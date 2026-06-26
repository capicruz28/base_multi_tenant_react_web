import type { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
  executeActiveSessionRevoke,
  type ActiveSessionRevokeDeps,
} from '@/features/admin/utils/iam-session-revoke.utils';
import type { AdminSessionRead } from '@/features/admin/types/session.types';
import { isCurrentSession } from '@/features/admin/utils/iam-current-session';

vi.mock('@/core/auth/session/session-logout-v3.flags', () => ({
  SESSION_LOGOUT_V3_ENABLED: true,
}));

const CURRENT_SESSION_ID = 'session-browser-b';
const CURRENT_TOKEN_ID = 'token-browser-b';

const RC1_DEVICE = {
  client_type: 'web',
  browser: 'Chrome',
  browser_version: '120',
  os: 'Windows',
  platform: 'desktop',
  device_label: 'Chrome en Windows',
  ip_address: '127.0.0.1',
  device_id: 'device-b',
} as const;

const currentSession: AdminSessionRead = {
  session_id: CURRENT_SESSION_ID,
  token_id: CURRENT_TOKEN_ID,
  usuario_id: 'user-tenant-admin',
  cliente_id: 'client-1',
  empresa_id: null,
  empresa_nombre: null,
  issued_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  last_refresh_at: '2026-01-01T12:00:00Z',
  last_used_at: '2026-01-01T12:00:00Z',
  expires_at: '2026-12-31T00:00:00Z',
  is_current: true,
  status: 'active',
  duration_seconds: 86400,
  device: { ...RC1_DEVICE },
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
  session_id: 'session-browser-a',
  token_id: 'token-browser-a',
  is_current: false,
  device_id: 'device-a',
  device_name: 'Firefox',
  user_agent: 'Mozilla/5.0 Firefox',
  device: {
    ...RC1_DEVICE,
    browser: 'Firefox',
    device_label: 'Firefox en Windows',
    device_id: 'device-a',
  },
};

const otherUserSession: AdminSessionRead = {
  ...currentSession,
  session_id: 'session-other-user',
  token_id: 'token-other-user',
  is_current: false,
  usuario_id: 'user-other',
  nombre_usuario: 'Bob Usuario',
  nombre: 'Bob',
  apellido: 'Usuario',
};

const CURRENT_CONTEXT = {
  currentSessionId: CURRENT_SESSION_ID,
  currentTokenId: CURRENT_TOKEN_ID,
};

function createDeps(
  overrides?: Partial<ActiveSessionRevokeDeps>,
): ActiveSessionRevokeDeps {
  return {
    revokeSessionById: vi.fn().mockResolvedValue(undefined),
    invalidateActiveSessionsListQueries: vi.fn().mockResolvedValue(undefined),
    runSessionValidityProbe: vi.fn().mockResolvedValue(undefined),
    isCurrentSession: (session) => isCurrentSession(session, CURRENT_CONTEXT),
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

  it('revocar sesión actual ejecuta runSessionValidityProbe con session_id', async () => {
    const deps = createDeps();

    await executeActiveSessionRevoke(currentSession, queryClient, deps);

    expect(deps.revokeSessionById).toHaveBeenCalledWith(CURRENT_SESSION_ID);
    expect(deps.runSessionValidityProbe).toHaveBeenCalledTimes(1);
    expect(deps.invalidateActiveSessionsListQueries).toHaveBeenCalledWith(queryClient);
    expect(deps.showSuccessToast).toHaveBeenCalledWith(
      'Sesión de tenant_admin revocada correctamente.',
    );
  });

  it('revocar otra sesión propia (otro navegador) NO ejecuta probe', async () => {
    const deps = createDeps();

    await executeActiveSessionRevoke(otherBrowserSameUserSession, queryClient, deps);

    expect(deps.revokeSessionById).toHaveBeenCalledWith('session-browser-a');
    expect(deps.runSessionValidityProbe).not.toHaveBeenCalled();
    expect(deps.invalidateActiveSessionsListQueries).toHaveBeenCalledTimes(1);
    expect(deps.showSuccessToast).toHaveBeenCalledTimes(1);
  });

  it('revoke sesión ajena NO ejecuta probe', async () => {
    const deps = createDeps();

    await executeActiveSessionRevoke(otherUserSession, queryClient, deps);

    expect(deps.revokeSessionById).toHaveBeenCalledWith('session-other-user');
    expect(deps.runSessionValidityProbe).not.toHaveBeenCalled();
    expect(deps.invalidateActiveSessionsListQueries).toHaveBeenCalledTimes(1);
    expect(deps.showSuccessToast).toHaveBeenCalledTimes(1);
  });

  it('is_current false — probe si session_id coincide', async () => {
    const deps = createDeps({
      isCurrentSession: (session) => isCurrentSession(session, CURRENT_CONTEXT),
    });
    const sessionWithFalseFlag = { ...currentSession, is_current: false };

    await executeActiveSessionRevoke(sessionWithFalseFlag, queryClient, deps);

    expect(deps.runSessionValidityProbe).toHaveBeenCalledTimes(1);
  });

  it('context vacío — fallback no dispara probe sin is_current true', async () => {
    const deps = createDeps({
      isCurrentSession: (session) =>
        isCurrentSession(session, { currentSessionId: null, currentTokenId: null }),
    });
    const sessionWithoutFlag = {
      ...currentSession,
      is_current: undefined as unknown as boolean,
    };

    await executeActiveSessionRevoke(sessionWithoutFlag, queryClient, deps);

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

  it('RC1 sin session_id — revoke usa token_id como fallback', async () => {
    const deps = createDeps();
    const rc1Only = { ...otherBrowserSameUserSession, session_id: undefined };

    await executeActiveSessionRevoke(rc1Only, queryClient, deps);

    expect(deps.revokeSessionById).toHaveBeenCalledWith('token-browser-a');
  });
});

/** Compatibilidad: re-export desde ActiveSessionsPage sigue resolviendo el mismo símbolo. */
describe('ActiveSessionsPage re-export', () => {
  it('executeActiveSessionRevoke re-exportado desde la page', async () => {
    const pageModule = await import('@/features/admin/pages/ActiveSessionsPage');
    expect(pageModule.executeActiveSessionRevoke).toBe(executeActiveSessionRevoke);
  }, 25_000);
});
