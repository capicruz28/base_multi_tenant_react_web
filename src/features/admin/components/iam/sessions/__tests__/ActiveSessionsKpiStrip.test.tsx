import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ActiveSessionsKpiStrip } from '@/features/admin/components/iam/sessions/ActiveSessionsKpiStrip';

describe('ActiveSessionsKpiStrip — Fase 1B', () => {
  const baseProps = {
    totalTenant: 247,
    webCount: 198,
    mobileCount: 49,
    hasActiveFilters: false,
    onTotalClick: vi.fn(),
    onWebClick: vi.fn(),
    onMobileClick: vi.fn(),
    onExpiringSoonClick: vi.fn(),
  };

  it('renderiza 3 KPIs numéricos con textos congelados', () => {
    render(<ActiveSessionsKpiStrip {...baseProps} />);

    expect(screen.getByText('247')).toBeInTheDocument();
    expect(screen.getByText('198')).toBeInTheDocument();
    expect(screen.getByText('49')).toBeInTheDocument();
    expect(screen.getByText('totales tenant')).toBeInTheDocument();
    expect(screen.getByText('Web')).toBeInTheDocument();
    expect(screen.getByText('Mobile')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver próximas a expirar →' })).toBeInTheDocument();
  });

  it('enlace expirar no muestra número', () => {
    render(<ActiveSessionsKpiStrip {...baseProps} />);
    const link = screen.getByRole('button', { name: 'Ver próximas a expirar →' });
    expect(link.textContent).toBe('Ver próximas a expirar →');
  });

  it('dispara callbacks al click', async () => {
    const user = userEvent.setup();
    const onTotalClick = vi.fn();
    const onWebClick = vi.fn();
    const onMobileClick = vi.fn();
    const onExpiringSoonClick = vi.fn();

    render(
      <ActiveSessionsKpiStrip
        {...baseProps}
        onTotalClick={onTotalClick}
        onWebClick={onWebClick}
        onMobileClick={onMobileClick}
        onExpiringSoonClick={onExpiringSoonClick}
      />,
    );

    await user.click(screen.getByRole('button', { name: '247 totales tenant' }));
    await user.click(screen.getByRole('button', { name: '198 Web' }));
    await user.click(screen.getByRole('button', { name: '49 Mobile' }));
    await user.click(screen.getByRole('button', { name: 'Ver próximas a expirar →' }));

    expect(onTotalClick).toHaveBeenCalledOnce();
    expect(onWebClick).toHaveBeenCalledOnce();
    expect(onMobileClick).toHaveBeenCalledOnce();
    expect(onExpiringSoonClick).toHaveBeenCalledOnce();
  });

  it('atenua tiles con filtros activos', () => {
    render(<ActiveSessionsKpiStrip {...baseProps} hasActiveFilters />);
    const totalTile = screen.getByRole('button', { name: '247 totales tenant' });
    expect(totalTile.className).toMatch(/opacity-90/);
    expect(totalTile).toHaveAttribute('title', 'Totales del tenant');
  });

  it('resalta tile Web cuando el filtro plataforma es web', () => {
    render(<ActiveSessionsKpiStrip {...baseProps} activeClientTypeFilter="web" />);
    const webTile = screen.getByRole('button', { name: '198 Web' });
    expect(webTile.className).toMatch(/border-brand-primary/);
  });

  it('resalta tile Mobile cuando el filtro plataforma es mobile', () => {
    render(<ActiveSessionsKpiStrip {...baseProps} activeClientTypeFilter="mobile" />);
    const mobileTile = screen.getByRole('button', { name: '49 Mobile' });
    expect(mobileTile.className).toMatch(/border-brand-primary/);
  });
});
