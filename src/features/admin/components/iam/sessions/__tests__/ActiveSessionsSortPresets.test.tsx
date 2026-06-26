import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ActiveSessionsSortPresets } from '@/features/admin/components/iam/sessions/ActiveSessionsSortPresets';

describe('ActiveSessionsSortPresets', () => {
  it('renderiza presets y selección actual', () => {
    render(
      <ActiveSessionsSortPresets
        sortBy="expires_at"
        sortOrder="asc"
        onPresetChange={vi.fn()}
      />,
    );

    const select = screen.getByRole('combobox', { name: 'Ordenar sesiones' });
    expect(select).toHaveValue('expiring_soon');
    expect(screen.getByRole('option', { name: 'Último refresh' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Usuario Z-A' })).toBeInTheDocument();
  });

  it('dispara onPresetChange al elegir preset', async () => {
    const user = userEvent.setup();
    const onPresetChange = vi.fn();

    render(
      <ActiveSessionsSortPresets
        sortBy={undefined}
        sortOrder="desc"
        onPresetChange={onPresetChange}
      />,
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Ordenar sesiones' }),
      'most_recent',
    );

    expect(onPresetChange).toHaveBeenCalledWith('created_at', 'desc');
  });

  it('restablece orden al elegir Predeterminado', async () => {
    const user = userEvent.setup();
    const onPresetChange = vi.fn();

    render(
      <ActiveSessionsSortPresets
        sortBy="created_at"
        sortOrder="desc"
        onPresetChange={onPresetChange}
      />,
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Ordenar sesiones' }),
      '',
    );

    expect(onPresetChange).toHaveBeenCalledWith(undefined, 'desc');
  });
});
