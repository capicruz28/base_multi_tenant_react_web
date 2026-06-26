import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SessionDeviceCell } from '@/features/admin/components/iam/sessions/SessionDeviceCell';
import type { SessionDeviceRead } from '@/features/admin/types/session.types';
import { resolveLastSeenIp } from '@/features/admin/utils/iam-session-ip.utils';
import type { UserSessionRead } from '@/features/admin/types/session.types';

const DEVICE: SessionDeviceRead = {
  client_type: 'web',
  browser: 'Chrome',
  browser_version: null,
  os: 'Windows',
  platform: 'desktop',
  device_label: 'Chrome en Windows',
  ip_address: '10.0.0.5',
  device_id: null,
};

const SESSION: UserSessionRead = {
  session_id: 's-1',
  token_id: 't-1',
  usuario_id: 'u-1',
  cliente_id: 'c-1',
  empresa_id: null,
  empresa_nombre: null,
  issued_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  last_refresh_at: null,
  last_used_at: null,
  expires_at: '2026-12-31T00:00:00Z',
  is_current: false,
  status: 'active',
  duration_seconds: 1,
  device: DEVICE,
  client_type: 'web',
  login_ip: '192.168.1.1',
  ip_address: '10.0.0.99',
  device_name: null,
  device_id: null,
};

describe('SessionDeviceCell — semántica IP V2 (FE-23)', () => {
  it('display=ip muestra última IP vía lastSeenIp, no login_ip', () => {
    render(
      <SessionDeviceCell
        device={DEVICE}
        display="ip"
        lastSeenIp={resolveLastSeenIp(SESSION)}
      />,
    );

    expect(screen.getByText('10.0.0.5')).toBeInTheDocument();
    expect(screen.queryByText('192.168.1.1')).not.toBeInTheDocument();
  });
});
