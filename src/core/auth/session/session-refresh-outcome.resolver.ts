/**
 * Resolver outcomes refresh — IAM-FE-PHASE-05 IMPL-04.
 */

import type {
  RefreshHttpErrorContext,
  RefreshOutcome,
  RefreshOutcomeMetadata,
  RefreshResilienceSource,
  RefreshSingleFlightRole,
} from './session-refresh-outcome.types';
import {
  isCambiarEmpresaL02AlreadyRotatedHint,
  isCambiarEmpresaL02GuardActive,
} from './session-cambiar-empresa-l02';

const TOKEN_REUSE_DETAIL_PATTERNS = [
  'token_reuse',
  'token reuse',
  'reutilización',
  'reutilizacion',
  'todas sus sesiones',
  'todas las sesiones',
  'all sessions',
] as const;

export interface ResolveSuccessRefreshOutcomeInput {
  singleFlightRole?: RefreshSingleFlightRole;
  nowMs?: number;
}

export interface ResolveFailureRefreshOutcomeInput {
  http: RefreshHttpErrorContext;
  source: RefreshResilienceSource;
  attemptCount: number;
  backoffMsApplied: number;
  singleFlightRole?: RefreshSingleFlightRole;
  nowMs?: number;
}

function matchesTokenReuseDetail(detail: string | undefined): boolean {
  if (!detail) {
    return false;
  }

  const normalized = detail.toLowerCase();
  return TOKEN_REUSE_DETAIL_PATTERNS.some((pattern) => normalized.includes(pattern));
}

/**
 * Outcome éxito 200 — ROTATED vs ALREADY_ROTATED (F5 perdedor).
 */
export function resolveSuccessRefreshOutcome(
  input: ResolveSuccessRefreshOutcomeInput = {},
): RefreshOutcome {
  const role = input.singleFlightRole ?? 'leader';
  const nowMs = input.nowMs ?? Date.now();

  if (role === 'queued') {
    return 'ALREADY_ROTATED';
  }

  if (isCambiarEmpresaL02AlreadyRotatedHint(nowMs)) {
    return 'ALREADY_ROTATED';
  }

  return 'ROTATED';
}

/**
 * Outcome fallo refresh tras agotar retries.
 */
export function resolveFailureRefreshOutcome(
  input: ResolveFailureRefreshOutcomeInput,
): RefreshOutcome {
  const status = input.http.httpStatus;

  if (status === 401) {
    const nowMs = input.nowMs ?? Date.now();
    if (isCambiarEmpresaL02GuardActive(nowMs)) {
      return 'REFRESH_FAILED_401';
    }
    if (matchesTokenReuseDetail(input.http.detail)) {
      return 'REFRESH_FAILED_TOKEN_REUSE';
    }
    return 'REFRESH_FAILED_401';
  }

  if (status === 403) {
    return 'REFRESH_FAILED_403';
  }

  if (status === 500) {
    return 'REFRESH_FAILED_500_EXHAUSTED';
  }

  if (status === 429) {
    return 'REFRESH_FAILED_429_EXHAUSTED';
  }

  return 'REFRESH_UNKNOWN';
}

export function buildRefreshOutcomeMetadata(
  outcome: RefreshOutcome,
  input: {
    source: RefreshResilienceSource;
    attemptCount: number;
    backoffMsApplied: number;
    singleFlightRole?: RefreshSingleFlightRole;
    httpStatus?: number;
    nowMs?: number;
  },
): RefreshOutcomeMetadata {
  const nowMs = input.nowMs ?? Date.now();

  return {
    outcome,
    httpStatus: input.httpStatus,
    attemptCount: input.attemptCount,
    backoffMsApplied: input.backoffMsApplied,
    source: input.source,
    l02GuardActive: isCambiarEmpresaL02GuardActive(nowMs),
    singleFlightRole: input.singleFlightRole ?? 'leader',
  };
}
