/**
 * Diagnóstico sesión unificado — GAP-P3-01 (PATCH-01 A-P1-01).
 * Con telemetría master ON → solo L8; sin console legacy.
 */

import {
  emitSessionDiagContext,
  isSessionTelemetryEffective,
} from '@/core/auth/session/session-telemetry-auth-wiring';

/** Log sesión: L8 cuando master ON; legacy DEV silenciado en ese caso. */
export function logAuthSessionDiag(
  label: string,
  fields: Record<string, unknown> = {},
): void {
  if (isSessionTelemetryEffective()) {
    emitSessionDiagContext(label, fields);
    return;
  }

  if (import.meta.env.DEV) {
    console.log(`[AuthSession] ${label}`, fields);
  }
}

/** Ejecutar callback legacy DEV solo si telemetría master OFF. */
export function runLegacySessionDevLog(action: () => void): void {
  if (isSessionTelemetryEffective()) {
    return;
  }
  if (import.meta.env.DEV) {
    action();
  }
}
