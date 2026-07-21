import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/core/api/api';
import { superadminUsuarioStatsService } from '../superadmin-usuario-stats.service';

vi.mock('@/core/api/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('superadminUsuarioStatsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /superadmin/usuarios/stats without pagination params', async () => {
    const stats = {
      total_usuarios: 128,
      usuarios_activos: 100,
      usuarios_inactivos: 28,
      usuarios_bloqueados: 5,
    };
    vi.mocked(api.get).mockResolvedValue({ data: stats });

    const result = await superadminUsuarioStatsService.getUsuariosStats();

    expect(api.get).toHaveBeenCalledWith('/superadmin/usuarios/stats', { params: {} });
    expect(result).toEqual(stats);
  });

  it('forwards optional filter params from contract', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        total_usuarios: 10,
        usuarios_activos: 8,
        usuarios_inactivos: 2,
        usuarios_bloqueados: 1,
      },
    });

    await superadminUsuarioStatsService.getUsuariosStats({
      cliente_id: '00000000-0000-0000-0000-000000000001',
      search: 'ops',
      proveedor_autenticacion: 'local',
    });

    expect(api.get).toHaveBeenCalledWith('/superadmin/usuarios/stats', {
      params: {
        cliente_id: '00000000-0000-0000-0000-000000000001',
        search: 'ops',
        proveedor_autenticacion: 'local',
      },
    });
  });
});
