/**
 * Servicio del módulo AUD (Auditoría y Trazabilidad).
 * Base URL: /api/v1/aud
 * El log es inmutable: solo list, getById y create.
 */
import api from '@/core/api/api';
import type { LogAuditoriaRead, LogAuditoriaCreate } from '../types/aud.types';

const BASE = '/aud';

export const logAuditoriaService = {
  list: async (params?: {
    empresa_id?: string;
    modulo?: string;
    tabla?: string;
    accion?: string;
    usuario_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    registro_id?: string;
    buscar?: string;
    limit?: number;
  }): Promise<LogAuditoriaRead[]> => {
    const { data } = await api.get<LogAuditoriaRead[]>(`${BASE}/log-auditoria`, {
      params,
    });
    return Array.isArray(data) ? data : [];
  },

  getById: async (logId: string): Promise<LogAuditoriaRead> => {
    const { data } = await api.get<LogAuditoriaRead>(
      `${BASE}/log-auditoria/${logId}`
    );
    return data;
  },

  create: async (payload: LogAuditoriaCreate): Promise<LogAuditoriaRead> => {
    const { data } = await api.post<LogAuditoriaRead>(
      `${BASE}/log-auditoria`,
      payload
    );
    return data;
  },
};
