/**
 * Servicio del módulo POS (Punto de Venta)
 * Endpoints: /api/v1/pos/
 */
import api from '@/core/api/api';
import type {
  PuntoVenta,
  PuntoVentaCreate,
  PuntoVentaUpdate,
  TurnoCaja,
  TurnoCajaCreate,
  TurnoCajaUpdate,
  Venta,
  VentaCreate,
  VentaUpdate,
  VentaDetalle,
  VentaDetalleCreate,
  VentaDetalleUpdate,
} from '../types/pos.types';

const BASE = '/pos';

// ─── Puntos de Venta ───────────────────────────────────────────────────────

export const puntoVentaService = {
  list: async (params?: {
    empresa_id?: string;
    sucursal_id?: string;
    estado?: string;
    es_activo?: boolean;
    buscar?: string;
  }): Promise<PuntoVenta[]> => {
    const { data } = await api.get<PuntoVenta[]>(`${BASE}/puntos-venta`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (puntoVentaId: string): Promise<PuntoVenta> => {
    const { data } = await api.get<PuntoVenta>(`${BASE}/puntos-venta/${puntoVentaId}`);
    return data;
  },

  create: async (payload: PuntoVentaCreate): Promise<PuntoVenta> => {
    const { data } = await api.post<PuntoVenta>(`${BASE}/puntos-venta`, payload);
    return data;
  },

  update: async (puntoVentaId: string, payload: PuntoVentaUpdate): Promise<PuntoVenta> => {
    const { data } = await api.put<PuntoVenta>(`${BASE}/puntos-venta/${puntoVentaId}`, payload);
    return data;
  },
};

// ─── Turnos de Caja ────────────────────────────────────────────────────────

export const turnoCajaService = {
  list: async (params?: {
    punto_venta_id?: string;
    estado?: string;
    cajero_usuario_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<TurnoCaja[]> => {
    const { data } = await api.get<TurnoCaja[]>(`${BASE}/turnos-caja`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (turnoId: string): Promise<TurnoCaja> => {
    const { data } = await api.get<TurnoCaja>(`${BASE}/turnos-caja/${turnoId}`);
    return data;
  },

  create: async (payload: TurnoCajaCreate): Promise<TurnoCaja> => {
    const { data } = await api.post<TurnoCaja>(`${BASE}/turnos-caja`, payload);
    return data;
  },

  update: async (turnoId: string, payload: TurnoCajaUpdate): Promise<TurnoCaja> => {
    const { data } = await api.put<TurnoCaja>(`${BASE}/turnos-caja/${turnoId}`, payload);
    return data;
  },
};

// ─── Ventas POS ────────────────────────────────────────────────────────────

export const ventaService = {
  list: async (params?: {
    punto_venta_id?: string;
    turno_caja_id?: string;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<Venta[]> => {
    const { data } = await api.get<Venta[]>(`${BASE}/ventas`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (ventaId: string): Promise<Venta> => {
    const { data } = await api.get<Venta>(`${BASE}/ventas/${ventaId}`);
    return data;
  },

  create: async (payload: VentaCreate): Promise<Venta> => {
    const { data } = await api.post<Venta>(`${BASE}/ventas`, payload);
    return data;
  },

  update: async (ventaId: string, payload: VentaUpdate): Promise<Venta> => {
    const { data } = await api.put<Venta>(`${BASE}/ventas/${ventaId}`, payload);
    return data;
  },
};

// ─── Ventas Detalle ────────────────────────────────────────────────────────

export const ventaDetalleService = {
  list: async (ventaId?: string): Promise<VentaDetalle[]> => {
    const params = ventaId ? { venta_id: ventaId } : undefined;
    const { data } = await api.get<VentaDetalle[]>(`${BASE}/ventas-detalle`, { params });
    return Array.isArray(data) ? data : [];
  },

  create: async (payload: VentaDetalleCreate): Promise<VentaDetalle> => {
    const { data } = await api.post<VentaDetalle>(`${BASE}/ventas-detalle`, payload);
    return data;
  },

  update: async (ventaDetalleId: string, payload: VentaDetalleUpdate): Promise<VentaDetalle> => {
    const { data } = await api.put<VentaDetalle>(`${BASE}/ventas-detalle/${ventaDetalleId}`, payload);
    return data;
  },
};
