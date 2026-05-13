/**
 * Servicio del módulo MFG (Manufactura y Producción).
 * Base URL: /api/v1/mfg
 */
import api from '@/core/api/api';
import type {
  CentroTrabajo,
  CentroTrabajoCreate,
  CentroTrabajoUpdate,
  Operacion,
  OperacionCreate,
  OperacionUpdate,
  ListaMateriales,
  ListaMaterialesCreate,
  ListaMaterialesUpdate,
  ListaMaterialesDetalle,
  ListaMaterialesDetalleCreate,
  ListaMaterialesDetalleUpdate,
  RutaFabricacion,
  RutaFabricacionCreate,
  RutaFabricacionUpdate,
  RutaFabricacionDetalle,
  RutaFabricacionDetalleCreate,
  RutaFabricacionDetalleUpdate,
  OrdenProduccion,
  OrdenProduccionCreate,
  OrdenProduccionUpdate,
  OrdenProduccionOperacion,
  OrdenProduccionOperacionCreate,
  OrdenProduccionOperacionUpdate,
  ConsumoMateriales,
  ConsumoMaterialesCreate,
  ConsumoMaterialesUpdate,
} from '../types/mfg.types';

const BASE = '/mfg';

// ─── Centros de Trabajo ────────────────────────────────────────────────────

