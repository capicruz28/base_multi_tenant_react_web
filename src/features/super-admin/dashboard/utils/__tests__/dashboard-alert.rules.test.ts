import { describe, it, expect } from 'vitest';
import {
  AUTH_LOGIN_FAILURES_THRESHOLD,
  buildOperatorAlertsFromUsuarios,
  buildPortfolioAlertsFromSnapshot,
  buildSecurityAlertsFromEstadisticas,
  IP_SUSPICIOUS_FAILURE_RATIO,
} from '../dashboard-alert.rules';
import type { AuditoriaEstadisticasResponse } from '@/types/superadmin-auditoria.types';
import type { SuperadminUsuario } from '@/types/superadmin-usuario.types';

const baseStats = (): AuditoriaEstadisticasResponse => ({
  periodo: {
    fecha_desde: '2026-06-02T00:00:00',
    fecha_hasta: '2026-06-03T00:00:00',
  },
  autenticacion: {
    total_eventos: 100,
    login_exitosos: 90,
    login_fallidos: 10,
    eventos_por_tipo: { login_success: 90, login_failed: 10 },
  },
  sincronizacion: {
    total_sincronizaciones: 10,
    exitosas: 10,
    fallidas: 0,
    por_tipo: { manual: 5, scheduled: 5 },
  },
  top_ips: [],
  top_usuarios: [],
});

describe('buildSecurityAlertsFromEstadisticas', () => {
  it('returns empty list when stats are undefined', () => {
    expect(buildSecurityAlertsFromEstadisticas(undefined)).toEqual([]);
  });

  it('emits AUTH_LOGIN_FAILURES_HIGH when threshold is reached', () => {
    const stats = baseStats();
    stats.autenticacion.login_fallidos = AUTH_LOGIN_FAILURES_THRESHOLD;

    const alerts = buildSecurityAlertsFromEstadisticas(stats);
    expect(alerts.some((a) => a.codigo === 'AUTH_LOGIN_FAILURES_HIGH')).toBe(true);
    expect(alerts.find((a) => a.codigo === 'AUTH_LOGIN_FAILURES_HIGH')?.accion_url).toBe(
      '/super-admin/auditoria?evento=login_failed',
    );
  });

  it('does not emit AUTH_LOGIN_FAILURES_HIGH below threshold', () => {
    const stats = baseStats();
    stats.autenticacion.login_fallidos = AUTH_LOGIN_FAILURES_THRESHOLD - 1;

    const alerts = buildSecurityAlertsFromEstadisticas(stats);
    expect(alerts.some((a) => a.codigo === 'AUTH_LOGIN_FAILURES_HIGH')).toBe(false);
  });

  it('emits AUTH_SYNC_FAILURES when sync fallidas > 0', () => {
    const stats = baseStats();
    stats.sincronizacion.fallidas = 2;

    const alerts = buildSecurityAlertsFromEstadisticas(stats);
    const syncAlert = alerts.find((a) => a.codigo === 'AUTH_SYNC_FAILURES');
    expect(syncAlert).toBeDefined();
    expect(syncAlert?.mensaje).toContain('2');
  });

  it('emits IP_SUSPICIOUS when failure ratio exceeds threshold', () => {
    const stats = baseStats();
    stats.top_ips = [
      {
        ip_address: '198.51.100.10',
        total_eventos: 100,
        eventos_fallidos: Math.ceil(100 * IP_SUSPICIOUS_FAILURE_RATIO) + 1,
      },
    ];

    const alerts = buildSecurityAlertsFromEstadisticas(stats);
    const ipAlert = alerts.find((a) => a.codigo === 'IP_SUSPICIOUS');
    expect(ipAlert).toBeDefined();
    expect(ipAlert?.mensaje).toContain('198.51.100.10');
    expect(ipAlert?.accion_url).toContain('ip_address=198.51.100.10');
  });
});

describe('buildPortfolioAlertsFromSnapshot', () => {
  const baseAggregation = {
    suspendidos: 0,
    trial: 0,
    cancelados: 0,
    morosos: 0,
    estadoIncoherente: 0,
    trialExpired: 0,
    trialExpiring: 0,
    porPlan: { basico: 0, profesional: 0, enterprise: 0, trial: 0 },
    totalEnSnapshot: 0,
    totalReported: 0,
    isPartial: false,
  };

  it('returns empty when aggregation is undefined', () => {
    expect(buildPortfolioAlertsFromSnapshot(undefined)).toEqual([]);
  });

  it('emits CLIENT alerts when counts are present', () => {
    const alerts = buildPortfolioAlertsFromSnapshot({
      ...baseAggregation,
      trialExpired: 2,
      trialExpiring: 1,
      estadoIncoherente: 1,
      suspendidos: 3,
    });

    expect(alerts.map((a) => a.codigo)).toEqual([
      'CLIENT_TRIAL_EXPIRED',
      'CLIENT_TRIAL_EXPIRING',
      'CLIENT_STATE_INCOHERENT',
      'CLIENT_SUSPENDED',
    ]);
  });
});

describe('buildOperatorAlertsFromUsuarios', () => {
  const makeOperator = (overrides: Partial<SuperadminUsuario> = {}): SuperadminUsuario =>
    ({
      usuario_id: 'u-1',
      cliente_id: '00000000-0000-0000-0000-000000000001',
      nombre_usuario: 'ops.admin',
      es_activo: true,
      es_eliminado: false,
      fecha_bloqueo: null,
      is_super_admin: true,
      ...overrides,
    }) as SuperadminUsuario;

  it('returns empty while loading', () => {
    expect(buildOperatorAlertsFromUsuarios([], 1, true, false)).toEqual([]);
  });

  it('emits USER_BLOCKED when blocked count > 0', () => {
    const alerts = buildOperatorAlertsFromUsuarios([makeOperator()], 2, false, false);
    expect(alerts.some((a) => a.codigo === 'USER_BLOCKED')).toBe(true);
  });

  it('emits PLATFORM_OPERATOR_NONE_ACTIVE when no active operators', () => {
    const alerts = buildOperatorAlertsFromUsuarios([], 0, false, false);
    expect(alerts.some((a) => a.codigo === 'PLATFORM_OPERATOR_NONE_ACTIVE')).toBe(true);
  });
});
