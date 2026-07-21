import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PLATFORM_SUPERADMIN_CLIENTE_ID } from '@/core/auth/utils/auth-session-snapshot';
import { superadminAuditoriaService } from '@/services/superadmin-auditoria.service';
import { superadminUsuarioService } from '@/services/superadmin-usuario.service';
import { superadminUsuarioStatsService } from '@/services/superadmin-usuario-stats.service';
import type { SyncAuditLog } from '@/types/superadmin-auditoria.types';
import type { SuperadminUsuario } from '@/types/superadmin-usuario.types';
import {
  fetchClientesSnapshot,
  getRecentClientesFromSnapshot,
  type RecentClienteItem,
} from '../utils/clientes-snapshot.utils';
import {
  buildOperatorAlertsFromUsuarios,
  type DashboardAlertItem,
} from '../utils/dashboard-alert.rules';

const PLATFORM_OPERATORS_LIMIT = 50;
const SYNC_FEED_LIMIT = 10;
const RECENT_CLIENTES_LIMIT = 5;

export type PlatformDashboardP1CData = {
  syncLogs: SyncAuditLog[];
  syncLoading: boolean;
  syncError: boolean;
  platformOperators: SuperadminUsuario[];
  operatorsLoading: boolean;
  operatorsError: boolean;
  recentClientes: RecentClienteItem[];
  recentClientesLoading: boolean;
  recentClientesError: boolean;
  isPartialRecentClientes: boolean;
  operatorAlerts: DashboardAlertItem[];
  alertsLoading: boolean;
};

export function usePlatformDashboardP1C(enabled: boolean): PlatformDashboardP1CData {
  const syncQuery = useQuery({
    queryKey: ['platform-dashboard', 'sync-logs', SYNC_FEED_LIMIT],
    queryFn: () =>
      superadminAuditoriaService.getSyncLogs({
        page: 1,
        limit: SYNC_FEED_LIMIT,
        orden: 'desc',
        ordenar_por: 'fecha_sincronizacion',
      }),
    enabled,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const operatorsQuery = useQuery({
    queryKey: ['platform-dashboard', 'platform-operators', PLATFORM_SUPERADMIN_CLIENTE_ID],
    queryFn: () =>
      superadminUsuarioService.getUsuariosGlobales({
        page: 1,
        limit: PLATFORM_OPERATORS_LIMIT,
        cliente_id: PLATFORM_SUPERADMIN_CLIENTE_ID,
        es_activo: true,
        ordenar_por: 'fecha_ultimo_acceso',
        orden: 'desc',
      }),
    enabled,
    staleTime: 60_000,
  });

  const usuariosStatsQuery = useQuery({
    queryKey: ['platform-dashboard', 'usuarios-stats'],
    queryFn: () => superadminUsuarioStatsService.getUsuariosStats(),
    enabled,
    staleTime: 120_000,
  });

  const recentClientesQuery = useQuery({
    queryKey: ['platform-dashboard', 'clientes-snapshot'],
    queryFn: fetchClientesSnapshot,
    enabled,
    staleTime: 120_000,
  });

  const recentClientes = useMemo(() => {
    if (!recentClientesQuery.data || recentClientesQuery.isError) return [];
    return getRecentClientesFromSnapshot(
      recentClientesQuery.data.clientes,
      RECENT_CLIENTES_LIMIT,
    );
  }, [recentClientesQuery.data, recentClientesQuery.isError]);

  const blockedCount = useMemo(() => {
    if (!usuariosStatsQuery.data || usuariosStatsQuery.isError) return 0;
    return usuariosStatsQuery.data.usuarios_bloqueados;
  }, [usuariosStatsQuery.data, usuariosStatsQuery.isError]);

  const operatorAlerts = useMemo(
    () =>
      buildOperatorAlertsFromUsuarios(
        operatorsQuery.data?.usuarios,
        blockedCount,
        operatorsQuery.isLoading,
        usuariosStatsQuery.isLoading,
      ),
    [
      operatorsQuery.data?.usuarios,
      blockedCount,
      operatorsQuery.isLoading,
      usuariosStatsQuery.isLoading,
    ],
  );

  return {
    syncLogs: syncQuery.data?.logs ?? [],
    syncLoading: syncQuery.isLoading,
    syncError: syncQuery.isError,
    platformOperators: operatorsQuery.data?.usuarios ?? [],
    operatorsLoading: operatorsQuery.isLoading,
    operatorsError: operatorsQuery.isError,
    recentClientes,
    recentClientesLoading: recentClientesQuery.isLoading,
    recentClientesError: recentClientesQuery.isError,
    isPartialRecentClientes: recentClientesQuery.data?.isPartial ?? false,
    operatorAlerts,
    alertsLoading: operatorsQuery.isLoading || usuariosStatsQuery.isLoading,
  };
}
