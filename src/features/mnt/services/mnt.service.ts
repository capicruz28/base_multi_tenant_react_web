/**
 * Servicio del módulo MNT (Mantenimiento de Activos).
 * Base URL: /api/v1/mnt
 */
import api from '@/core/api/api';
import type {
  Activo,
  ActivoCreate,
  ActivoUpdate,
  PlanMantenimiento,
  PlanMantenimientoCreate,
  PlanMantenimientoUpdate,
  OrdenTrabajo,
  OrdenTrabajoCreate,
  OrdenTrabajoUpdate,
  HistorialMantenimiento,
  HistorialMantenimientoCreate,
  HistorialMantenimientoUpdate,
} from '../types/mnt.types';

const BASE = '/mnt';

// ─── Activos ─────────────────────────────────────────────────────────────────

export const activoService = {
  list: async (params?: {
    empresa_id?: string;
    tipo_activo?: string;
    estado_activo?: string;
    criticidad?: string;
    es_activo?: boolean;
    buscar?: string;
  }): Promise<Activo[]> => {
    const { data } = await api.get<Activo[]>(`${BASE}/activos`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (activoId: string): Promise<Activo> => {
    const { data } = await api.get<Activo>(`${BASE}/activos/${activoId}`);
    return data;
  },

  create: async (payload: ActivoCreate): Promise<Activo> => {
    const { data } = await api.post<Activo>(`${BASE}/activos`, payload);
    return data;
  },

  update: async (activoId: string, payload: ActivoUpdate): Promise<Activo> => {
    const { data } = await api.put<Activo>(`${BASE}/activos/${activoId}`, payload);
    return data;
  },
};

// ─── Planes Mantenimiento ────────────────────────────────────────────────────

export const planMantenimientoService = {
  list: async (params?: {
    activo_id?: string;
    tipo_mantenimiento?: string;
    es_activo?: boolean;
    buscar?: string;
  }): Promise<PlanMantenimiento[]> => {
    const { data } = await api.get<PlanMantenimiento[]>(
      `${BASE}/planes-mantenimiento`,
      { params }
    );
    return Array.isArray(data) ? data : [];
  },

  getById: async (planMantenimientoId: string): Promise<PlanMantenimiento> => {
    const { data } = await api.get<PlanMantenimiento>(
      `${BASE}/planes-mantenimiento/${planMantenimientoId}`
    );
    return data;
  },

  create: async (payload: PlanMantenimientoCreate): Promise<PlanMantenimiento> => {
    const { data } = await api.post<PlanMantenimiento>(
      `${BASE}/planes-mantenimiento`,
      payload
    );
    return data;
  },

  update: async (
    planMantenimientoId: string,
    payload: PlanMantenimientoUpdate
  ): Promise<PlanMantenimiento> => {
    const { data } = await api.put<PlanMantenimiento>(
      `${BASE}/planes-mantenimiento/${planMantenimientoId}`,
      payload
    );
    return data;
  },
};

// ─── Órdenes Trabajo ────────────────────────────────────────────────────────

export const ordenTrabajoService = {
  list: async (params?: {
    empresa_id?: string;
    activo_id?: string;
    estado?: string;
    tipo_mantenimiento?: string;
    buscar?: string;
  }): Promise<OrdenTrabajo[]> => {
    const { data } = await api.get<OrdenTrabajo[]>(`${BASE}/ordenes-trabajo`, {
      params,
    });
    return Array.isArray(data) ? data : [];
  },

  getById: async (ordenTrabajoId: string): Promise<OrdenTrabajo> => {
    const { data } = await api.get<OrdenTrabajo>(
      `${BASE}/ordenes-trabajo/${ordenTrabajoId}`
    );
    return data;
  },

  create: async (payload: OrdenTrabajoCreate): Promise<OrdenTrabajo> => {
    const { data } = await api.post<OrdenTrabajo>(`${BASE}/ordenes-trabajo`, payload);
    return data;
  },

  update: async (
    ordenTrabajoId: string,
    payload: OrdenTrabajoUpdate
  ): Promise<OrdenTrabajo> => {
    const { data } = await api.put<OrdenTrabajo>(
      `${BASE}/ordenes-trabajo/${ordenTrabajoId}`,
      payload
    );
    return data;
  },
};

// ─── Historial Mantenimiento ─────────────────────────────────────────────────

export const historialMantenimientoService = {
  list: async (params?: {
    activo_id?: string;
    orden_trabajo_id?: string;
    tipo_mantenimiento?: string;
  }): Promise<HistorialMantenimiento[]> => {
    const { data } = await api.get<HistorialMantenimiento[]>(
      `${BASE}/historial-mantenimiento`,
      { params }
    );
    return Array.isArray(data) ? data : [];
  },

  getById: async (historialId: string): Promise<HistorialMantenimiento> => {
    const { data } = await api.get<HistorialMantenimiento>(
      `${BASE}/historial-mantenimiento/${historialId}`
    );
    return data;
  },

  create: async (
    payload: HistorialMantenimientoCreate
  ): Promise<HistorialMantenimiento> => {
    const { data } = await api.post<HistorialMantenimiento>(
      `${BASE}/historial-mantenimiento`,
      payload
    );
    return data;
  },

  update: async (
    historialId: string,
    payload: HistorialMantenimientoUpdate
  ): Promise<HistorialMantenimiento> => {
    const { data } = await api.put<HistorialMantenimiento>(
      `${BASE}/historial-mantenimiento/${historialId}`,
      payload
    );
    return data;
  },
};
