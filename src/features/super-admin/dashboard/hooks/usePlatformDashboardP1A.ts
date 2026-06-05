import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { superadminAuditoriaService } from '@/services/superadmin-auditoria.service';
import type { AuditoriaEstadisticasResponse } from '@/types/superadmin-auditoria.types';
import { getLast24HoursRange } from '../utils/auditoria-period.utils';
import {
  buildSecurityAlertsFromEstadisticas,
  type DashboardAlertItem,
} from '../utils/dashboard-alert.rules';
import type { DashboardMetricState } from './usePlatformDashboardP0';

export type PlatformDashboardP1AData = {
  loginsFallidos: DashboardMetricState;
  loginsExitosos: DashboardMetricState;
  syncFallidas: DashboardMetricState;
  securityAlerts: DashboardAlertItem[];
  estadisticas: AuditoriaEstadisticasResponse | null;
  alertsLoading: boolean;
};

const metricFromStats = (
  value: number | undefined,
  isLoading: boolean,
  isError: boolean,
): DashboardMetricState => ({
  value: isLoading || isError ? null : (value ?? 0),
  isLoading,
  isError,
});

export function usePlatformDashboardP1A(enabled: boolean): PlatformDashboardP1AData {
  const period = useMemo(() => getLast24HoursRange(), []);

  const statsQuery = useQuery({
    queryKey: [
      'platform-dashboard',
      'auditoria-estadisticas',
      period.fecha_desde,
      period.fecha_hasta,
    ],
    queryFn: () => superadminAuditoriaService.getAuditoriaEstadisticas(period),
    enabled,
    staleTime: 60_000,
  });

  const stats = statsQuery.data;

  const securityAlerts = useMemo(
    () => (statsQuery.isError ? [] : buildSecurityAlertsFromEstadisticas(stats)),
    [stats, statsQuery.isError],
  );

  return {
    loginsFallidos: metricFromStats(
      stats?.autenticacion?.login_fallidos,
      statsQuery.isLoading,
      statsQuery.isError,
    ),
    loginsExitosos: metricFromStats(
      stats?.autenticacion?.login_exitosos,
      statsQuery.isLoading,
      statsQuery.isError,
    ),
    syncFallidas: metricFromStats(
      stats?.sincronizacion?.fallidas,
      statsQuery.isLoading,
      statsQuery.isError,
    ),
    securityAlerts,
    estadisticas: stats ?? null,
    alertsLoading: statsQuery.isLoading,
  };
}
