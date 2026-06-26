import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      nombre: 'Admin',
      apellido: 'User',
      empresa_nombre: 'ACME Colombia',
    });

    const onViewDetail = vi.fn();

    const { container } = render(
      <ActiveSessionsTableView
        sessions={[adminCurrent]}
        onSort={vi.fn()}
        onRevoke={vi.fn()}
        onViewDetail={onViewDetail}
        isCurrentSession={(s) => s.is_current === true}
        variant="admin"
      />,
    );

    expect(screen.getByTestId('session-current-marker')).toBeInTheDocument();
    expect(screen.getByText('ESTA SESIÓN')).toBeInTheDocument();
    expect(container.querySelector('td.border-l-brand-primary')).not.toBeNull();
    expect(screen.getByText('ACME Colombia')).toBeInTheDocument();
    expect(screen.getByText(/Último refresh:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver detalle' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Cerrar esta sesión' })).toBeInTheDocument();
    expect(container.querySelectorAll('thead th')).toHaveLength(5);
    expect(container.querySelector('table.table-fixed')).not.toBeNull();
  });

  it('variant=admin tabla — Eye abre detalle vía callback', async () => {
    const session = buildSession({
      nombre_usuario: 'viewer_user',
      login_ip: '10.0.0.1',
      device: { ...RC1_DEVICE, ip_address: '10.0.0.2' },
      ip_address: '10.0.0.2',
    });
    const onViewDetail = vi.fn();

    render(
      <ActiveSessionsTableView
        sessions={[session]}
        onSort={vi.fn()}
        onRevoke={vi.fn()}
        onViewDetail={onViewDetail}
        isCurrentSession={() => false}
        variant="admin"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ver detalle' }));
    expect(onViewDetail).toHaveBeenCalledWith(session);
    expect(screen.getByLabelText(/IP de inicio difiere/)).toBeInTheDocument();
  });

  it('variant=admin cards — Eye, paridad tabla, sin campos prohibidos', async () => {
    const session = buildSession({
      nombre_usuario: 'viewer_user',
      nombre: 'Viewer',
      apellido: 'User',
      empresa_nombre: 'ACME Colombia',
      login_ip: '10.0.0.1',
      device: { ...RC1_DEVICE, ip_address: '10.0.0.2' },
      ip_address: '10.0.0.2',
    });
    const onViewDetail = vi.fn();
    const onRevoke = vi.fn();

    render(
      <ActiveSessionsCardsView
        sessions={[session]}
        onRevoke={onRevoke}
        onViewDetail={onViewDetail}
        isCurrentSession={() => false}
        variant="admin"
      />,
    );

    expect(screen.getByText('ACME Colombia')).toBeInTheDocument();
    expect(screen.getByText(/Último refresh:/)).toBeInTheDocument();
    expect(screen.queryByText(/Emitida:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Expira:/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver detalle' })).toBeEnabled();
    expect(screen.getByLabelText(/IP de inicio difiere/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ver detalle' }));
    expect(onViewDetail).toHaveBeenCalledWith(session);

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(onRevoke).toHaveBeenCalledWith(session);
  });

  it('variant=admin cards — dispositivo en una sola línea', () => {
    const chromeSession = buildSession({
      token_id: 'token-chrome',
      device: { ...RC1_DEVICE, device_label: 'Chrome en Windows' },
    });
    const edgeSession = buildSession({
      token_id: 'token-edge',
      device: {
        ...RC1_DEVICE,
        browser: 'Edge',
        device_label: 'Edge 149 en Windows',
      },
    });

    render(
      <ActiveSessionsCardsView
        sessions={[chromeSession, edgeSession]}
        onRevoke={vi.fn()}
        onViewDetail={vi.fn()}
        isCurrentSession={() => false}
        variant="admin"
      />,
    );

    const clientLines = screen.getAllByTestId('session-cliente-line');
    expect(clientLines).toHaveLength(2);
    for (const line of clientLines) {
      expect(line.className).toMatch(/whitespace-nowrap/);
      expect(line.textContent).toMatch(/Web/);
      expect(line.textContent).toMatch(/·/);
    }
    expect(clientLines[0]?.textContent).toMatch(/Chrome en Windows/);
    expect(clientLines[1]?.textContent).toMatch(/Edge 149 en Windows/);
  });

  it('variant=admin cards — altura uniforme y footer alineado', () => {
    const sessions = [
      buildSession({
        token_id: 'token-a',
        nombre_usuario: 'user_a',
        empresa_nombre: 'Empresa A',
        device: { ...RC1_DEVICE, device_label: 'Chrome en Windows' },
      }),
      buildSession({
        token_id: 'token-b',
        is_current: true,
        nombre_usuario: 'user_b',
        nombre: 'User',
        apellido: 'B',
        empresa_nombre: 'Empresa B con nombre largo para probar truncado',
        device: {
          ...RC1_DEVICE,
          browser: 'Edge',
          device_label: 'Edge 149 en Windows 11 Pro',
        },
      }),
    ];

    const { container } = render(
      <ActiveSessionsCardsView
        sessions={sessions}
        onRevoke={vi.fn()}
        onViewDetail={vi.fn()}
        isCurrentSession={(s) => s.is_current === true}
        variant="admin"
      />,
    );

    const cards = container.querySelectorAll('[data-testid="session-admin-card"]');
    expect(cards).toHaveLength(2);

    const heights = Array.from(cards).map((card) => card.getBoundingClientRect().height);
    expect(heights[0]).toBe(heights[1]);

    const footers = Array.from(cards).map((card) =>
      card.querySelector('.mt-auto.border-t'),
    );
    expect(footers[0]).not.toBeNull();
    expect(footers[1]).not.toBeNull();
    expect(footers[0]?.getBoundingClientRect().top).toBe(footers[1]?.getBoundingClientRect().top);
  });

  it('variant=admin cards — marker sesión actual', () => {
    const adminCurrent = buildSession({
      token_id: 'token-admin-card',
      is_current: true,
      nombre_usuario: 'admin_user',
      nombre: 'Admin',
      apellido: 'User',
      empresa_nombre: 'ACME Colombia',
    });

    const { container } = render(
      <ActiveSessionsCardsView
        sessions={[adminCurrent]}
        onRevoke={vi.fn()}
        onViewDetail={vi.fn()}
        isCurrentSession={(s) => s.is_current === true}
        variant="admin"
      />,
    );

    expect(screen.getByTestId('session-current-marker')).toBeInTheDocument();
    const currentCard = container.querySelector('[data-current-session="true"]');
    expect(currentCard?.className).toMatch(/border-brand-primary/);
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
