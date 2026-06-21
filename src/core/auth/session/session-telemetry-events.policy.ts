/**
 * Events policy — Session Telemetry Fase 8 (IAM-FE-PHASE-08 IMPL-04).
 * P1-01 — solo metadata allowlisted; nunca envelopes F4 crudos.
 */

import type { RefreshOutcome } from './session-refresh-outcome.types';
import type { SessionTerminationReason } from './session-termination-reason';
import { toAccessTokenPrefix } from './session-telemetry-redaction.policy';
import type {
  AuthSyncEmittedTelemetryInput,
  AuthSyncReceivedTelemetryInput,
  NavGateDiagTelemetryInput,
  PlatformRefreshDiagTelemetryInput,
  SessionBootstrapTelemetryInput,
  SessionDiagContextTelemetryInput,
  SessionImpersonationExitTelemetryInput,
  SessionProbeTelemetryInput,
  SessionRefreshTelemetryInput,
  SessionTelemetryEventName,
  SessionTerminationCaller,
  SessionTerminationTelemetryInput,
} from './session-telemetry.types';

function isRefreshFailureOutcome(outcome: RefreshOutcome): boolean {
  return outcome !== 'ROTATED' && outcome !== 'ALREADY_ROTATED';
}

export function resolveTerminationCaller(
  reason: SessionTerminationReason,
  hint?: SessionTerminationCaller,
): SessionTerminationCaller {
  if (hint) {
    return hint;
  }

  switch (reason) {
    case 'MANUAL_LOGOUT':
      return 'manual_logout';
    case 'IMPERSONATION_END':
      return 'impersonation_exit';
    case 'BOOTSTRAP_FAILED':
    case 'HYDRATE_FAILED':
      return 'bootstrap_fail';
    case 'REFRESH_UNAUTHORIZED':
    case 'TOKEN_REUSE':
    case 'REFRESH_REVOKED':
    case 'REFRESH_INVALID':
    case 'SESSION_EXPIRED':
    case 'IDLE_TIMEOUT':
    case 'ABSOLUTE_EXPIRY':
      return 'refresh_fail';
    default:
      return 'unknown';
  }
}

export function resolveRefreshTelemetryEventName(
  outcome: RefreshOutcome,
): 'SESSION_REFRESH_SUCCESS' | 'SESSION_REFRESH_FAILURE' {
  return isRefreshFailureOutcome(outcome)
    ? 'SESSION_REFRESH_FAILURE'
    : 'SESSION_REFRESH_SUCCESS';
}

export function buildSessionRefreshTelemetryPayload(
  input: SessionRefreshTelemetryInput,
): Record<string, unknown> {
  const prefix =
    input.accessTokenPrefix !== undefined
      ? input.accessTokenPrefix
      : null;

  return {
    outcome: input.metadata.outcome,
    source: input.metadata.source,
    httpStatus: input.metadata.httpStatus,
    attemptCount: input.metadata.attemptCount,
    backoffMsApplied: input.metadata.backoffMsApplied,
    singleFlightRole: input.metadata.singleFlightRole,
    l02GuardActive: input.metadata.l02GuardActive,
    ...(prefix !== null && prefix !== undefined
      ? { accessTokenPrefix: toAccessTokenPrefix(prefix) ?? prefix }
      : {}),
  };
}

export function buildSessionTerminationTelemetryPayload(
  input: SessionTerminationTelemetryInput,
): Record<string, unknown> {
  return {
    reason: input.reason,
    caller: input.caller,
    isSecurityTermination: input.isSecurityTermination,
    ...(input.severity ? { severity: input.severity } : {}),
  };
}

export function buildAuthSyncEmittedTelemetryPayload(
  input: AuthSyncEmittedTelemetryInput,
): Record<string, unknown> {
  return {
    type: input.type,
    tabId: input.tabId,
    eventId: input.eventId,
    ...(input.refreshOutcome !== undefined ? { refreshOutcome: input.refreshOutcome } : {}),
  };
}

export function buildAuthSyncReceivedTelemetryPayload(
  input: AuthSyncReceivedTelemetryInput,
): Record<string, unknown> {
  return {
    type: input.type,
    tabId: input.tabId,
    eventId: input.eventId,
  };
}

export function buildSessionProbeTelemetryPayload(
  input: SessionProbeTelemetryInput,
): Record<string, unknown> {
  return {
    result: input.result,
    ...(input.skippedReason ? { skippedReason: input.skippedReason } : {}),
  };
}

