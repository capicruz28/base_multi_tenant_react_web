/**
 * Servicio del módulo BI (Reportes y Analytics).
 * Base URL: /api/v1/bi
 */
import api from '@/core/api/api';
import type {
  ReporteRead,
  ReporteCreate,
  ReporteUpdate,
} from '../types/bi.types';

const BASE = '/bi';

export const reportesService = {
  list: async (params?: {
    empresa_id?: string;
    tipo_reporte?: string;
    modulo_origen?: string;
    categoria?: string;
    es_activo?: boolean;
    es_publico?: boolean;
    buscar?: string;
  }): Promise<ReporteRead[]> => {
    const { data } = await api.get<ReporteRead[]>(`${BASE}/reportes`, {
      params,
    });
    return Array.isArray(data) ? data : [];
  },

  getById: async (reporteId: string): Promise<ReporteRead> => {
    const { data } = await api.get<ReporteRead>(
      `${BASE}/reportes/${reporteId}`
    );
    return data;
  },

  create: async (payload: ReporteCreate): Promise<ReporteRead> => {
    const { data } = await api.post<ReporteRead>(
      `${BASE}/reportes`,
      payload
    );
    return data;
  },

  update: async (
    reporteId: string,
    payload: ReporteUpdate
  ): Promise<ReporteRead> => {
    const { data } = await api.put<ReporteRead>(
      `${BASE}/reportes/${reporteId}`,
      payload
    );
    return data;
  },
};
