import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SessionDetailDialog } from '@/features/admin/components/iam/sessions/SessionDetailDialog';
import type { AdminSessionRead } from '@/features/admin/types/session.types';

const RC1_DEVICE = {
  client_type: 'web',
  browser: 'Chrome',
  browser_version: '120',
  os: 'Windows',
  platform: 'desktop',
  device_label: 'Chrome en Windows',
  ip_address: '10.0.0.2',
  device_id: null,
};

function buildSession(overrides: Partial<AdminSessionRead> = {}): AdminSessionRead {
  return {
    token_id: 'token-1',
    usuario_id: 'user-1',
    cliente_id: 'client-1',
    empresa_id: 'empresa-1',
    empresa_nombre: 'ACME Colombia',
    issued_at: '2026-06-18T10:00:00Z',
    created_at: '2026-06-18T10:00:00Z',
    last_refresh_at: '2026-06-21T08:30:00Z',
    last_used_at: '2026-06-21T08:30:00Z',
    expires_at: '2026-06-25T10:00:00Z',
    is_current: false,
    status: 'active',
    duration_seconds: 86_400,
    device: RC1_DEVICE,
    client_type: 'web',
    login_ip: '10.0.0.1',
    ip_address: '10.0.0.2',
    device_name: null,
    device_id: null,
    nombre_usuario: 'jdoe',
    nombre: 'John',
    apellido: 'Doe',
    user_agent: 'Mozilla/5.0 Chrome',
    last_business_activity_at: '2026-06-21T08:00:00Z',
    ...overrides,
  };
}

describe('SessionDetailDialog', () => {
  it('renders identity, network and collapsible user-agent without UUIDs', async () => {
    const user = userEvent.setup();
    const session = buildSession();

    render(
      <SessionDetailDialog
        session={session}
        open
        onOpenChange={vi.fn()}
        isCurrentSession={false}
        onRevokeRequest={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Detalle de sesión' })).toBeInTheDocument();
    expect(screen.getByText('jdoe')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/Empresa: ACME Colombia/)).toBeInTheDocument();
    expect(screen.queryByText(/user-1/)).not.toBeInTheDocument();
    expect(screen.queryByText(/token-1/)).not.toBeInTheDocument();
    expect(screen.queryByText(/client-1/)).not.toBeInTheDocument();

    expect(screen.getByText(/IP inicio sesión/)).toBeInTheDocument();
    expect(
      screen.getByText(/La IP de inicio de sesión difiere de la última IP conocida/),
    ).toBeInTheDocument();

    expect(screen.queryByText('Mozilla/5.0 Chrome')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Diagnóstico avanzado/i }));
    expect(screen.getByText('Mozilla/5.0 Chrome')).toBeInTheDocument();
  });

  it('invokes onRevokeRequest from footer action', async () => {
    const user = userEvent.setup();
    const onRevokeRequest = vi.fn();
    const session = buildSession({ is_current: true });

    render(
      <SessionDetailDialog
        session={session}
        open
        onOpenChange={vi.fn()}
        isCurrentSession
        onRevokeRequest={onRevokeRequest}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cerrar esta sesión' }));
    expect(onRevokeRequest).toHaveBeenCalledWith(session);
  });
});
