/**
 * Servicio del módulo QMS (Quality Management System)
 * Endpoints: /api/v1/qms/
 */
import api from '@/core/api/api';
import type {
  ParametroCalidad,
  ParametroCalidadCreate,
  ParametroCalidadUpdate,
  PlanInspeccion,
  PlanInspeccionCreate,
  PlanInspeccionUpdate,
  PlanInspeccionDetalle,
  PlanInspeccionDetalleCreate,
  Inspeccion,
  InspeccionCreate,
  InspeccionUpdate,
  InspeccionDetalle,
  InspeccionDetalleCreate,
  NoConformidad,
  NoConformidadCreate,
  NoConformidadUpdate,
} from '../types/qms.types';

const BASE = '/qms';

// ─── Parámetros de Calidad ───────────────────────────────────────────────────

export const parametroCalidadService = {
  list: async (params?: {
    empresa_id?: string;
    tipo_parametro?: string;
    solo_activos?: boolean;
    buscar?: string;
  }): Promise<ParametroCalidad[]> => {
    const { data } = await api.get<ParametroCalidad[]>(`${BASE}/parametros-calidad`, {
      params: { solo_activos: params?.solo_activos ?? true, ...params },
    });
    return Array.isArray(data) ? data : [];
  },

  getById: async (parametroId: string): Promise<ParametroCalidad> => {
    const { data } = await api.get<ParametroCalidad>(`${BASE}/parametros-calidad/${parametroId}`);
    return data;
  },

  create: async (payload: ParametroCalidadCreate): Promise<ParametroCalidad> => {
    const { data } = await api.post<ParametroCalidad>(`${BASE}/parametros-calidad`, payload);
    return data;
  },

  update: async (parametroId: string, payload: ParametroCalidadUpdate): Promise<ParametroCalidad> => {
    const { data } = await api.put<ParametroCalidad>(`${BASE}/parametros-calidad/${parametroId}`, payload);
    return data;
  },
};

// ─── Planes de Inspección ────────────────────────────────────────────────────

export const planInspeccionService = {
  list: async (params?: {
    empresa_id?: string;
    producto_id?: string;
    categoria_id?: string;
    tipo_inspeccion?: string;
    solo_activos?: boolean;
    buscar?: string;
  }): Promise<PlanInspeccion[]> => {
    const { data } = await api.get<PlanInspeccion[]>(`${BASE}/planes-inspeccion`, {
      params: { solo_activos: params?.solo_activos ?? true, ...params },
    });
    return Array.isArray(data) ? data : [];
  },

  getById: async (planId: string): Promise<PlanInspeccion> => {
    const { data } = await api.get<PlanInspeccion>(`${BASE}/planes-inspeccion/${planId}`);
    return data;
  },

  create: async (payload: PlanInspeccionCreate): Promise<PlanInspeccion> => {
    const { data } = await api.post<PlanInspeccion>(`${BASE}/planes-inspeccion`, payload);
    return data;
  },

  update: async (planId: string, payload: PlanInspeccionUpdate): Promise<PlanInspeccion> => {
    const { data } = await api.put<PlanInspeccion>(`${BASE}/planes-inspeccion/${planId}`, payload);
    return data;
  },

  listDetalles: async (planId: string): Promise<PlanInspeccionDetalle[]> => {
    const { data } = await api.get<PlanInspeccionDetalle[]>(`${BASE}/planes-inspeccion/${planId}/detalles`);
    return Array.isArray(data) ? data : [];
  },

  createDetalle: async (planId: string, payload: PlanInspeccionDetalleCreate): Promise<PlanInspeccionDetalle> => {
    const { data } = await api.post<PlanInspeccionDetalle>(`${BASE}/planes-inspeccion/${planId}/detalles`, payload);
    return data;
  },
};

// ─── Inspecciones ────────────────────────────────────────────────────────────

export const inspeccionService = {
  list: async (params?: {
    empresa_id?: string;
    producto_id?: string;
    plan_inspeccion_id?: string;
    resultado?: string;
    lote?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    buscar?: string;
  }): Promise<Inspeccion[]> => {
    const { data } = await api.get<Inspeccion[]>(`${BASE}/inspecciones`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (inspeccionId: string): Promise<Inspeccion> => {
    const { data } = await api.get<Inspeccion>(`${BASE}/inspecciones/${inspeccionId}`);
    return data;
  },

  create: async (payload: InspeccionCreate): Promise<Inspeccion> => {
    const { data } = await api.post<Inspeccion>(`${BASE}/inspecciones`, payload);
    return data;
  },

  update: async (inspeccionId: string, payload: InspeccionUpdate): Promise<Inspeccion> => {
    const { data } = await api.put<Inspeccion>(`${BASE}/inspecciones/${inspeccionId}`, payload);
    return data;
  },

  listDetalles: async (inspeccionId: string): Promise<InspeccionDetalle[]> => {
    const { data } = await api.get<InspeccionDetalle[]>(`${BASE}/inspecciones/${inspeccionId}/detalles`);
    return Array.isArray(data) ? data : [];
  },

  createDetalle: async (inspeccionId: string, payload: InspeccionDetalleCreate): Promise<InspeccionDetalle> => {
    const { data } = await api.post<InspeccionDetalle>(`${BASE}/inspecciones/${inspeccionId}/detalles`, payload);
    return data;
  },
};

// ─── No Conformidades ───────────────────────────────────────────────────────

export const noConformidadService = {
  list: async (params?: {
    empresa_id?: string;
    producto_id?: string;
    origen?: string;
    tipo_nc?: string;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    buscar?: string;
  }): Promise<NoConformidad[]> => {
    const { data } = await api.get<NoConformidad[]>(`${BASE}/no-conformidades`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (ncId: string): Promise<NoConformidad> => {
    const { data } = await api.get<NoConformidad>(`${BASE}/no-conformidades/${ncId}`);
    return data;
  },

  create: async (payload: NoConformidadCreate): Promise<NoConformidad> => {
    const { data } = await api.post<NoConformidad>(`${BASE}/no-conformidades`, payload);
    return data;
  },

  update: async (ncId: string, payload: NoConformidadUpdate): Promise<NoConformidad> => {
    const { data } = await api.put<NoConformidad>(`${BASE}/no-conformidades/${ncId}`, payload);
    return data;
  },
};
