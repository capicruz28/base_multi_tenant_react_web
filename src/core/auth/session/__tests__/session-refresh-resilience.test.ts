import { describe, expect, it, vi, beforeEach } from 'vitest';

import { resetCambiarEmpresaL02GuardForTests } from '../session-cambiar-empresa-l02';
import {
  getCambiarEmpresaL02Guard,
  registerCambiarEmpresaL02Guard,
} from '../session-cambiar-empresa-l02';
import { executeRefreshWithResilience, getRefreshFailureOutcomeMetadata } from '../session-refresh-resilience';
import type { RefreshRetryPolicyConfig } from '../session-refresh-retry.policy';
import {
  DEFAULT_REFRESH_RETRY_429_BACKOFF_MS,
  DEFAULT_REFRESH_RETRY_500_BACKOFF_MS,
  MAX_REFRESH_RETRY_ATTEMPTS,
} from '../session-refresh-retry.policy';

const RESILIENCE_ON: RefreshRetryPolicyConfig = {
  resilienceEnabled: true,
  retry500Enabled: true,
  retry429Enabled: true,
  maxRetries: MAX_REFRESH_RETRY_ATTEMPTS,
  backoff500Ms: DEFAULT_REFRESH_RETRY_500_BACKOFF_MS,
  backoff429Ms: DEFAULT_REFRESH_RETRY_429_BACKOFF_MS,
};

function axiosLikeError(status: number, detail?: string): Error & { response: unknown } {
  return Object.assign(new Error(`HTTP ${status}`), {
    response: {
      status,
      data: detail ? { detail } : undefined,
      headers: {},
    },
  });
}

describe('session-refresh-resilience (IMPL-05 / IMPL-12)', () => {
  beforeEach(() => {
    resetCambiarEmpresaL02GuardForTests();
  });

  it('V5.1 — 500 transitorio: 1 retry → éxito', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const callRefresh = vi
      .fn()
      .mockRejectedValueOnce(axiosLikeError(500))
      .mockResolvedValueOnce('token-after-retry');

    const result = await executeRefreshWithResilience(
      { source: 'interceptor', singleFlightRole: 'leader' },
      { callRefresh, sleep, policy: RESILIENCE_ON },
    );

    expect(callRefresh).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('token-after-retry');
    expect(result.metadata.outcome).toBe('ROTATED');
    expect(result.metadata.attemptCount).toBe(2);
  });

  it('V5.2 — 500 persistente: retry agotado → propaga error', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const callRefresh = vi.fn().mockRejectedValue(axiosLikeError(500));

    await expect(
      executeRefreshWithResilience(
        { source: 'bootstrap', singleFlightRole: 'leader' },
        { callRefresh, sleep, policy: RESILIENCE_ON },
      ),
    ).rejects.toMatchObject({ response: { status: 500 } });

    expect(callRefresh).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('RT-03 — 401 sin retry', async () => {
    const sleep = vi.fn();
    const callRefresh = vi.fn().mockRejectedValue(axiosLikeError(401));

    await expect(
      executeRefreshWithResilience(
        { source: 'interceptor', singleFlightRole: 'leader' },
        { callRefresh, sleep, policy: RESILIENCE_ON },
      ),
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(callRefresh).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('refresh OK limpia guard L-02', async () => {
    registerCambiarEmpresaL02Guard('empresa-aaa', 0);

    await executeRefreshWithResilience(
      { source: 'interceptor', singleFlightRole: 'leader' },
      {
        callRefresh: vi.fn().mockResolvedValue('new-token'),
        policy: RESILIENCE_ON,
      },
    );

    expect(getCambiarEmpresaL02Guard()).toBeNull();
  });

  it('master OFF — delegación directa sin retry', async () => {
    const sleep = vi.fn();
    const callRefresh = vi
      .fn()
      .mockRejectedValueOnce(axiosLikeError(500))
      .mockResolvedValueOnce('token');

    await expect(
      executeRefreshWithResilience(
        { source: 'interceptor', singleFlightRole: 'leader' },
        {
          callRefresh,
          sleep,
          policy: { ...RESILIENCE_ON, resilienceEnabled: false },
        },
      ),
    ).rejects.toMatchObject({ response: { status: 500 } });

    expect(callRefresh).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('V5.5 — ALREADY_ROTATED metadata para follower queued', async () => {
    const result = await executeRefreshWithResilience(
      { source: 'interceptor', singleFlightRole: 'queued' },
      {
        callRefresh: vi.fn().mockResolvedValue('access-token'),
        policy: RESILIENCE_ON,
      },
    );

    expect(result.metadata.outcome).toBe('ALREADY_ROTATED');
  });

  it('P1-02 — L-02 guard activo → ALREADY_ROTATED en éxito', async () => {
    registerCambiarEmpresaL02Guard('empresa-aaa', 1_000);

    const result = await executeRefreshWithResilience(
      { source: 'interceptor', singleFlightRole: 'leader' },
      {
        callRefresh: vi.fn().mockResolvedValue('access-token'),
        getNowMs: () => 1_000,
        policy: RESILIENCE_ON,
      },
    );

    expect(result.metadata.outcome).toBe('ALREADY_ROTATED');
    expect(getCambiarEmpresaL02Guard()).toBeNull();
  });

  it('P1-01 — fallo refresh adjunta metadata outcome runtime', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const callRefresh = vi.fn().mockRejectedValue(axiosLikeError(500));

    try {
      await executeRefreshWithResilience(
        { source: 'bootstrap', singleFlightRole: 'leader' },
        { callRefresh, sleep, policy: RESILIENCE_ON },
      );
      expect.unreachable('should throw');
    } catch (error) {
      const metadata = getRefreshFailureOutcomeMetadata(error);
      expect(metadata?.outcome).toBe('REFRESH_FAILED_500_EXHAUSTED');
      expect(metadata?.attemptCount).toBe(2);
      expect(metadata?.source).toBe('bootstrap');
    }
  });
});
