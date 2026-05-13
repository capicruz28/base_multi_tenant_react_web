/**
 * Servicio del módulo INV_BILL (Facturación Electrónica)
 * Base URL: /api/v1/inv-bill/
 * Autenticación: Bearer token (header enviado por la instancia axios).
 */
import api from '@/core/api/api';
import type {
  SerieComprobante,
  SerieComprobanteCreate,
  SerieComprobanteUpdate,
  Comprobante,
  ComprobanteCreate,
  ComprobanteUpdate,
  ComprobanteDetalle,
  ComprobanteDetalleCreate,
  ComprobanteDetalleUpdate,
  InvBillListParams,
} from '../types/inv-bill.types';

const BASE = '/inv-bill';

// ─── Series de Comprobantes ────────────────────────────────────────────────

export const serieComprobanteService = {
  list: async (params?: InvBillListParams): Promise<SerieComprobante[]> => {
    const q: Record<string, string | boolean> = { solo_activos: params?.solo_activos ?? true };
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.tipo_comprobante) q.tipo_comprobante = params.tipo_comprobante;
    const { data } = await api.get<SerieComprobante[]>(`${BASE}/series`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (serieId: string): Promise<SerieComprobante> => {
    const { data } = await api.get<SerieComprobante>(`${BASE}/series/${serieId}`);
    return data;
  },

  create: async (payload: SerieComprobanteCreate): Promise<SerieComprobante> => {
    const { data } = await api.post<SerieComprobante>(`${BASE}/series`, payload);
    return data;
  },

  update: async (serieId: string, payload: SerieComprobanteUpdate): Promise<SerieComprobante> => {
    const { data } = await api.put<SerieComprobante>(`${BASE}/series/${serieId}`, payload);
    return data;
  },
};

// ─── Comprobantes ───────────────────────────────────────────────────────────

export const comprobanteService = {
  list: async (params?: InvBillListParams): Promise<Comprobante[]> => {
    const q: Record<string, string> = {};
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.tipo_comprobante) q.tipo_comprobante = params.tipo_comprobante;
    if (params?.cliente_venta_id) q.cliente_venta_id = params.cliente_venta_id;
    if (params?.pedido_id) q.pedido_id = params.pedido_id;
    if (params?.estado) q.estado = params.estado;
    if (params?.estado_sunat) q.estado_sunat = params.estado_sunat;
    if (params?.fecha_desde) q.fecha_desde = params.fecha_desde;
    if (params?.fecha_hasta) q.fecha_hasta = params.fecha_hasta;
    const { data } = await api.get<Comprobante[]>(`${BASE}/comprobantes`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (comprobanteId: string): Promise<Comprobante> => {
    const { data } = await api.get<Comprobante>(`${BASE}/comprobantes/${comprobanteId}`);
    return data;
  },

  create: async (payload: ComprobanteCreate): Promise<Comprobante> => {
    const { data } = await api.post<Comprobante>(`${BASE}/comprobantes`, payload);
    return data;
  },

  update: async (comprobanteId: string, payload: ComprobanteUpdate): Promise<Comprobante> => {
    const { data } = await api.put<Comprobante>(`${BASE}/comprobantes/${comprobanteId}`, payload);
    return data;
  },
};

// ─── Detalles de Comprobantes ───────────────────────────────────────────────

export const comprobanteDetalleService = {
  list: async (params?: InvBillListParams): Promise<ComprobanteDetalle[]> => {
    const q: Record<string, string> = {};
    if (params?.comprobante_id) q.comprobante_id = params.comprobante_id;
    const { data } = await api.get<ComprobanteDetalle[]>(`${BASE}/comprobantes-detalles`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (detalleId: string): Promise<ComprobanteDetalle> => {
    const { data } = await api.get<ComprobanteDetalle>(`${BASE}/comprobantes-detalles/${detalleId}`);
    return data;
  },

  create: async (payload: ComprobanteDetalleCreate): Promise<ComprobanteDetalle> => {
    const { data } = await api.post<ComprobanteDetalle>(`${BASE}/comprobantes-detalles`, payload);
    return data;
  },

  update: async (detalleId: string, payload: ComprobanteDetalleUpdate): Promise<ComprobanteDetalle> => {
    const { data } = await api.put<ComprobanteDetalle>(`${BASE}/comprobantes-detalles/${detalleId}`, payload);
    return data;
  },
};
