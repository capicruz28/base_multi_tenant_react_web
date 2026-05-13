/**
 * Servicio del módulo INV (Inventarios)
 * Base URL: /api/v1/inv/
 * Autenticación: Bearer token (header enviado por la instancia axios).
 */
import axios from 'axios';
import api from '@/core/api/api';
import type {
  Categoria,
  CategoriaCreate,
  CategoriaUpdate,
  UnidadMedida,
  UnidadMedidaCreate,
  UnidadMedidaUpdate,
  Producto,
  ProductoCreate,
  ProductoUpdate,
  Almacen,
  AlmacenCreate,
  AlmacenUpdate,
  Stock,
  StockCreate,
  StockUpdate,
  TipoMovimiento,
  TipoMovimientoCreate,
  TipoMovimientoUpdate,
  Movimiento,
  MovimientoCreate,
  MovimientoUpdate,
  MovimientoDetalleRead,
  MovimientoDetalleCreate,
  MovimientoDetalleUpdate,
  InventarioFisico,
  InventarioFisicoCreate,
  InventarioFisicoUpdate,
  InventarioFisicoDetalleRead,
  InventarioFisicoDetalleCreate,
  InventarioFisicoDetalleUpdate,
  AprobarInventarioFisicoRequest,
  AutorizarMovimientoRequest,
  AnularMovimientoRequest,
  InvListParams,
} from '../types/inv.types';

const BASE = '/inv';

// ─── Categorías ─────────────────────────────────────────────────────────────

