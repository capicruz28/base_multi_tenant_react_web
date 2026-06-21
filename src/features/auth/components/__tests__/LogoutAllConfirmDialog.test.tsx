import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  LOGOUT_ALL_DIALOG_MESSAGE,
  LOGOUT_ALL_DIALOG_TITLE,
  LogoutAllConfirmDialog,
} from '@/features/auth/components/LogoutAllConfirmDialog';

describe('LogoutAllConfirmDialog (IMPL-07)', () => {
  it('no renderiza contenido cuando isOpen es false', () => {
    render(
      <LogoutAllConfirmDialog
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.queryByRole('heading', { name: LOGOUT_ALL_DIALOG_TITLE })).toBeNull();
  });

  it('muestra título, mensaje y botones cuando está abierto', () => {
    render(
      <LogoutAllConfirmDialog
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: LOGOUT_ALL_DIALOG_TITLE })).toBeTruthy();
    expect(screen.getByText(LOGOUT_ALL_DIALOG_MESSAGE)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cerrar todas las sesiones' })).toBeTruthy();
  });

  it('invoca onClose al cancelar', () => {
    const onClose = vi.fn();

    render(
      <LogoutAllConfirmDialog
        isOpen
        onClose={onClose}
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('invoca onConfirm una sola vez al confirmar', () => {
    const onConfirm = vi.fn();

    render(
      <LogoutAllConfirmDialog
        isOpen
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar todas las sesiones' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('deshabilita acciones durante pending', () => {
    render(
      <LogoutAllConfirmDialog
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isPending
      />,
    );

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cerrar todas las sesiones' })).toBeDisabled();
  });

  it('usa variant danger (clase semántica error en confirmar)', () => {
    render(
      <LogoutAllConfirmDialog
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const confirmButton = screen.getByRole('button', { name: 'Cerrar todas las sesiones' });

    expect(confirmButton.className).toContain('bg-error');
  });
});
