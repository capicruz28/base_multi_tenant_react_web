/**
 * Servicio del módulo BDG (Presupuestos).
 * Base URL: /api/v1/bdg
 */
import api from '@/core/api/api';
import type {
  Presupuesto,
  PresupuestoCreate,
  PresupuestoUpdate,
  PresupuestoDetalle,
  PresupuestoDetalleCreate,
  PresupuestoDetalleUpdate,
} from '../types/bdg.types';

const BASE = '/bdg';

export const presupuestosService = {
  list: async (params?: {
    empresa_id?: string;
    anio?: number;
    tipo_presupuesto?: string;
    estado?: string;
    buscar?: string;
  }): Promise<Presupuesto[]> => {
    const { data } = await api.get<Presupuesto[]>(`${BASE}/presupuestos`, {
      params,
    });
    return Array.isArray(data) ? data : [];
  },

  getById: async (presupuestoId: string): Promise<Presupuesto> => {
    const { data } = await api.get<Presupuesto>(
      `${BASE}/presupuestos/${presupuestoId}`
    );
    return data;
  },

  create: async (payload: PresupuestoCreate): Promise<Presupuesto> => {
    const { data } = await api.post<Presupuesto>(`${BASE}/presupuestos`, payload);
    return data;
  },

  update: async (
    presupuestoId: string,
    payload: PresupuestoUpdate
  ): Promise<Presupuesto> => {
    const { data } = await api.put<Presupuesto>(
      `${BASE}/presupuestos/${presupuestoId}`,
      payload
    );
    return data;
  },
};

export const presupuestoDetalleService = {
  list: async (params?: {
    presupuesto_id?: string;
    cuenta_id?: string;
    centro_costo_id?: string;
    mes?: number;
  }): Promise<PresupuestoDetalle[]> => {
    const { data } = await api.get<PresupuestoDetalle[]>(
      `${BASE}/presupuesto-detalle`,
      { params }
    );
    return Array.isArray(data) ? data : [];
  },

  getById: async (
    presupuestoDetalleId: string
  ): Promise<PresupuestoDetalle> => {
    const { data } = await api.get<PresupuestoDetalle>(
      `${BASE}/presupuesto-detalle/${presupuestoDetalleId}`
    );
    return data;
  },

  create: async (
    payload: PresupuestoDetalleCreate
  ): Promise<PresupuestoDetalle> => {
    const { data } = await api.post<PresupuestoDetalle>(
      `${BASE}/presupuesto-detalle`,
      payload
    );
    return data;
  },

  update: async (
    presupuestoDetalleId: string,
    payload: PresupuestoDetalleUpdate
  ): Promise<PresupuestoDetalle> => {
    const { data } = await api.put<PresupuestoDetalle>(
      `${BASE}/presupuesto-detalle/${presupuestoDetalleId}`,
      payload
    );
    return data;
  },
};
