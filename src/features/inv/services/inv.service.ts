/**
 * Servicio del módulo INV (Inventarios)
 * Base URL: /api/v1/inv/
 * Autenticación: Bearer token enviado automáticamente por la instancia Axios.
 *
 * REGLA: Solo se llaman endpoints NO deprecated del contrato.
 * Stock create/update están deprecated → no implementados (stock via movimientos).
 * movimientos-detalle POST/PUT están deprecated → usar con-detalle.
 * inventario-fisico-detalle POST/PUT están deprecated → usar con-detalle.
 *
 * Bloque 2 (Fase 2): normalización de respuestas donde el API serializa Decimal como string
 * (p. ej. `StockRead`); cuerpos POST vacíos tipados (`AutorizarMovimientoRequest`, etc.).
 */
import axios from 'axios';
import api from '@/core/api/api';
import {
  buildErpListQueryParams,
  isPaginated,
  unwrapListItems,
  type ErpPaginatedResponse,
} from '@/core/list';
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
  TipoMovimiento,
  TipoMovimientoCreate,
  TipoMovimientoUpdate,
  Movimiento,
  MovimientoCreate,
  MovimientoUpdate,
  MovimientoConDetalle,
  MovimientoConDetalleCreate,
  MovimientoConDetalleUpdate,
  MovimientoDetalleRead,
  InventarioFisico,
  InventarioFisicoCreate,
  InventarioFisicoUpdate,
  InventarioFisicoConDetalle,
  InventarioFisicoConDetalleCreate,
  InventarioFisicoConDetalleUpdate,
  InventarioFisicoDetalleRead,
  AprobarInventarioFisicoRequest,
  AnularMovimientoRequest,
  EstornarMovimientoRequest,
  AutorizarMovimientoRequest,
  ProcesarMovimientoRequest,
  KardexLineaRead,
  InvListParams,
} from '../types/inv.types';

const BASE = '/inv';

type InvListQueryOptions = {
  /** Maestros: default `solo_activos=true`. Transaccionales: omitir si no viene en params. */
  includeSoloActivosDefault?: boolean;
};

/** Construye query HTTP INV + params PERF (contrato listados v1). */
export function buildInvListQuery(
  params?: InvListParams,
  options?: InvListQueryOptions,
): Record<string, string | number | boolean> {
  const p = params ?? {};
  const base: Record<string, string | number | boolean | undefined> = {};

  if (options?.includeSoloActivosDefault !== false) {
    base.solo_activos = p.solo_activos ?? true;
  } else if (p.solo_activos !== undefined) {
    base.solo_activos = p.solo_activos;
  }

  if (p.empresa_id) base.empresa_id = p.empresa_id;
  if (p.categoria_id) base.categoria_id = p.categoria_id;
  if (p.tipo_producto) base.tipo_producto = p.tipo_producto;
  if (p.sucursal_id) base.sucursal_id = p.sucursal_id;
  if (p.almacen_id) base.almacen_id = p.almacen_id;
  if (p.producto_id) base.producto_id = p.producto_id;
  if (p.tipo_movimiento_id) base.tipo_movimiento_id = p.tipo_movimiento_id;
  if (p.movimiento_id) base.movimiento_id = p.movimiento_id;
  if (p.inventario_fisico_id) base.inventario_fisico_id = p.inventario_fisico_id;
  if (p.estado) base.estado = p.estado;
  if (p.fecha_desde) base.fecha_desde = p.fecha_desde;
  if (p.fecha_hasta) base.fecha_hasta = p.fecha_hasta;

  return buildErpListQueryParams(base, p);
}

/** Fetch listado INV — retorna `list[]` o envelope según `page` (PERF-01). */
export async function invFetchList<T>(
  path: string,
  params?: Record<string, string | number | boolean>,
): Promise<T[] | ErpPaginatedResponse<T>> {
  const { data } = await api.get<T[] | ErpPaginatedResponse<T>>(`${BASE}${path}`, { params });
  return data;
}

function invListItems<T>(data: T[] | ErpPaginatedResponse<T>): T[] {
  return unwrapListItems(data);
}

