/**
 * Servicio del módulo LOG (Logística y Distribución)
 * Endpoints: /log/
 */
import api from '@/core/api/api';
import type {
  Transportista,
  TransportistaCreate,
  TransportistaUpdate,
  Vehiculo,
  VehiculoCreate,
  VehiculoUpdate,
  Ruta,
  RutaCreate,
  RutaUpdate,
  GuiaRemision,
  GuiaRemisionCreate,
  GuiaRemisionUpdate,
  GuiaRemisionDetalle,
  GuiaRemisionDetalleCreate,
  GuiaRemisionDetalleUpdate,
  Despacho,
  DespachoCreate,
  DespachoUpdate,
  DespachoGuia,
  DespachoGuiaCreate,
  DespachoGuiaUpdate,
} from '../types/log.types';

const BASE = '/log';

// ─── Transportistas ────────────────────────────────────────────────────────────────

export const transportistaService = {
  list: async (params?: {
    empresa_id?: string;
    solo_activos?: boolean;
    buscar?: string;
  }): Promise<Transportista[]> => {
    const { data } = await api.get<Transportista[]>(`${BASE}/transportistas`, { params });
    return data;
  },

  getById: async (transportistaId: string): Promise<Transportista> => {
    const { data } = await api.get<Transportista>(`${BASE}/transportistas/${transportistaId}`);
    return data;
  },

  create: async (payload: TransportistaCreate): Promise<Transportista> => {
    const { data } = await api.post<Transportista>(`${BASE}/transportistas`, payload);
    return data;
  },

  update: async (transportistaId: string, payload: TransportistaUpdate): Promise<Transportista> => {
    const { data } = await api.put<Transportista>(`${BASE}/transportistas/${transportistaId}`, payload);
    return data;
  },
};

// ─── Vehículos ────────────────────────────────────────────────────────────────

export const vehiculoService = {
  list: async (params?: {
    empresa_id?: string;
    transportista_id?: string;
    tipo_propiedad?: string;
    estado_vehiculo?: string;
    solo_activos?: boolean;
    buscar?: string;
  }): Promise<Vehiculo[]> => {
    const { data } = await api.get<Vehiculo[]>(`${BASE}/vehiculos`, { params });
    return data;
  },

  getById: async (vehiculoId: string): Promise<Vehiculo> => {
    const { data } = await api.get<Vehiculo>(`${BASE}/vehiculos/${vehiculoId}`);
    return data;
  },

  create: async (payload: VehiculoCreate): Promise<Vehiculo> => {
    const { data } = await api.post<Vehiculo>(`${BASE}/vehiculos`, payload);
    return data;
  },

  update: async (vehiculoId: string, payload: VehiculoUpdate): Promise<Vehiculo> => {
    const { data } = await api.put<Vehiculo>(`${BASE}/vehiculos/${vehiculoId}`, payload);
    return data;
  },
};

// ─── Rutas ────────────────────────────────────────────────────────────────

export const rutaService = {
  list: async (params?: {
    empresa_id?: string;
    origen_sucursal_id?: string;
    solo_activos?: boolean;
    buscar?: string;
  }): Promise<Ruta[]> => {
    const { data } = await api.get<Ruta[]>(`${BASE}/rutas`, { params });
    return data;
  },

  getById: async (rutaId: string): Promise<Ruta> => {
    const { data } = await api.get<Ruta>(`${BASE}/rutas/${rutaId}`);
    return data;
  },

  create: async (payload: RutaCreate): Promise<Ruta> => {
    const { data } = await api.post<Ruta>(`${BASE}/rutas`, payload);
    return data;
  },

  update: async (rutaId: string, payload: RutaUpdate): Promise<Ruta> => {
    const { data } = await api.put<Ruta>(`${BASE}/rutas/${rutaId}`, payload);
    return data;
  },
};

// ─── Guías de Remisión ────────────────────────────────────────────────────────────────

