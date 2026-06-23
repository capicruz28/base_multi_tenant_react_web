import { describe, expect, it } from 'vitest';

import type { UserSessionRead } from '@/features/admin/types/session.types';
import { sortSessionsCurrentFirst } from '@/features/admin/utils/iam-session-list-order.utils';

const BASE: UserSessionRead = {
  token_id: 'token-a',
  usuario_id: 'user-1',
  cliente_id: 'client-1',
  empresa_id: null,
  empresa_nombre: null,
  issued_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  last_refresh_at: '2026-01-01T12:00:00Z',
  last_used_at: '2026-01-01T12:00:00Z',
  expires_at: '2026-12-31T00:00:00Z',
  is_current: false,
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

describe('useMySessionsList — sortSessionsCurrentFirst', () => {
  it('coloca la sesión actual primero preservando orden relativo del resto', () => {
    const sessions: UserSessionRead[] = [
      { ...BASE, token_id: 'token-b', is_current: false },
      { ...BASE, token_id: 'token-current', is_current: true },
      { ...BASE, token_id: 'token-c', is_current: false },
      { ...BASE, token_id: 'token-d', is_current: false },
    ];

    const sorted = sortSessionsCurrentFirst(
      sessions,
      (session) => session.is_current === true,
    );

    expect(sorted.map((s) => s.token_id)).toEqual([
      'token-current',
      'token-b',
      'token-c',
      'token-d',
    ]);
  });

  it('fallback current_token_id cuando is_current no está definido', () => {
    const sessions: UserSessionRead[] = [
      { ...BASE, token_id: 'token-x' },
      { ...BASE, token_id: 'token-fallback', is_current: undefined as unknown as boolean },
    ];

    const sorted = sortSessionsCurrentFirst(sessions, (session) => session.token_id === 'token-fallback');

    expect(sorted[0]?.token_id).toBe('token-fallback');
    expect(sorted[1]?.token_id).toBe('token-x');
  });
});

describe('MY_SESSIONS_LIST_QUERY_KEY', () => {
  it('exporta query key estable', async () => {
    const mod = await import('@/features/admin/hooks/useMySessionsList');
    expect(mod.MY_SESSIONS_LIST_QUERY_KEY).toEqual(['auth', 'sessions', 'my']);
    expect(mod.MY_SESSIONS_TABLE_COLSPAN).toBe(8);
  });
});
