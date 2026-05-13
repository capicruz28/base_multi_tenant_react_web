/**
 * Servicio del módulo MPS (Plan Maestro de Producción).
 * Base URL: /api/v1/mps
 */
import api from '@/core/api/api';
import type {
  PronosticoDemanda,
  PronosticoDemandaCreate,
  PronosticoDemandaUpdate,
  PlanProduccion,
  PlanProduccionCreate,
  PlanProduccionUpdate,
  PlanProduccionDetalle,
  PlanProduccionDetalleCreate,
  PlanProduccionDetalleUpdate,
} from '../types/mps.types';

const BASE = '/mps';

// ─── Pronóstico de Demanda ───────────────────────────────────────────────────

export const pronosticoDemandaService = {
  list: async (params?: {
    empresa_id?: string;
    producto_id?: string;
    anio?: number;
    mes?: number;
  }): Promise<PronosticoDemanda[]> => {
    const { data } = await api.get<PronosticoDemanda[]>(
      `${BASE}/pronostico-demanda`,
      { params }
    );
    return Array.isArray(data) ? data : [];
  },

  getById: async (pronosticoId: string): Promise<PronosticoDemanda> => {
    const { data } = await api.get<PronosticoDemanda>(
      `${BASE}/pronostico-demanda/${pronosticoId}`
    );
    return data;
  },

  create: async (payload: PronosticoDemandaCreate): Promise<PronosticoDemanda> => {
    const { data } = await api.post<PronosticoDemanda>(
      `${BASE}/pronostico-demanda`,
      payload
    );
    return data;
  },

  update: async (
    pronosticoId: string,
    payload: PronosticoDemandaUpdate
  ): Promise<PronosticoDemanda> => {
    const { data } = await api.put<PronosticoDemanda>(
      `${BASE}/pronostico-demanda/${pronosticoId}`,
      payload
    );
    return data;
  },
};

// ─── Plan de Producción ─────────────────────────────────────────────────────

export const planProduccionService = {
  list: async (params?: {
    empresa_id?: string;
    estado?: string;
    buscar?: string;
  }): Promise<PlanProduccion[]> => {
    const { data } = await api.get<PlanProduccion[]>(
      `${BASE}/plan-produccion`,
      { params }
    );
    return Array.isArray(data) ? data : [];
  },

  getById: async (planProduccionId: string): Promise<PlanProduccion> => {
    const { data } = await api.get<PlanProduccion>(
      `${BASE}/plan-produccion/${planProduccionId}`
    );
    return data;
  },

  create: async (payload: PlanProduccionCreate): Promise<PlanProduccion> => {
    const { data } = await api.post<PlanProduccion>(
      `${BASE}/plan-produccion`,
      payload
    );
    return data;
  },

  update: async (
    planProduccionId: string,
    payload: PlanProduccionUpdate
  ): Promise<PlanProduccion> => {
    const { data } = await api.put<PlanProduccion>(
      `${BASE}/plan-produccion/${planProduccionId}`,
      payload
    );
    return data;
  },
};

// ─── Plan de Producción Detalle ──────────────────────────────────────────────

export const planProduccionDetalleService = {
  list: async (params?: {
    plan_produccion_id?: string;
    producto_id?: string;
  }): Promise<PlanProduccionDetalle[]> => {
    const { data } = await api.get<PlanProduccionDetalle[]>(
      `${BASE}/plan-produccion-detalle`,
      { params }
    );
    return Array.isArray(data) ? data : [];
  },

  getById: async (planDetalleId: string): Promise<PlanProduccionDetalle> => {
    const { data } = await api.get<PlanProduccionDetalle>(
      `${BASE}/plan-produccion-detalle/${planDetalleId}`
    );
    return data;
  },

  create: async (
    payload: PlanProduccionDetalleCreate
  ): Promise<PlanProduccionDetalle> => {
    const { data } = await api.post<PlanProduccionDetalle>(
      `${BASE}/plan-produccion-detalle`,
      payload
    );
    return data;
  },

  update: async (
    planDetalleId: string,
    payload: PlanProduccionDetalleUpdate
  ): Promise<PlanProduccionDetalle> => {
    const { data } = await api.put<PlanProduccionDetalle>(
      `${BASE}/plan-produccion-detalle/${planDetalleId}`,
      payload
    );
    return data;
  },
};
