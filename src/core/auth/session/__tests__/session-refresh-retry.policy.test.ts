import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_REFRESH_RETRY_429_BACKOFF_MS,
  DEFAULT_REFRESH_RETRY_500_BACKOFF_MS,
  extractRefreshHttpErrorContext,
  MAX_REFRESH_RETRY_ATTEMPTS,
  parseRetryAfterHeader,
  resolveRefreshRetryDecision,
  type RefreshRetryPolicyConfig,
} from '../session-refresh-retry.policy';

const RESILIENCE_ON: RefreshRetryPolicyConfig = {
  resilienceEnabled: true,
  retry500Enabled: true,
  retry429Enabled: true,
  maxRetries: MAX_REFRESH_RETRY_ATTEMPTS,
  backoff500Ms: DEFAULT_REFRESH_RETRY_500_BACKOFF_MS,
  backoff429Ms: DEFAULT_REFRESH_RETRY_429_BACKOFF_MS,
};

describe('session-refresh-retry.policy (IMPL-03 / IMPL-11)', () => {
  describe('resolveRefreshRetryDecision', () => {
    it('RT-03 — 401 refresh → abort sin retry', () => {
      const decision = resolveRefreshRetryDecision(
        { httpStatus: 401 },
        1,
        RESILIENCE_ON,
      );
      expect(decision.action).toBe('abort');
      expect(decision.backoffMs).toBe(0);
    });

    it('403 refresh → abort sin retry', () => {
      const decision = resolveRefreshRetryDecision(
        { httpStatus: 403 },
        1,
        RESILIENCE_ON,
      );
      expect(decision.action).toBe('abort');
    });

    it('V5.1 — 500 transitorio → 1 retry con backoff', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const decision = resolveRefreshRetryDecision(
        { httpStatus: 500 },
        1,
        RESILIENCE_ON,
      );

      expect(decision.action).toBe('retry');
      expect(decision.backoffMs).toBeGreaterThanOrEqual(450);
      expect(decision.backoffMs).toBeLessThanOrEqual(550);
    });

    it('V5.2 — 500 persistente tras retry agotado → abort', () => {
      const decision = resolveRefreshRetryDecision(
        { httpStatus: 500 },
        2,
        RESILIENCE_ON,
      );
      expect(decision.action).toBe('abort');
    });

    it('V5.3 — 429 → retry con backoff default', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const decision = resolveRefreshRetryDecision(
        { httpStatus: 429 },
        1,
        RESILIENCE_ON,
      );

      expect(decision.action).toBe('retry');
      expect(decision.backoffMs).toBeGreaterThanOrEqual(900);
      expect(decision.backoffMs).toBeLessThanOrEqual(1_100);
    });

    it('429 respeta Retry-After en segundos', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const decision = resolveRefreshRetryDecision(
        { httpStatus: 429, retryAfterHeader: '2' },
        1,
        RESILIENCE_ON,
        1_000,
      );

      expect(decision.action).toBe('retry');
      expect(decision.backoffMs).toBeGreaterThanOrEqual(1_800);
      expect(decision.backoffMs).toBeLessThanOrEqual(2_200);
    });

    it('master resilience OFF → abort inmediato', () => {
      const decision = resolveRefreshRetryDecision(
        { httpStatus: 500 },
        1,
        { ...RESILIENCE_ON, resilienceEnabled: false },
      );
      expect(decision.action).toBe('abort');
    });

    it('sub-flag retry 500 OFF → abort en 500', () => {
      const decision = resolveRefreshRetryDecision(
        { httpStatus: 500 },
        1,
        { ...RESILIENCE_ON, retry500Enabled: false },
      );
      expect(decision.action).toBe('abort');
    });
  });

  describe('parseRetryAfterHeader', () => {
    it('parsea segundos', () => {
      expect(parseRetryAfterHeader('3', 0)).toBe(3_000);
    });

    it('parsea HTTP-date futuro', () => {
      const now = Date.now();
      const future = new Date(now + 5_000).toUTCString();
      const parsed = parseRetryAfterHeader(future, now);
      expect(parsed).toBeGreaterThanOrEqual(4_900);
      expect(parsed).toBeLessThanOrEqual(5_100);
    });

    it('undefined para valor inválido', () => {
      expect(parseRetryAfterHeader('not-a-date', 0)).toBeUndefined();
    });
  });

  describe('extractRefreshHttpErrorContext', () => {
    it('extrae status, detail y Retry-After de error Axios-like', () => {
      const error = {
        response: {
          status: 401,
          data: { detail: 'token_reuse detected' },
          headers: { 'retry-after': '5' },
        },
      };

      expect(extractRefreshHttpErrorContext(error)).toEqual({
        httpStatus: 401,
        retryAfterHeader: '5',
        detail: 'token_reuse detected',
      });
    });
  });
});
