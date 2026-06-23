import { describe, expect, it } from 'vitest';

import type { AdminSessionRead } from '@/features/admin/types/session.types';
import { isCurrentSession } from '@/features/admin/utils/iam-current-session';

const BASE_SESSION: AdminSessionRead = {
  token_id: 'token-browser-a',
  usuario_id: 'user-tenant-admin',
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
  duration_seconds: 86400,
  device: {
    client_type: 'web',
    browser: 'Chrome',
    browser_version: '120',
    os: 'Windows',
    platform: 'desktop',
    device_label: 'Chrome en Windows',
    ip_address: '127.0.0.1',
    device_id: 'device-a',
  },
  device_name: 'Chrome',
  device_id: 'device-a',
  ip_address: '127.0.0.1',
  user_agent: 'Mozilla/5.0 Chrome',
  client_type: 'web',
  nombre_usuario: 'tenant_admin',
  nombre: 'Tenant',
  apellido: 'Admin',
};

describe('isCurrentSession (IAM-FE-CURRENT-TOKEN-ID-01 + RC1 is_current)', () => {
  it('prioriza is_current true del Backend aunque current_token_id sea null', () => {
    expect(isCurrentSession({ ...BASE_SESSION, is_current: true }, null)).toBe(true);
  });

  it('HOTFIX: fallback token_id cuando backend is_current false pero token coincide', () => {
    expect(
      isCurrentSession({ ...BASE_SESSION, is_current: false }, BASE_SESSION.token_id),
    ).toBe(true);
  });

  it('coerce is_current string "true"', () => {
    expect(
      isCurrentSession(
        { ...BASE_SESSION, is_current: 'true' as unknown as boolean },
        null,
      ),
    ).toBe(true);
  });

  it('fallback token_id cuando is_current no está definido', () => {
    const legacySession = { ...BASE_SESSION, is_current: undefined as unknown as boolean };
    expect(isCurrentSession(legacySession, 'token-browser-a')).toBe(true);
    expect(isCurrentSession(legacySession, 'token-browser-b')).toBe(false);
  });

  it('token_id case-insensitive match', () => {
    expect(isCurrentSession(BASE_SESSION, 'TOKEN-BROWSER-A')).toBe(true);
  });

  it('identifica la sesión actual por token_id (fallback)', () => {
    expect(isCurrentSession(BASE_SESSION, 'token-browser-a')).toBe(true);
    expect(isCurrentSession({ ...BASE_SESSION, is_current: true }, 'token-browser-a')).toBe(true);
  });

  it('dos navegadores mismo usuario — otra sesión propia no es la actual', () => {
    const otherBrowserSession: AdminSessionRead = {
      ...BASE_SESSION,
      token_id: 'token-browser-b',
      is_current: false,
      device_id: 'device-b',
      device_name: 'Firefox',
      user_agent: 'Mozilla/5.0 Firefox',
      device: {
        ...BASE_SESSION.device,
        browser: 'Firefox',
        device_label: 'Firefox en Windows',
        device_id: 'device-b',
      },
    };

    expect(isCurrentSession(otherBrowserSession, 'token-browser-b')).toBe(true);
    expect(isCurrentSession(BASE_SESSION, 'token-browser-b')).toBe(false);
  });

  it('revocar otra sesión propia — target distinto de current_token_id', () => {
    const sessionBrowserA = BASE_SESSION;
    const currentOnBrowserB = 'token-browser-b';

    expect(isCurrentSession(sessionBrowserA, currentOnBrowserB)).toBe(false);
  });

  it('revocar sesión actual — target coincide con current_token_id', () => {
    expect(
      isCurrentSession({ ...BASE_SESSION, is_current: true }, BASE_SESSION.token_id),
    ).toBe(true);
  });

  it('current_token_id null — ninguna sesión es actual sin is_current true ni token', () => {
    expect(isCurrentSession(BASE_SESSION, null)).toBe(false);
    expect(isCurrentSession(BASE_SESSION, undefined)).toBe(false);
    expect(isCurrentSession(BASE_SESSION, '')).toBe(false);
  });

  it('sesión de otro usuario con is_current true', () => {
    const otherUser: AdminSessionRead = {
      ...BASE_SESSION,
      usuario_id: 'user-other',
      token_id: 'token-browser-a',
      is_current: true,
    };

    expect(isCurrentSession(otherUser, 'token-browser-a')).toBe(true);
    expect(isCurrentSession(otherUser, 'token-other')).toBe(true);
  });
});
