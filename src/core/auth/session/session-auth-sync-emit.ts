/**
 * Política de emisión auth-sync — IAM-FE-PHASE-04 IMPL-04.
 * Anti-loop R1–R7 (excepto R5/R6/R7 en apply).
 */

import {
  SESSION_AUTH_SYNC_V4_ENABLED,
} from './session-auth-sync.flags';
import { sessionAuthSyncChannel } from './session-auth-sync-channel';
import type {
  AuthSyncEmpresaChangedPayload,
  AuthSyncEnvelope,
  AuthSyncEventType,
  AuthSyncSessionLoginPayload,
  AuthSyncSessionRefreshedPayload,
  AuthSyncSessionTerminatedPayload,
} from './session-auth-sync.types';
import { AUTH_SYNC_PROTOCOL_VERSION } from './session-auth-sync.types';
import type { TerminateSessionEventPayload } from './session-terminate';

/** Debounce emisión REFRESHED — R4. */
export const AUTH_SYNC_REFRESHED_DEBOUNCE_MS = 2_000;

/** Ventana deduplicación eventId — R2. */
export const AUTH_SYNC_EVENT_DEDUP_WINDOW_MS = 30_000;

let selfTabId: string | null = null;

/** Profundidad inbound apply — R3 no re-emitir. */
let inboundApplyDepth = 0;

/** Última emisión REFRESHED por tab — R4. */
let lastRefreshedEmitAtMs: number | null = null;

/** eventId → issuedAtMs — R2. */
const seenEventIds = new Map<string, number>();

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `auth-sync-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Identificador estable de pestaña — R1. */
export function getAuthSyncTabId(): string {
  if (!selfTabId) {
    selfTabId = generateUuid();
  }
  return selfTabId;
}

/** Reset tabId — solo tests. */
export function resetAuthSyncTabIdForTests(): void {
  selfTabId = null;
}

export function runWithInboundApply<T>(fn: () => T): T {
  inboundApplyDepth += 1;
  try {
    return fn();
  } finally {
    inboundApplyDepth -= 1;
  }
}

export async function runWithInboundApplyAsync(fn: () => Promise<void>): Promise<void> {
  inboundApplyDepth += 1;
  try {
    await fn();
  } finally {
    inboundApplyDepth -= 1;
  }
}

export function isInboundApplyActive(): boolean {
  return inboundApplyDepth > 0;
}

function purgeExpiredEventIds(nowMs: number): void {
  for (const [eventId, issuedAtMs] of seenEventIds.entries()) {
    if (nowMs - issuedAtMs > AUTH_SYNC_EVENT_DEDUP_WINDOW_MS) {
      seenEventIds.delete(eventId);
    }
  }
}

/** Registra eventId recibido; false si duplicado — R2. */
export function registerInboundEventId(eventId: string, issuedAtMs: number): boolean {
  purgeExpiredEventIds(issuedAtMs);

  if (seenEventIds.has(eventId)) {
    return false;
  }

  seenEventIds.set(eventId, issuedAtMs);
  return true;
}

/** Reset estado emit — solo tests. */
export function resetAuthSyncEmitStateForTests(): void {
  inboundApplyDepth = 0;
  lastRefreshedEmitAtMs = null;
  seenEventIds.clear();
}

function shouldSkipOutboundEmit(type: AuthSyncEventType, nowMs: number): boolean {
  if (!SESSION_AUTH_SYNC_V4_ENABLED) {
    return true;
  }

  if (!sessionAuthSyncChannel.isAvailable()) {
    return true;
  }

  // R3 — no re-emitir eventos recibidos
  if (isInboundApplyActive()) {
    return true;
  }

  // R4 — debounce REFRESHED
  if (type === 'SESSION_REFRESHED' && lastRefreshedEmitAtMs !== null) {
    if (nowMs - lastRefreshedEmitAtMs < AUTH_SYNC_REFRESHED_DEBOUNCE_MS) {
      return true;
    }
  }

  return false;
}

export function buildAuthSyncEnvelope<T extends AuthSyncEventType>(
  type: T,
  payload: AuthSyncEnvelope<T>['payload'],
  nowMs: number = Date.now(),
): AuthSyncEnvelope<T> {
  return {
    v: AUTH_SYNC_PROTOCOL_VERSION,
    eventId: generateUuid(),
    tabId: getAuthSyncTabId(),
    type,
    issuedAtMs: nowMs,
    payload,
  };
}

/**
 * Emite evento auth-sync con política anti-tormenta.
 * @returns true si se publicó en el canal.
 */
export function postAuthSyncEvent<T extends AuthSyncEventType>(
  type: T,
  payload: AuthSyncEnvelope<T>['payload'],
  nowMs: number = Date.now(),
): boolean {
  if (shouldSkipOutboundEmit(type, nowMs)) {
    return false;
  }

  const envelope = buildAuthSyncEnvelope(type, payload, nowMs);
  const posted = sessionAuthSyncChannel.post(envelope);

  if (posted && type === 'SESSION_REFRESHED') {
    lastRefreshedEmitAtMs = nowMs;
  }

  if (posted) {
    seenEventIds.set(envelope.eventId, envelope.issuedAtMs);
  }

  return posted;
}

export function emitSessionLoginSync(payload: AuthSyncSessionLoginPayload): boolean {
  return postAuthSyncEvent('SESSION_LOGIN', payload);
}

export function emitSessionRefreshedSync(payload: AuthSyncSessionRefreshedPayload): boolean {
  return postAuthSyncEvent('SESSION_REFRESHED', payload);
}

export function emitEmpresaChangedSync(payload: AuthSyncEmpresaChangedPayload): boolean {
  return postAuthSyncEvent('EMPRESA_CHANGED', payload);
}

export function emitSessionTerminatedSync(
  payload: AuthSyncSessionTerminatedPayload,
): boolean {
  return postAuthSyncEvent('SESSION_TERMINATED', payload);
}

/**
 * Factory para TerminateSessionDeps.emitTerminationEvent — IMPL-06.
 */
export function createAuthSyncTerminationEmitter(): (
  payload: TerminateSessionEventPayload,
) => void {
  return (payload) => {
    emitSessionTerminatedSync({
      reason: payload.reason,
      redirectPath: payload.profile.redirectPath,
      preservePreLoginBranding: payload.reason === 'MANUAL_LOGOUT',
    });
  };
}

/** Indica si auth-sync está operativo (flag + BC). */
export function isAuthSyncEffective(): boolean {
  return SESSION_AUTH_SYNC_V4_ENABLED && sessionAuthSyncChannel.isAvailable();
}
