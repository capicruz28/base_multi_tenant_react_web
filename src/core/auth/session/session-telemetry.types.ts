/**
 * Types — Session Telemetry Fase 8 (IAM-FE-PHASE-08 IMPL-02).
 */

import type { AuthSyncEventType } from './session-auth-sync.types';
import type { RefreshOutcome, RefreshOutcomeMetadata } from './session-refresh-outcome.types';
import type { SessionTerminationReason } from './session-termination-reason';
import type { ImpersonationExitSource } from './session-impersonation.types';

export type SessionTelemetryEventName =
  | 'SESSION_REFRESH_SUCCESS'
  | 'SESSION_REFRESH_FAILURE'
  | 'SESSION_TERMINATED'
  | 'AUTH_SYNC_EMITTED'
  | 'AUTH_SYNC_RECEIVED'
  | 'SESSION_PROBE_COMPLETED'
  | 'SESSION_IMPERSONATION_EXIT'
  | 'SESSION_BOOTSTRAP_COMPLETED'
  | 'SESSION_DIAG_PLATFORM_REFRESH'
  | 'SESSION_DIAG_CONTEXT'
  | 'NAV_GATE_DIAG';

export type SessionTerminationCaller =
  | 'refresh_fail'
  | 'manual_logout'
  | 'probe_remote'
  | 'auth_sync_follower'
  | 'impersonation_exit'
  | 'bootstrap_fail'
  | 'unknown';

export type SessionProbeTelemetryResult = 'ok' | 'skipped' | 'error';

/** Metadata allowlisted — refresh (F5). */
export interface SessionRefreshTelemetryInput {
  readonly metadata: RefreshOutcomeMetadata;
  readonly accessTokenPrefix?: string | null;
  readonly parentEventId?: string;
}

/** Metadata allowlisted — terminación (F2). */
export interface SessionTerminationTelemetryInput {
  readonly reason: SessionTerminationReason;
  readonly caller: SessionTerminationCaller;
  readonly isSecurityTermination: boolean;
  readonly severity?: string;
  readonly parentEventId?: string;
}

/** Metadata allowlisted — auth-sync emit (sin envelope F4). */
export interface AuthSyncEmittedTelemetryInput {
  readonly type: AuthSyncEventType;
  readonly tabId: string;
  readonly eventId: string;
  readonly refreshOutcome?: RefreshOutcome;
}

/** Metadata allowlisted — auth-sync receive (sin payload F4). */
export interface AuthSyncReceivedTelemetryInput {
  readonly type: AuthSyncEventType;
  readonly tabId: string;
  readonly eventId: string;
}

export interface SessionProbeTelemetryInput {
  readonly result: SessionProbeTelemetryResult;
  readonly skippedReason?: string;
}

export interface SessionImpersonationExitTelemetryInput {
  readonly source: ImpersonationExitSource;
  readonly action: string;
}

export interface SessionBootstrapTelemetryInput {
  readonly path: string;
  readonly hydrateSkipped?: boolean;
}

/** Campos PLATFORM_REFRESH_DIAGNOSTIC — post-redacción. */
export interface PlatformRefreshDiagTelemetryInput {
  readonly label: string;
  readonly feHost: string;
  readonly feSubdomain: string | null;
  readonly jwtClienteMatchesSuperadmin: boolean | null;
  readonly userClienteMatchesSuperadmin: boolean | null;
  readonly accessTokenPrefix: string | null;
  readonly httpStatus?: number;
}

export interface SessionDiagContextTelemetryInput {
  readonly label: string;
  readonly fields: Record<string, unknown>;
}

export interface NavGateDiagTelemetryInput {
  readonly component: string;
  readonly event: string;
  readonly level: 'log' | 'warn';
  readonly fields: Record<string, unknown>;
}

export interface SessionTelemetryEnvelope {
  readonly eventId: string;
  readonly eventName: SessionTelemetryEventName;
  readonly correlationId: string;
  readonly tabId: string;
  readonly parentEventId?: string;
  readonly issuedAtMs: number;
  readonly payload: Record<string, unknown>;
}

export interface SessionTelemetrySink {
  emit(envelope: SessionTelemetryEnvelope): void;
}
