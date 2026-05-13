/**
 * Servicio del módulo WMS (Warehouse Management System)
 * Endpoints: /wms/
 */
import api from '@/core/api/api';
import type {
  ZonaAlmacen,
  ZonaAlmacenCreate,
  ZonaAlmacenUpdate,
  Ubicacion,
  UbicacionCreate,
  UbicacionUpdate,
  StockUbicacion,
  StockUbicacionCreate,
  StockUbicacionUpdate,
  Tarea,
  TareaCreate,
  TareaUpdate,
} from '../types/wms.types';

const BASE = '/wms';

// ─── Zonas de Almacén ────────────────────────────────────────────────────────────────

export const zonaAlmacenService = {
  list: async (params?: {
    almacen_id?: string;
    tipo_zona?: string;
    solo_activos?: boolean;
    buscar?: string;
  }): Promise<ZonaAlmacen[]> => {
    const { data } = await api.get<ZonaAlmacen[]>(`${BASE}/zonas`, { params });
    return data;
  },

  getById: async (zonaId: string): Promise<ZonaAlmacen> => {
    const { data } = await api.get<ZonaAlmacen>(`${BASE}/zonas/${zonaId}`);
    return data;
  },

  create: async (payload: ZonaAlmacenCreate): Promise<ZonaAlmacen> => {
    const { data } = await api.post<ZonaAlmacen>(`${BASE}/zonas`, payload);
    return data;
  },

  update: async (zonaId: string, payload: ZonaAlmacenUpdate): Promise<ZonaAlmacen> => {
    const { data } = await api.put<ZonaAlmacen>(`${BASE}/zonas/${zonaId}`, payload);
    return data;
  },
};

// ─── Ubicaciones ────────────────────────────────────────────────────────────────

export const ubicacionService = {
  list: async (params?: {
    almacen_id?: string;
    zona_id?: string;
    tipo_ubicacion?: string;
    estado_ubicacion?: string;
    es_ubicacion_picking?: boolean;
    solo_activos?: boolean;
    buscar?: string;
  }): Promise<Ubicacion[]> => {
    const { data } = await api.get<Ubicacion[]>(`${BASE}/ubicaciones`, { params });
    return data;
  },

  getById: async (ubicacionId: string): Promise<Ubicacion> => {
    const { data } = await api.get<Ubicacion>(`${BASE}/ubicaciones/${ubicacionId}`);
    return data;
  },

  create: async (payload: UbicacionCreate): Promise<Ubicacion> => {
    const { data } = await api.post<Ubicacion>(`${BASE}/ubicaciones`, payload);
    return data;
  },

  update: async (ubicacionId: string, payload: UbicacionUpdate): Promise<Ubicacion> => {
    const { data } = await api.put<Ubicacion>(`${BASE}/ubicaciones/${ubicacionId}`, payload);
    return data;
  },
};

// ─── Stock por Ubicación ────────────────────────────────────────────────────────────────

export const stockUbicacionService = {
  list: async (params?: {
    almacen_id?: string;
    ubicacion_id?: string;
    producto_id?: string;
    estado_stock?: string;
    lote?: string;
  }): Promise<StockUbicacion[]> => {
    const { data } = await api.get<StockUbicacion[]>(`${BASE}/stock-ubicacion`, { params });
    return data;
  },

  getById: async (stockUbicacionId: string): Promise<StockUbicacion> => {
    const { data } = await api.get<StockUbicacion>(`${BASE}/stock-ubicacion/${stockUbicacionId}`);
    return data;
  },

  create: async (payload: StockUbicacionCreate): Promise<StockUbicacion> => {
    const { data } = await api.post<StockUbicacion>(`${BASE}/stock-ubicacion`, payload);
    return data;
  },

  update: async (stockUbicacionId: string, payload: StockUbicacionUpdate): Promise<StockUbicacion> => {
    const { data } = await api.put<StockUbicacion>(`${BASE}/stock-ubicacion/${stockUbicacionId}`, payload);
    return data;
  },
};

// ─── Tareas ────────────────────────────────────────────────────────────────

export const tareaService = {
  list: async (params?: {
    almacen_id?: string;
    tipo_tarea?: string;
    estado?: string;
    asignado_usuario_id?: string;
    producto_id?: string;
    buscar?: string;
  }): Promise<Tarea[]> => {
    const { data } = await api.get<Tarea[]>(`${BASE}/tareas`, { params });
    return data;
  },

  getById: async (tareaId: string): Promise<Tarea> => {
    const { data } = await api.get<Tarea>(`${BASE}/tareas/${tareaId}`);
    return data;
  },

  create: async (payload: TareaCreate): Promise<Tarea> => {
    const { data } = await api.post<Tarea>(`${BASE}/tareas`, payload);
    return data;
  },

  update: async (tareaId: string, payload: TareaUpdate): Promise<Tarea> => {
    const { data } = await api.put<Tarea>(`${BASE}/tareas/${tareaId}`, payload);
    return data;
  },
};
