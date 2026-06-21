import { describe, expect, it } from 'vitest';

import type { AdminSessionRead } from '@/features/admin/types/session.types';
import { isCurrentSession } from '@/features/admin/utils/iam-current-session';

const BASE_SESSION: AdminSessionRead = {
  token_id: 'token-browser-a',
  usuario_id: 'user-tenant-admin',
  cliente_id: 'client-1',
  created_at: '2026-01-01T00:00:00Z',
  last_used_at: '2026-01-01T12:00:00Z',
  expires_at: '2026-12-31T00:00:00Z',
  device_name: 'Chrome',
  device_id: 'device-a',
  ip_address: '127.0.0.1',
  user_agent: 'Mozilla/5.0 Chrome',
  client_type: 'web',
  nombre_usuario: 'tenant_admin',
  nombre: 'Tenant',
  apellido: 'Admin',
};

describe('isCurrentSession (IAM-FE-CURRENT-TOKEN-ID-01)', () => {
  it('identifica la sesión actual por token_id', () => {
    expect(isCurrentSession(BASE_SESSION, 'token-browser-a')).toBe(true);
  });

  it('dos navegadores mismo usuario — otra sesión propia no es la actual', () => {
    const otherBrowserSession: AdminSessionRead = {
      ...BASE_SESSION,
      token_id: 'token-browser-b',
      device_id: 'device-b',
      device_name: 'Firefox',
      user_agent: 'Mozilla/5.0 Firefox',
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
    expect(isCurrentSession(BASE_SESSION, BASE_SESSION.token_id)).toBe(true);
  });

  it('current_token_id null — ninguna sesión es actual', () => {
    expect(isCurrentSession(BASE_SESSION, null)).toBe(false);
    expect(isCurrentSession(BASE_SESSION, undefined)).toBe(false);
    expect(isCurrentSession(BASE_SESSION, '')).toBe(false);
  });

  it('sesión de otro usuario nunca es actual aunque comparta token_id improbable', () => {
    const otherUser: AdminSessionRead = {
      ...BASE_SESSION,
      usuario_id: 'user-other',
      token_id: 'token-browser-a',
    };

    expect(isCurrentSession(otherUser, 'token-browser-a')).toBe(true);
    expect(isCurrentSession(otherUser, 'token-other')).toBe(false);
  });
});
