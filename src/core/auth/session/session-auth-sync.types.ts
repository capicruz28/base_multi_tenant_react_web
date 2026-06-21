/**
 * Tipos envelope auth-sync — IAM-FE-PHASE-04 IMPL-02.
 */

import type { SessionClaimsSnapshot } from './session-claims-snapshot';
import type { ImpersonationExitSource } from './session-impersonation.types';
import type { RefreshOutcome } from './session-refresh-outcome.types';
import type { SessionTerminationReason } from './session-termination-reason';

/** Versión protocolo BroadcastChannel auth-sync. */
export const AUTH_SYNC_PROTOCOL_VERSION = 1 as const;

export type AuthSyncProtocolVersion = typeof AUTH_SYNC_PROTOCOL_VERSION;

export type AuthSyncEventType =
  | 'SESSION_LOGIN'
  | 'SESSION_REFRESHED'
  | 'SESSION_TERMINATED'
  | 'EMPRESA_CHANGED'
  | 'SELECTION_SYNC';

export interface AuthSyncSessionLoginPayload {
  accessToken: string;
  claimsSnapshot: SessionClaimsSnapshot;
  empresaActivaId: string | null;
  /** Extensión Fase 6 — backward-compatible; consumidores ignoran si ausente. */
  impersonationExitSource?: ImpersonationExitSource;
}

export interface AuthSyncSessionRefreshedPayload {
  accessToken: string;
  claimsSnapshot: SessionClaimsSnapshot;
  empresaActivaId: string | null;
  /** Extensión Fase 5 — backward-compatible; consumidores ignoran si ausente. */
  refreshOutcome?: RefreshOutcome;
}

export interface AuthSyncSessionTerminatedPayload {
  reason: SessionTerminationReason;
  redirectPath?: string;
  preservePreLoginBranding?: boolean;
}

export interface AuthSyncEmpresaChangedPayload {
  accessToken: string;
  empresaActivaId: string | null;
  claimsSnapshot: SessionClaimsSnapshot;
}

export interface AuthSyncSelectionSyncPayload {
  selectionToken: string | null;
  empresasDisponibles: ReadonlyArray<{
    empresa_id: string;
    razon_social?: string;
    codigo?: string;
  }>;
  userPreview: Record<string, unknown> | null;
  cleared: boolean;
}

export type AuthSyncEventPayload =
  | AuthSyncSessionLoginPayload
  | AuthSyncSessionRefreshedPayload
  | AuthSyncSessionTerminatedPayload
  | AuthSyncEmpresaChangedPayload
  | AuthSyncSelectionSyncPayload;

export interface AuthSyncEnvelope<T extends AuthSyncEventType = AuthSyncEventType> {
  v: AuthSyncProtocolVersion;
  eventId: string;
  tabId: string;
  type: T;
  issuedAtMs: number;
  payload: Extract<
    {
      SESSION_LOGIN: AuthSyncSessionLoginPayload;
      SESSION_REFRESHED: AuthSyncSessionRefreshedPayload;
      SESSION_TERMINATED: AuthSyncSessionTerminatedPayload;
      EMPRESA_CHANGED: AuthSyncEmpresaChangedPayload;
      SELECTION_SYNC: AuthSyncSelectionSyncPayload;
    },
    { [K in T]: unknown }[T]
  >;
}

const AUTH_SYNC_EVENT_TYPES: ReadonlySet<string> = new Set([
  'SESSION_LOGIN',
  'SESSION_REFRESHED',
  'SESSION_TERMINATED',
  'EMPRESA_CHANGED',
  'SELECTION_SYNC',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Valida envelope mínimo v1 recibido por BroadcastChannel.
 */
export function isAuthSyncEnvelope(value: unknown): value is AuthSyncEnvelope {
  if (!isRecord(value)) {
    return false;
  }

  if (value.v !== AUTH_SYNC_PROTOCOL_VERSION) {
    return false;
  }

  if (typeof value.eventId !== 'string' || value.eventId.trim().length === 0) {
    return false;
  }

  if (typeof value.tabId !== 'string' || value.tabId.trim().length === 0) {
    return false;
  }

  if (typeof value.type !== 'string' || !AUTH_SYNC_EVENT_TYPES.has(value.type)) {
    return false;
  }

  if (typeof value.issuedAtMs !== 'number' || !Number.isFinite(value.issuedAtMs)) {
    return false;
  }

  if (!isRecord(value.payload)) {
    return false;
  }

  return true;
}
