/**
 * Servicio del módulo WFL (Flujos de Trabajo).
 * Base URL: /api/v1/wfl
 */
import api from '@/core/api/api';
import type {
  FlujoTrabajoRead,
  FlujoTrabajoCreate,
  FlujoTrabajoUpdate,
} from '../types/wfl.types';

const BASE = '/wfl';

export const flujosTrabajoService = {
  list: async (params?: {
    empresa_id?: string;
    tipo_flujo?: string;
    modulo_aplicable?: string;
    es_activo?: boolean;
    buscar?: string;
  }): Promise<FlujoTrabajoRead[]> => {
    const { data } = await api.get<FlujoTrabajoRead[]>(`${BASE}/flujos-trabajo`, {
      params,
    });
    return Array.isArray(data) ? data : [];
  },

  getById: async (flujoId: string): Promise<FlujoTrabajoRead> => {
    const { data } = await api.get<FlujoTrabajoRead>(
      `${BASE}/flujos-trabajo/${flujoId}`
    );
    return data;
  },

  create: async (payload: FlujoTrabajoCreate): Promise<FlujoTrabajoRead> => {
    const { data } = await api.post<FlujoTrabajoRead>(
      `${BASE}/flujos-trabajo`,
      payload
    );
    return data;
  },

  update: async (
    flujoId: string,
    payload: FlujoTrabajoUpdate
  ): Promise<FlujoTrabajoRead> => {
    const { data } = await api.put<FlujoTrabajoRead>(
      `${BASE}/flujos-trabajo/${flujoId}`,
      payload
    );
    return data;
  },
};