export const centroTrabajoService = {
  list: async (params?: {
    empresa_id?: string;
    estado_centro?: string;
    es_activo?: boolean;
    buscar?: string;
  }): Promise<CentroTrabajo[]> => {
    const { data } = await api.get<CentroTrabajo[]>(`${BASE}/centros-trabajo`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (centroTrabajoId: string): Promise<CentroTrabajo> => {
    const { data } = await api.get<CentroTrabajo>(`${BASE}/centros-trabajo/${centroTrabajoId}`);
    return data;
  },

  create: async (payload: CentroTrabajoCreate): Promise<CentroTrabajo> => {
    const { data } = await api.post<CentroTrabajo>(`${BASE}/centros-trabajo`, payload);
    return data;
  },

  update: async (centroTrabajoId: string, payload: CentroTrabajoUpdate): Promise<CentroTrabajo> => {
    const { data } = await api.put<CentroTrabajo>(`${BASE}/centros-trabajo/${centroTrabajoId}`, payload);
    return data;
  },
};

// ─── Operaciones ───────────────────────────────────────────────────────────

export const operacionService = {
  list: async (params?: {
    empresa_id?: string;
    centro_trabajo_id?: string;
    es_activo?: boolean;
    buscar?: string;
  }): Promise<Operacion[]> => {
    const { data } = await api.get<Operacion[]>(`${BASE}/operaciones`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (operacionId: string): Promise<Operacion> => {
    const { data } = await api.get<Operacion>(`${BASE}/operaciones/${operacionId}`);
    return data;
  },

  create: async (payload: OperacionCreate): Promise<Operacion> => {
    const { data } = await api.post<Operacion>(`${BASE}/operaciones`, payload);
    return data;
  },

  update: async (operacionId: string, payload: OperacionUpdate): Promise<Operacion> => {
    const { data } = await api.put<Operacion>(`${BASE}/operaciones/${operacionId}`, payload);
    return data;
  },
};

// ─── Listas de Materiales (BOM) ─────────────────────────────────────────────

export const listaMaterialesService = {
  list: async (params?: {
    empresa_id?: string;
    producto_id?: string;
    es_bom_activa?: boolean;
    estado?: string;
    buscar?: string;
  }): Promise<ListaMateriales[]> => {
    const { data } = await api.get<ListaMateriales[]>(`${BASE}/listas-materiales`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (bomId: string): Promise<ListaMateriales> => {
    const { data } = await api.get<ListaMateriales>(`${BASE}/listas-materiales/${bomId}`);
    return data;
  },

  create: async (payload: ListaMaterialesCreate): Promise<ListaMateriales> => {
    const { data } = await api.post<ListaMateriales>(`${BASE}/listas-materiales`, payload);
    return data;
  },

  update: async (bomId: string, payload: ListaMaterialesUpdate): Promise<ListaMateriales> => {
    const { data } = await api.put<ListaMateriales>(`${BASE}/listas-materiales/${bomId}`, payload);
    return data;
  },
};

// ─── Lista Materiales Detalle ──────────────────────────────────────────────

export const listaMaterialesDetalleService = {
  list: async (params?: { bom_id?: string }): Promise<ListaMaterialesDetalle[]> => {
    const { data } = await api.get<ListaMaterialesDetalle[]>(`${BASE}/lista-materiales-detalle`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (bomDetalleId: string): Promise<ListaMaterialesDetalle> => {
    const { data } = await api.get<ListaMaterialesDetalle>(`${BASE}/lista-materiales-detalle/${bomDetalleId}`);
    return data;
  },

  create: async (payload: ListaMaterialesDetalleCreate): Promise<ListaMaterialesDetalle> => {
    const { data } = await api.post<ListaMaterialesDetalle>(`${BASE}/lista-materiales-detalle`, payload);
    return data;
  },

  update: async (
    bomDetalleId: string,
    payload: ListaMaterialesDetalleUpdate
  ): Promise<ListaMaterialesDetalle> => {
    const { data } = await api.put<ListaMaterialesDetalle>(
      `${BASE}/lista-materiales-detalle/${bomDetalleId}`,
      payload
    );
    return data;
  },
};

// ─── Rutas de Fabricación ──────────────────────────────────────────────────

export const rutaFabricacionService = {
  list: async (params?: {
    empresa_id?: string;
    producto_id?: string;
    es_ruta_activa?: boolean;
    estado?: string;
    buscar?: string;
  }): Promise<RutaFabricacion[]> => {
    const { data } = await api.get<RutaFabricacion[]>(`${BASE}/rutas-fabricacion`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (rutaId: string): Promise<RutaFabricacion> => {
    const { data } = await api.get<RutaFabricacion>(`${BASE}/rutas-fabricacion/${rutaId}`);
    return data;
  },

  create: async (payload: RutaFabricacionCreate): Promise<RutaFabricacion> => {
    const { data } = await api.post<RutaFabricacion>(`${BASE}/rutas-fabricacion`, payload);
    return data;
  },

  update: async (rutaId: string, payload: RutaFabricacionUpdate): Promise<RutaFabricacion> => {
    const { data } = await api.put<RutaFabricacion>(`${BASE}/rutas-fabricacion/${rutaId}`, payload);
    return data;
  },
};

// ─── Ruta Fabricación Detalle ──────────────────────────────────────────────

export const rutaFabricacionDetalleService = {
  list: async (params?: { ruta_id?: string }): Promise<RutaFabricacionDetalle[]> => {
    const { data } = await api.get<RutaFabricacionDetalle[]>(`${BASE}/ruta-fabricacion-detalle`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (rutaDetalleId: string): Promise<RutaFabricacionDetalle> => {
    const { data } = await api.get<RutaFabricacionDetalle>(
      `${BASE}/ruta-fabricacion-detalle/${rutaDetalleId}`
    );
    return data;
  },

  create: async (payload: RutaFabricacionDetalleCreate): Promise<RutaFabricacionDetalle> => {
    const { data } = await api.post<RutaFabricacionDetalle>(
      `${BASE}/ruta-fabricacion-detalle`,
      payload
    );
    return data;
  },

  update: async (
    rutaDetalleId: string,
    payload: RutaFabricacionDetalleUpdate
  ): Promise<RutaFabricacionDetalle> => {
    const { data } = await api.put<RutaFabricacionDetalle>(
      `${BASE}/ruta-fabricacion-detalle/${rutaDetalleId}`,
      payload
    );
    return data;
  },
};

// ─── Órdenes de Producción ─────────────────────────────────────────────────

export const ordenProduccionService = {
  list: async (params?: {
    empresa_id?: string;
    producto_id?: string;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<OrdenProduccion[]> => {
    const { data } = await api.get<OrdenProduccion[]>(`${BASE}/ordenes-produccion`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (ordenProduccionId: string): Promise<OrdenProduccion> => {
    const { data } = await api.get<OrdenProduccion>(
      `${BASE}/ordenes-produccion/${ordenProduccionId}`
    );
    return data;
  },

  create: async (payload: OrdenProduccionCreate): Promise<OrdenProduccion> => {
    const { data } = await api.post<OrdenProduccion>(`${BASE}/ordenes-produccion`, payload);
    return data;
  },

  update: async (
    ordenProduccionId: string,
    payload: OrdenProduccionUpdate
  ): Promise<OrdenProduccion> => {
    const { data } = await api.put<OrdenProduccion>(
      `${BASE}/ordenes-produccion/${ordenProduccionId}`,
      payload
    );
    return data;
  },
};

// ─── Orden Producción Operaciones ──────────────────────────────────────────

export const ordenProduccionOperacionService = {
  list: async (params?: {
    orden_produccion_id?: string;
    centro_trabajo_id?: string;
    estado?: string;
  }): Promise<OrdenProduccionOperacion[]> => {
    const { data } = await api.get<OrdenProduccionOperacion[]>(
      `${BASE}/orden-produccion-operaciones`,
      { params }
    );
    return Array.isArray(data) ? data : [];
  },

  getById: async (opOperacionId: string): Promise<OrdenProduccionOperacion> => {
    const { data } = await api.get<OrdenProduccionOperacion>(
      `${BASE}/orden-produccion-operaciones/${opOperacionId}`
    );
    return data;
  },

  create: async (
    payload: OrdenProduccionOperacionCreate
  ): Promise<OrdenProduccionOperacion> => {
    const { data } = await api.post<OrdenProduccionOperacion>(
      `${BASE}/orden-produccion-operaciones`,
      payload
    );
    return data;
  },

  update: async (
    opOperacionId: string,
    payload: OrdenProduccionOperacionUpdate
  ): Promise<OrdenProduccionOperacion> => {
    const { data } = await api.put<OrdenProduccionOperacion>(
      `${BASE}/orden-produccion-operaciones/${opOperacionId}`,
      payload
    );
    return data;
  },
};

// ─── Consumo Materiales ────────────────────────────────────────────────────

export const consumoMaterialesService = {
  list: async (params?: {
    orden_produccion_id?: string;
    producto_id?: string;
  }): Promise<ConsumoMateriales[]> => {
    const { data } = await api.get<ConsumoMateriales[]>(`${BASE}/consumo-materiales`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (consumoId: string): Promise<ConsumoMateriales> => {
    const { data } = await api.get<ConsumoMateriales>(`${BASE}/consumo-materiales/${consumoId}`);
    return data;
  },

  create: async (payload: ConsumoMaterialesCreate): Promise<ConsumoMateriales> => {
    const { data } = await api.post<ConsumoMateriales>(`${BASE}/consumo-materiales`, payload);
    return data;
  },

  update: async (
    consumoId: string,
    payload: ConsumoMaterialesUpdate
  ): Promise<ConsumoMateriales> => {
    const { data } = await api.put<ConsumoMateriales>(
      `${BASE}/consumo-materiales/${consumoId}`,
      payload
    );
    return data;
  },
};
