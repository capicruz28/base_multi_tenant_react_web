import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePlatformDashboardP0 } from '../usePlatformDashboardP0';
import { clienteService } from '@/features/super-admin/clientes/services/cliente.service';
import { moduloV2Service } from '@/features/modulos/services/modulo-v2.service';
import { superadminAuditoriaService } from '@/services/superadmin-auditoria.service';
import { superadminUsuarioStatsService } from '@/services/superadmin-usuario-stats.service';

vi.mock('@/features/super-admin/clientes/services/cliente.service', () => ({
  clienteService: {
    getClientes: vi.fn(),
  },
}));

vi.mock('@/features/modulos/services/modulo-v2.service', () => ({
  moduloV2Service: {
    getModulos: vi.fn(),
  },
}));

vi.mock('@/services/superadmin-auditoria.service', () => ({
  superadminAuditoriaService: {
    getAuthLogsByCliente: vi.fn(),
  },
}));

vi.mock('@/services/superadmin-usuario-stats.service', () => ({
  superadminUsuarioStatsService: {
    getUsuariosStats: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('usePlatformDashboardP0', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(clienteService.getClientes).mockImplementation(async (_p, _l, filtros) => ({
      clientes: [],
      total_clientes: filtros?.activeFilter === 'active' ? 38 : 42,
      pagina_actual: 1,
      total_paginas: 1,
      items_por_pagina: 1,
    }));

    vi.mocked(superadminUsuarioStatsService.getUsuariosStats).mockResolvedValue({
      total_usuarios: 120,
      usuarios_activos: 100,
      usuarios_inactivos: 20,
      usuarios_bloqueados: 3,
    });

    vi.mocked(moduloV2Service.getModulos).mockResolvedValue({
      items: [],
      total: 24,
      page: 1,
      size: 1,
      pages: 1,
    });

    vi.mocked(superadminAuditoriaService.getAuthLogsByCliente).mockResolvedValue({
      logs: [
        {
          log_id: 'log-1',
          cliente_id: 'cliente-1',
          cliente: {
            cliente_id: 'cliente-1',
            razon_social: 'ACME Corp S.A.',
            subdominio: 'acme',
            tipo_instalacion: 'shared',
            estado_suscripcion: 'activo',
          },
          evento: 'login_success',
          exito: true,
          fecha_evento: '2026-06-03T08:12:33',
        },
      ],
      total_logs: 1,
      pagina_actual: 1,
      total_paginas: 1,
    });
  });

  it('loads W1, W2, W11, W12 and W9 from contract endpoints', async () => {
    const { result } = renderHook(() => usePlatformDashboardP0(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.clientesActivos.isLoading).toBe(false);
      expect(result.current.actividadReciente.isLoading).toBe(false);
    });

    expect(result.current.clientesActivos.value).toBe(38);
    expect(result.current.totalClientes.value).toBe(42);
    expect(result.current.totalUsuarios.value).toBe(120);
    expect(result.current.totalModulos.value).toBe(24);
    expect(result.current.actividadReciente.logs).toHaveLength(1);

    expect(clienteService.getClientes).toHaveBeenCalledWith(1, 1, { activeFilter: 'active' });
    expect(clienteService.getClientes).toHaveBeenCalledWith(1, 1, { activeFilter: 'all' });
    expect(superadminUsuarioStatsService.getUsuariosStats).toHaveBeenCalledWith();
    expect(moduloV2Service.getModulos).toHaveBeenCalledWith({ skip: 0, limit: 1 });
    expect(superadminAuditoriaService.getAuthLogsByCliente).toHaveBeenCalledWith({
      page: 1,
      limit: 15,
      orden: 'desc',
      ordenar_por: 'fecha_evento',
    });
  });

  it('does not fetch when disabled', () => {
    renderHook(() => usePlatformDashboardP0(false), { wrapper: createWrapper() });

    expect(clienteService.getClientes).not.toHaveBeenCalled();
    expect(superadminUsuarioStatsService.getUsuariosStats).not.toHaveBeenCalled();
    expect(moduloV2Service.getModulos).not.toHaveBeenCalled();
    expect(superadminAuditoriaService.getAuthLogsByCliente).not.toHaveBeenCalled();
  });
});
