import { describe, expect, it } from 'vitest';

import { resolveSessionIpMismatch } from '@/features/admin/utils/iam-session-ip.utils';

describe('resolveSessionIpMismatch', () => {
  it('returns false when login_ip or last seen is missing', () => {
    expect(
      resolveSessionIpMismatch({
        login_ip: null,
        device: { ip_address: '10.0.0.1' },
        ip_address: '10.0.0.1',
      }),
    ).toBe(false);

    expect(
      resolveSessionIpMismatch({
        login_ip: '10.0.0.2',
        device: { ip_address: null },
        ip_address: null,
      }),
    ).toBe(false);
  });

  it('returns true when login_ip differs from last seen (case-insensitive)', () => {
    expect(
      resolveSessionIpMismatch({
        login_ip: '10.0.0.1',
        device: { ip_address: '10.0.0.2' },
        ip_address: null,
      }),
    ).toBe(true);

    expect(
      resolveSessionIpMismatch({
        login_ip: '192.168.1.10',
        device: { ip_address: '192.168.1.11' },
        ip_address: '192.168.1.10',
      }),
    ).toBe(true);
  });

  it('returns false when IPs match after normalization', () => {
    expect(
      resolveSessionIpMismatch({
        login_ip: ' 10.0.0.1 ',
        device: { ip_address: '10.0.0.1' },
        ip_address: null,
      }),
    ).toBe(false);
  });
});
