import { describe, expect, it } from 'vitest';

import type { AdminSessionRead } from '@/features/admin/types/session.types';
import { isCurrentSession } from '@/features/admin/utils/iam-current-session';

const BASE_SESSION: AdminSessionRead = {
  session_id: 'session-browser-a',
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

const EMPTY_CONTEXT = { currentSessionId: null, currentTokenId: null };

describe('isCurrentSession (IAM V2 FA01)', () => {
  it('prioriza is_current true del Backend aunque context sea null', () => {
    expect(isCurrentSession({ ...BASE_SESSION, is_current: true }, EMPTY_CONTEXT)).toBe(true);
  });

  it('fallback session_id vs current_session_id (V2 primario)', () => {
    expect(
      isCurrentSession(BASE_SESSION, {
        currentSessionId: 'session-browser-a',
        currentTokenId: null,
      }),
    ).toBe(true);
    expect(
      isCurrentSession(BASE_SESSION, {
        currentSessionId: 'session-browser-b',
        currentTokenId: 'token-browser-b',
      }),
    ).toBe(false);
  });

  it('session_id case-insensitive match', () => {
    expect(
      isCurrentSession(BASE_SESSION, {
        currentSessionId: 'SESSION-BROWSER-A',
        currentTokenId: null,
      }),
    ).toBe(true);
  });

  it('fallback token_id vs current_token_id (compat RC1)', () => {
    const rc1Session = { ...BASE_SESSION, session_id: undefined };
    expect(
      isCurrentSession(rc1Session, {
        currentSessionId: null,
        currentTokenId: 'token-browser-a',
      }),
    ).toBe(true);
    expect(
      isCurrentSession(rc1Session, {
        currentSessionId: null,
        currentTokenId: 'token-browser-b',
      }),
    ).toBe(false);
  });

  it('HOTFIX: fallback token_id cuando backend is_current false pero token coincide', () => {
    expect(
      isCurrentSession(
        { ...BASE_SESSION, is_current: false },
        { currentSessionId: null, currentTokenId: BASE_SESSION.token_id },
      ),
    ).toBe(true);
  });

  it('coerce is_current string "true"', () => {
    expect(
      isCurrentSession(
        { ...BASE_SESSION, is_current: 'true' as unknown as boolean },
        EMPTY_CONTEXT,
      ),
    ).toBe(true);
  });

  it('dos navegadores mismo usuario — otra sesión propia no es la actual', () => {
    const otherBrowserSession: AdminSessionRead = {
      ...BASE_SESSION,
      session_id: 'session-browser-b',
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

    expect(
      isCurrentSession(otherBrowserSession, {
        currentSessionId: 'session-browser-b',
        currentTokenId: 'token-browser-b',
      }),
    ).toBe(true);
    expect(
      isCurrentSession(BASE_SESSION, {
        currentSessionId: 'session-browser-b',
        currentTokenId: 'token-browser-b',
      }),
    ).toBe(false);
  });

  it('RTR: token_id cambió pero session_id estable — match por session_id', () => {
    const afterRtr: AdminSessionRead = {
      ...BASE_SESSION,
      token_id: 'token-rotated-new',
      is_current: false,
    };

    expect(
      isCurrentSession(afterRtr, {
        currentSessionId: 'session-browser-a',
        currentTokenId: 'token-rotated-new',
      }),
    ).toBe(true);
  });

  it('context null — ninguna sesión es actual sin is_current true', () => {
    expect(isCurrentSession(BASE_SESSION, EMPTY_CONTEXT)).toBe(false);
    expect(
      isCurrentSession(BASE_SESSION, { currentSessionId: undefined, currentTokenId: '' }),
    ).toBe(false);
  });

  it('sesión de otro usuario con is_current true', () => {
    const otherUser: AdminSessionRead = {
      ...BASE_SESSION,
      usuario_id: 'user-other',
      session_id: 'session-other',
      token_id: 'token-other',
      is_current: true,
    };

    expect(
      isCurrentSession(otherUser, {
        currentSessionId: 'session-browser-a',
        currentTokenId: 'token-browser-a',
      }),
    ).toBe(true);
  });
});
