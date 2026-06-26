import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AxiosError } from 'axios';

import api from '@/core/api/api';
import { authService } from '@/features/auth/services/auth.service';
import type { UserData } from '@/features/auth/types/auth.types';

vi.mock('@/core/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);

function buildRawUser(
  overrides?: Partial<UserData & Record<string, unknown>>,
): UserData & Record<string, unknown> {
  return {
    usuario_id: 'user-1',
    cliente_id: 'client-1',
    nombre_usuario: 'admin',
    correo: 'admin@example.com',
    nombre: 'Admin',
    apellido: 'User',
    es_activo: true,
    roles: ['admin'],
    ...overrides,
  };
}

function createAxiosError(status: number, detail?: string): AxiosError {
  return {
    response: { status, data: { detail: detail ?? `HTTP ${status}` } },
    config: { url: '/auth/me/' },
    message: `Request failed with status code ${status}`,
    name: 'AxiosError',
    isAxiosError: true,
    toJSON: () => ({}),
  } as AxiosError;
}

describe('authService.me — IAM-FE-AUTH-ME-401-CONTRACT-01', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('contrato HTTP — propagación de errores', () => {
    it('401 → throw (no null)', async () => {
      const error401 = createAxiosError(401, 'Sesión inválida');
      mockedGet.mockRejectedValue(error401);

      await expect(authService.me()).rejects.toEqual(error401);
    });

    it('403 → throw (no null)', async () => {
      const error403 = createAxiosError(403, 'No autorizado');
      mockedGet.mockRejectedValue(error403);

      await expect(authService.me()).rejects.toEqual(error403);
    });

    it('404 → throw', async () => {
      const error404 = createAxiosError(404, 'No encontrado');
      mockedGet.mockRejectedValue(error404);

      await expect(authService.me()).rejects.toEqual(error404);
    });

    it('error de red → throw', async () => {
      const networkError = new Error('Network Error');
      mockedGet.mockRejectedValue(networkError);

      await expect(authService.me()).rejects.toThrow('Network Error');
    });
  });

  describe('normalización current_session_id y current_token_id', () => {
    it('normaliza current_session_id desde GET /auth/me', async () => {
      mockedGet.mockResolvedValue({
        data: buildRawUser({ current_session_id: '  session-current-uuid  ' }),
      });

      const profile = await authService.me();

      expect(mockedGet).toHaveBeenCalledWith('/auth/me/');
      expect(profile?.current_session_id).toBe('session-current-uuid');
    });

    it('current_session_id ausente o vacío → null', async () => {
      mockedGet.mockResolvedValue({
        data: buildRawUser({ current_session_id: '   ' }),
      });

      const profile = await authService.me();

      expect(profile?.current_session_id).toBeNull();
    });

    it('normaliza current_token_id desde GET /auth/me', async () => {
      mockedGet.mockResolvedValue({
        data: buildRawUser({ current_token_id: '  token-current-uuid  ' }),
      });

      const profile = await authService.me();

      expect(mockedGet).toHaveBeenCalledWith('/auth/me/');
      expect(profile?.current_token_id).toBe('token-current-uuid');
    });

    it('current_token_id ausente o vacío → null', async () => {
      mockedGet.mockResolvedValue({
        data: buildRawUser({ current_token_id: '   ' }),
      });

      const profile = await authService.me();

      expect(profile?.current_token_id).toBeNull();
    });
  });
});
