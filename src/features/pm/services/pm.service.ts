/**
 * Servicio del módulo PM (Gestión de Proyectos).
 * Base URL: /api/v1/pm
 */
import api from '@/core/api/api';
import type { Proyecto, ProyectoCreate, ProyectoUpdate } from '../types/pm.types';

const BASE = '/pm';

export const proyectosService = {
  list: async (params?: {
    empresa_id?: string;
    estado?: string;
    cliente_venta_id?: string;
    buscar?: string;
  }): Promise<Proyecto[]> => {
    const { data } = await api.get<Proyecto[]>(`${BASE}/proyectos`, {
      params,
    });
    return Array.isArray(data) ? data : [];
  },

  getById: async (proyectoId: string): Promise<Proyecto> => {
    const { data } = await api.get<Proyecto>(
      `${BASE}/proyectos/${proyectoId}`
    );
    return data;
  },

  create: async (payload: ProyectoCreate): Promise<Proyecto> => {
    const { data } = await api.post<Proyecto>(`${BASE}/proyectos`, payload);
    return data;
  },

  update: async (
    proyectoId: string,
    payload: ProyectoUpdate
  ): Promise<Proyecto> => {
    const { data } = await api.put<Proyecto>(
      `${BASE}/proyectos/${proyectoId}`,
      payload
    );
    return data;
  },
};
