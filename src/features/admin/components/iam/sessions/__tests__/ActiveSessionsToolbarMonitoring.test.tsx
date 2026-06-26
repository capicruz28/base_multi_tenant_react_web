import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ActiveSessionsToolbarMonitoring } from '@/features/admin/components/iam/sessions/ActiveSessionsToolbarMonitoring';

describe('ActiveSessionsToolbarMonitoring', () => {
  it('agrupa actualizado, selector auto-refresh y refresh manual', () => {
    render(
      <ActiveSessionsToolbarMonitoring
        dataUpdatedAt={Date.now() - 120_000}
        listDataUpdatedAt={Date.now() - 60_000}
        autoRefreshInterval="manual"
        onAutoRefreshIntervalChange={vi.fn()}
        onRefreshAll={vi.fn()}
        isRefreshing={false}
        viewMode="table"
        onViewModeChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/Actualizado hace/i)).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Intervalo de actualización automática' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actualizar listado y métricas' })).toBeInTheDocument();
  });

  it('dispara callbacks de refresh, auto-refresh y vista', async () => {
    const user = userEvent.setup();
    const onAutoRefreshIntervalChange = vi.fn();
    const onRefreshAll = vi.fn();
    const onViewModeChange = vi.fn();

    render(
      <ActiveSessionsToolbarMonitoring
        autoRefreshInterval="manual"
        onAutoRefreshIntervalChange={onAutoRefreshIntervalChange}
        onRefreshAll={onRefreshAll}
        isRefreshing={false}
        viewMode="table"
        onViewModeChange={onViewModeChange}
      />,
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Intervalo de actualización automática' }),
      '30s',
    );
    await user.click(screen.getByRole('button', { name: 'Actualizar listado y métricas' }));
    await user.click(screen.getByRole('button', { name: 'Vista de tarjetas' }));

    expect(onAutoRefreshIntervalChange).toHaveBeenCalledWith('30s');
    expect(onRefreshAll).toHaveBeenCalledTimes(1);
    expect(onViewModeChange).toHaveBeenCalledWith('grid');
  });
});
