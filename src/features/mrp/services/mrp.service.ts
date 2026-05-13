/**
 * Servicio del módulo MRP (Planeamiento de Materiales).
 * Base URL: /api/v1/mrp
 */
import api from '@/core/api/api';
import type {
  PlanMaestro,
  PlanMaestroCreate,
  PlanMaestroUpdate,
  NecesidadBruta,
  NecesidadBrutaCreate,
  NecesidadBrutaUpdate,
  ExplosionMateriales,
  ExplosionMaterialesCreate,
  ExplosionMaterialesUpdate,
  OrdenSugerida,
  OrdenSugeridaCreate,
  OrdenSugeridaUpdate,
} from '../types/mrp.types';

const BASE = '/mrp';

// ─── Plan Maestro ────────────────────────────────────────────────────────────

export const planMaestroService = {
  list: async (params?: {
    empresa_id?: string;
    estado?: string;
    buscar?: string;
  }): Promise<PlanMaestro[]> => {
    const { data } = await api.get<PlanMaestro[]>(`${BASE}/plan-maestro`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (planMaestroId: string): Promise<PlanMaestro> => {
    const { data } = await api.get<PlanMaestro>(`${BASE}/plan-maestro/${planMaestroId}`);
    return data;
  },

  create: async (payload: PlanMaestroCreate): Promise<PlanMaestro> => {
    const { data } = await api.post<PlanMaestro>(`${BASE}/plan-maestro`, payload);
    return data;
  },

  update: async (planMaestroId: string, payload: PlanMaestroUpdate): Promise<PlanMaestro> => {
    const { data } = await api.put<PlanMaestro>(`${BASE}/plan-maestro/${planMaestroId}`, payload);
    return data;
  },
};

// ─── Necesidades Brutas ──────────────────────────────────────────────────────

export const necesidadesBrutasService = {
  list: async (params?: {
    plan_maestro_id?: string;
    producto_id?: string;
    origen?: string;
  }): Promise<NecesidadBruta[]> => {
    const { data } = await api.get<NecesidadBruta[]>(`${BASE}/necesidades-brutas`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (necesidadId: string): Promise<NecesidadBruta> => {
    const { data } = await api.get<NecesidadBruta>(`${BASE}/necesidades-brutas/${necesidadId}`);
    return data;
  },

  create: async (payload: NecesidadBrutaCreate): Promise<NecesidadBruta> => {
    const { data } = await api.post<NecesidadBruta>(`${BASE}/necesidades-brutas`, payload);
    return data;
  },

  update: async (
    necesidadId: string,
    payload: NecesidadBrutaUpdate
  ): Promise<NecesidadBruta> => {
    const { data } = await api.put<NecesidadBruta>(
      `${BASE}/necesidades-brutas/${necesidadId}`,
      payload
    );
    return data;
  },
};

// ─── Explosión Materiales ─────────────────────────────────────────────────────

export const explosionMaterialesService = {
  list: async (params?: {
    plan_maestro_id?: string;
    producto_componente_id?: string;
    nivel_bom?: number;
  }): Promise<ExplosionMateriales[]> => {
    const { data } = await api.get<ExplosionMateriales[]>(
      `${BASE}/explosion-materiales`,
      { params }
    );
    return Array.isArray(data) ? data : [];
  },

  getById: async (explosionId: string): Promise<ExplosionMateriales> => {
    const { data } = await api.get<ExplosionMateriales>(
      `${BASE}/explosion-materiales/${explosionId}`
    );
    return data;
  },

  create: async (payload: ExplosionMaterialesCreate): Promise<ExplosionMateriales> => {
    const { data } = await api.post<ExplosionMateriales>(
      `${BASE}/explosion-materiales`,
      payload
    );
    return data;
  },

  update: async (
    explosionId: string,
    payload: ExplosionMaterialesUpdate
  ): Promise<ExplosionMateriales> => {
    const { data } = await api.put<ExplosionMateriales>(
      `${BASE}/explosion-materiales/${explosionId}`,
      payload
    );
    return data;
  },
};

// ─── Órdenes Sugeridas ────────────────────────────────────────────────────────

export const ordenesSugeridasService = {
  list: async (params?: {
    plan_maestro_id?: string;
    producto_id?: string;
    estado?: string;
    tipo_orden?: string;
  }): Promise<OrdenSugerida[]> => {
    const { data } = await api.get<OrdenSugerida[]>(`${BASE}/ordenes-sugeridas`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (ordenSugeridaId: string): Promise<OrdenSugerida> => {
    const { data } = await api.get<OrdenSugerida>(
      `${BASE}/ordenes-sugeridas/${ordenSugeridaId}`
    );
    return data;
  },

  create: async (payload: OrdenSugeridaCreate): Promise<OrdenSugerida> => {
    const { data } = await api.post<OrdenSugerida>(`${BASE}/ordenes-sugeridas`, payload);
    return data;
  },

  update: async (
    ordenSugeridaId: string,
    payload: OrdenSugeridaUpdate
  ): Promise<OrdenSugerida> => {
    const { data } = await api.put<OrdenSugerida>(
      `${BASE}/ordenes-sugeridas/${ordenSugeridaId}`,
      payload
    );
    return data;
  },
};