export const guiaRemisionService = {
  list: async (params?: {
    empresa_id?: string;
    estado?: string;
    motivo_traslado?: string;
    transportista_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    buscar?: string;
  }): Promise<GuiaRemision[]> => {
    const { data } = await api.get<GuiaRemision[]>(`${BASE}/guias-remision`, { params });
    return data;
  },

  getById: async (guiaRemisionId: string): Promise<GuiaRemision> => {
    const { data } = await api.get<GuiaRemision>(`${BASE}/guias-remision/${guiaRemisionId}`);
    return data;
  },

  create: async (payload: GuiaRemisionCreate): Promise<GuiaRemision> => {
    const { data } = await api.post<GuiaRemision>(`${BASE}/guias-remision`, payload);
    return data;
  },

  update: async (guiaRemisionId: string, payload: GuiaRemisionUpdate): Promise<GuiaRemision> => {
    const { data } = await api.put<GuiaRemision>(`${BASE}/guias-remision/${guiaRemisionId}`, payload);
    return data;
  },
};

// ─── Detalles de Guía de Remisión ────────────────────────────────────────────────────────────────

export const guiaRemisionDetalleService = {
  list: async (guiaRemisionId: string): Promise<GuiaRemisionDetalle[]> => {
    const { data } = await api.get<GuiaRemisionDetalle[]>(
      `${BASE}/guias-remision/${guiaRemisionId}/detalles`
    );
    return data;
  },

  create: async (
    guiaRemisionId: string,
    payload: GuiaRemisionDetalleCreate
  ): Promise<GuiaRemisionDetalle> => {
    const { data } = await api.post<GuiaRemisionDetalle>(
      `${BASE}/guias-remision/${guiaRemisionId}/detalles`,
      payload
    );
    return data;
  },

  update: async (
    guiaRemisionId: string,
    detalleId: string,
    payload: GuiaRemisionDetalleUpdate
  ): Promise<GuiaRemisionDetalle> => {
    const { data } = await api.put<GuiaRemisionDetalle>(
      `${BASE}/guias-remision/${guiaRemisionId}/detalles/${detalleId}`,
      payload
    );
    return data;
  },

  delete: async (guiaRemisionId: string, detalleId: string): Promise<void> => {
    await api.delete(`${BASE}/guias-remision/${guiaRemisionId}/detalles/${detalleId}`);
  },
};

// ─── Despachos ────────────────────────────────────────────────────────────────

export const despachoService = {
  list: async (params?: {
    empresa_id?: string;
    estado?: string;
    ruta_id?: string;
    vehiculo_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    buscar?: string;
  }): Promise<Despacho[]> => {
    const { data } = await api.get<Despacho[]>(`${BASE}/despachos`, { params });
    return data;
  },

  getById: async (despachoId: string): Promise<Despacho> => {
    const { data } = await api.get<Despacho>(`${BASE}/despachos/${despachoId}`);
    return data;
  },

  create: async (payload: DespachoCreate): Promise<Despacho> => {
    const { data } = await api.post<Despacho>(`${BASE}/despachos`, payload);
    return data;
  },

  update: async (despachoId: string, payload: DespachoUpdate): Promise<Despacho> => {
    const { data } = await api.put<Despacho>(`${BASE}/despachos/${despachoId}`, payload);
    return data;
  },
};

// ─── Guías de Despacho ────────────────────────────────────────────────────────────────

export const despachoGuiaService = {
  list: async (despachoId: string): Promise<DespachoGuia[]> => {
    const { data } = await api.get<DespachoGuia[]>(`${BASE}/despachos/${despachoId}/guias`);
    return data;
  },

  create: async (despachoId: string, payload: DespachoGuiaCreate): Promise<DespachoGuia> => {
    const { data } = await api.post<DespachoGuia>(`${BASE}/despachos/${despachoId}/guias`, payload);
    return data;
  },

  update: async (
    despachoId: string,
    guiaId: string,
    payload: DespachoGuiaUpdate
  ): Promise<DespachoGuia> => {
    const { data } = await api.put<DespachoGuia>(
      `${BASE}/despachos/${despachoId}/guias/${guiaId}`,
      payload
    );
    return data;
  },

  delete: async (despachoId: string, guiaId: string): Promise<void> => {
    await api.delete(`${BASE}/despachos/${despachoId}/guias/${guiaId}`);
  },
};
