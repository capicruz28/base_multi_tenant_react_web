/**
 * Servicio del módulo CRM (Customer Relationship Management)
 * Endpoints: /api/v1/crm/
 */
import api from '@/core/api/api';
import type {
  Campana,
  CampanaCreate,
  CampanaUpdate,
  Lead,
  LeadCreate,
  LeadUpdate,
  Oportunidad,
  OportunidadCreate,
  OportunidadUpdate,
  Actividad,
  ActividadCreate,
  ActividadUpdate,
} from '../types/crm.types';

const BASE = '/crm';

// ─── Campañas ────────────────────────────────────────────────────────────────

export const campanaService = {
  list: async (params?: {
    empresa_id?: string;
    tipo_campana?: string;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    buscar?: string;
  }): Promise<Campana[]> => {
    const { data } = await api.get<Campana[]>(`${BASE}/campanas`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (campanaId: string): Promise<Campana> => {
    const { data } = await api.get<Campana>(`${BASE}/campanas/${campanaId}`);
    return data;
  },

  create: async (payload: CampanaCreate): Promise<Campana> => {
    const { data } = await api.post<Campana>(`${BASE}/campanas`, payload);
    return data;
  },

  update: async (campanaId: string, payload: CampanaUpdate): Promise<Campana> => {
    const { data } = await api.put<Campana>(`${BASE}/campanas/${campanaId}`, payload);
    return data;
  },
};

// ─── Leads ───────────────────────────────────────────────────────────────────

export const leadService = {
  list: async (params?: {
    empresa_id?: string;
    campana_id?: string;
    origen_lead?: string;
    calificacion?: string;
    estado?: string;
    asignado_vendedor_usuario_id?: string;
    buscar?: string;
  }): Promise<Lead[]> => {
    const { data } = await api.get<Lead[]>(`${BASE}/leads`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (leadId: string): Promise<Lead> => {
    const { data } = await api.get<Lead>(`${BASE}/leads/${leadId}`);
    return data;
  },

  create: async (payload: LeadCreate): Promise<Lead> => {
    const { data } = await api.post<Lead>(`${BASE}/leads`, payload);
    return data;
  },

  update: async (leadId: string, payload: LeadUpdate): Promise<Lead> => {
    const { data } = await api.put<Lead>(`${BASE}/leads/${leadId}`, payload);
    return data;
  },
};

// ─── Oportunidades ───────────────────────────────────────────────────────────

export const oportunidadService = {
  list: async (params?: {
    empresa_id?: string;
    cliente_venta_id?: string;
    lead_id?: string;
    campana_id?: string;
    vendedor_usuario_id?: string;
    etapa?: string;
    estado?: string;
    tipo_oportunidad?: string;
    fecha_cierre_desde?: string;
    fecha_cierre_hasta?: string;
    buscar?: string;
  }): Promise<Oportunidad[]> => {
    const { data } = await api.get<Oportunidad[]>(`${BASE}/oportunidades`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (oportunidadId: string): Promise<Oportunidad> => {
    const { data } = await api.get<Oportunidad>(`${BASE}/oportunidades/${oportunidadId}`);
    return data;
  },

  create: async (payload: OportunidadCreate): Promise<Oportunidad> => {
    const { data } = await api.post<Oportunidad>(`${BASE}/oportunidades`, payload);
    return data;
  },

  update: async (oportunidadId: string, payload: OportunidadUpdate): Promise<Oportunidad> => {
    const { data } = await api.put<Oportunidad>(`${BASE}/oportunidades/${oportunidadId}`, payload);
    return data;
  },
};

// ─── Actividades ─────────────────────────────────────────────────────────────

export const actividadService = {
  list: async (params?: {
    empresa_id?: string;
    lead_id?: string;
    oportunidad_id?: string;
    cliente_venta_id?: string;
    tipo_actividad?: string;
    usuario_responsable_id?: string;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    buscar?: string;
  }): Promise<Actividad[]> => {
    const { data } = await api.get<Actividad[]>(`${BASE}/actividades`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (actividadId: string): Promise<Actividad> => {
    const { data } = await api.get<Actividad>(`${BASE}/actividades/${actividadId}`);
    return data;
  },

  create: async (payload: ActividadCreate): Promise<Actividad> => {
    const { data } = await api.post<Actividad>(`${BASE}/actividades`, payload);
    return data;
  },

  update: async (actividadId: string, payload: ActividadUpdate): Promise<Actividad> => {
    const { data } = await api.put<Actividad>(`${BASE}/actividades/${actividadId}`, payload);
    return data;
  },
};
