import { describe, expect, it } from 'vitest';

import {
  resolveBootstrapImpersonationExitSource,
  resolveImpersonationExitPolicy,
  resolveImpersonationExitSourceFromHttpStatus,
  resolveImpersonationExitToastMessage,
  shouldRedirectToSuperAdminAfterImpersonationExit,
} from '../session-impersonation-exit.policy';
import type { SessionImpersonationFlagsSnapshot } from '../session-impersonation.flags';

const FLAGS_ON: SessionImpersonationFlagsSnapshot = {
  masterEnabled: true,
  interceptorEnabled: true,
  cambiarEmpresaEnabled: true,
  authSyncEnabled: true,
};

const FLAGS_OFF: SessionImpersonationFlagsSnapshot = {
  masterEnabled: false,
  interceptorEnabled: true,
  cambiarEmpresaEnabled: true,
  authSyncEnabled: true,
};

describe('session-impersonation-exit.policy (IMPL-03)', () => {
  it('NO_OP cuando no es modo soporte en interceptor', () => {
    expect(
      resolveImpersonationExitPolicy(
        { isSupportMode: false, context: 'interceptor', httpStatus: 401 },
        FLAGS_ON,
      ),
    ).toEqual({ action: 'NO_OP' });
  });

  it('REJECT_LEGACY cuando master OFF en interceptor', () => {
    expect(
      resolveImpersonationExitPolicy(
        { isSupportMode: true, context: 'interceptor', httpStatus: 401 },
        FLAGS_OFF,
      ),
    ).toEqual({ action: 'REJECT_LEGACY' });
  });

  it('CONTROLLED_EXIT interceptor 401/403 cuando flags ON', () => {
    expect(
      resolveImpersonationExitPolicy(
        { isSupportMode: true, context: 'interceptor', httpStatus: 401 },
        FLAGS_ON,
      ),
    ).toEqual({ action: 'CONTROLLED_EXIT', source: 'INTERCEPTOR_ERP_401' });

    expect(
      resolveImpersonationExitPolicy(
        { isSupportMode: true, context: 'interceptor', httpStatus: 403 },
        FLAGS_ON,
      ),
    ).toEqual({ action: 'CONTROLLED_EXIT', source: 'INTERCEPTOR_ERP_403' });
  });

  it('REJECT_LEGACY interceptor cuando sub-flag OFF', () => {
    expect(
      resolveImpersonationExitPolicy(
        { isSupportMode: true, context: 'interceptor', httpStatus: 401 },
        { ...FLAGS_ON, interceptorEnabled: false },
      ),
    ).toEqual({ action: 'REJECT_LEGACY' });
  });

  it('CONTROLLED_EXIT cambiar empresa precheck y forbidden', () => {
    expect(
      resolveImpersonationExitPolicy(
        { isSupportMode: true, context: 'cambiar_empresa_precheck' },
        FLAGS_ON,
      ),
    ).toEqual({ action: 'CONTROLLED_EXIT', source: 'CAMBIAR_EMPRESA_FORBIDDEN' });

    expect(
      resolveImpersonationExitPolicy(
        { isSupportMode: true, context: 'cambiar_empresa_forbidden', httpStatus: 403 },
        FLAGS_ON,
      ),
    ).toEqual({ action: 'CONTROLLED_EXIT', source: 'CAMBIAR_EMPRESA_FORBIDDEN' });
  });

  it('bootstrap mapea expired vs invalid', () => {
    expect(resolveBootstrapImpersonationExitSource('expired')).toBe(
      'BOOTSTRAP_SUPPORT_EXPIRED',
    );
    expect(resolveBootstrapImpersonationExitSource('invalid')).toBe(
      'BOOTSTRAP_SUPPORT_INVALID',
    );
    expect(resolveBootstrapImpersonationExitSource('me_failed')).toBe(
      'BOOTSTRAP_SUPPORT_INVALID',
    );
  });

  it('manual → CONTROLLED_EXIT MANUAL_END o DELEGATE_MANUAL si master OFF', () => {
    expect(
      resolveImpersonationExitPolicy({ isSupportMode: true, context: 'manual' }, FLAGS_ON),
    ).toEqual({ action: 'CONTROLLED_EXIT', source: 'MANUAL_END' });

    expect(
      resolveImpersonationExitPolicy({ isSupportMode: true, context: 'manual' }, FLAGS_OFF),
    ).toEqual({ action: 'DELEGATE_MANUAL' });
  });

  it('resolveImpersonationExitSourceFromHttpStatus default 401', () => {
    expect(resolveImpersonationExitSourceFromHttpStatus(403)).toBe('INTERCEPTOR_ERP_403');
    expect(resolveImpersonationExitSourceFromHttpStatus(401)).toBe('INTERCEPTOR_ERP_401');
    expect(resolveImpersonationExitSourceFromHttpStatus(undefined)).toBe(
      'INTERCEPTOR_ERP_401',
    );
  });

  it('toast messages diferenciados por source', () => {
    expect(resolveImpersonationExitToastMessage('CAMBIAR_EMPRESA_FORBIDDEN')).toContain(
      'Cambio de empresa no permitido',
    );
    expect(resolveImpersonationExitToastMessage('INTERCEPTOR_ERP_401')).toContain(
      'sesión de soporte',
    );
    expect(resolveImpersonationExitToastMessage('MANUAL_END')).toContain(
      'Modo soporte finalizado',
    );
  });

  it('redirect super-admin en /app y /admin excepto MANUAL_END', () => {
    expect(
      shouldRedirectToSuperAdminAfterImpersonationExit(
        '/app/inventario',
        'INTERCEPTOR_ERP_401',
      ),
    ).toBe(true);
    expect(
      shouldRedirectToSuperAdminAfterImpersonationExit(
        '/admin/users',
        'INTERCEPTOR_ERP_403',
      ),
    ).toBe(true);
    expect(
      shouldRedirectToSuperAdminAfterImpersonationExit('/super-admin/dashboard', 'MANUAL_END'),
    ).toBe(false);
  });
});