/** Convierte valor API (string Decimal o number) a número o null. */
function invParseNumberLoose(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function invParseNumberRequired(v: unknown, fallback = 0): number {
  return invParseNumberLoose(v) ?? fallback;
}

/** Normaliza fila `StockRead` (strings) → `Stock` (números para la UI). */
function normalizeStockRow(raw: unknown): Stock {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Respuesta de stock inválida');
  }
  const r = raw as Record<string, unknown>;
  return {
    stock_id: String(r.stock_id ?? ''),
    cliente_id: String(r.cliente_id ?? ''),
    empresa_id: String(r.empresa_id ?? ''),
    producto_id: String(r.producto_id ?? ''),
    almacen_id: String(r.almacen_id ?? ''),
    cantidad_actual: invParseNumberRequired(r.cantidad_actual),
    cantidad_reservada: invParseNumberLoose(r.cantidad_reservada),
    cantidad_disponible: invParseNumberLoose(r.cantidad_disponible),
    cantidad_transito: invParseNumberLoose(r.cantidad_transito),
    costo_promedio: invParseNumberLoose(r.costo_promedio),
    valor_total: invParseNumberLoose(r.valor_total),
    moneda_id: r.moneda_id != null && r.moneda_id !== '' ? String(r.moneda_id) : undefined,
    moneda: r.moneda != null && r.moneda !== '' ? String(r.moneda) : null,
    stock_minimo: invParseNumberLoose(r.stock_minimo),
    stock_maximo: invParseNumberLoose(r.stock_maximo),
    punto_reorden: invParseNumberLoose(r.punto_reorden),
    ubicacion_almacen: r.ubicacion_almacen != null ? String(r.ubicacion_almacen) : null,
    fecha_ultimo_movimiento: r.fecha_ultimo_movimiento != null ? String(r.fecha_ultimo_movimiento) : null,
    fecha_ultima_compra: r.fecha_ultima_compra != null ? String(r.fecha_ultima_compra) : null,
    fecha_ultima_venta: r.fecha_ultima_venta != null ? String(r.fecha_ultima_venta) : null,
    fecha_actualizacion: r.fecha_actualizacion != null ? String(r.fecha_actualizacion) : null,
  };
}

// ─── Categorías ─────────────────────────────────────────────────────────────

