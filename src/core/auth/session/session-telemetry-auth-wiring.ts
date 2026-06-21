/**
 * Auth wiring — Session Telemetry Fase 8 (IAM-FE-PHASE-08 IMPL-08…12).
 * P1-03 — composición emitTerminationEvent sin modificar F2/F4.
 */

import { useEffect } from 'react';

import type { AuthSyncEventType } from './session-auth-sync.types';
import { sessionAuthSyncChannel } from './session-auth-sync-channel';
import { getAuthSyncTabId } from './session-auth-sync-emit';
import type { RefreshOutcomeMetadata } from './session-refresh-outcome.types';
import type { TerminateSessionEventPayload } from './session-terminate';
import {
  buildAuthSessionSnapshot,
  type AuthSessionSnapshot,
} from '@/core/auth/utils/auth-session-snapshot';
import type { UserData } from '@/features/auth/types/auth.types';
import {
  consumeLastRefreshFailureEventId,
  ensureCorrelationId,
  resetCorrelationId,
} from './session-telemetry-correlation';
import {
  emitAuthSyncEmittedTelemetry,
  emitAuthSyncReceivedTelemetry,
  emitNavGateDiagTelemetry,
  emitPlatformRefreshDiagTelemetry,
  emitSessionBootstrapTelemetry,
  emitSessionDiagContextTelemetry,
  emitSessionImpersonationExitTelemetry,
  emitSessionProbeTelemetry,
  emitSessionRefreshTelemetry,
  emitSessionTerminationTelemetry,
} from './session-telemetry.emitter';
import {
  resolveTerminationCaller,
} from './session-telemetry-events.policy';
import { toAccessTokenPrefix } from './session-telemetry-redaction.policy';
import { prepareSessionDiagContextFields } from './session-telemetry-diag-context.policy';
import { isSessionTelemetryEffective } from './session-telemetry.flags';
import type { ImpersonationExitSource } from './session-impersonation.types';
import type { SessionTerminationCaller } from './session-telemetry.types';

export type TerminationEventEmitter = (payload: TerminateSessionEventPayload) => void;

/** P1-03 — composición explícita F4 + F8 (u otros) sin modificar cuerpos congelados. */
export function composeTerminationEventEmitters(
  ...emitters: TerminationEventEmitter[]
): TerminationEventEmitter {
  return (payload) => {
    for (const emit of emitters) {
      emit(payload);
    }
  };
}

export interface CreateSessionTelemetryTerminationEmitterInput {
  readonly resolveCaller?: (payload: TerminateSessionEventPayload) => SessionTerminationCaller;
  readonly onAfterEmit?: () => void;
}

export function createSessionTelemetryTerminationEmitter(
  input: CreateSessionTelemetryTerminationEmitterInput = {},
): TerminationEventEmitter {
  return (payload) => {
    if (!isSessionTelemetryEffective()) {
      return;
    }

    const parentEventId = consumeLastRefreshFailureEventId();
    const caller =
      input.resolveCaller?.(payload) ??
      resolveTerminationCaller(payload.reason);

    emitSessionTerminationTelemetry({
      reason: payload.reason,
      caller,
      isSecurityTermination: payload.isSecurityTermination,
      severity: payload.profile.severity,
      parentEventId,
    });

    resetCorrelationId('terminate');
    input.onAfterEmit?.();
  };
}

export function emitSessionRefreshOutcomeTelemetry(
  metadata: RefreshOutcomeMetadata,
  accessToken?: string | null,
): void {
  if (!isSessionTelemetryEffective()) {
    return;
  }

  emitSessionRefreshTelemetry({
    metadata,
    accessTokenPrefix: toAccessTokenPrefix(accessToken ?? null),
  });
}

export function emitSessionRefreshFailureOutcomeTelemetry(
  metadata: RefreshOutcomeMetadata,
): void {
  if (!isSessionTelemetryEffective()) {
    return;
  }

  emitSessionRefreshTelemetry({ metadata });
}

export function trackSessionLoginCorrelation(): void {
  if (!isSessionTelemetryEffective()) {
    return;
  }
  resetCorrelationId('login_replace');
  ensureCorrelationId('login');
}

export function trackSessionBootstrapCorrelation(): void {
  if (!isSessionTelemetryEffective()) {
    return;
  }
  ensureCorrelationId('bootstrap');
}

export function emitSessionBootstrapCompletedTelemetry(input: {
  path: string;
  hydrateSkipped?: boolean;
}): void {
  if (!isSessionTelemetryEffective()) {
    return;
  }

  trackSessionBootstrapCorrelation();
  emitSessionBootstrapTelemetry(input);
}

