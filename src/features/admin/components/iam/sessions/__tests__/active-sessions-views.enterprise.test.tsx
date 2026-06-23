import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ActiveSessionsCardsView } from '@/features/admin/components/iam/sessions/ActiveSessionsCardsView';
import { ActiveSessionsTableView } from '@/features/admin/components/iam/sessions/ActiveSessionsTableView';
import type { AdminSessionRead } from '@/features/admin/types/session.types';

const RC1_DEVICE = {
  client_type: 'web',
  browser: 'Chrome',
  browser_version: '120',
  os: 'Windows',
  platform: 'desktop',
  device_label: 'Chrome en Windows',
  ip_address: '10.0.0.1',
  device_id: null,
};

function buildSession(overrides: Partial<AdminSessionRead>): AdminSessionRead {
  return {
    token_id: 'token-default',
    usuario_id: 'user-1',
    cliente_id: 'client-1',
    empresa_id: null,
    empresa_nombre: null,
    issued_at: '2026-06-18T10:00:00Z',
    created_at: '2026-06-18T10:00:00Z',
    last_refresh_at: '2026-06-21T08:30:00Z',
    last_used_at: '2026-06-21T08:30:00Z',
    expires_at: '2026-06-25T10:00:00Z',
    is_current: false,
    status: 'active',
    duration_seconds: 1000,
    device: RC1_DEVICE,
    client_type: 'web',
    ip_address: '10.0.0.1',
    device_name: null,
    device_id: null,
    nombre_usuario: null,
    nombre: null,
    apellido: null,
    user_agent: null,
    ...overrides,
  };
}

describe('ActiveSessions views — variant self + enterprise current session', () => {
  const currentSession = buildSession({ token_id: 'token-current', is_current: true });
  const otherSession = buildSession({ token_id: 'token-other', is_current: false });

  it('variant=self cards — badge, fondo, borde y copy Cerrar esta sesión', () => {
    const { container } = render(
      <ActiveSessionsCardsView
        sessions={[currentSession, otherSession]}
        onRevoke={vi.fn()}
        isCurrentSession={(s) => s.is_current === true}
        variant="self"
      />,
    );

    expect(screen.getAllByTestId('session-current-marker')).toHaveLength(1);
    expect(screen.getByText('ESTA SESIÓN')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar esta sesión' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();

    const currentCard = container.querySelector('[data-current-session="true"]');
    expect(currentCard).not.toBeNull();
    expect(currentCard?.className).toMatch(/border-brand-primary/);
    expect(currentCard?.className).toMatch(/bg-brand-primary\/5/);
  });

  it('variant=self tabla — badge, borde, fondo y copy', () => {
    const { container } = render(
      <ActiveSessionsTableView
        sessions={[currentSession, otherSession]}
        onSort={vi.fn()}
        onRevoke={vi.fn()}
        isCurrentSession={(s) => s.is_current === true}
        variant="self"
      />,
    );

    expect(screen.getAllByTestId('session-current-marker')).toHaveLength(1);
    expect(screen.getByLabelText('Cerrar esta sesión')).toBeInTheDocument();
    expect(screen.getByLabelText('Cerrar sesión')).toBeInTheDocument();

    const currentRow = container.querySelector('tr[data-current-session="true"]');
    expect(currentRow).not.toBeNull();
    expect(currentRow?.className).toMatch(/bg-brand-primary\/5/);

    const leadingCell = currentRow?.querySelector('td.border-l-brand-primary');
    expect(leadingCell).not.toBeNull();
    expect(leadingCell?.className).toMatch(/border-l-4/);
  });

  it('variant=admin tabla — badge ESTA SESIÓN en fila usuario', () => {
    const adminCurrent = buildSession({
      token_id: 'token-admin-current',
      is_current: true,
      nombre_usuario: 'admin_user',
    });

    const { container } = render(
      <ActiveSessionsTableView
        sessions={[adminCurrent]}
        onSort={vi.fn()}
        onRevoke={vi.fn()}
        isCurrentSession={(s) => s.is_current === true}
        variant="admin"
      />,
    );

    expect(screen.getByTestId('session-current-marker')).toBeInTheDocument();
    expect(screen.getByText('ESTA SESIÓN')).toBeInTheDocument();
    expect(container.querySelector('td.border-l-brand-primary')).not.toBeNull();
  });

  it('fallback is_current false + token_id match — marca sesión actual', () => {
    const legacySession = buildSession({
      token_id: 'legacy-token',
      is_current: false,
    });

    render(
      <ActiveSessionsCardsView
        sessions={[legacySession]}
        onRevoke={vi.fn()}
        isCurrentSession={(s) => s.token_id === 'legacy-token'}
        variant="self"
      />,
    );

    expect(screen.getByTestId('session-current-marker')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar esta sesión' })).toBeInTheDocument();
  });
});
