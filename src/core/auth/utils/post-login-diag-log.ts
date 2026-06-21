/**
 * Logs temporales DEV — delegados a telemetría NAV_GATE F8 (P1-02).
 */
import {
  emitNavGateDiag,
  isSessionTelemetryEffective,
} from '@/core/auth/session/session-telemetry-auth-wiring';

const TAG = '[POST_LOGIN_DIAG]';

export function logPostLoginDiag(
  component: string,
  event: string,
  payload: Record<string, unknown> = {},
): void {
  if (isSessionTelemetryEffective()) {
    emitNavGateDiag(component, event, 'log', payload);
    return;
  }

  if (!import.meta.env.DEV) {
    return;
  }

  console.log(TAG, { component, event, ts: performance.now(), ...payload });
}

export function warnPostLoginDiag(
  component: string,
  event: string,
  payload: Record<string, unknown> = {},
): void {
  if (isSessionTelemetryEffective()) {
    emitNavGateDiag(component, event, 'warn', payload);
    return;
  }

  if (!import.meta.env.DEV) {
    return;
  }

  console.warn(TAG, { component, event, ts: performance.now(), ...payload });
}
