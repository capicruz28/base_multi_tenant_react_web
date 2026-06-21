/**
 * Guard L-02 post-cambiarEmpresa — IAM-FE-PHASE-05 IMPL-06 (GAP-P1-08).
 */

import type { ClassifySessionTerminationInput } from './session-termination-reason';
import { SESSION_EXPIRED_CANONICAL_MESSAGE } from './session-termination-ux';
import { SESSION_CAMBIAR_EMPRESA_L02_V5_ENABLED } from './session-refresh-resilience.flags';

/** TTL guard L-02 — diseño §9.2. */
export const CAMBIAR_EMPRESA_L02_GUARD_TTL_MS = 60_000;

export interface CambiarEmpresaL02GuardState {
  readonly empresaId: string;
  readonly registeredAtMs: number;
  readonly outcomeHint: 'ALREADY_ROTATED_L02';
}

let activeGuard: CambiarEmpresaL02GuardState | null = null;

export function registerCambiarEmpresaL02Guard(
  empresaId: string,
  nowMs: number = Date.now(),
): void {
  if (!SESSION_CAMBIAR_EMPRESA_L02_V5_ENABLED) {
    return;
  }

  const trimmed = empresaId.trim();
  if (trimmed.length === 0) {
    return;
  }

  activeGuard = {
    empresaId: trimmed,
    registeredAtMs: nowMs,
    outcomeHint: 'ALREADY_ROTATED_L02',
  };
}

export function clearCambiarEmpresaL02Guard(): void {
  activeGuard = null;
}

export function getCambiarEmpresaL02Guard(): CambiarEmpresaL02GuardState | null {
  return activeGuard;
}

export function isCambiarEmpresaL02GuardActive(nowMs: number = Date.now()): boolean {
  if (!SESSION_CAMBIAR_EMPRESA_L02_V5_ENABLED || !activeGuard) {
    return false;
  }

  return nowMs - activeGuard.registeredAtMs < CAMBIAR_EMPRESA_L02_GUARD_TTL_MS;
}

/** Heurística L-02 §6.2 — guard activo con hint ALREADY_ROTATED. */
export function isCambiarEmpresaL02AlreadyRotatedHint(
  nowMs: number = Date.now(),
): boolean {
  if (!isCambiarEmpresaL02GuardActive(nowMs)) {
    return false;
  }

  return activeGuard?.outcomeHint === 'ALREADY_ROTATED_L02';
}

/** Reset — solo tests. */
export function resetCambiarEmpresaL02GuardForTests(): void {
  activeGuard = null;
}

/**
 * Enriquece classify input: 401 refresh con guard L-02 activo → SESSION_EXPIRED (no TOKEN_REUSE).
 * No modifica classifySessionTermination — usa detail canónico §19.
 */
export function applyL02GuardToRefreshClassifyInput(
  input: ClassifySessionTerminationInput,
  nowMs: number = Date.now(),
): ClassifySessionTerminationInput {
  if (!SESSION_CAMBIAR_EMPRESA_L02_V5_ENABLED) {
    return input;
  }

  if (input.httpStatus !== 401) {
    return input;
  }

  if (input.context !== 'refresh' && input.context !== 'bootstrap') {
    return input;
  }

  if (!isCambiarEmpresaL02GuardActive(nowMs)) {
    return input;
  }

  return {
    ...input,
    detail: SESSION_EXPIRED_CANONICAL_MESSAGE,
  };
}
