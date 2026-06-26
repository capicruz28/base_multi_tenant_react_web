import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { UserPasswordResetRevealDialog } from '@/features/admin/components/iam/UserPasswordResetRevealDialog';
import type { AdminPasswordResetResponse } from '@/features/admin/types/usuario.types';

vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/shared/utils/copy-to-clipboard', () => ({
  copyTextToClipboard: vi.fn().mockResolvedValue(undefined),
}));

const mockResult: AdminPasswordResetResponse = {
  success: true,
  message: 'Contraseña restablecida exitosamente. La contraseña temporal solo se muestra una vez.',
  usuario_id: 'user-2',
  credenciales_temporales: {
    nombre_usuario: 'jperez',
    contrasena: 'Temp#Secret99',
    requiere_cambio: true,
  },
  sesiones_revocadas: 2,
};

describe('UserPasswordResetRevealDialog', () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra mensaje del backend y no expone contraseña en texto visible por defecto', () => {
    render(
      <UserPasswordResetRevealDialog
        isOpen
        result={mockResult}
        targetDisplayName="Juan Pérez"
        isInactiveUser={false}
        onComplete={onComplete}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Contraseña restablecida' })).toBeInTheDocument();
    expect(screen.getByText(mockResult.message)).toBeInTheDocument();
    expect(screen.queryByText('Temp#Secret99')).not.toBeInTheDocument();
    expect(screen.getByText('Se cerraron 2 sesión(es) activa(s) de este usuario.')).toBeInTheDocument();
  });

  it('muestra banner inactivo cuando aplica', () => {
    render(
      <UserPasswordResetRevealDialog
        isOpen
        result={mockResult}
        targetDisplayName="Juan Pérez"
        isInactiveUser
        onComplete={onComplete}
      />,
    );

    expect(
      screen.getByText(
        /Este usuario está inactivo\. Debe reactivarlo antes de que pueda iniciar sesión/,
      ),
    ).toBeInTheDocument();
  });

  it('requiere ack para Finalizar', async () => {
    const user = userEvent.setup();

    render(
      <UserPasswordResetRevealDialog
        isOpen
        result={mockResult}
        targetDisplayName="Juan Pérez"
        isInactiveUser={false}
        onComplete={onComplete}
      />,
    );

    const finalizeBtn = screen.getByRole('button', { name: 'Finalizar' });
    expect(finalizeBtn).toBeDisabled();

    await user.click(
      screen.getByRole('checkbox', {
        name: /Confirmo que he guardado las credenciales/,
      }),
    );
    expect(finalizeBtn).not.toBeDisabled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('finaliza tras ack', async () => {
    const user = userEvent.setup();

    render(
      <UserPasswordResetRevealDialog
        isOpen
        result={mockResult}
        targetDisplayName="Juan Pérez"
        isInactiveUser={false}
        onComplete={onComplete}
      />,
    );

    await user.click(
      screen.getByRole('checkbox', {
        name: /Confirmo que he guardado las credenciales/,
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Finalizar' }));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('pide confirmación al cerrar sin ack', async () => {
    const user = userEvent.setup();

    render(
      <UserPasswordResetRevealDialog
        isOpen
        result={mockResult}
        targetDisplayName="Juan Pérez"
        isInactiveUser={false}
        onComplete={onComplete}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: 'Cerrar' })[1]);

    expect(screen.getByRole('heading', { name: '¿Cerrar sin confirmar?' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cerrar de todos modos' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
