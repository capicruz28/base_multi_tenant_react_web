import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'react-hot-toast';

import AccountSecurityPage from '@/features/account/pages/AccountSecurityPage';
import { LOGOUT_ALL_DIALOG_TITLE } from '@/features/auth/components/LogoutAllConfirmDialog';

const completePasswordChangeMock = vi.fn();
const logoutAllSessionsMock = vi.fn();

vi.mock('@/core/auth/session/session-logout-v3.flags', () => ({
  SESSION_LOGOUT_V3_ENABLED: true,
}));

vi.mock('@/shared/context/AuthContext', () => ({
  useAuth: () => ({
    auth: {
      user: {
        nombre_usuario: 'ana',
      },
    },
    completePasswordChange: completePasswordChangeMock,
    logoutAllSessions: logoutAllSessionsMock,
    isAuthenticated: true,
    isImpersonation: false,
    requiereSeleccionEmpresa: false,
    requiresPasswordChange: false,
  }),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AccountSecurityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    completePasswordChangeMock.mockResolvedValue({ user: { nombre_usuario: 'ana' } });
    logoutAllSessionsMock.mockResolvedValue(undefined);
  });

  it('renderiza cards Seguridad y Sesión global', () => {
    render(<AccountSecurityPage />);

    expect(screen.getByTestId('account-security-page')).toBeInTheDocument();
    expect(screen.getByText('Seguridad')).toBeInTheDocument();
    expect(screen.getByText('Sesión global')).toBeInTheDocument();
    expect(
      screen.getByText(/todas las demás sesiones activas serán cerradas automáticamente/i),
    ).toBeInTheDocument();
  });

  it('abre LogoutAllConfirmDialog y llama logoutAllSessions', async () => {
    render(<AccountSecurityPage />);

    const logoutButtons = () =>
      screen.getAllByRole('button', { name: 'Cerrar todas las sesiones' });

    fireEvent.click(logoutButtons()[0]);
    expect(screen.getByRole('heading', { name: LOGOUT_ALL_DIALOG_TITLE })).toBeInTheDocument();

    fireEvent.click(logoutButtons()[logoutButtons().length - 1]);

    await waitFor(() => {
      expect(logoutAllSessionsMock).toHaveBeenCalledTimes(1);
    });
  });

  it('muestra toast en error logout all', async () => {
    logoutAllSessionsMock.mockRejectedValue(new Error('Sin permiso'));

    render(<AccountSecurityPage />);
    const logoutButtons = () =>
      screen.getAllByRole('button', { name: 'Cerrar todas las sesiones' });

    fireEvent.click(logoutButtons()[0]);
    fireEvent.click(logoutButtons()[logoutButtons().length - 1]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