export const categoriaService = {
  list: async (params?: InvListParams): Promise<Categoria[]> => {
    const q: Record<string, string | boolean> = { solo_activos: params?.solo_activos ?? true };
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    const { data } = await api.get<Categoria[]>(`${BASE}/categorias`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (categoriaId: string): Promise<Categoria> => {
    const { data } = await api.get<Categoria>(`${BASE}/categorias/${categoriaId}`);
    return data;
  },

  create: async (payload: CategoriaCreate): Promise<Categoria> => {
    const { data } = await api.post<Categoria>(`${BASE}/categorias`, payload);
    return data;
  },

  update: async (categoriaId: string, payload: CategoriaUpdate): Promise<Categoria> => {
    const { data } = await api.put<Categoria>(`${BASE}/categorias/${categoriaId}`, payload);
    return data;
  },

  delete: async (categoriaId: string): Promise<void> => {
    await api.delete(`${BASE}/categorias/${categoriaId}`);
  },

  reactivar: async (categoriaId: string): Promise<Categoria> => {
    const { data } = await api.post<Categoria>(`${BASE}/categorias/${categoriaId}/reactivar`);
    return data;
  },
};

// ─── Unidades de Medida ────────────────────────────────────────────────────

export const unidadMedidaService = {
  list: async (params?: InvListParams): Promise<UnidadMedida[]> => {
    const q: Record<string, string | boolean> = { solo_activos: params?.solo_activos ?? true };
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    const { data } = await api.get<UnidadMedida[]>(`${BASE}/unidades-medida`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (unidadMedidaId: string): Promise<UnidadMedida> => {
    const { data } = await api.get<UnidadMedida>(`${BASE}/unidades-medida/${unidadMedidaId}`);
    return data;
  },

  create: async (payload: UnidadMedidaCreate): Promise<UnidadMedida> => {
    const { data } = await api.post<UnidadMedida>(`${BASE}/unidades-medida`, payload);
    return data;
  },

  update: async (unidadMedidaId: string, payload: UnidadMedidaUpdate): Promise<UnidadMedida> => {
    const { data } = await api.put<UnidadMedida>(`${BASE}/unidades-medida/${unidadMedidaId}`, payload);
    return data;
  },

  delete: async (unidadMedidaId: string): Promise<void> => {
    await api.delete(`${BASE}/unidades-medida/${unidadMedidaId}`);
  },

  reactivar: async (unidadMedidaId: string): Promise<UnidadMedida> => {
    const { data } = await api.post<UnidadMedida>(`${BASE}/unidades-medida/${unidadMedidaId}/reactivar`);
    return data;
  },
};

// ─── Productos ──────────────────────────────────────────────────────────────

export const productoService = {
  list: async (params?: InvListParams): Promise<Producto[]> => {
    const q: Record<string, string | boolean> = { solo_activos: params?.solo_activos ?? true };
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.categoria_id) q.categoria_id = params.categoria_id;
    if (params?.tipo_producto) q.tipo_producto = params.tipo_producto;
    if (params?.buscar) q.buscar = params.buscar;
    const { data } = await api.get<Producto[]>(`${BASE}/productos`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (productoId: string): Promise<Producto> => {
    const { data } = await api.get<Producto>(`${BASE}/productos/${productoId}`);
    return data;
  },

  create: async (payload: ProductoCreate): Promise<Producto> => {
    const { data } = await api.post<Producto>(`${BASE}/productos`, payload);
    return data;
  },

  update: async (productoId: string, payload: ProductoUpdate): Promise<Producto> => {
    const { data } = await api.put<Producto>(`${BASE}/productos/${productoId}`, payload);
    return data;
  },

  delete: async (productoId: string): Promise<void> => {
    await api.delete(`${BASE}/productos/${productoId}`);
  },

  reactivar: async (productoId: string): Promise<Producto> => {
    const { data } = await api.post<Producto>(`${BASE}/productos/${productoId}/reactivar`);
    return data;
  },
};

// ─── Almacenes ──────────────────────────────────────────────────────────────

export const almacenService = {
  list: async (params?: InvListParams): Promise<Almacen[]> => {
    const q: Record<string, string | boolean> = { solo_activos: params?.solo_activos ?? true };
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.sucursal_id) q.sucursal_id = params.sucursal_id;
    const { data } = await api.get<Almacen[]>(`${BASE}/almacenes`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (almacenId: string): Promise<Almacen> => {
    const { data } = await api.get<Almacen>(`${BASE}/almacenes/${almacenId}`);
    return data;
  },

  create: async (payload: AlmacenCreate): Promise<Almacen> => {
    const { data } = await api.post<Almacen>(`${BASE}/almacenes`, payload);
    return data;
  },

  update: async (almacenId: string, payload: AlmacenUpdate): Promise<Almacen> => {
    const { data } = await api.put<Almacen>(`${BASE}/almacenes/${almacenId}`, payload);
    return data;
  },

  delete: async (almacenId: string): Promise<void> => {
    await api.delete(`${BASE}/almacenes/${almacenId}`);
  },

  reactivar: async (almacenId: string): Promise<Almacen> => {
    const { data } = await api.post<Almacen>(`${BASE}/almacenes/${almacenId}/reactivar`);
    return data;
  },
};

// ─── Stock ──────────────────────────────────────────────────────────────────

export const stockService = {
  list: async (params?: InvListParams): Promise<Stock[]> => {
    const q: Record<string, string> = {};
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.producto_id) q.producto_id = params.producto_id;
    if (params?.almacen_id) q.almacen_id = params.almacen_id;
    const { data } = await api.get<Stock[]>(`${BASE}/stock`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (stockId: string): Promise<Stock> => {
    const { data } = await api.get<Stock>(`${BASE}/stock/${stockId}`);
    return data;
  },

  getByProductoAlmacen: async (productoId: string, almacenId: string): Promise<Stock | null> => {
    try {
      const { data } = await api.get<Stock>(`${BASE}/stock/producto/${productoId}/almacen/${almacenId}`);
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  },

  create: async (payload: StockCreate): Promise<Stock> => {
    const { data } = await api.post<Stock>(`${BASE}/stock`, payload);
    return data;
  },

  update: async (stockId: string, payload: StockUpdate): Promise<Stock> => {
    const { data } = await api.put<Stock>(`${BASE}/stock/${stockId}`, payload);
    return data;
  },

  alertas: async (params?: Pick<InvListParams, 'empresa_id' | 'almacen_id'>): Promise<Stock[]> => {
    const q: Record<string, string> = {};
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.almacen_id) q.almacen_id = params.almacen_id;
    const { data } = await api.get<Stock[]>(`${BASE}/stock/alertas`, { params: q });
    return Array.isArray(data) ? data : [];
  },
};

// ─── Tipos de Movimiento ───────────────────────────────────────────────────

export const tipoMovimientoService = {
  list: async (params?: InvListParams): Promise<TipoMovimiento[]> => {
    const q: Record<string, string | boolean> = { solo_activos: params?.solo_activos ?? true };
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    const { data } = await api.get<TipoMovimiento[]>(`${BASE}/tipos-movimiento`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (tipoMovimientoId: string): Promise<TipoMovimiento> => {
    const { data } = await api.get<TipoMovimiento>(`${BASE}/tipos-movimiento/${tipoMovimientoId}`);
    return data;
  },

  create: async (payload: TipoMovimientoCreate): Promise<TipoMovimiento> => {
    const { data } = await api.post<TipoMovimiento>(`${BASE}/tipos-movimiento`, payload);
    return data;
  },

  update: async (tipoMovimientoId: string, payload: TipoMovimientoUpdate): Promise<TipoMovimiento> => {
    const { data } = await api.put<TipoMovimiento>(`${BASE}/tipos-movimiento/${tipoMovimientoId}`, payload);
    return data;
  },

  delete: async (tipoMovimientoId: string): Promise<void> => {
    await api.delete(`${BASE}/tipos-movimiento/${tipoMovimientoId}`);
  },

  reactivar: async (tipoMovimientoId: string): Promise<TipoMovimiento> => {
    const { data } = await api.post<TipoMovimiento>(`${BASE}/tipos-movimiento/${tipoMovimientoId}/reactivar`);
    return data;
  },
};

// ─── Movimientos ───────────────────────────────────────────────────────────

export const movimientoService = {
  list: async (params?: InvListParams): Promise<Movimiento[]> => {
    const q: Record<string, string> = {};
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.tipo_movimiento_id) q.tipo_movimiento_id = params.tipo_movimiento_id;
    if (params?.almacen_id) q.almacen_id = params.almacen_id;
    if (params?.estado) q.estado = params.estado;
    if (params?.fecha_desde) q.fecha_desde = params.fecha_desde;
    if (params?.fecha_hasta) q.fecha_hasta = params.fecha_hasta;
    const { data } = await api.get<Movimiento[]>(`${BASE}/movimientos`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (movimientoId: string): Promise<Movimiento> => {
    const { data } = await api.get<Movimiento>(`${BASE}/movimientos/${movimientoId}`);
    return data;
  },

  create: async (payload: MovimientoCreate): Promise<Movimiento> => {
    const { data } = await api.post<Movimiento>(`${BASE}/movimientos`, payload);
    return data;
  },

  update: async (movimientoId: string, payload: MovimientoUpdate): Promise<Movimiento> => {
    const { data } = await api.put<Movimiento>(`${BASE}/movimientos/${movimientoId}`, payload);
    return data;
  },

  autorizar: async (movimientoId: string, _payload?: AutorizarMovimientoRequest): Promise<Movimiento> => {
    const { data } = await api.post<Movimiento>(`${BASE}/${movimientoId}/autorizar`);
    return data;
  },

  procesar: async (movimientoId: string): Promise<Movimiento> => {
    const { data } = await api.post<Movimiento>(`${BASE}/${movimientoId}/procesar`);
    return data;
  },

  anular: async (movimientoId: string, payload?: AnularMovimientoRequest): Promise<Movimiento> => {
    const { data } = await api.post<Movimiento>(`${BASE}/${movimientoId}/anular`, payload ?? {});
    return data;
  },
};

// ─── Inventario Físico ─────────────────────────────────────────────────────

export const inventarioFisicoService = {
  list: async (params?: InvListParams): Promise<InventarioFisico[]> => {
    const q: Record<string, string> = {};
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.almacen_id) q.almacen_id = params.almacen_id;
    if (params?.estado) q.estado = params.estado;
    if (params?.fecha_desde) q.fecha_desde = params.fecha_desde;
    if (params?.fecha_hasta) q.fecha_hasta = params.fecha_hasta;
    const { data } = await api.get<InventarioFisico[]>(`${BASE}/inventario-fisico`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (inventarioFisicoId: string): Promise<InventarioFisico> => {
    const { data } = await api.get<InventarioFisico>(`${BASE}/inventario-fisico/${inventarioFisicoId}`);
    return data;
  },

  create: async (payload: InventarioFisicoCreate): Promise<InventarioFisico> => {
    const { data } = await api.post<InventarioFisico>(`${BASE}/inventario-fisico`, payload);
    return data;
  },

  update: async (inventarioFisicoId: string, payload: InventarioFisicoUpdate): Promise<InventarioFisico> => {
    const { data } = await api.put<InventarioFisico>(`${BASE}/inventario-fisico/${inventarioFisicoId}`, payload);
    return data;
  },

  anular: async (inventarioFisicoId: string): Promise<InventarioFisico> => {
    const { data } = await api.post<InventarioFisico>(`${BASE}/inventario-fisico/${inventarioFisicoId}/anular`);
    return data;
  },

  aprobar: async (inventarioFisicoId: string, payload: AprobarInventarioFisicoRequest): Promise<InventarioFisico> => {
    const { data } = await api.post<InventarioFisico>(`${BASE}/inventario-fisico/${inventarioFisicoId}/aprobar`, payload);
    return data;
  },
};

// ─── Movimientos (Detalle) ───────────────────────────────────────────────────

export const movimientoDetalleService = {
  list: async (params?: Pick<InvListParams, 'empresa_id' | 'movimiento_id' | 'producto_id'>): Promise<MovimientoDetalleRead[]> => {
    const q: Record<string, string> = {};
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.movimiento_id) q.movimiento_id = params.movimiento_id;
    if (params?.producto_id) q.producto_id = params.producto_id;
    const { data } = await api.get<MovimientoDetalleRead[]>(`${BASE}/movimientos-detalle`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (movimientoDetalleId: string): Promise<MovimientoDetalleRead> => {
    const { data } = await api.get<MovimientoDetalleRead>(`${BASE}/movimientos-detalle/${movimientoDetalleId}`);
    return data;
  },

  create: async (payload: MovimientoDetalleCreate): Promise<MovimientoDetalleRead> => {
    const { data } = await api.post<MovimientoDetalleRead>(`${BASE}/movimientos-detalle`, payload);
    return data;
  },

  update: async (movimientoDetalleId: string, payload: MovimientoDetalleUpdate): Promise<MovimientoDetalleRead> => {
    const { data } = await api.put<MovimientoDetalleRead>(`${BASE}/movimientos-detalle/${movimientoDetalleId}`, payload);
    return data;
  },
};

// ─── Inventario Físico (Detalle) ────────────────────────────────────────────

export const inventarioFisicoDetalleService = {
  list: async (params?: Pick<InvListParams, 'empresa_id' | 'inventario_fisico_id' | 'producto_id'>): Promise<InventarioFisicoDetalleRead[]> => {
    const q: Record<string, string> = {};
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.inventario_fisico_id) q.inventario_fisico_id = params.inventario_fisico_id;
    if (params?.producto_id) q.producto_id = params.producto_id;
    const { data } = await api.get<InventarioFisicoDetalleRead[]>(`${BASE}/inventario-fisico-detalle`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (inventarioFisicoDetalleId: string): Promise<InventarioFisicoDetalleRead> => {
    const { data } = await api.get<InventarioFisicoDetalleRead>(
      `${BASE}/inventario-fisico-detalle/${inventarioFisicoDetalleId}`
    );
    return data;
  },

  create: async (payload: InventarioFisicoDetalleCreate): Promise<InventarioFisicoDetalleRead> => {
    const { data } = await api.post<InventarioFisicoDetalleRead>(`${BASE}/inventario-fisico-detalle`, payload);
    return data;
  },

  update: async (
    inventarioFisicoDetalleId: string,
    payload: InventarioFisicoDetalleUpdate
  ): Promise<InventarioFisicoDetalleRead> => {
    const { data } = await api.put<InventarioFisicoDetalleRead>(
      `${BASE}/inventario-fisico-detalle/${inventarioFisicoDetalleId}`,
      payload
    );
    return data;
  },
};

// ─── Kardex ─────────────────────────────────────────────────────────────────

import type { KardexLineaRead } from '../types/inv.types';

export const kardexService = {
  list: async (params?: InvListParams): Promise<KardexLineaRead[]> => {
    const q: Record<string, string> = {};
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.producto_id) q.producto_id = params.producto_id;
    if (params?.almacen_id) q.almacen_id = params.almacen_id;
    if (params?.fecha_desde) q.fecha_desde = params.fecha_desde;
    if (params?.fecha_hasta) q.fecha_hasta = params.fecha_hasta;
    const { data } = await api.get<KardexLineaRead[]>(`${BASE}/kardex`, { params: q });
    return Array.isArray(data) ? data : [];
  },
};
