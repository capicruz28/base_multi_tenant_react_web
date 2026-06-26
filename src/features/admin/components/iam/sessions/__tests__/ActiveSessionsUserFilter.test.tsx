import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
  ActiveSessionsUserFilter,
  formatUserOptionLabel,
} from '@/features/admin/components/iam/sessions/ActiveSessionsUserFilter';

const mockUsers = [
  {
    usuario_id: 'user-1',
    nombre_usuario: 'jdoe',
    nombre: 'John',
    apellido: 'Doe',
  },
];

vi.mock('@/features/admin/hooks/useUsersList', () => ({
  useUsersList: vi.fn(() => ({
    items: mockUsers,
    isLoading: false,
  })),
}));

describe('ActiveSessionsUserFilter combobox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('formatUserOptionLabel incluye nombre completo', () => {
    expect(formatUserOptionLabel(mockUsers[0])).toBe('jdoe — John Doe');
  });

  it('renderiza un único control con placeholder congelado', () => {
    render(<ActiveSessionsUserFilter value={undefined} onChange={vi.fn()} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Filtrar por usuario…')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('selecciona usuario y emite usuario_id', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ActiveSessionsUserFilter value={undefined} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'jdoe — John Doe' }));

    expect(onChange).toHaveBeenCalledWith('user-1');
    expect(screen.getByDisplayValue('jdoe — John Doe')).toBeInTheDocument();
  });

  it('opción Todos los usuarios limpia filtro', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ActiveSessionsUserFilter value="user-1" onChange={onChange} />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Todos los usuarios' }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