export function emitAuthSyncEmittedFromMetadata(input: {
  type: AuthSyncEventType;
  eventId: string;
  refreshOutcome?: import('./session-refresh-outcome.types').RefreshOutcome;
}): void {
  if (!isSessionTelemetryEffective()) {
    return;
  }

  emitAuthSyncEmittedTelemetry({
    type: input.type,
    tabId: getAuthSyncTabId(),
    eventId: input.eventId,
    refreshOutcome: input.refreshOutcome,
  });
}

export function emitSessionProbeCompletedTelemetry(input: {
  result: 'ok' | 'skipped' | 'error';
  skippedReason?: string;
}): void {
  if (!isSessionTelemetryEffective()) {
    return;
  }

  emitSessionProbeTelemetry(input);
}

export function emitSessionImpersonationExitFromSource(input: {
  source: ImpersonationExitSource;
  action?: string;
}): void {
  if (!isSessionTelemetryEffective()) {
    return;
  }

  emitSessionImpersonationExitTelemetry({
    source: input.source,
    action: input.action ?? 'CONTROLLED_EXIT',
  });
}

export function emitPlatformRefreshDiagFromSnapshot(
  label: string,
  accessToken: string | null | undefined,
  user: UserData | null | undefined,
  httpStatus?: number,
): void {
  if (!isSessionTelemetryEffective()) {
    return;
  }

  const snap = buildAuthSessionSnapshot(label, accessToken, user);
  emitPlatformRefreshDiagFromAuthSnapshot(snap, httpStatus);
}

export function emitPlatformRefreshDiagFromAuthSnapshot(
  snap: AuthSessionSnapshot,
  httpStatus?: number,
): void {
  if (!isSessionTelemetryEffective()) {
    return;
  }

  emitPlatformRefreshDiagTelemetry({
    label: snap.label,
    feHost: snap.feHost,
    feSubdomain: snap.feSubdomain,
    jwtClienteMatchesSuperadmin: snap.jwtClienteMatchesSuperadmin,
    userClienteMatchesSuperadmin: snap.userClienteMatchesSuperadmin,
    accessTokenPrefix: snap.accessTokenPrefix,
    httpStatus,
  });
}

export function emitSessionDiagContext(label: string, fields: Record<string, unknown>): void {
  if (!isSessionTelemetryEffective()) {
    return;
  }

  const safeFields = prepareSessionDiagContextFields(fields);
  emitSessionDiagContextTelemetry({ label, fields: safeFields });
}

export function emitNavGateDiag(
  component: string,
  event: string,
  level: 'log' | 'warn',
  fields: Record<string, unknown> = {},
): void {
  if (!isSessionTelemetryEffective()) {
    return;
  }

  const safeFields = prepareSessionDiagContextFields(fields);
  emitNavGateDiagTelemetry({ component, event, level, fields: safeFields });
}

export interface SessionTelemetryAuthSyncListenerOptions {
  readonly enabled?: boolean;
}

/** Observador pasivo outbound F4 — metadata envelope sin payload (P1-01). */
export function useSessionTelemetryAuthSyncEmittedListener(
  options: SessionTelemetryAuthSyncListenerOptions = {},
): void {
  const enabled = options.enabled ?? isSessionTelemetryEffective();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!sessionAuthSyncChannel.isAvailable()) {
      return;
    }

    return sessionAuthSyncChannel.subscribe((envelope) => {
      if (envelope.tabId !== getAuthSyncTabId()) {
        return;
      }

      emitAuthSyncEmittedTelemetry({
        type: envelope.type,
        tabId: envelope.tabId,
        eventId: envelope.eventId,
      });
    });
  }, [enabled]);
}

export function SessionTelemetryAuthSyncEmittedBinder(
  options: SessionTelemetryAuthSyncListenerOptions = {},
): null {
  useSessionTelemetryAuthSyncEmittedListener(options);
  return null;
}

/** Observador pasivo inbound F4 — post-handler vía orden subscribe. */
export function useSessionTelemetryAuthSyncListener(
  options: SessionTelemetryAuthSyncListenerOptions = {},
): void {
  const enabled = options.enabled ?? isSessionTelemetryEffective();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!sessionAuthSyncChannel.isAvailable()) {
      return;
    }

    return sessionAuthSyncChannel.subscribe((envelope) => {
      if (envelope.tabId === getAuthSyncTabId()) {
        return;
      }

      emitAuthSyncReceivedTelemetry({
        type: envelope.type,
        tabId: envelope.tabId,
        eventId: envelope.eventId,
      });
    });
  }, [enabled]);
}

export function SessionTelemetryAuthSyncBinder(
  options: SessionTelemetryAuthSyncListenerOptions = {},
): null {
  useSessionTelemetryAuthSyncListener(options);
  return null;
}

/** Re-export para legacy consolidation (P1-02). */
export { isSessionTelemetryEffective };
