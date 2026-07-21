import { useQueries } from '@tanstack/react-query';
import { clienteService } from '@/features/super-admin/clientes/services/cliente.service';
import { moduloV2Service } from '@/features/modulos/services/modulo-v2.service';
import { superadminAuditoriaService } from '@/services/superadmin-auditoria.service';
import { superadminUsuarioStatsService } from '@/services/superadmin-usuario-stats.service';
import type { AuthAuditLog } from '@/types/superadmin-auditoria.types';

export type DashboardMetricState = {
  value: number | null;
  isLoading: boolean;
  isError: boolean;
};

export type PlatformDashboardP0Data = {
  clientesActivos: DashboardMetricState;
  totalClientes: DashboardMetricState;
  totalUsuarios: DashboardMetricState;
  totalModulos: DashboardMetricState;
  actividadReciente: {
    logs: AuthAuditLog[];
    isLoading: boolean;
    isError: boolean;
  };
};

const metricFromQuery = (query: {
  data?: number;
  isLoading: boolean;
  isError: boolean;
}): DashboardMetricState => ({
  value: query.data ?? null,
  isLoading: query.isLoading,
  isError: query.isError,
});

export function usePlatformDashboardP0(enabled: boolean): PlatformDashboardP0Data {
  const [
    clientesActivosQuery,
    totalClientesQuery,
    totalUsuariosQuery,
    totalModulosQuery,
    actividadQuery,
  ] = useQueries({
    queries: [
      {
        queryKey: ['platform-dashboard', 'clientes-activos'],
        queryFn: async () => {
          const data = await clienteService.getClientes(1, 1, { activeFilter: 'active' });
          return data.total_clientes;
        },
        enabled,
        staleTime: 60_000,
      },
      {
        queryKey: ['platform-dashboard', 'clientes-total'],
        queryFn: async () => {
          const data = await clienteService.getClientes(1, 1, { activeFilter: 'all' });
          return data.total_clientes;
        },
        enabled,
        staleTime: 60_000,
      },
      {
        queryKey: ['platform-dashboard', 'usuarios-stats'],
        queryFn: () => superadminUsuarioStatsService.getUsuariosStats(),
        select: (data) => data.total_usuarios,
        enabled,
        staleTime: 60_000,
      },
      {
        queryKey: ['platform-dashboard', 'modulos-total'],
        queryFn: async () => {
          const data = await moduloV2Service.getModulos({ skip: 0, limit: 1 });
          return data.total;
        },
        enabled,
        staleTime: 60_000,
      },
      {
        queryKey: ['platform-dashboard', 'auth-activity'],
        queryFn: () =>
          superadminAuditoriaService.getAuthLogsByCliente({
            page: 1,
            limit: 15,
            orden: 'desc',
            ordenar_por: 'fecha_evento',
          }),
        enabled,
        staleTime: 60_000,
      },
    ],
  });

  return {
    clientesActivos: metricFromQuery(clientesActivosQuery),
    totalClientes: metricFromQuery(totalClientesQuery),
    totalUsuarios: metricFromQuery(totalUsuariosQuery),
    totalModulos: metricFromQuery(totalModulosQuery),
    actividadReciente: {
      logs: actividadQuery.data?.logs ?? [],
      isLoading: actividadQuery.isLoading,
      isError: actividadQuery.isError,
    },
  };
}
