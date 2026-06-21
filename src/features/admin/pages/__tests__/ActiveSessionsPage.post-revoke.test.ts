import type { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
  executeActiveSessionRevoke,
  type ActiveSessionRevokeDeps,
} from '@/features/admin/pages/ActiveSessionsPage';
import type { AdminSessionRead } from '@/features/admin/types/session.types';
import { isCurrentSession } from '@/features/admin/utils/iam-current-session';

vi.mock('@/core/auth/session/session-logout-v3.flags', () => ({
  SESSION_LOGOUT_V3_ENABLED: true,
}));

const CURRENT_TOKEN_ID = 'token-browser-b';

const currentSession: AdminSessionRead = {
  token_id: CURRENT_TOKEN_ID,
  usuario_id: 'user-tenant-admin',
  cliente_id: 'client-1',
  created_at: '2026-01-01T00:00:00Z',
  last_used_at: '2026-01-01T12:00:00Z',
  expires_at: '2026-12-31T00:00:00Z',
  device_name: 'Chrome',
  device_id: 'device-b',
  ip_address: '127.0.0.1',
  user_agent: 'Mozilla/5.0 Chrome',
  client_type: 'web',
  nombre_usuario: 'tenant_admin',
  nombre: 'Tenant',
  apellido: 'Admin',
};

const otherBrowserSameUserSession: AdminSessionRead = {
  ...currentSession,
  token_id: 'token-browser-a',
  device_id: 'device-a',
  device_name: 'Firefox',
  user_agent: 'Mozilla/5.0 Firefox',
};

const otherUserSession: AdminSessionRead = {
  ...currentSession,
  token_id: 'token-other-user',
  usuario_id: 'user-other',
  nombre_usuario: 'Bob Usuario',
  nombre: 'Bob',
  apellido: 'Usuario',
};

function createDeps(
  overrides?: Partial<ActiveSessionRevokeDeps>,
): ActiveSessionRevokeDeps {
  return {
    revokeSessionById: vi.fn().mockResolvedValue(undefined),
    invalidateActiveSessionsListQueries: vi.fn().mockResolvedValue(undefined),
    runSessionValidityProbe: vi.fn().mockResolvedValue(undefined),
    isCurrentSession: (session) => isCurrentSession(session, CURRENT_TOKEN_ID),
    showSuccessToast: vi.fn(),
    showErrorToast: vi.fn(),
    ...overrides,
  };
}

const queryClient = {} as QueryClient;

describe('executeActiveSessionRevoke post-revoke probe (IMPL-08)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('revocar sesión actual ejecuta runSessionValidityProbe', async () => {
    const deps = createDeps();

    await executeActiveSessionRevoke(currentSession, queryClient, deps);

    expect(deps.revokeSessionById).toHaveBeenCalledWith(CURRENT_TOKEN_ID);
    expect(deps.runSessionValidityProbe).toHaveBeenCalledTimes(1);
    expect(deps.invalidateActiveSessionsListQueries).toHaveBeenCalledWith(queryClient);
    expect(deps.showSuccessToast).toHaveBeenCalledWith(
      'Sesión de tenant_admin revocada correctamente.',
    );
  });

  it('revocar otra sesión propia (otro navegador) NO ejecuta probe', async () => {
    const deps = createDeps();

    await executeActiveSessionRevoke(otherBrowserSameUserSession, queryClient, deps);

    expect(deps.revokeSessionById).toHaveBeenCalledWith('token-browser-a');
    expect(deps.runSessionValidityProbe).not.toHaveBeenCalled();
    expect(deps.invalidateActiveSessionsListQueries).toHaveBeenCalledTimes(1);
    expect(deps.showSuccessToast).toHaveBeenCalledTimes(1);
  });

  it('revoke sesión ajena NO ejecuta probe', async () => {
    const deps = createDeps();

    await executeActiveSessionRevoke(otherUserSession, queryClient, deps);

    expect(deps.revokeSessionById).toHaveBeenCalledWith('token-other-user');
    expect(deps.runSessionValidityProbe).not.toHaveBeenCalled();
    expect(deps.invalidateActiveSessionsListQueries).toHaveBeenCalledTimes(1);
    expect(deps.showSuccessToast).toHaveBeenCalledTimes(1);
  });

  it('current_token_id null — ninguna sesión dispara probe', async () => {
    const deps = createDeps({
      isCurrentSession: (session) => isCurrentSession(session, null),
    });

    await executeActiveSessionRevoke(currentSession, queryClient, deps);

    expect(deps.runSessionValidityProbe).not.toHaveBeenCalled();
  });

  it('revoke con error NO ejecuta probe ni invalidate', async () => {
    const deps = createDeps({
      revokeSessionById: vi.fn().mockRejectedValue(new Error('revoke failed')),
    });

    await expect(
      executeActiveSessionRevoke(currentSession, queryClient, deps),
    ).rejects.toThrow('revoke failed');

    expect(deps.runSessionValidityProbe).not.toHaveBeenCalled();
    expect(deps.invalidateActiveSessionsListQueries).not.toHaveBeenCalled();
    expect(deps.showSuccessToast).not.toHaveBeenCalled();
    expect(deps.showErrorToast).toHaveBeenCalledWith('revoke failed');
  });

  it('mantiene toast de éxito e invalidateQueries en flujo exitoso', async () => {
    const deps = createDeps();

    await executeActiveSessionRevoke(otherUserSession, queryClient, deps);

    expect(deps.showSuccessToast).toHaveBeenCalledTimes(1);
    expect(deps.invalidateActiveSessionsListQueries).toHaveBeenCalledTimes(1);
    expect(deps.showErrorToast).not.toHaveBeenCalled();
  });
});