export function buildSessionImpersonationExitTelemetryPayload(
  input: SessionImpersonationExitTelemetryInput,
): Record<string, unknown> {
  return {
    source: input.source,
    action: input.action,
  };
}

export function buildSessionBootstrapTelemetryPayload(
  input: SessionBootstrapTelemetryInput,
): Record<string, unknown> {
  return {
    path: input.path,
    ...(input.hydrateSkipped !== undefined ? { hydrateSkipped: input.hydrateSkipped } : {}),
  };
}

export function buildPlatformRefreshDiagTelemetryPayload(
  input: PlatformRefreshDiagTelemetryInput,
): Record<string, unknown> {
  return {
    label: input.label,
    feHost: input.feHost,
    feSubdomain: input.feSubdomain,
    jwtClienteMatchesSuperadmin: input.jwtClienteMatchesSuperadmin,
    userClienteMatchesSuperadmin: input.userClienteMatchesSuperadmin,
    accessTokenPrefix: input.accessTokenPrefix,
    ...(input.httpStatus !== undefined ? { httpStatus: input.httpStatus } : {}),
  };
}

export function buildSessionDiagContextTelemetryPayload(
  input: SessionDiagContextTelemetryInput,
): Record<string, unknown> {
  return {
    label: input.label,
    ...input.fields,
  };
}

export function buildNavGateDiagTelemetryPayload(
  input: NavGateDiagTelemetryInput,
): Record<string, unknown> {
  return {
    component: input.component,
    event: input.event,
    level: input.level,
    ...input.fields,
  };
}

export type SessionTelemetryBuildInput =
  | { eventName: 'SESSION_REFRESH_SUCCESS' | 'SESSION_REFRESH_FAILURE'; data: SessionRefreshTelemetryInput }
  | { eventName: 'SESSION_TERMINATED'; data: SessionTerminationTelemetryInput }
  | { eventName: 'AUTH_SYNC_EMITTED'; data: AuthSyncEmittedTelemetryInput }
  | { eventName: 'AUTH_SYNC_RECEIVED'; data: AuthSyncReceivedTelemetryInput }
  | { eventName: 'SESSION_PROBE_COMPLETED'; data: SessionProbeTelemetryInput }
  | { eventName: 'SESSION_IMPERSONATION_EXIT'; data: SessionImpersonationExitTelemetryInput }
  | { eventName: 'SESSION_BOOTSTRAP_COMPLETED'; data: SessionBootstrapTelemetryInput }
  | { eventName: 'SESSION_DIAG_PLATFORM_REFRESH'; data: PlatformRefreshDiagTelemetryInput }
  | { eventName: 'SESSION_DIAG_CONTEXT'; data: SessionDiagContextTelemetryInput }
  | { eventName: 'NAV_GATE_DIAG'; data: NavGateDiagTelemetryInput };

export function buildSessionTelemetryPayload(
  input: SessionTelemetryBuildInput,
): Record<string, unknown> {
  switch (input.eventName) {
    case 'SESSION_REFRESH_SUCCESS':
    case 'SESSION_REFRESH_FAILURE':
      return buildSessionRefreshTelemetryPayload(input.data);
    case 'SESSION_TERMINATED':
      return buildSessionTerminationTelemetryPayload(input.data);
    case 'AUTH_SYNC_EMITTED':
      return buildAuthSyncEmittedTelemetryPayload(input.data);
    case 'AUTH_SYNC_RECEIVED':
      return buildAuthSyncReceivedTelemetryPayload(input.data);
    case 'SESSION_PROBE_COMPLETED':
      return buildSessionProbeTelemetryPayload(input.data);
    case 'SESSION_IMPERSONATION_EXIT':
      return buildSessionImpersonationExitTelemetryPayload(input.data);
    case 'SESSION_BOOTSTRAP_COMPLETED':
      return buildSessionBootstrapTelemetryPayload(input.data);
    case 'SESSION_DIAG_PLATFORM_REFRESH':
      return buildPlatformRefreshDiagTelemetryPayload(input.data);
    case 'SESSION_DIAG_CONTEXT':
      return buildSessionDiagContextTelemetryPayload(input.data);
    case 'NAV_GATE_DIAG':
      return buildNavGateDiagTelemetryPayload(input.data);
    default: {
      const _exhaustive: never = input;
      return _exhaustive;
    }
  }
}

export function resolveRefreshEventNameFromMetadata(
  input: SessionRefreshTelemetryInput,
): SessionTelemetryEventName {
  return resolveRefreshTelemetryEventName(input.metadata.outcome);
}
