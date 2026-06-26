import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ActiveSessionsAutoRefreshSelect } from '@/features/admin/components/iam/sessions/ActiveSessionsAutoRefreshSelect';

describe('ActiveSessionsAutoRefreshSelect', () => {
  it('renderiza opciones enterprise', () => {
    render(<ActiveSessionsAutoRefreshSelect value="manual" onChange={vi.fn()} />);

    const select = screen.getByRole('combobox', { name: 'Intervalo de actualización automática' });
    expect(select).toHaveValue('manual');
    expect(screen.getByRole('option', { name: '30 segundos' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '5 minutos' })).toBeInTheDocument();
  });

  it('dispara onChange al cambiar intervalo', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ActiveSessionsAutoRefreshSelect value="manual" onChange={onChange} />);

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Intervalo de actualización automática' }),
      '60s',
    );

    expect(onChange).toHaveBeenCalledWith('60s');
  });
});
