/**
 * Orquestador refresh con resiliencia — IAM-FE-PHASE-05 IMPL-05.
 */

import { clearCambiarEmpresaL02Guard } from './session-cambiar-empresa-l02';
import {
  buildRefreshOutcomeMetadata,
  resolveFailureRefreshOutcome,
  resolveSuccessRefreshOutcome,
} from './session-refresh-outcome.resolver';
import type {
  RefreshOutcomeMetadata,
  RefreshResilienceSource,
  RefreshSingleFlightRole,
} from './session-refresh-outcome.types';
import {
  DEFAULT_REFRESH_RETRY_POLICY,
  extractRefreshHttpErrorContext,
  resolveRefreshRetryDecision,
  type RefreshRetryPolicyConfig,
} from './session-refresh-retry.policy';
import { SESSION_REFRESH_RESILIENCE_V5_ENABLED } from './session-refresh-resilience.flags';

export interface ExecuteRefreshWithResilienceInput {
  source: RefreshResilienceSource;
  singleFlightRole?: RefreshSingleFlightRole;
}

export interface ExecuteRefreshWithResilienceDeps {
  callRefresh: () => Promise<string>;
  sleep?: (ms: number) => Promise<void>;
  getNowMs?: () => number;
  policy?: RefreshRetryPolicyConfig;
}

export interface ExecuteRefreshWithResilienceResult {
  accessToken: string;
  metadata: RefreshOutcomeMetadata;
}

/** Clave interna — metadata outcome en error refresh fallido (P1-01). */
export const REFRESH_FAILURE_OUTCOME_METADATA_KEY = '__refreshFailureOutcomeMetadata';

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

interface BuildRefreshFailureMetadataInput {
  source: RefreshResilienceSource;
  attemptCount: number;
  backoffMsApplied: number;
  singleFlightRole: RefreshSingleFlightRole;
  nowMs: number;
  error: unknown;
}

function buildRefreshFailureMetadata(
  input: BuildRefreshFailureMetadataInput,
): RefreshOutcomeMetadata {
  const httpContext = extractRefreshHttpErrorContext(input.error);
  const failureOutcome = resolveFailureRefreshOutcome({
    http: httpContext,
    source: input.source,
    attemptCount: input.attemptCount,
    backoffMsApplied: input.backoffMsApplied,
    singleFlightRole: input.singleFlightRole,
    nowMs: input.nowMs,
  });

  return buildRefreshOutcomeMetadata(failureOutcome, {
    source: input.source,
    attemptCount: input.attemptCount,
    backoffMsApplied: input.backoffMsApplied,
    singleFlightRole: input.singleFlightRole,
    httpStatus: httpContext.httpStatus,
    nowMs: input.nowMs,
  });
}

/** Adjunta metadata outcome al error original sin alterar classify F2. */
export function enrichRefreshFailureError(
  error: unknown,
  input: Omit<BuildRefreshFailureMetadataInput, 'error'>,
): unknown {
  const metadata = buildRefreshFailureMetadata({ ...input, error });

  if (error !== null && typeof error === 'object') {
    Object.defineProperty(error, REFRESH_FAILURE_OUTCOME_METADATA_KEY, {
      value: metadata,
      enumerable: false,
      configurable: true,
    });
  }

  return error;
}

/** Extrae metadata outcome de error refresh fallido — runtime P1-01. */
export function getRefreshFailureOutcomeMetadata(
  error: unknown,
): RefreshOutcomeMetadata | undefined {
  if (error === null || typeof error !== 'object') {
    return undefined;
  }

  if (REFRESH_FAILURE_OUTCOME_METADATA_KEY in error) {
    const metadata = (error as Record<string, unknown>)[
      REFRESH_FAILURE_OUTCOME_METADATA_KEY
    ];
    if (metadata && typeof metadata === 'object' && 'outcome' in metadata) {
      return metadata as RefreshOutcomeMetadata;
    }
  }

  return undefined;
}

function buildRefreshSuccessResult(
  accessToken: string,
  input: {
    source: RefreshResilienceSource;
    attemptCount: number;
    backoffMsApplied: number;
    singleFlightRole: RefreshSingleFlightRole;
    nowMs: number;
  },
): ExecuteRefreshWithResilienceResult {
  const outcome = resolveSuccessRefreshOutcome({
    singleFlightRole: input.singleFlightRole,
    nowMs: input.nowMs,
  });
  clearCambiarEmpresaL02Guard();

  return {
    accessToken,
    metadata: buildRefreshOutcomeMetadata(outcome, {
      source: input.source,
      attemptCount: input.attemptCount,
      backoffMsApplied: input.backoffMsApplied,
      singleFlightRole: input.singleFlightRole,
      httpStatus: 200,
      nowMs: input.nowMs,
    }),
  };
}

/**
 * Ejecuta refresh con retry 500/429 dentro del single-flight líder.
 * Propaga error original tras agotar retries (RT-02: caller maneja cola).
 */
export async function executeRefreshWithResilience(
  input: ExecuteRefreshWithResilienceInput,
  deps: ExecuteRefreshWithResilienceDeps,
): Promise<ExecuteRefreshWithResilienceResult> {
  const policy = deps.policy ?? DEFAULT_REFRESH_RETRY_POLICY;
  const sleep = deps.sleep ?? defaultSleep;
  const getNowMs = deps.getNowMs ?? (() => Date.now());
  const singleFlightRole = input.singleFlightRole ?? 'leader';

  if (!SESSION_REFRESH_RESILIENCE_V5_ENABLED || !policy.resilienceEnabled) {
    const nowMs = getNowMs();
    try {
      const accessToken = await deps.callRefresh();
      return buildRefreshSuccessResult(accessToken, {
        source: input.source,
        attemptCount: 1,
        backoffMsApplied: 0,
        singleFlightRole,
        nowMs,
      });
    } catch (error) {
      throw enrichRefreshFailureError(error, {
        source: input.source,
        attemptCount: 1,
        backoffMsApplied: 0,
        singleFlightRole,
        nowMs,
      });
    }
  }

  let attemptCount = 0;
  let backoffMsApplied = 0;

  while (true) {
    attemptCount += 1;

    try {
      const accessToken = await deps.callRefresh();
      const nowMs = getNowMs();

      return buildRefreshSuccessResult(accessToken, {
        source: input.source,
        attemptCount,
        backoffMsApplied,
        singleFlightRole,
        nowMs,
      });
    } catch (error) {
      const nowMs = getNowMs();
      const httpContext = extractRefreshHttpErrorContext(error);
      const decision = resolveRefreshRetryDecision(
        httpContext,
        attemptCount,
        policy,
        nowMs,
      );

      if (decision.action === 'retry') {
        backoffMsApplied += decision.backoffMs;
        await sleep(decision.backoffMs);
        continue;
      }

      throw enrichRefreshFailureError(error, {
        source: input.source,
        attemptCount,
        backoffMsApplied,
        singleFlightRole,
        nowMs,
      });
    }
  }
}
