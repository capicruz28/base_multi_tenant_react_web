import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

import { useResetUserPassword } from '@/features/admin/hooks/useResetUserPassword';
import { resetUserPassword } from '@/features/admin/services/usuario.service';

vi.mock('@/features/admin/services/usuario.service', () => ({
  resetUserPassword: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/features/admin/hooks/useUsersList', () => ({
  invalidateUsersListQueries: vi.fn().mockResolvedValue(undefined),
}));

const mockResponse = {
  success: true,
  message: 'Contraseña restablecida exitosamente.',
  usuario_id: 'user-2',
  credenciales_temporales: {
    nombre_usuario: 'jperez',
    contrasena: 'Temp#123',
    requiere_cambio: true,
  },
  sesiones_revocadas: 1,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useResetUserPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('llama resetUserPassword con el usuario_id', async () => {
    vi.mocked(resetUserPassword).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useResetUserPassword(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.resetPassword('user-2');
    });

    expect(resetUserPassword).toHaveBeenCalledWith('user-2');
  });

  it('muestra toast de error en onError', async () => {
    vi.mocked(resetUserPassword).mockRejectedValue(
      new axios.AxiosError('fail', 'ERR', undefined, undefined, {
        status: 500,
        data: { detail: 'Error interno' },
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as never,
      }),
    );

    const { result } = renderHook(() => useResetUserPassword(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(result.current.resetPassword('user-2')).rejects.toBeDefined();
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('dispara onSelfResetBlocked en 400 auto-reset', async () => {
    const onSelfResetBlocked = vi.fn();
    vi.mocked(resetUserPassword).mockRejectedValue(
      new axios.AxiosError('bad', 'ERR', undefined, undefined, {
        status: 400,
        data: {
          detail:
            'No puede restablecer su propia contraseña por esta vía. Use el cambio de contraseña o solicítelo a otro administrador',
        },
        statusText: 'Bad Request',
        headers: {},
        config: {} as never,
      }),
    );

    const { result } = renderHook(
      () => useResetUserPassword({ onSelfResetBlocked }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await expect(result.current.resetPassword('admin-1')).rejects.toBeDefined();
    });

    expect(onSelfResetBlocked).toHaveBeenCalledTimes(1);
  });
});
