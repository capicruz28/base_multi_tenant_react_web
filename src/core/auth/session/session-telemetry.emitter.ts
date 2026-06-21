/**
 * Emitter — Session Telemetry Fase 8 (IAM-FE-PHASE-08 IMPL-06).
 */

import {
  buildSessionTelemetryPayload,
  resolveRefreshEventNameFromMetadata,
  type SessionTelemetryBuildInput,
} from './session-telemetry-events.policy';
import {
  getSessionTelemetryFlagsSnapshot,
  isSessionTelemetryAuthSyncActive,
  isSessionTelemetryEffective,
  isSessionTelemetryRefreshActive,
  isSessionTelemetryTerminationActive,
  type SessionTelemetryFlagsSnapshot,
} from './session-telemetry.flags';
import { applySessionTelemetryRedaction } from './session-telemetry-redaction.policy';
import {
  generateSessionTelemetryEventId,
  getSessionTelemetryTabId,
  rememberRefreshFailureEventId,
  requireCorrelationContext,
} from './session-telemetry-correlation';
import { getSessionTelemetryDevSink } from './session-telemetry.sink.dev';
import type {
  SessionTelemetryEnvelope,
  SessionTelemetryEventName,
  SessionTelemetrySink,
} from './session-telemetry.types';

export interface SessionTelemetryEmitterDeps {
  readonly flags?: SessionTelemetryFlagsSnapshot;
  readonly sink?: SessionTelemetrySink;
  readonly getNowMs?: () => number;
}

function isEventAllowed(
  eventName: SessionTelemetryEventName,
  flags: SessionTelemetryFlagsSnapshot,
): boolean {
  if (!isSessionTelemetryEffective(flags)) {
    return false;
  }

  switch (eventName) {
    case 'SESSION_REFRESH_SUCCESS':
    case 'SESSION_REFRESH_FAILURE':
      return isSessionTelemetryRefreshActive(flags);
    case 'SESSION_TERMINATED':
      return isSessionTelemetryTerminationActive(flags);
    case 'AUTH_SYNC_EMITTED':
    case 'AUTH_SYNC_RECEIVED':
      return isSessionTelemetryAuthSyncActive(flags);
    default:
      return true;
  }
}

export function emitSessionTelemetryEvent(
  eventName: SessionTelemetryEventName,
  buildInput: SessionTelemetryBuildInput['data'],
  options?: {
    parentEventId?: string;
    flags?: SessionTelemetryFlagsSnapshot;
    sink?: SessionTelemetrySink;
    getNowMs?: () => number;
  },
): string | null {
  const flags = options?.flags ?? getSessionTelemetryFlagsSnapshot();

  if (!isEventAllowed(eventName, flags)) {
    return null;
  }

  const buildPayloadInput = { eventName, data: buildInput } as SessionTelemetryBuildInput;
  const rawPayload = buildSessionTelemetryPayload(buildPayloadInput);
  const payload = applySessionTelemetryRedaction(rawPayload);

  const { correlationId } = requireCorrelationContext();
  const eventId = generateSessionTelemetryEventId();
  const envelope: SessionTelemetryEnvelope = {
    eventId,
    eventName,
    correlationId,
    tabId: getSessionTelemetryTabId(),
    ...(options?.parentEventId ? { parentEventId: options.parentEventId } : {}),
    issuedAtMs: options?.getNowMs?.() ?? Date.now(),
    payload,
  };

  const sink = options?.sink ?? getSessionTelemetryDevSink();
  sink.emit(envelope);

  if (eventName === 'SESSION_REFRESH_FAILURE') {
    rememberRefreshFailureEventId(eventId);
  }

  return eventId;
}

