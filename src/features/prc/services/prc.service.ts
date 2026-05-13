/**
 * Servicio del módulo PRC (Precios y Promociones)
 * Endpoints: /prc/
 */
import api from '@/core/api/api';
import type {
  ListaPrecio,
  ListaPrecioCreate,
  ListaPrecioListParams,
  ListaPrecioUpdate,
  ListaPrecioDetalle,
  ListaPrecioDetalleCreate,
  ListaPrecioDetalleUpdate,
  Promocion,
  PromocionCreate,
  PromocionListParams,
  PromocionUpdate,
} from '../types/prc.types';

const BASE = '/prc';

// ─── Listas de Precio ────────────────────────────────────────────────────────────────

export const listaPrecioService = {
  list: async (params?: ListaPrecioListParams): Promise<ListaPrecio[]> => {
    const { data } = await api.get<ListaPrecio[]>(`${BASE}/listas-precio`, { params });
    return data;
  },

  getById: async (listaPrecioId: string, empresaId?: string): Promise<ListaPrecio> => {
    const params = empresaId ? { empresa_id: empresaId } : undefined;
    const { data } = await api.get<ListaPrecio>(`${BASE}/listas-precio/${listaPrecioId}`, { params });
    return data;
  },

  create: async (payload: ListaPrecioCreate): Promise<ListaPrecio> => {
    const { data } = await api.post<ListaPrecio>(`${BASE}/listas-precio`, payload);
    return data;
  },

  update: async (
    listaPrecioId: string,
    payload: ListaPrecioUpdate,
    empresaId?: string
  ): Promise<ListaPrecio> => {
    const params = empresaId ? { empresa_id: empresaId } : undefined;
    const { data } = await api.put<ListaPrecio>(`${BASE}/listas-precio/${listaPrecioId}`, payload, {
      params,
    });
    return data;
  },

  delete: async (listaPrecioId: string, empresaId?: string): Promise<void> => {
    const params = empresaId ? { empresa_id: empresaId } : undefined;
    await api.delete(`${BASE}/listas-precio/${listaPrecioId}`, { params });
  },

  reactivar: async (listaPrecioId: string, empresaId?: string): Promise<ListaPrecio> => {
    const params = empresaId ? { empresa_id: empresaId } : undefined;
    const { data } = await api.post<ListaPrecio>(
      `${BASE}/listas-precio/${listaPrecioId}/reactivar`,
      undefined,
      { params }
    );
    return data;
  },
};

// ─── Detalles de Lista de Precio ────────────────────────────────────────────────────────────────

export const listaPrecioDetalleService = {
  list: async (
    listaPrecioId: string,
    params?: {
      producto_id?: string;
      solo_activos?: boolean;
    }
  ): Promise<ListaPrecioDetalle[]> => {
    const { data } = await api.get<ListaPrecioDetalle[]>(
      `${BASE}/listas-precio/${listaPrecioId}/detalles`,
      { params }
    );
    return data;
  },

  getById: async (detalleId: string): Promise<ListaPrecioDetalle> => {
    const { data } = await api.get<ListaPrecioDetalle>(`${BASE}/listas-precio/detalles/${detalleId}`);
    return data;
  },

  create: async (listaPrecioId: string, payload: ListaPrecioDetalleCreate): Promise<ListaPrecioDetalle> => {
    const { data } = await api.post<ListaPrecioDetalle>(
      `${BASE}/listas-precio/${listaPrecioId}/detalles`,
      payload
    );
    return data;
  },

  update: async (detalleId: string, payload: ListaPrecioDetalleUpdate): Promise<ListaPrecioDetalle> => {
    const { data } = await api.put<ListaPrecioDetalle>(
      `${BASE}/listas-precio/detalles/${detalleId}`,
      payload
    );
    return data;
  },
};

// ─── Promociones ────────────────────────────────────────────────────────────────

export const promocionService = {
  list: async (params?: PromocionListParams): Promise<Promocion[]> => {
    const { data } = await api.get<Promocion[]>(`${BASE}/promociones`, { params });
    return data;
  },

  getById: async (promocionId: string, empresaId?: string): Promise<Promocion> => {
    const params = empresaId ? { empresa_id: empresaId } : undefined;
    const { data } = await api.get<Promocion>(`${BASE}/promociones/${promocionId}`, { params });
    return data;
  },

  create: async (payload: PromocionCreate): Promise<Promocion> => {
    const { data } = await api.post<Promocion>(`${BASE}/promociones`, payload);
    return data;
  },

  update: async (
    promocionId: string,
    payload: PromocionUpdate,
    empresaId?: string
  ): Promise<Promocion> => {
    const params = empresaId ? { empresa_id: empresaId } : undefined;
    const { data } = await api.put<Promocion>(`${BASE}/promociones/${promocionId}`, payload, {
      params,
    });
    return data;
  },

  delete: async (promocionId: string, empresaId?: string): Promise<void> => {
    const params = empresaId ? { empresa_id: empresaId } : undefined;
    await api.delete(`${BASE}/promociones/${promocionId}`, { params });
  },

  reactivar: async (promocionId: string, empresaId?: string): Promise<Promocion> => {
    const params = empresaId ? { empresa_id: empresaId } : undefined;
    const { data } = await api.post<Promocion>(
      `${BASE}/promociones/${promocionId}/reactivar`,
      undefined,
      { params }
    );
    return data;
  },
};
