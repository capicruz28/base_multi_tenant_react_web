import { describe, it, expect } from 'vitest';
import type { Cliente } from '@/features/super-admin/clientes/types/cliente.types';
import { SubscriptionPlan, SubscriptionStatus } from '@/core/constants';
import {
  aggregateClientesSnapshot,
  filterBusinessClientes,
  getRecentClientesFromSnapshot,
  isSystemCliente,
  toPlanDistributionSegments,
  TRIAL_EXPIRING_WINDOW_DAYS,
} from '../clientes-snapshot.utils';

const makeCliente = (overrides: Partial<Cliente> = {}): Cliente =>
  ({
    cliente_id: 'id-1',
    codigo_cliente: 'ACME001',
    subdominio: 'acme',
    razon_social: 'ACME',
    nombre_comercial: null,
    ruc: null,
    tipo_instalacion: 'shared',
    servidor_api_local: null,
    modo_autenticacion: 'local',
    logo_url: null,
    favicon_url: null,
    color_primario: '#000',
    color_secundario: '#fff',
    tema_personalizado: null,
    plan_suscripcion: SubscriptionPlan.PROFESSIONAL,
    estado_suscripcion: SubscriptionStatus.ACTIVE,
    fecha_inicio_suscripcion: null,
    fecha_fin_trial: null,
    contacto_nombre: null,
    contacto_email: 'a@acme.com',
    contacto_telefono: null,
    es_activo: true,
    es_demo: false,
    metadata_json: null,
    api_key_sincronizacion: null,
    sincronizacion_habilitada: false,
    ultima_sincronizacion: null,
    fecha_creacion: '2025-01-01',
    fecha_actualizacion: null,
    fecha_ultimo_acceso: null,
    ...overrides,
  }) as Cliente;

describe('clientes-snapshot.utils', () => {
  it('excludes SYSTEM from business clientes', () => {
    const list = [
      makeCliente({ codigo_cliente: 'SYSTEM' }),
      makeCliente({ codigo_cliente: 'ACME001' }),
    ];
    expect(isSystemCliente(list[0])).toBe(true);
    expect(filterBusinessClientes(list)).toHaveLength(1);
  });

  it('aggregates portfolio KPIs and plan distribution', () => {
    const now = new Date('2026-06-03T12:00:00.000Z');
    const clientes = [
      makeCliente({ estado_suscripcion: SubscriptionStatus.SUSPENDED }),
      makeCliente({
        plan_suscripcion: SubscriptionPlan.TRIAL,
        estado_suscripcion: SubscriptionStatus.TRIAL,
      }),
      makeCliente({ estado_suscripcion: SubscriptionStatus.CANCELLED }),
      makeCliente({ estado_suscripcion: SubscriptionStatus.OVERDUE }),
      makeCliente({ plan_suscripcion: SubscriptionPlan.BASIC }),
      makeCliente({ plan_suscripcion: SubscriptionPlan.ENTERPRISE }),
    ];

    const agg = aggregateClientesSnapshot(clientes, clientes.length, false, now);

    expect(agg.suspendidos).toBe(1);
    expect(agg.trial).toBe(1);
    expect(agg.cancelados).toBe(1);
    expect(agg.morosos).toBe(1);
    expect(agg.porPlan.basico).toBe(1);
    expect(agg.porPlan.enterprise).toBe(1);
    expect(agg.porPlan.trial).toBe(1);
    expect(agg.porPlan.profesional).toBe(3);
  });

  it('detects trial expired and expiring windows', () => {
    const now = new Date('2026-06-03T12:00:00.000Z');
    const expiringDay = new Date(now);
    expiringDay.setDate(expiringDay.getDate() + TRIAL_EXPIRING_WINDOW_DAYS);

    const clientes = [
      makeCliente({
        plan_suscripcion: SubscriptionPlan.TRIAL,
        fecha_fin_trial: '2026-06-01',
      }),
      makeCliente({
        plan_suscripcion: SubscriptionPlan.TRIAL,
        fecha_fin_trial: expiringDay.toISOString().slice(0, 10),
      }),
    ];

    const agg = aggregateClientesSnapshot(clientes, 2, false, now);
    expect(agg.trialExpired).toBe(1);
    expect(agg.trialExpiring).toBe(1);
  });

  it('maps plan segments for W14 chart', () => {
    const segments = toPlanDistributionSegments({
      basico: 2,
      profesional: 5,
      enterprise: 1,
      trial: 0,
    });
    expect(segments).toHaveLength(3);
    expect(segments.find((s) => s.key === 'profesional')?.value).toBe(5);
  });

  it('returns most recent clientes sorted by fecha_creacion (W13)', () => {
    const clientes = [
      makeCliente({
        cliente_id: 'old',
        codigo_cliente: 'OLD',
        fecha_creacion: '2024-01-01',
      }),
      makeCliente({
        cliente_id: 'new',
        codigo_cliente: 'NEW',
        fecha_creacion: '2026-05-01',
      }),
      makeCliente({
        cliente_id: 'mid',
        codigo_cliente: 'MID',
        fecha_creacion: '2025-06-01',
      }),
    ];

    const recent = getRecentClientesFromSnapshot(clientes, 2);
    expect(recent).toHaveLength(2);
    expect(recent[0].clienteId).toBe('new');
    expect(recent[1].clienteId).toBe('mid');
  });
});
