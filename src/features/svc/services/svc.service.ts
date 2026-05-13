/**
 * Servicio del módulo SVC (Órdenes de Servicio).
 * Base URL: /api/v1/svc
 */
import api from '@/core/api/api';
import type {
  OrdenServicio,
  OrdenServicioCreate,
  OrdenServicioUpdate,
} from '../types/svc.types';

const BASE = '/svc';

export const ordenesServicioService = {
  list: async (params?: {
    empresa_id?: string;
    estado?: string;
    cliente_venta_id?: string;
    tipo_servicio?: string;
    buscar?: string;
  }): Promise<OrdenServicio[]> => {
    const { data } = await api.get<OrdenServicio[]>(
      `${BASE}/ordenes-servicio`,
      { params }
    );
    return Array.isArray(data) ? data : [];
  },

  getById: async (ordenServicioId: string): Promise<OrdenServicio> => {
    const { data } = await api.get<OrdenServicio>(
      `${BASE}/ordenes-servicio/${ordenServicioId}`
    );
    return data;
  },

  create: async (payload: OrdenServicioCreate): Promise<OrdenServicio> => {
    const { data } = await api.post<OrdenServicio>(
      `${BASE}/ordenes-servicio`,
      payload
    );
    return data;
  },

  update: async (
    ordenServicioId: string,
    payload: OrdenServicioUpdate
  ): Promise<OrdenServicio> => {
    const { data } = await api.put<OrdenServicio>(
      `${BASE}/ordenes-servicio/${ordenServicioId}`,
      payload
    );
    return data;
  },
};
