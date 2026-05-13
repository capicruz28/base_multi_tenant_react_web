/**
 * Servicio del módulo CST (Costeo de Productos).
 * Base URL: /api/v1/cst
 */
import api from '@/core/api/api';
import type {
  CentroCostoTipo,
  CentroCostoTipoCreate,
  CentroCostoTipoUpdate,
  ProductoCosto,
  ProductoCostoCreate,
  ProductoCostoUpdate,
} from '../types/cst.types';

const BASE = '/cst';

// ─── Tipos de Centro de Costo ───────────────────────────────────────────────

export const tiposCentroCostoService = {
  list: async (params?: {
    empresa_id?: string;
    tipo_clasificacion?: string;
    es_activo?: boolean;
    buscar?: string;
  }): Promise<CentroCostoTipo[]> => {
    const { data } = await api.get<CentroCostoTipo[]>(
      `${BASE}/tipos-centro-costo`,
      { params }
    );
    return Array.isArray(data) ? data : [];
  },

  getById: async (ccTipoId: string): Promise<CentroCostoTipo> => {
    const { data } = await api.get<CentroCostoTipo>(
      `${BASE}/tipos-centro-costo/${ccTipoId}`
    );
    return data;
  },

  create: async (payload: CentroCostoTipoCreate): Promise<CentroCostoTipo> => {
    const { data } = await api.post<CentroCostoTipo>(
      `${BASE}/tipos-centro-costo`,
      payload
    );
    return data;
  },

  update: async (
    ccTipoId: string,
    payload: CentroCostoTipoUpdate
  ): Promise<CentroCostoTipo> => {
    const { data } = await api.put<CentroCostoTipo>(
      `${BASE}/tipos-centro-costo/${ccTipoId}`,
      payload
    );
    return data;
  },
};

// ─── Producto Costo ───────────────────────────────────────────────────────

export const productoCostoService = {
  list: async (params?: {
    empresa_id?: string;
    producto_id?: string;
    anio?: number;
    mes?: number;
    metodo_costeo?: string;
  }): Promise<ProductoCosto[]> => {
    const { data } = await api.get<ProductoCosto[]>(
      `${BASE}/producto-costo`,
      { params }
    );
    return Array.isArray(data) ? data : [];
  },

  getById: async (productoCostoId: string): Promise<ProductoCosto> => {
    const { data } = await api.get<ProductoCosto>(
      `${BASE}/producto-costo/${productoCostoId}`
    );
    return data;
  },

  create: async (payload: ProductoCostoCreate): Promise<ProductoCosto> => {
    const { data } = await api.post<ProductoCosto>(
      `${BASE}/producto-costo`,
      payload
    );
    return data;
  },

  update: async (
    productoCostoId: string,
    payload: ProductoCostoUpdate
  ): Promise<ProductoCosto> => {
    const { data } = await api.put<ProductoCosto>(
      `${BASE}/producto-costo/${productoCostoId}`,
      payload
    );
    return data;
  },
};
