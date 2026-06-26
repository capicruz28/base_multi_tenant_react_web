import { describe, expect, it } from 'vitest';

import type { UserSessionRead } from '@/features/admin/types/session.types';
import { resolveSessionId } from '@/features/admin/utils/iam-session-id.utils';

describe('resolveSessionId (IAM V2 FA01)', () => {
  const base: UserSessionRead = {
    session_id: 'session-uuid-v2',
    token_id: 'token-refresh-v2',
    usuario_id: 'user-1',
    cliente_id: 'client-1',
    empresa_id: null,
    empresa_nombre: null,
    issued_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    last_refresh_at: null,
    last_used_at: null,
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

  it('prioriza session_id cuando está presente', () => {
    expect(resolveSessionId(base)).toBe('session-uuid-v2');
  });

  it('fallback a token_id cuando session_id ausente (RC1)', () => {
    expect(resolveSessionId({ ...base, session_id: undefined })).toBe('token-refresh-v2');
    expect(resolveSessionId({ ...base, session_id: null })).toBe('token-refresh-v2');
    expect(resolveSessionId({ ...base, session_id: '   ' })).toBe('token-refresh-v2');
  });
});
