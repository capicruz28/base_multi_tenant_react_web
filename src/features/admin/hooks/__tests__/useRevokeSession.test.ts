import type { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
  executeSelfSessionRevoke,
  type SelfSessionRevokeDeps,
} from '@/features/admin/utils/iam-session-revoke.utils';
import type { UserSessionRead } from '@/features/admin/types/session.types';
import { isCurrentSession } from '@/features/admin/utils/iam-current-session';

vi.mock('@/core/auth/session/session-logout-v3.flags', () => ({
  SESSION_LOGOUT_V3_ENABLED: true,
}));

const CURRENT_TOKEN = 'token-current';

const session: UserSessionRead = {
  token_id: CURRENT_TOKEN,
  usuario_id: 'user-1',
  cliente_id: 'client-1',
  empresa_id: null,
  empresa_nombre: null,
  issued_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  last_refresh_at: null,
  last_used_at: null,
  expires_at: '2026-12-31T00:00:00Z',
  is_current: true,
  status: 'active',
  duration_seconds: 100,
  device: {
    client_type: 'web',
    browser: 'Chrome',
    browser_version: null,
    os: 'Windows',
    platform: 'desktop',
    device_label: 'Chrome en Windows',
    ip_address: null,
    device_id: null,
  },
  client_type: 'web',
  ip_address: null,
  device_name: null,
  device_id: null,
};

function createDeps(overrides?: Partial<SelfSessionRevokeDeps>): SelfSessionRevokeDeps {
  return {
    revokeSessionSelf: vi.fn().mockResolvedValue({ message: 'ok', token_id: CURRENT_TOKEN }),
    invalidateMySessionsListQueries: vi.fn().mockResolvedValue(undefined),
    runSessionValidityProbe: vi.fn().mockResolvedValue(undefined),
    isCurrentSession: (s) => isCurrentSession(s, CURRENT_TOKEN),
    showSuccessToast: vi.fn(),
    showErrorToast: vi.fn(),
    ...overrides,
  };
}

const queryClient = {} as QueryClient;

describe('useRevokeSession — executeSelfSessionRevoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('self-revoke sesión actual ejecuta probe', async () => {
    const deps = createDeps();

    await executeSelfSessionRevoke(session, queryClient, deps);

    expect(deps.revokeSessionSelf).toHaveBeenCalledWith(CURRENT_TOKEN);
    expect(deps.runSessionValidityProbe).toHaveBeenCalledTimes(1);
    expect(deps.invalidateMySessionsListQueries).toHaveBeenCalledWith(queryClient);
    expect(deps.showSuccessToast).toHaveBeenCalledWith('Sesión cerrada correctamente.');
  });

  it('self-revoke remota NO ejecuta probe', async () => {
    const deps = createDeps();
    const remote = { ...session, token_id: 'token-remote', is_current: false };

    await executeSelfSessionRevoke(remote, queryClient, deps);

    expect(deps.runSessionValidityProbe).not.toHaveBeenCalled();
  });

  it('error en self-revoke muestra toast de error', async () => {
    const deps = createDeps({
      revokeSessionSelf: vi.fn().mockRejectedValue(new Error('self revoke failed')),
    });

    await expect(executeSelfSessionRevoke(session, queryClient, deps)).rejects.toThrow(
      'self revoke failed',
    );

    expect(deps.showErrorToast).toHaveBeenCalledWith('self revoke failed');
    expect(deps.invalidateMySessionsListQueries).not.toHaveBeenCalled();
  });
});

describe('useRevokeSession hook exports', () => {
  it('exporta modos admin y self', async () => {
    const mod = await import('@/features/admin/hooks/useRevokeSession');
    expect(typeof mod.useRevokeSession).toBe('function');
  });
});

describe('getSessionCloseActionLabel', () => {
  it('copy Cerrar esta sesión vs Cerrar sesión', async () => {
    const { getSessionCloseActionLabel } = await import(
      '@/features/admin/utils/iam-session-display.utils'
    );
    expect(getSessionCloseActionLabel(true)).toBe('Cerrar esta sesión');
    expect(getSessionCloseActionLabel(false)).toBe('Cerrar sesión');
  });
});
