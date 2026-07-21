import type { ProvisioningState } from '../types/provisioning.types';

/** Intervalo polling fase inicial (0–2 min) — contrato §10. */
export const PROVISIONING_POLL_INITIAL_MS = 5_000;

/** Intervalo polling fase media (2–10 min) — contrato §10. */
export const PROVISIONING_POLL_MEDIUM_MS = 10_000;

/** Intervalo polling fase larga (>10 min) — contrato §10. */
export const PROVISIONING_POLL_LONG_MS = 15_000;

/** Timeout UI recomendado — contrato §10.3. */
export const PROVISIONING_UI_TIMEOUT_MS = 30 * 60 * 1_000;

/** Umbral fase inicial → media (2 min). */
export const PROVISIONING_POLL_PHASE_INITIAL_MS = 2 * 60 * 1_000;

/** Umbral fase media → larga (10 min desde inicio). */
export const PROVISIONING_POLL_PHASE_MEDIUM_MS = 10 * 60 * 1_000;

/** Fallos consecutivos de red/5xx antes de banner de error de conexión — contrato §10. */
export const PROVISIONING_MAX_CONSECUTIVE_POLL_ERRORS = 3;

export function getProvisioningPollIntervalMs(elapsedMs: number): number {
  if (elapsedMs < PROVISIONING_POLL_PHASE_INITIAL_MS) {
    return PROVISIONING_POLL_INITIAL_MS;
  }
  if (elapsedMs < PROVISIONING_POLL_PHASE_MEDIUM_MS) {
    return PROVISIONING_POLL_MEDIUM_MS;
  }
  return PROVISIONING_POLL_LONG_MS;
}

export function isProvisioningPollTimedOut(startedAtMs: number, nowMs: number): boolean {
  return nowMs - startedAtMs >= PROVISIONING_UI_TIMEOUT_MS;
}

export function isTerminalProvisioningState(state: ProvisioningState): boolean {
  return state === 'ready' || state === 'failed';
}
