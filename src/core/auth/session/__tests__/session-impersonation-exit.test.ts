import { describe, expect, it, vi } from 'vitest';

import { buildSessionClaimsSnapshot } from '../session-claims-snapshot';
import {
  executeImpersonationControlledExit,
  isImpersonationExitInFlight,
  resetImpersonationExitStateForTests,
} from '../session-impersonation-exit';

describe('session-impersonation-exit orchestrator (IMPL-04)', () => {
  it('ejecuta toast → endImpersonation API → restore → emit post-restore', async () => {
    resetImpersonationExitStateForTests();

    const showToast = vi.fn();
    const callEndImpersonationApi = vi.fn().mockResolvedValue(undefined);
    const restorePlatformSession = vi.fn().mockResolvedValue(undefined);
    const emitPostRestoreAuthSync = vi.fn();
    const parentToken = 'parent.access.token';

    await executeImpersonationControlledExit(
      { source: 'MANUAL_END' },
      {
        showToast,
        callEndImpersonationApi,
        restorePlatformSession,
        emitPostRestoreAuthSync,
        getRestoredAccessToken: () => parentToken,
        getCurrentUser: () => null,
        getEmpresaActivaId: () => null,
      },
    );

    expect(showToast).toHaveBeenCalledTimes(1);
    expect(callEndImpersonationApi).toHaveBeenCalledTimes(1);
    expect(restorePlatformSession).toHaveBeenCalledWith({ redirectToSuperAdmin: undefined });
    expect(emitPostRestoreAuthSync).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: parentToken,
        source: 'MANUAL_END',
        claimsSnapshot: buildSessionClaimsSnapshot(parentToken, null, null),
      }),
    );
  });

  it('skipEndImpersonationApi omite API best-effort', async () => {
    resetImpersonationExitStateForTests();

    const callEndImpersonationApi = vi.fn();
    await executeImpersonationControlledExit(
      { source: 'INTERCEPTOR_ERP_401', skipEndImpersonationApi: true },
      {
        showToast: vi.fn(),
        callEndImpersonationApi,
        restorePlatformSession: vi.fn().mockResolvedValue(undefined),
      },
    );

    expect(callEndImpersonationApi).not.toHaveBeenCalled();
  });

  it('idempotencia — segunda llamada concurrente reutiliza promise', async () => {
    resetImpersonationExitStateForTests();

    let resolveRestore: (() => void) | undefined;
    const restorePlatformSession = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRestore = resolve;
        }),
    );

    const first = executeImpersonationControlledExit(
      { source: 'INTERCEPTOR_ERP_403', skipEndImpersonationApi: true },
      {
        showToast: vi.fn(),
        restorePlatformSession,
      },
    );

    expect(isImpersonationExitInFlight()).toBe(true);

    const second = executeImpersonationControlledExit(
      { source: 'INTERCEPTOR_ERP_403', skipEndImpersonationApi: true },
      {
        showToast: vi.fn(),
        restorePlatformSession: vi.fn(),
      },
    );

    resolveRestore?.();
    await Promise.all([first, second]);

    expect(restorePlatformSession).toHaveBeenCalledTimes(1);
    expect(isImpersonationExitInFlight()).toBe(false);
  });

  it('API best-effort failure no bloquea restore', async () => {
    resetImpersonationExitStateForTests();

    const restorePlatformSession = vi.fn().mockResolvedValue(undefined);
    const logDev = vi.fn();

    await executeImpersonationControlledExit(
      { source: 'MANUAL_END' },
      {
        showToast: vi.fn(),
        callEndImpersonationApi: vi.fn().mockRejectedValue(new Error('network')),
        restorePlatformSession,
        logDev,
      },
    );

    expect(restorePlatformSession).toHaveBeenCalledTimes(1);
    expect(logDev).toHaveBeenCalled();
  });
});
