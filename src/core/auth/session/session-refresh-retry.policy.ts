/**
 * Política retry refresh 500/429 — IAM-FE-PHASE-05 IMPL-03.
 */

import {
  SESSION_REFRESH_RESILIENCE_V5_ENABLED,
  SESSION_REFRESH_RETRY_429_V5_ENABLED,
  SESSION_REFRESH_RETRY_500_V5_ENABLED,
} from './session-refresh-resilience.flags';
import type { RefreshHttpErrorContext } from './session-refresh-outcome.types';

/** Backoff 500 ms — diseño §7.1. */
export const DEFAULT_REFRESH_RETRY_500_BACKOFF_MS = 500;

/** Backoff 429 default — diseño §7.2. */
export const DEFAULT_REFRESH_RETRY_429_BACKOFF_MS = 1_000;

/** Máximo reintentos 500/429 — diseño §7.1 / §7.2. */
export const MAX_REFRESH_RETRY_ATTEMPTS = 1;

export type RefreshRetryAction = 'retry' | 'abort';

export interface RefreshRetryDecision {
  readonly action: RefreshRetryAction;
  readonly backoffMs: number;
}

export interface RefreshRetryPolicyConfig {
  readonly resilienceEnabled: boolean;
  readonly retry500Enabled: boolean;
  readonly retry429Enabled: boolean;
  readonly maxRetries: number;
  readonly backoff500Ms: number;
  readonly backoff429Ms: number;
}

export const DEFAULT_REFRESH_RETRY_POLICY: Readonly<RefreshRetryPolicyConfig> = Object.freeze({
  resilienceEnabled: SESSION_REFRESH_RESILIENCE_V5_ENABLED,
  retry500Enabled: SESSION_REFRESH_RETRY_500_V5_ENABLED,
  retry429Enabled: SESSION_REFRESH_RETRY_429_V5_ENABLED,
  maxRetries: MAX_REFRESH_RETRY_ATTEMPTS,
  backoff500Ms: DEFAULT_REFRESH_RETRY_500_BACKOFF_MS,
  backoff429Ms: DEFAULT_REFRESH_RETRY_429_BACKOFF_MS,
});

function applyJitter(baseMs: number): number {
  const jitterFactor = 0.9 + Math.random() * 0.2;
  return Math.round(baseMs * jitterFactor);
}

/**
 * Parsea header Retry-After (segundos o HTTP-date).
 * Fallback undefined si no parseable.
 */
export function parseRetryAfterHeader(
  value: string | undefined,
  nowMs: number = Date.now(),
): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const trimmed = value.trim();
  const asSeconds = Number(trimmed);

  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.round(asSeconds * 1_000);
  }

  const asDate = Date.parse(trimmed);
  if (!Number.isNaN(asDate)) {
    const delta = asDate - nowMs;
    return delta > 0 ? delta : 0;
  }

  return undefined;
}

/**
 * Extrae contexto HTTP de error tipo Axios sin importar Axios.
 */
export function extractRefreshHttpErrorContext(error: unknown): RefreshHttpErrorContext {
  if (!error || typeof error !== 'object') {
    return {};
  }

  if ('response' in error) {
    const response = (
      error as {
        response?: {
          status?: number;
          data?: { detail?: unknown };
          headers?: Record<string, unknown>;
        };
      }
    ).response;

    const headers = response?.headers ?? {};
    const retryAfterRaw =
      headers['retry-after'] ?? headers['Retry-After'] ?? headers['retryAfter'];

    let detail: string | undefined;
    const rawDetail = response?.data?.detail;
    if (typeof rawDetail === 'string' && rawDetail.trim().length > 0) {
      detail = rawDetail.trim();
    }

    return {
      httpStatus: response?.status,
      retryAfterHeader:
        typeof retryAfterRaw === 'string' ? retryAfterRaw : undefined,
      detail,
    };
  }

  return {};
}

/**
 * Decide si reintentar refresh tras error HTTP.
 * RT-03: 401/403 → abort. Máx 1 retry por §19 BE.
 */
export function resolveRefreshRetryDecision(
  context: RefreshHttpErrorContext,
  attemptCount: number,
  policy: RefreshRetryPolicyConfig = DEFAULT_REFRESH_RETRY_POLICY,
  nowMs: number = Date.now(),
): RefreshRetryDecision {
  if (!policy.resilienceEnabled) {
    return { action: 'abort', backoffMs: 0 };
  }

  const status = context.httpStatus;

  if (status === 401 || status === 403) {
    return { action: 'abort', backoffMs: 0 };
  }

  if (status === 500 && policy.retry500Enabled && attemptCount <= policy.maxRetries) {
    return {
      action: 'retry',
      backoffMs: applyJitter(policy.backoff500Ms),
    };
  }

  if (status === 429 && policy.retry429Enabled && attemptCount <= policy.maxRetries) {
    const retryAfterMs =
      parseRetryAfterHeader(context.retryAfterHeader, nowMs) ?? policy.backoff429Ms;

    return {
      action: 'retry',
      backoffMs: applyJitter(retryAfterMs),
    };
  }

  return { action: 'abort', backoffMs: 0 };
}
