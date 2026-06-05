import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePlatformDashboardP1C } from '../usePlatformDashboardP1C';
import { superadminAuditoriaService } from '@/services/superadmin-auditoria.service';
import { superadminUsuarioService } from '@/services/superadmin-usuario.service';
import { fetchClientesSnapshot } from '../../utils/clientes-snapshot.utils';

vi.mock('@/services/superadmin-auditoria.service', () => ({
  superadminAuditoriaService: {
    getSyncLogs: vi.fn(),
  },
}));

vi.mock('@/services/superadmin-usuario.service', () => ({
  superadminUsuarioService: {
    getUsuariosGlobales: vi.fn(),
  },
}));

vi.mock('../../utils/clientes-snapshot.utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/clientes-snapshot.utils')>();
  return {
    ...actual,
    fetchClientesSnapshot: vi.fn(),
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('usePlatformDashboardP1C', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(superadminAuditoriaService.getSyncLogs).mockResolvedValue({
      logs: [
        {
          log_id: '1',
          tipo_sincronizacion: 'manual',
          direccion: 'push',
          operacion: 'update',
          estado: 'exitoso',
          fecha_sincronizacion: '2026-06-03T10:00:00',
        },
      ],
      total_logs: 1,
      pagina_actual: 1,
      total_paginas: 1,
    });
    vi.mocked(superadminUsuarioService.getUsuariosGlobales).mockImplementation(async (params) => {
      if (params?.cliente_id) {
        return {
          usuarios: [
            {
              usuario_id: 'op-1',
              nombre_usuario: 'platform.ops',
              es_activo: true,
              es_eliminado: false,
              is_super_admin: true,
            },
          ],
          total_usuarios: 1,
          pagina_actual: 1,
          total_paginas: 1,
        } as never;
      }
      return {
        usuarios: [{ usuario_id: 'u-1', fecha_bloqueo: '2026-06-01' }],
        total_usuarios: 1,
        pagina_actual: 1,
        total_paginas: 1,
      } as never;
    });
    vi.mocked(fetchClientesSnapshot).mockResolvedValue({
      clientes: [
        {
          cliente_id: 'c-1',
          codigo_cliente: 'NEW001',
          razon_social: 'New Corp',
          nombre_comercial: null,
          plan_suscripcion: 'basico',
          fecha_creacion: '2026-06-01',
        },
      ] as never,
      totalReported: 1,
      isPartial: false,
    });
  });

  it('loads W10 sync feed, W13 recent clientes and platform operators', async () => {
    const { result } = renderHook(() => usePlatformDashboardP1C(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.syncLoading).toBe(false);
    });

    expect(result.current.syncLogs).toHaveLength(1);
    expect(result.current.recentClientes).toHaveLength(1);
    expect(result.current.recentClientes[0].clienteId).toBe('c-1');
    expect(result.current.platformOperators).toHaveLength(1);
    expect(superadminAuditoriaService.getSyncLogs).toHaveBeenCalledTimes(1);
    expect(superadminUsuarioService.getUsuariosGlobales).toHaveBeenCalledTimes(2);
  });

  it('builds operator alerts from blocked users scan', async () => {
    const { result } = renderHook(() => usePlatformDashboardP1C(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.alertsLoading).toBe(false);
    });

    expect(result.current.operatorAlerts.some((a) => a.codigo === 'USER_BLOCKED')).toBe(true);
  });

  it('does not fetch when disabled', () => {
    renderHook(() => usePlatformDashboardP1C(false), { wrapper: createWrapper() });
    expect(superadminAuditoriaService.getSyncLogs).not.toHaveBeenCalled();
  });
});
