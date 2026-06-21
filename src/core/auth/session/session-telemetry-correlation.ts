/**
 * Correlación — Session Telemetry Fase 8 (IAM-FE-PHASE-08 IMPL-05).
 * P1-04 — ciclo de vida correlationId por pestaña (independiente entre tabs).
 */

import { getAuthSyncTabId } from './session-auth-sync-emit';

export type CorrelationEnsureReason = 'bootstrap' | 'login';

export type CorrelationResetReason = 'terminate' | 'impersonation_exit' | 'login_replace';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `telemetry-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** correlationId activo en esta pestaña — null tras terminate/login_replace. */
let activeCorrelationId: string | null = null;

/** Último eventId de SESSION_REFRESH_FAILURE — cadena V8.2. */
let lastRefreshFailureEventId: string | null = null;

/** Tab que posee el correlationId actual (defensa same-tab). */
let correlationOwnerTabId: string | null = null;

export function getSessionTelemetryTabId(): string {
  return getAuthSyncTabId();
}

export function getActiveCorrelationId(): string | null {
  const tabId = getSessionTelemetryTabId();
  if (correlationOwnerTabId !== null && correlationOwnerTabId !== tabId) {
    return null;
  }
  return activeCorrelationId;
}

/**
 * Bootstrap: crea correlationId si no existe (sesión restaurada sin login explícito).
 * Login: siempre rota — nueva sesión, no mezclar con anterior.
 */
export function ensureCorrelationId(reason: CorrelationEnsureReason): string {
  const tabId = getSessionTelemetryTabId();

  if (reason === 'login') {
    activeCorrelationId = generateUuid();
    correlationOwnerTabId = tabId;
    lastRefreshFailureEventId = null;
    return activeCorrelationId;
  }

  if (activeCorrelationId === null || correlationOwnerTabId !== tabId) {
    activeCorrelationId = generateUuid();
    correlationOwnerTabId = tabId;
    lastRefreshFailureEventId = null;
  }

  return activeCorrelationId;
}

/** Terminate / impersonation exit / login replace — invalida ciclo actual. */
export function resetCorrelationId(reason: CorrelationResetReason): void {
  if (reason === 'login_replace') {
    activeCorrelationId = null;
    correlationOwnerTabId = null;
    lastRefreshFailureEventId = null;
    return;
  }

  activeCorrelationId = null;
  correlationOwnerTabId = null;
  lastRefreshFailureEventId = null;
}

export function rememberRefreshFailureEventId(eventId: string): void {
  lastRefreshFailureEventId = eventId;
}

export function consumeLastRefreshFailureEventId(): string | undefined {
  const value = lastRefreshFailureEventId ?? undefined;
  return value;
}

export function clearLastRefreshFailureEventId(): void {
  lastRefreshFailureEventId = null;
}

export function resetSessionTelemetryCorrelationForTests(): void {
  activeCorrelationId = null;
  correlationOwnerTabId = null;
  lastRefreshFailureEventId = null;
}

export interface SessionTelemetryCorrelationContext {
  readonly correlationId: string;
  readonly tabId: string;
}

/** Obtiene contexto correlación; lanza si no hay sesión activa. */
export function requireCorrelationContext(): SessionTelemetryCorrelationContext {
  const existing = getActiveCorrelationId();
  if (existing) {
    return { correlationId: existing, tabId: getSessionTelemetryTabId() };
  }

  const correlationId = ensureCorrelationId('bootstrap');
  return { correlationId, tabId: getSessionTelemetryTabId() };
}

export function generateSessionTelemetryEventId(): string {
  return generateUuid();
}
