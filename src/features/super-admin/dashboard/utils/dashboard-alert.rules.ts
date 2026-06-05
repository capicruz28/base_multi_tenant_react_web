import type { AuditoriaEstadisticasResponse } from '@/types/superadmin-auditoria.types';
import type { SuperadminUsuario } from '@/types/superadmin-usuario.types';
import type { ClientesSnapshotAggregation } from './clientes-snapshot.utils';

export type DashboardAlertSeverity = 'info' | 'warning' | 'critical';

export interface DashboardAlertItem {
  codigo: string;
  severidad: DashboardAlertSeverity;
  mensaje: string;
  accion_url?: string;
}

/** Umbral sugerido en contrato §4.1 para AUTH_LOGIN_FAILURES_HIGH. */
export const AUTH_LOGIN_FAILURES_THRESHOLD = 50;

/** Ratio mínimo fallos/total para IP_SUSPICIOUS (contrato §4.1). */
export const IP_SUSPICIOUS_FAILURE_RATIO = 0.5;

export function buildSecurityAlertsFromEstadisticas(
  stats: AuditoriaEstadisticasResponse | undefined,
): DashboardAlertItem[] {
  if (!stats) return [];

  const alerts: DashboardAlertItem[] = [];

  const loginFallidos = stats.autenticacion?.login_fallidos ?? 0;
  if (loginFallidos >= AUTH_LOGIN_FAILURES_THRESHOLD) {
    alerts.push({
      codigo: 'AUTH_LOGIN_FAILURES_HIGH',
      severidad: 'warning',
      mensaje: `${loginFallidos} logins fallidos en las últimas 24 horas`,
      accion_url: '/super-admin/auditoria?evento=login_failed',
    });
  }

  const syncFallidas = stats.sincronizacion?.fallidas ?? 0;
  if (syncFallidas > 0) {
    alerts.push({
      codigo: 'AUTH_SYNC_FAILURES',
      severidad: 'warning',
      mensaje:
        syncFallidas === 1
          ? '1 sincronización fallida en las últimas 24 horas'
          : `${syncFallidas} sincronizaciones fallidas en las últimas 24 horas`,
      accion_url: '/super-admin/auditoria',
    });
  }

  for (const ip of stats.top_ips ?? []) {
    if (ip.total_eventos <= 0) continue;
    const ratio = ip.eventos_fallidos / ip.total_eventos;
    if (ratio > IP_SUSPICIOUS_FAILURE_RATIO) {
      const pct = Math.round(ratio * 100);
      alerts.push({
        codigo: 'IP_SUSPICIOUS',
        severidad: 'warning',
        mensaje: `IP ${ip.ip_address} con ${pct}% de eventos fallidos (${ip.eventos_fallidos}/${ip.total_eventos})`,
        accion_url: `/super-admin/auditoria?ip_address=${encodeURIComponent(ip.ip_address)}`,
      });
    }
  }

  return alerts;
}

export function buildPortfolioAlertsFromSnapshot(
  aggregation: ClientesSnapshotAggregation | undefined,
): DashboardAlertItem[] {
  if (!aggregation) return [];

  const alerts: DashboardAlertItem[] = [];
  const clientesUrl = '/super-admin/clientes';

  if (aggregation.trialExpired > 0) {
    alerts.push({
      codigo: 'CLIENT_TRIAL_EXPIRED',
      severidad: 'warning',
      mensaje:
        aggregation.trialExpired === 1
          ? '1 cliente trial con periodo vencido'
          : `${aggregation.trialExpired} clientes trial con periodo vencido`,
      accion_url: clientesUrl,
    });
  }

  if (aggregation.trialExpiring > 0) {
    alerts.push({
      codigo: 'CLIENT_TRIAL_EXPIRING',
      severidad: 'info',
      mensaje:
        aggregation.trialExpiring === 1
          ? '1 cliente trial vence en los próximos 7 días'
          : `${aggregation.trialExpiring} clientes trial vencen en los próximos 7 días`,
      accion_url: clientesUrl,
    });
  }

  if (aggregation.estadoIncoherente > 0) {
    alerts.push({
      codigo: 'CLIENT_STATE_INCOHERENT',
      severidad: 'critical',
      mensaje:
        aggregation.estadoIncoherente === 1
          ? '1 cliente con suscripción activa pero registro inactivo'
          : `${aggregation.estadoIncoherente} clientes con suscripción activa pero registro inactivo`,
      accion_url: clientesUrl,
    });
  }

  if (aggregation.suspendidos > 0) {
    alerts.push({
      codigo: 'CLIENT_SUSPENDED',
      severidad: 'info',
      mensaje:
        aggregation.suspendidos === 1
          ? '1 cliente con suscripción suspendida'
          : `${aggregation.suspendidos} clientes con suscripción suspendida`,
      accion_url: clientesUrl,
    });
  }

  return alerts;
}

export function buildOperatorAlertsFromUsuarios(
  operators: SuperadminUsuario[] | undefined,
  blockedCount: number,
  operatorsLoading: boolean,
  blockedLoading: boolean,
): DashboardAlertItem[] {
  if (operatorsLoading || blockedLoading) return [];

  const alerts: DashboardAlertItem[] = [];

  if (blockedCount > 0) {
    alerts.push({
      codigo: 'USER_BLOCKED',
      severidad: 'warning',
      mensaje:
        blockedCount === 1
          ? '1 usuario bloqueado detectado en la plataforma'
          : `${blockedCount} usuarios bloqueados detectados en la plataforma`,
      accion_url: '/super-admin/clientes',
    });
  }

  const activeOperators = operators?.filter((u) => u.es_activo && !u.es_eliminado) ?? [];
  if (operators && activeOperators.length === 0) {
    alerts.push({
      codigo: 'PLATFORM_OPERATOR_NONE_ACTIVE',
      severidad: 'critical',
      mensaje: 'No hay operadores Platform activos',
      accion_url: '/super-admin/clientes',
    });
  }

  return alerts;
}

export function mergeDashboardAlerts(...groups: DashboardAlertItem[][]): DashboardAlertItem[] {
  return groups.flat();
}
