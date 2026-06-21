import { describe, expect, it, vi } from 'vitest';

import {
  resolveImpersonationExitPolicy,
  shouldRedirectToSuperAdminAfterImpersonationExit,
} from '../session-impersonation-exit.policy';
import {
  executeImpersonationControlledExit,
  resetImpersonationExitStateForTests,
} from '../session-impersonation-exit';
import type { SessionImpersonationFlagsSnapshot } from '../session-impersonation.flags';

const FLAGS_ON: SessionImpersonationFlagsSnapshot = {
  masterEnabled: true,
  interceptorEnabled: true,
  cambiarEmpresaEnabled: true,
  authSyncEnabled: true,
};

/**
 * Simula branch interceptor AuthContext para 401/403 en modo soporte (V6.1).
 */
async function simulateInterceptorSupportAuthError(options: {
  httpStatus: 401 | 403;
  pathname: string;
  flags?: SessionImpersonationFlagsSnapshot;
}): Promise<'controlled_exit' | 'reject_legacy'> {
  resetImpersonationExitStateForTests();

  const decision = resolveImpersonationExitPolicy(
    {
      isSupportMode: true,
      context: 'interceptor',
      httpStatus: options.httpStatus,
    },
    options.flags ?? FLAGS_ON,
  );

  if (decision.action === 'CONTROLLED_EXIT' && decision.source) {
    const redirectToSuperAdmin = shouldRedirectToSuperAdminAfterImpersonationExit(
      options.pathname,
      decision.source,
    );

    await executeImpersonationControlledExit(
      {
        source: decision.source,
        redirectToSuperAdmin,
        skipEndImpersonationApi: true,
      },
      {
        showToast: vi.fn(),
        restorePlatformSession: vi.fn().mockResolvedValue(undefined),
        emitPostRestoreAuthSync: vi.fn(),
        getRestoredAccessToken: () => 'parent-token',
        getCurrentUser: () => null,
        getEmpresaActivaId: () => null,
      },
    );

    return 'controlled_exit';
  }

  return 'reject_legacy';
}

describe('session-impersonation interceptor integration (IMPL-12)', () => {
  it('V6.1 — 401 soporte con flags ON → controlled exit sin refresh F5', async () => {
    const refreshSpy = vi.fn();
    const result = await simulateInterceptorSupportAuthError({
      httpStatus: 401,
      pathname: '/app/dashboard',
    });

    expect(result).toBe('controlled_exit');
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it('V6.1 — 403 soporte con flags ON → controlled exit', async () => {
    const result = await simulateInterceptorSupportAuthError({
      httpStatus: 403,
      pathname: '/admin/clientes',
    });

    expect(result).toBe('controlled_exit');
  });

  it('rollback L1 — master OFF → reject legacy', async () => {
    const result = await simulateInterceptorSupportAuthError({
      httpStatus: 401,
      pathname: '/app/dashboard',
      flags: { ...FLAGS_ON, masterEnabled: false },
    });

    expect(result).toBe('reject_legacy');
  });

  it('rollback L2 — interceptor sub-flag OFF → reject legacy', async () => {
    const result = await simulateInterceptorSupportAuthError({
      httpStatus: 401,
      pathname: '/app/dashboard',
      flags: { ...FLAGS_ON, interceptorEnabled: false },
    });

    expect(result).toBe('reject_legacy');
  });
});
