import { describe, expect, it } from 'vitest';

import type { UserSessionRead } from '@/features/admin/types/session.types';
import {
  formatLastSeenIp,
  formatLoginIp,
  resolveLastSeenIp,
  resolveLoginIp,
} from '@/features/admin/utils/iam-session-ip.utils';

const BASE: UserSessionRead = {
  session_id: 'session-1',
  token_id: 'token-1',
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
    ip_address: '10.0.0.5',
    device_id: null,
  },
  client_type: 'web',
  login_ip: '192.168.1.1',
  ip_address: '10.0.0.99',
  device_name: null,
  device_id: null,
};

describe('iam-session-ip.utils (IAM V2 FE-23)', () => {
  it('resolveLastSeenIp prioriza device.ip_address sobre ip_address raíz', () => {
    expect(resolveLastSeenIp(BASE)).toBe('10.0.0.5');
  });

  it('resolveLastSeenIp fallback a ip_address raíz sin device.ip', () => {
    expect(
      resolveLastSeenIp({
        ...BASE,
        device: { ...BASE.device, ip_address: null },
        ip_address: '10.0.0.99',
      }),
    ).toBe('10.0.0.99');
  });

  it('resolveLoginIp es independiente de última IP', () => {
    expect(resolveLoginIp(BASE)).toBe('192.168.1.1');
    expect(resolveLastSeenIp(BASE)).not.toBe(resolveLoginIp(BASE));
  });

  it('formatLastSeenIp no expone login_ip', () => {
    expect(formatLastSeenIp(BASE)).toBe('10.0.0.5');
    expect(formatLastSeenIp({ ...BASE, login_ip: '192.168.1.1' })).toBe('10.0.0.5');
  });

  it('formatLoginIp para auditoría', () => {
    expect(formatLoginIp(BASE)).toBe('192.168.1.1');
    expect(formatLoginIp({ ...BASE, login_ip: null })).toBe('—');
  });
});
