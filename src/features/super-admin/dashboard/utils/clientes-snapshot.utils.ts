import { clienteService, CLIENTES_INACTIVE_FETCH_LIMIT } from '@/features/super-admin/clientes/services/cliente.service';
import type { Cliente } from '@/features/super-admin/clientes/types/cliente.types';
import { SubscriptionPlan, SubscriptionStatus } from '@/core/constants';

/** Código tenant sistema — excluir de agregaciones de negocio (contrato §8.4). */
export const SYSTEM_CLIENTE_CODIGO = 'SYSTEM';

/** Días de anticipación para CLIENT_TRIAL_EXPIRING (contrato §4.1). */
export const TRIAL_EXPIRING_WINDOW_DAYS = 7;

export type ClientesSnapshotFetchResult = {
  clientes: Cliente[];
  totalReported: number;
  isPartial: boolean;
};

export type PlanDistributionKey = 'basico' | 'profesional' | 'enterprise' | 'trial';

export type ClientesSnapshotAggregation = {
  suspendidos: number;
  trial: number;
  cancelados: number;
  morosos: number;
  estadoIncoherente: number;
  trialExpired: number;
  trialExpiring: number;
  porPlan: Record<PlanDistributionKey, number>;
  totalEnSnapshot: number;
  totalReported: number;
  isPartial: boolean;
};

export function isSystemCliente(cliente: Cliente): boolean {
  return cliente.codigo_cliente?.toUpperCase() === SYSTEM_CLIENTE_CODIGO;
}

export function filterBusinessClientes(clientes: Cliente[]): Cliente[] {
  return clientes.filter((c) => !isSystemCliente(c));
}

/**
 * Snapshot global de clientes para agregaciones dashboard (contrato §5 W14).
 * GET /clientes/?solo_activos=false&limit=1000
 */
export async function fetchClientesSnapshot(): Promise<ClientesSnapshotFetchResult> {
  const response = await clienteService.getClientes(1, CLIENTES_INACTIVE_FETCH_LIMIT, {
    activeFilter: 'all',
  });
  const businessClientes = filterBusinessClientes(response.clientes ?? []);
  const totalReported = response.total_clientes ?? businessClientes.length;
  const fetchedCount = response.clientes?.length ?? 0;
  const isPartial = totalReported > fetchedCount;

  return {
    clientes: businessClientes,
    totalReported,
    isPartial,
  };
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isTrialCliente(cliente: Cliente): boolean {
  return (
    cliente.plan_suscripcion === SubscriptionPlan.TRIAL ||
    cliente.estado_suscripcion === SubscriptionStatus.TRIAL
  );
}

export function aggregateClientesSnapshot(
  clientes: Cliente[],
  totalReported: number,
  isPartial: boolean,
  now: Date = new Date(),
): ClientesSnapshotAggregation {
  const today = startOfDay(now);
  const expiringUntil = new Date(today);
  expiringUntil.setDate(expiringUntil.getDate() + TRIAL_EXPIRING_WINDOW_DAYS);

  const porPlan: Record<PlanDistributionKey, number> = {
    basico: 0,
    profesional: 0,
    enterprise: 0,
    trial: 0,
  };

  let suspendidos = 0;
  let trial = 0;
  let cancelados = 0;
  let morosos = 0;
  let estadoIncoherente = 0;
  let trialExpired = 0;
  let trialExpiring = 0;

  for (const cliente of clientes) {
    if (cliente.estado_suscripcion === SubscriptionStatus.SUSPENDED) suspendidos += 1;
    if (isTrialCliente(cliente)) trial += 1;
    if (cliente.estado_suscripcion === SubscriptionStatus.CANCELLED) cancelados += 1;
    if (cliente.estado_suscripcion === SubscriptionStatus.OVERDUE) morosos += 1;

    if (
      cliente.estado_suscripcion === SubscriptionStatus.ACTIVE &&
      cliente.es_activo === false
    ) {
      estadoIncoherente += 1;
    }

    const plan = cliente.plan_suscripcion;
    if (plan === SubscriptionPlan.BASIC) porPlan.basico += 1;
    else if (plan === SubscriptionPlan.PROFESSIONAL) porPlan.profesional += 1;
    else if (plan === SubscriptionPlan.ENTERPRISE) porPlan.enterprise += 1;
    else if (plan === SubscriptionPlan.TRIAL) porPlan.trial += 1;

    if (cliente.plan_suscripcion === SubscriptionPlan.TRIAL && cliente.fecha_fin_trial) {
      const finTrial = parseDateOnly(cliente.fecha_fin_trial);
      if (finTrial) {
        if (finTrial < today) trialExpired += 1;
        else if (finTrial <= expiringUntil) trialExpiring += 1;
      }
    }
  }

  return {
    suspendidos,
    trial,
    cancelados,
    morosos,
    estadoIncoherente,
    trialExpired,
    trialExpiring,
    porPlan,
    totalEnSnapshot: clientes.length,
    totalReported,
    isPartial,
  };
}

export type PlanDistributionSegment = {
  key: PlanDistributionKey;
  label: string;
  value: number;
};

export function toPlanDistributionSegments(
  porPlan: Record<PlanDistributionKey, number>,
): PlanDistributionSegment[] {
  return [
    { key: 'basico', label: 'Básico', value: porPlan.basico },
    { key: 'profesional', label: 'Profesional', value: porPlan.profesional },
    { key: 'enterprise', label: 'Enterprise', value: porPlan.enterprise },
    { key: 'trial', label: 'Trial', value: porPlan.trial },
  ].filter((s) => s.value > 0);
}

export type RecentClienteItem = {
  clienteId: string;
  label: string;
  codigoCliente: string;
  fechaCreacion: string;
  planSuscripcion: string;
};

/** W13 — clientes recientes desde snapshot (sort FE por fecha_creacion). */
export function getRecentClientesFromSnapshot(
  clientes: Cliente[],
  limit = 5,
): RecentClienteItem[] {
  return [...clientes]
    .sort((a, b) => {
      const dateA = new Date(a.fecha_creacion).getTime();
      const dateB = new Date(b.fecha_creacion).getTime();
      return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
    })
    .slice(0, limit)
    .map((cliente) => ({
      clienteId: cliente.cliente_id,
      label: cliente.razon_social || cliente.nombre_comercial || cliente.codigo_cliente,
      codigoCliente: cliente.codigo_cliente,
      fechaCreacion: cliente.fecha_creacion,
      planSuscripcion: cliente.plan_suscripcion,
    }));
}
