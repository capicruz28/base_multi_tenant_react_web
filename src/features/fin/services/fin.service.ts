/**
 * Servicio del módulo FIN (Finanzas y Contabilidad)
 * Endpoints: /fin/
 */
import api from '@/core/api/api';
import type {
  PlanCuenta,
  PlanCuentaCreate,
  PlanCuentaUpdate,
  PeriodoContable,
  PeriodoContableCreate,
  PeriodoContableUpdate,
  AsientoContable,
  AsientoContableCreate,
  AsientoContableUpdate,
  AsientoDetalle,
  AsientoDetalleCreate,
  AsientoDetalleUpdate,
} from '../types/fin.types';

const BASE = '/fin';

// ─── Plan de Cuentas ────────────────────────────────────────────────────────────────

export const planCuentaService = {
  list: async (params?: {
    empresa_id?: string;
    cuenta_padre_id?: string;
    tipo_cuenta?: string;
    nivel?: number;
    solo_activos?: boolean;
    buscar?: string;
  }): Promise<PlanCuenta[]> => {
    const { data } = await api.get<PlanCuenta[]>(`${BASE}/plan-cuentas`, { params });
    return data;
  },

  getById: async (cuentaId: string): Promise<PlanCuenta> => {
    const { data } = await api.get<PlanCuenta>(`${BASE}/plan-cuentas/${cuentaId}`);
    return data;
  },

  create: async (payload: PlanCuentaCreate): Promise<PlanCuenta> => {
    const { data } = await api.post<PlanCuenta>(`${BASE}/plan-cuentas`, payload);
    return data;
  },

  update: async (cuentaId: string, payload: PlanCuentaUpdate): Promise<PlanCuenta> => {
    const { data } = await api.put<PlanCuenta>(`${BASE}/plan-cuentas/${cuentaId}`, payload);
    return data;
  },
};

// ─── Periodos Contables ────────────────────────────────────────────────────────────────

export const periodoContableService = {
  list: async (params?: {
    empresa_id?: string;
    año?: number;
    mes?: number;
    estado?: string;
  }): Promise<PeriodoContable[]> => {
    const { data } = await api.get<PeriodoContable[]>(`${BASE}/periodos`, { params });
    return data;
  },

  getById: async (periodoId: string): Promise<PeriodoContable> => {
    const { data } = await api.get<PeriodoContable>(`${BASE}/periodos/${periodoId}`);
    return data;
  },

  create: async (payload: PeriodoContableCreate): Promise<PeriodoContable> => {
    const { data } = await api.post<PeriodoContable>(`${BASE}/periodos`, payload);
    return data;
  },

  update: async (periodoId: string, payload: PeriodoContableUpdate): Promise<PeriodoContable> => {
    const { data } = await api.put<PeriodoContable>(`${BASE}/periodos/${periodoId}`, payload);
    return data;
  },

  cerrar: async (periodoId: string): Promise<PeriodoContable> => {
    const { data } = await api.post<PeriodoContable>(`${BASE}/periodos/${periodoId}/cerrar`);
    return data;
  },
};

// ─── Asientos Contables ────────────────────────────────────────────────────────────────

export const asientoContableService = {
  list: async (params?: {
    empresa_id?: string;
    periodo_id?: string;
    tipo_asiento?: string;
    estado?: string;
    modulo_origen?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    buscar?: string;
  }): Promise<AsientoContable[]> => {
    const { data } = await api.get<AsientoContable[]>(`${BASE}/asientos`, { params });
    return data;
  },

  getById: async (asientoId: string): Promise<AsientoContable> => {
    const { data } = await api.get<AsientoContable>(`${BASE}/asientos/${asientoId}`);
    return data;
  },

  create: async (payload: AsientoContableCreate): Promise<AsientoContable> => {
    const { data } = await api.post<AsientoContable>(`${BASE}/asientos`, payload);
    return data;
  },

  update: async (asientoId: string, payload: AsientoContableUpdate): Promise<AsientoContable> => {
    const { data } = await api.put<AsientoContable>(`${BASE}/asientos/${asientoId}`, payload);
    return data;
  },

  aprobar: async (asientoId: string): Promise<AsientoContable> => {
    const { data } = await api.post<AsientoContable>(`${BASE}/asientos/${asientoId}/aprobar`);
    return data;
  },

  anular: async (asientoId: string): Promise<AsientoContable> => {
    const { data } = await api.post<AsientoContable>(`${BASE}/asientos/${asientoId}/anular`);
    return data;
  },
};

// ─── Detalles de Asiento Contable ────────────────────────────────────────────────────────────────

export const asientoDetalleService = {
  list: async (asientoId: string): Promise<AsientoDetalle[]> => {
    const { data } = await api.get<AsientoDetalle[]>(`${BASE}/asientos/${asientoId}/detalles`);
    return data;
  },

  create: async (asientoId: string, payload: AsientoDetalleCreate): Promise<AsientoDetalle> => {
    const { data } = await api.post<AsientoDetalle>(`${BASE}/asientos/${asientoId}/detalles`, payload);
    return data;
  },

  update: async (
    asientoId: string,
    detalleId: string,
    payload: AsientoDetalleUpdate
  ): Promise<AsientoDetalle> => {
    const { data } = await api.put<AsientoDetalle>(
      `${BASE}/asientos/${asientoId}/detalles/${detalleId}`,
      payload
    );
    return data;
  },

  delete: async (asientoId: string, detalleId: string): Promise<void> => {
    await api.delete(`${BASE}/asientos/${asientoId}/detalles/${detalleId}`);
  },
};
