import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CAMBIAR_EMPRESA_IMPERSONATION_BLOCKED_MESSAGE,
  evaluateCambiarEmpresaImpersonationGuard,
} from '../session-cambiar-empresa-impersonation.guard';

vi.mock('@/core/auth/utils/impersonation-fe-log', () => ({
  isImpersonationSupportMode: vi.fn(),
}));

import { isImpersonationSupportMode } from '@/core/auth/utils/impersonation-fe-log';

const mockIsImpersonationSupportMode = vi.mocked(isImpersonationSupportMode);

describe('session-cambiar-empresa-impersonation.guard (POST-CERT P0 Stage 1)', () => {
  beforeEach(() => {
    mockIsImpersonationSupportMode.mockReset();
  });

  it('bloquea en modo soporte con guard habilitado', () => {
    mockIsImpersonationSupportMode.mockReturnValue(true);

    expect(evaluateCambiarEmpresaImpersonationGuard('imp-token', { guardEnabled: true })).toEqual({
      blocked: true,
      message: CAMBIAR_EMPRESA_IMPERSONATION_BLOCKED_MESSAGE,
    });
    expect(mockIsImpersonationSupportMode).toHaveBeenCalledWith('imp-token');
  });

  it('no bloquea sesión ERP normal', () => {
    mockIsImpersonationSupportMode.mockReturnValue(false);

    expect(evaluateCambiarEmpresaImpersonationGuard('erp-token', { guardEnabled: true })).toEqual({
      blocked: false,
      message: CAMBIAR_EMPRESA_IMPERSONATION_BLOCKED_MESSAGE,
    });
  });

  it('no bloquea cuando guardEnabled es false (rollback)', () => {
    mockIsImpersonationSupportMode.mockReturnValue(true);

    expect(evaluateCambiarEmpresaImpersonationGuard('imp-token', { guardEnabled: false })).toEqual({
      blocked: false,
      message: CAMBIAR_EMPRESA_IMPERSONATION_BLOCKED_MESSAGE,
    });
    expect(mockIsImpersonationSupportMode).not.toHaveBeenCalled();
  });

  it('mensaje canónico exacto', () => {
    expect(CAMBIAR_EMPRESA_IMPERSONATION_BLOCKED_MESSAGE).toBe(
      'No es posible cambiar de empresa mientras se encuentra en modo impersonación.',
    );
  });
});
