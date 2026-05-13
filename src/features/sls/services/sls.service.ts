/**
 * Servicio del módulo SLS (Ventas)
 * Base URL: /api/v1/sls/
 * Autenticación: Bearer token (header enviado por la instancia axios).
 */
import api from '@/core/api/api';
import type {
  Cliente,
  ClienteCreate,
  ClienteUpdate,
  ContactoCliente,
  ContactoClienteCreate,
  ContactoClienteUpdate,
  DireccionCliente,
  DireccionClienteCreate,
  DireccionClienteUpdate,
  Cotizacion,
  CotizacionCreate,
  CotizacionUpdate,
  Pedido,
  PedidoCreate,
  PedidoUpdate,
  SlsListParams,
} from '../types/sls.types';

const BASE = '/sls';

// ─── Clientes ──────────────────────────────────────────────────────────────

export const clienteService = {
  list: async (params?: SlsListParams): Promise<Cliente[]> => {
    const q: Record<string, string | boolean> = { solo_activos: params?.solo_activos ?? true };
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.buscar) q.buscar = params.buscar;
    if (params?.vendedor_usuario_id) q.vendedor_usuario_id = params.vendedor_usuario_id;
    const { data } = await api.get<Cliente[]>(`${BASE}/clientes`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (clienteVentaId: string): Promise<Cliente> => {
    const { data } = await api.get<Cliente>(`${BASE}/clientes/${clienteVentaId}`);
    return data;
  },

  create: async (payload: ClienteCreate): Promise<Cliente> => {
    const { data } = await api.post<Cliente>(`${BASE}/clientes`, payload);
    return data;
  },

  update: async (clienteVentaId: string, payload: ClienteUpdate): Promise<Cliente> => {
    const { data } = await api.put<Cliente>(`${BASE}/clientes/${clienteVentaId}`, payload);
    return data;
  },
};

// ─── Contactos de Cliente ────────────────────────────────────────────────────

export const contactoClienteService = {
  list: async (params?: SlsListParams): Promise<ContactoCliente[]> => {
    const q: Record<string, string | boolean> = { solo_activos: params?.solo_activos ?? true };
    if (params?.cliente_venta_id) q.cliente_venta_id = params.cliente_venta_id;
    const { data } = await api.get<ContactoCliente[]>(`${BASE}/contactos`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (contactoId: string): Promise<ContactoCliente> => {
    const { data } = await api.get<ContactoCliente>(`${BASE}/contactos/${contactoId}`);
    return data;
  },

  create: async (payload: ContactoClienteCreate): Promise<ContactoCliente> => {
    const { data } = await api.post<ContactoCliente>(`${BASE}/contactos`, payload);
    return data;
  },

  update: async (contactoId: string, payload: ContactoClienteUpdate): Promise<ContactoCliente> => {
    const { data } = await api.put<ContactoCliente>(`${BASE}/contactos/${contactoId}`, payload);
    return data;
  },
};

// ─── Direcciones de Cliente ─────────────────────────────────────────────────

export const direccionClienteService = {
  list: async (params?: SlsListParams): Promise<DireccionCliente[]> => {
    const q: Record<string, string | boolean> = { solo_activos: params?.solo_activos ?? true };
    if (params?.cliente_venta_id) q.cliente_venta_id = params.cliente_venta_id;
    const { data } = await api.get<DireccionCliente[]>(`${BASE}/direcciones`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (direccionId: string): Promise<DireccionCliente> => {
    const { data } = await api.get<DireccionCliente>(`${BASE}/direcciones/${direccionId}`);
    return data;
  },

  create: async (payload: DireccionClienteCreate): Promise<DireccionCliente> => {
    const { data } = await api.post<DireccionCliente>(`${BASE}/direcciones`, payload);
    return data;
  },

  update: async (direccionId: string, payload: DireccionClienteUpdate): Promise<DireccionCliente> => {
    const { data } = await api.put<DireccionCliente>(`${BASE}/direcciones/${direccionId}`, payload);
    return data;
  },
};

// ─── Cotizaciones ──────────────────────────────────────────────────────────

export const cotizacionService = {
  list: async (params?: SlsListParams): Promise<Cotizacion[]> => {
    const q: Record<string, string> = {};
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.cliente_venta_id) q.cliente_venta_id = params.cliente_venta_id;
    if (params?.vendedor_usuario_id) q.vendedor_usuario_id = params.vendedor_usuario_id;
    if (params?.estado) q.estado = params.estado;
    if (params?.fecha_desde) q.fecha_desde = params.fecha_desde;
    if (params?.fecha_hasta) q.fecha_hasta = params.fecha_hasta;
    const { data } = await api.get<Cotizacion[]>(`${BASE}/cotizaciones`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (cotizacionId: string): Promise<Cotizacion> => {
    const { data } = await api.get<Cotizacion>(`${BASE}/cotizaciones/${cotizacionId}`);
    return data;
  },

  create: async (payload: CotizacionCreate): Promise<Cotizacion> => {
    const { data } = await api.post<Cotizacion>(`${BASE}/cotizaciones`, payload);
    return data;
  },

  update: async (cotizacionId: string, payload: CotizacionUpdate): Promise<Cotizacion> => {
    const { data } = await api.put<Cotizacion>(`${BASE}/cotizaciones/${cotizacionId}`, payload);
    return data;
  },
};

// ─── Pedidos ────────────────────────────────────────────────────────────────

export const pedidoService = {
  list: async (params?: SlsListParams): Promise<Pedido[]> => {
    const q: Record<string, string> = {};
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.cliente_venta_id) q.cliente_venta_id = params.cliente_venta_id;
    if (params?.vendedor_usuario_id) q.vendedor_usuario_id = params.vendedor_usuario_id;
    if (params?.cotizacion_id) q.cotizacion_id = params.cotizacion_id;
    if (params?.estado) q.estado = params.estado;
    if (params?.fecha_desde) q.fecha_desde = params.fecha_desde;
    if (params?.fecha_hasta) q.fecha_hasta = params.fecha_hasta;
    const { data } = await api.get<Pedido[]>(`${BASE}/pedidos`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (pedidoId: string): Promise<Pedido> => {
    const { data } = await api.get<Pedido>(`${BASE}/pedidos/${pedidoId}`);
    return data;
  },

  create: async (payload: PedidoCreate): Promise<Pedido> => {
    const { data } = await api.post<Pedido>(`${BASE}/pedidos`, payload);
    return data;
  },

  update: async (pedidoId: string, payload: PedidoUpdate): Promise<Pedido> => {
    const { data } = await api.put<Pedido>(`${BASE}/pedidos/${pedidoId}`, payload);
    return data;
  },
};