export const categoriaService = {
  list: async (params?: Pick<InvListParams, 'empresa_id' | 'solo_activos' | 'buscar' | 'page' | 'limit' | 'sort_by' | 'sort_dir'>): Promise<Categoria[]> => {
    return invListItems(
      await invFetchList<Categoria>('/categorias', buildInvListQuery(params)),
    );
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
  list: async (params?: Pick<InvListParams, 'empresa_id' | 'solo_activos' | 'buscar' | 'page' | 'limit' | 'sort_by' | 'sort_dir'>): Promise<UnidadMedida[]> => {
    return invListItems(
      await invFetchList<UnidadMedida>('/unidades-medida', buildInvListQuery(params)),
    );
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
  list: async (params?: Pick<InvListParams, 'empresa_id' | 'categoria_id' | 'tipo_producto' | 'solo_activos' | 'buscar' | 'page' | 'limit' | 'sort_by' | 'sort_dir'>): Promise<Producto[]> => {
    return invListItems(
      await invFetchList<Producto>('/productos', buildInvListQuery(params)),
    );
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
  list: async (params?: Pick<InvListParams, 'empresa_id' | 'sucursal_id' | 'solo_activos' | 'buscar' | 'page' | 'limit' | 'sort_by' | 'sort_dir'>): Promise<Almacen[]> => {
    return invListItems(
      await invFetchList<Almacen>('/almacenes', buildInvListQuery(params)),
    );
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

// ─── Stock (solo lectura) ───────────────────────────────────────────────────
// POST y PUT están deprecated — el stock se gestiona mediante movimientos.

/** Fetch stock/alertas con normalización de filas Decimal (PERF Tier C). */
export async function invFetchStockList(
  path: '/stock' | '/stock/alertas',
  params?: Record<string, string | number | boolean>,
): Promise<Stock[] | ErpPaginatedResponse<Stock>> {
  const data = await invFetchList<unknown>(path, params);
  if (isPaginated(data)) {
    return { ...data, items: data.items.map(normalizeStockRow) };
  }
  return invListItems(data).map(normalizeStockRow);
}

export const stockService = {
  list: async (params?: Pick<InvListParams, 'empresa_id' | 'producto_id' | 'almacen_id' | 'page' | 'limit' | 'sort_by' | 'sort_dir'>): Promise<Stock[]> => {
    const data = await invFetchList<unknown>(
      '/stock',
      buildInvListQuery(params, { includeSoloActivosDefault: false }),
    );
    const rows = invListItems(data);
    return rows.map((row) => normalizeStockRow(row));
  },

  getById: async (stockId: string): Promise<Stock> => {
    const { data } = await api.get<unknown>(`${BASE}/stock/${stockId}`);
    return normalizeStockRow(data);
  },

  getByProductoAlmacen: async (productoId: string, almacenId: string): Promise<Stock | null> => {
    try {
      const { data } = await api.get<unknown>(`${BASE}/stock/producto/${productoId}/almacen/${almacenId}`);
      if (data === null || data === undefined) return null;
      return normalizeStockRow(data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  },

  alertas: async (params?: Pick<InvListParams, 'empresa_id' | 'almacen_id' | 'page' | 'limit' | 'sort_by' | 'sort_dir'>): Promise<Stock[]> => {
    const data = await invFetchList<unknown>(
      '/stock/alertas',
      buildInvListQuery(params, { includeSoloActivosDefault: false }),
    );
    const rows = invListItems(data);
    return rows.map((row) => normalizeStockRow(row));
  },
};

// ─── Tipos de Movimiento ───────────────────────────────────────────────────

export const tipoMovimientoService = {
  list: async (params?: Pick<InvListParams, 'empresa_id' | 'solo_activos' | 'buscar' | 'page' | 'limit' | 'sort_by' | 'sort_dir'>): Promise<TipoMovimiento[]> => {
    return invListItems(
      await invFetchList<TipoMovimiento>('/tipos-movimiento', buildInvListQuery(params)),
    );
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
  list: async (params?: Pick<InvListParams, 'empresa_id' | 'tipo_movimiento_id' | 'almacen_id' | 'estado' | 'fecha_desde' | 'fecha_hasta' | 'page' | 'limit' | 'sort_by' | 'sort_dir'>): Promise<Movimiento[]> => {
    return invListItems(
      await invFetchList<Movimiento>(
        '/movimientos',
        buildInvListQuery(params, { includeSoloActivosDefault: false }),
      ),
    );
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

  // ── Endpoints con-detalle (cabecera + líneas en una sola operación) ──────

  getConDetalle: async (movimientoId: string): Promise<MovimientoConDetalle> => {
    const { data } = await api.get<MovimientoConDetalle>(`${BASE}/movimientos/${movimientoId}/con-detalle`);
    return data;
  },

  createConDetalle: async (payload: MovimientoConDetalleCreate): Promise<MovimientoConDetalle> => {
    const { data } = await api.post<MovimientoConDetalle>(`${BASE}/movimientos/con-detalle`, payload);
    return data;
  },

  updateConDetalle: async (movimientoId: string, payload: MovimientoConDetalleUpdate): Promise<MovimientoConDetalle> => {
    const { data } = await api.put<MovimientoConDetalle>(`${BASE}/movimientos/${movimientoId}/con-detalle`, payload);
    return data;
  },

  // ── Acciones de flujo (rutas canónicas RC1: /movimientos/{id}/…) ───────────

  autorizar: async (movimientoId: string): Promise<Movimiento> => {
    const body: AutorizarMovimientoRequest = {};
    const { data } = await api.post<Movimiento>(`${BASE}/movimientos/${movimientoId}/autorizar`, body);
    return data;
  },

  procesar: async (movimientoId: string): Promise<Movimiento> => {
    const body: ProcesarMovimientoRequest = {};
    const { data } = await api.post<Movimiento>(`${BASE}/movimientos/${movimientoId}/procesar`, body);
    return data;
  },

  anular: async (movimientoId: string, payload?: AnularMovimientoRequest): Promise<Movimiento> => {
    const { data } = await api.post<Movimiento>(`${BASE}/movimientos/${movimientoId}/anular`, payload ?? {});
    return data;
  },

  estornar: async (movimientoId: string, payload?: EstornarMovimientoRequest): Promise<Movimiento> => {
    const { data } = await api.post<Movimiento>(`${BASE}/movimientos/${movimientoId}/estornar`, payload ?? {});
    return data;
  },
};

// ─── Movimiento Detalle (solo lectura directa) ────────────────────────────
// POST y PUT están deprecated — crear/editar líneas solo via movimientoService.createConDetalle/updateConDetalle.

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
};

// ─── Inventario Físico ─────────────────────────────────────────────────────

export const inventarioFisicoService = {
  list: async (params?: Pick<InvListParams, 'empresa_id' | 'almacen_id' | 'estado' | 'fecha_desde' | 'fecha_hasta' | 'page' | 'limit' | 'sort_by' | 'sort_dir'>): Promise<InventarioFisico[]> => {
    return invListItems(
      await invFetchList<InventarioFisico>(
        '/inventario-fisico',
        buildInvListQuery(params, { includeSoloActivosDefault: false }),
      ),
    );
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

  // ── Endpoints con-detalle ─────────────────────────────────────────────────

  getConDetalle: async (inventarioFisicoId: string): Promise<InventarioFisicoConDetalle> => {
    const { data } = await api.get<InventarioFisicoConDetalle>(`${BASE}/inventario-fisico/${inventarioFisicoId}/con-detalle`);
    return data;
  },

  createConDetalle: async (payload: InventarioFisicoConDetalleCreate): Promise<InventarioFisicoConDetalle> => {
    const { data } = await api.post<InventarioFisicoConDetalle>(`${BASE}/inventario-fisico/con-detalle`, payload);
    return data;
  },

  updateConDetalle: async (inventarioFisicoId: string, payload: InventarioFisicoConDetalleUpdate): Promise<InventarioFisicoConDetalle> => {
    const { data } = await api.put<InventarioFisicoConDetalle>(`${BASE}/inventario-fisico/${inventarioFisicoId}/con-detalle`, payload);
    return data;
  },

  // ── Acciones de flujo ─────────────────────────────────────────────────────

  anular: async (inventarioFisicoId: string): Promise<InventarioFisico> => {
    const { data } = await api.post<InventarioFisico>(`${BASE}/inventario-fisico/${inventarioFisicoId}/anular`);
    return data;
  },

  finalizar: async (inventarioFisicoId: string): Promise<InventarioFisico> => {
    const { data } = await api.post<InventarioFisico>(`${BASE}/inventario-fisico/${inventarioFisicoId}/finalizar`);
    return data;
  },

  aprobar: async (inventarioFisicoId: string, payload: AprobarInventarioFisicoRequest): Promise<InventarioFisico> => {
    const { data } = await api.post<InventarioFisico>(`${BASE}/inventario-fisico/${inventarioFisicoId}/aprobar`, payload);
    return data;
  },
};

// ─── Inventario Físico Detalle (solo lectura directa) ────────────────────
// POST y PUT están deprecated — crear/editar líneas solo via inventarioFisicoService.createConDetalle/updateConDetalle.

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
    const { data } = await api.get<InventarioFisicoDetalleRead>(`${BASE}/inventario-fisico-detalle/${inventarioFisicoDetalleId}`);
    return data;
  },
};

// ─── Kardex ─────────────────────────────────────────────────────────────────

export const kardexService = {
  list: async (params?: Pick<InvListParams, 'empresa_id' | 'producto_id' | 'almacen_id' | 'fecha_desde' | 'fecha_hasta' | 'page' | 'limit' | 'sort_by' | 'sort_dir'>): Promise<KardexLineaRead[]> => {
    return invListItems(
      await invFetchList<KardexLineaRead>(
        '/kardex',
        buildInvListQuery(params, { includeSoloActivosDefault: false }),
      ),
    );
  },
};