export function emitSessionRefreshTelemetry(
  buildInput: Extract<SessionTelemetryBuildInput, { eventName: 'SESSION_REFRESH_SUCCESS' }>['data'],
  deps?: SessionTelemetryEmitterDeps,
): string | null {
  const eventName = resolveRefreshEventNameFromMetadata(buildInput);
  return emitSessionTelemetryEvent(eventName, buildInput, {
    parentEventId: buildInput.parentEventId,
    flags: deps?.flags,
    sink: deps?.sink,
    getNowMs: deps?.getNowMs,
  });
}

export function emitSessionTerminationTelemetry(
  buildInput: Extract<SessionTelemetryBuildInput, { eventName: 'SESSION_TERMINATED' }>['data'],
  deps?: SessionTelemetryEmitterDeps,
): string | null {
  return emitSessionTelemetryEvent('SESSION_TERMINATED', buildInput, {
    parentEventId: buildInput.parentEventId,
    flags: deps?.flags,
    sink: deps?.sink,
    getNowMs: deps?.getNowMs,
  });
}

export function emitAuthSyncEmittedTelemetry(
  buildInput: Extract<SessionTelemetryBuildInput, { eventName: 'AUTH_SYNC_EMITTED' }>['data'],
  deps?: SessionTelemetryEmitterDeps,
): string | null {
  return emitSessionTelemetryEvent('AUTH_SYNC_EMITTED', buildInput, deps);
}

export function emitAuthSyncReceivedTelemetry(
  buildInput: Extract<SessionTelemetryBuildInput, { eventName: 'AUTH_SYNC_RECEIVED' }>['data'],
  deps?: SessionTelemetryEmitterDeps,
): string | null {
  return emitSessionTelemetryEvent('AUTH_SYNC_RECEIVED', buildInput, deps);
}

export function emitSessionProbeTelemetry(
  buildInput: Extract<SessionTelemetryBuildInput, { eventName: 'SESSION_PROBE_COMPLETED' }>['data'],
  deps?: SessionTelemetryEmitterDeps,
): string | null {
  return emitSessionTelemetryEvent('SESSION_PROBE_COMPLETED', buildInput, deps);
}

export function emitSessionImpersonationExitTelemetry(
  buildInput: Extract<
    SessionTelemetryBuildInput,
    { eventName: 'SESSION_IMPERSONATION_EXIT' }
  >['data'],
  deps?: SessionTelemetryEmitterDeps,
): string | null {
  return emitSessionTelemetryEvent('SESSION_IMPERSONATION_EXIT', buildInput, deps);
}

export function emitSessionBootstrapTelemetry(
  buildInput: Extract<SessionTelemetryBuildInput, { eventName: 'SESSION_BOOTSTRAP_COMPLETED' }>['data'],
  deps?: SessionTelemetryEmitterDeps,
): string | null {
  return emitSessionTelemetryEvent('SESSION_BOOTSTRAP_COMPLETED', buildInput, deps);
}

export function emitPlatformRefreshDiagTelemetry(
  buildInput: Extract<
    SessionTelemetryBuildInput,
    { eventName: 'SESSION_DIAG_PLATFORM_REFRESH' }
  >['data'],
  deps?: SessionTelemetryEmitterDeps,
): string | null {
  return emitSessionTelemetryEvent('SESSION_DIAG_PLATFORM_REFRESH', buildInput, deps);
}

export function emitSessionDiagContextTelemetry(
  buildInput: Extract<SessionTelemetryBuildInput, { eventName: 'SESSION_DIAG_CONTEXT' }>['data'],
  deps?: SessionTelemetryEmitterDeps,
): string | null {
  return emitSessionTelemetryEvent('SESSION_DIAG_CONTEXT', buildInput, deps);
}

export function emitNavGateDiagTelemetry(
  buildInput: Extract<SessionTelemetryBuildInput, { eventName: 'NAV_GATE_DIAG' }>['data'],
  deps?: SessionTelemetryEmitterDeps,
): string | null {
  return emitSessionTelemetryEvent('NAV_GATE_DIAG', buildInput, deps);
}
