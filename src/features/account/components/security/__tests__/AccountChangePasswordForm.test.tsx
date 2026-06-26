import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'react-hot-toast';

import { AccountChangePasswordForm } from '@/features/account/components/security/AccountChangePasswordForm';

const completePasswordChangeMock = vi.fn();

vi.mock('@/shared/context/AuthContext', () => ({
  useAuth: () => ({
    auth: {
      user: {
        nombre_usuario: 'ana',
      },
    },
    completePasswordChange: completePasswordChangeMock,
  }),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AccountChangePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    completePasswordChangeMock.mockResolvedValue({ user: { nombre_usuario: 'ana' } });
  });

  it('envía completePasswordChange con payload válido', async () => {
    render(<AccountChangePasswordForm />);

    fireEvent.change(screen.getByLabelText('Contraseña actual'), {
      target: { value: 'OldPass1' },
    });
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
      target: { value: 'NewPass1' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), {
      target: { value: 'NewPass1' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar contraseña' }));

    await waitFor(() => {
      expect(completePasswordChangeMock).toHaveBeenCalledWith({
        current_password: 'OldPass1',
        new_password: 'NewPass1',
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Contraseña actualizada correctamente.');
  });
});
