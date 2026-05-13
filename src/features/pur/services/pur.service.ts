/**
 * Servicio del módulo PUR (Compras)
 * Base URL: /api/v1/pur/
 * Autenticación: Bearer token (header enviado por la instancia axios).
 */
import api from '@/core/api/api';
import type {
  Proveedor,
  ProveedorCreate,
  ProveedorUpdate,
  ContactoProveedor,
  ContactoProveedorCreate,
  ContactoProveedorUpdate,
  ProductoProveedor,
  ProductoProveedorCreate,
  ProductoProveedorUpdate,
  SolicitudCompra,
  SolicitudCompraCreate,
  SolicitudCompraUpdate,
  SolicitudCompraDetalle,
  SolicitudCompraDetalleCreate,
  SolicitudCompraDetalleUpdate,
  SolicitudCompraTransaccionalCreate,
  Cotizacion,
  CotizacionCreate,
  CotizacionUpdate,
  CotizacionDetalle,
  CotizacionDetalleCreate,
  CotizacionDetalleUpdate,
  CotizacionTransaccionalCreate,
  OrdenCompra,
  OrdenCompraCreate,
  OrdenCompraUpdate,
  OrdenCompraDetalle,
  OrdenCompraDetalleCreate,
  OrdenCompraDetalleUpdate,
  OrdenCompraTransaccionalCreate,
  Recepcion,
  RecepcionCreate,
  RecepcionUpdate,
  RecepcionDetalle,
  RecepcionDetalleCreate,
  RecepcionDetalleUpdate,
  RecepcionTransaccionalCreate,
  PurListParams,
} from '../types/pur.types';

const BASE = '/pur';

// ─── Proveedores ───────────────────────────────────────────────────────────

export const proveedorService = {
  list: async (params?: PurListParams): Promise<Proveedor[]> => {
    const q: PurListParams = { solo_activos: params?.solo_activos ?? true };
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.buscar) q.buscar = params.buscar;
    if (params?.tipo_proveedor) q.tipo_proveedor = params.tipo_proveedor;
    if (params?.categoria_proveedor) q.categoria_proveedor = params.categoria_proveedor;
    if (params?.estado) q.estado = params.estado;
    if (params?.sort_by) q.sort_by = params.sort_by;
    if (params?.order) q.order = params.order;
    if (params?.page) q.page = params.page;
    if (params?.page_size) q.page_size = params.page_size;
    const { data } = await api.get<Proveedor[]>(`${BASE}/proveedores`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (proveedorId: string): Promise<Proveedor> => {
    const { data } = await api.get<Proveedor>(`${BASE}/proveedores/${proveedorId}`);
    return data;
  },

  create: async (payload: ProveedorCreate): Promise<Proveedor> => {
    const { data } = await api.post<Proveedor>(`${BASE}/proveedores`, payload);
    return data;
  },

  update: async (proveedorId: string, payload: ProveedorUpdate): Promise<Proveedor> => {
    const { data } = await api.put<Proveedor>(`${BASE}/proveedores/${proveedorId}`, payload);
    return data;
  },

  reactivar: async (proveedorId: string): Promise<Proveedor> => {
    const { data } = await api.post<Proveedor>(`${BASE}/proveedores/${proveedorId}/reactivar`);
    return data;
  },
};

// ─── Contactos de Proveedor ─────────────────────────────────────────────────

export const contactoProveedorService = {
  list: async (params?: PurListParams): Promise<ContactoProveedor[]> => {
    const q: PurListParams = { solo_activos: params?.solo_activos ?? true };
    if (params?.proveedor_id) q.proveedor_id = params.proveedor_id;
    const { data } = await api.get<ContactoProveedor[]>(`${BASE}/contactos`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (contactoId: string): Promise<ContactoProveedor> => {
    const { data } = await api.get<ContactoProveedor>(`${BASE}/contactos/${contactoId}`);
    return data;
  },

  create: async (payload: ContactoProveedorCreate): Promise<ContactoProveedor> => {
    const { data } = await api.post<ContactoProveedor>(`${BASE}/contactos`, payload);
    return data;
  },

  update: async (contactoId: string, payload: ContactoProveedorUpdate): Promise<ContactoProveedor> => {
    const { data } = await api.put<ContactoProveedor>(`${BASE}/contactos/${contactoId}`, payload);
    return data;
  },

  reactivar: async (contactoId: string): Promise<ContactoProveedor> => {
    const { data } = await api.post<ContactoProveedor>(`${BASE}/contactos/${contactoId}/reactivar`);
    return data;
  },
};

// ─── Productos por Proveedor ──────────────────────────────────────────────

export const productoProveedorService = {
  list: async (params?: PurListParams): Promise<ProductoProveedor[]> => {
    const q: PurListParams = { solo_activos: params?.solo_activos ?? true };
    if (params?.proveedor_id) q.proveedor_id = params.proveedor_id;
    if (params?.producto_id) q.producto_id = params.producto_id;
    const { data } = await api.get<ProductoProveedor[]>(`${BASE}/productos-proveedor`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (productoProveedorId: string): Promise<ProductoProveedor> => {
    const { data } = await api.get<ProductoProveedor>(`${BASE}/productos-proveedor/${productoProveedorId}`);
    return data;
  },

  create: async (payload: ProductoProveedorCreate): Promise<ProductoProveedor> => {
    const { data } = await api.post<ProductoProveedor>(`${BASE}/productos-proveedor`, payload);
    return data;
  },

  update: async (productoProveedorId: string, payload: ProductoProveedorUpdate): Promise<ProductoProveedor> => {
    const { data } = await api.put<ProductoProveedor>(`${BASE}/productos-proveedor/${productoProveedorId}`, payload);
    return data;
  },

  reactivar: async (productoProveedorId: string): Promise<ProductoProveedor> => {
    const { data } = await api.post<ProductoProveedor>(`${BASE}/productos-proveedor/${productoProveedorId}/reactivar`);
    return data;
  },
};

// ─── Solicitudes de Compra ──────────────────────────────────────────────────

export const solicitudCompraService = {
  list: async (params?: PurListParams): Promise<SolicitudCompra[]> => {
    const q: PurListParams = {};
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.estado) q.estado = params.estado;
    if (params?.fecha_desde) q.fecha_desde = params.fecha_desde;
    if (params?.fecha_hasta) q.fecha_hasta = params.fecha_hasta;
    if (params?.sort_by) q.sort_by = params.sort_by;
    if (params?.order) q.order = params.order;
    if (params?.page) q.page = params.page;
    if (params?.page_size) q.page_size = params.page_size;
    const { data } = await api.get<SolicitudCompra[]>(`${BASE}/solicitudes`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (solicitudId: string): Promise<SolicitudCompra> => {
    const { data } = await api.get<SolicitudCompra>(`${BASE}/solicitudes/${solicitudId}`);
    return data;
  },

  create: async (payload: SolicitudCompraCreate): Promise<SolicitudCompra> => {
    const { data } = await api.post<SolicitudCompra>(`${BASE}/solicitudes`, payload);
    return data;
  },

  update: async (solicitudId: string, payload: SolicitudCompraUpdate): Promise<SolicitudCompra> => {
    const { data } = await api.put<SolicitudCompra>(`${BASE}/solicitudes/${solicitudId}`, payload);
    return data;
  },

  aprobar: async (solicitudId: string): Promise<SolicitudCompra> => {
    const { data } = await api.post<SolicitudCompra>(`${BASE}/solicitudes/${solicitudId}/aprobar`);
    return data;
  },

  rechazar: async (solicitudId: string, motivo?: string): Promise<SolicitudCompra> => {
    const { data } = await api.post<SolicitudCompra>(
      `${BASE}/solicitudes/${solicitudId}/rechazar`,
      motivo ? { motivo_rechazo: motivo } : null,
    );
    return data;
  },

  anular: async (solicitudId: string, motivo?: string): Promise<SolicitudCompra> => {
    const { data } = await api.post<SolicitudCompra>(
      `${BASE}/solicitudes/${solicitudId}/anular`,
      motivo ? { motivo: motivo } : null,
    );
    return data;
  },

  marcarProcesada: async (solicitudId: string): Promise<SolicitudCompra> => {
    const { data } = await api.post<SolicitudCompra>(`${BASE}/solicitudes/${solicitudId}/marcar-procesada`);
    return data;
  },
};

// ─── Solicitudes de Compra Detalle ────────────────────────────────────────

export const solicitudCompraDetalleService = {
  listBySolicitud: async (solicitudId: string, empresaId?: string): Promise<SolicitudCompraDetalle[]> => {
    const q: PurListParams = { solicitud_id: solicitudId };
    if (empresaId) q.empresa_id = empresaId;
    const { data } = await api.get<SolicitudCompraDetalle[]>(`${BASE}/solicitudes-detalle`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (solicitudDetalleId: string): Promise<SolicitudCompraDetalle> => {
    const { data } = await api.get<SolicitudCompraDetalle>(`${BASE}/solicitudes-detalle/${solicitudDetalleId}`);
    return data;
  },

  create: async (payload: SolicitudCompraDetalleCreate): Promise<SolicitudCompraDetalle> => {
    const { data } = await api.post<SolicitudCompraDetalle>(`${BASE}/solicitudes-detalle`, payload);
    return data;
  },

  update: async (solicitudDetalleId: string, payload: SolicitudCompraDetalleUpdate): Promise<SolicitudCompraDetalle> => {
    const { data } = await api.put<SolicitudCompraDetalle>(`${BASE}/solicitudes-detalle/${solicitudDetalleId}`, payload);
    return data;
  },

  // ⚠ DESALINEADO: este endpoint no existe en el contrato API — NO invocar desde UI
  delete: async (solicitudDetalleId: string): Promise<void> => {
    await api.delete(`${BASE}/solicitudes-detalle/${solicitudDetalleId}`);
  },
};

// ─── Solicitudes Transaccional ─────────────────────────────────────────────

export const solicitudTransaccionalService = {
  create: async (payload: SolicitudCompraTransaccionalCreate): Promise<SolicitudCompra> => {
    const { data } = await api.post<SolicitudCompra>(`${BASE}/solicitudes/transaccional`, payload);
    return data;
  },
};

// ─── Cotizaciones ───────────────────────────────────────────────────────────

export const cotizacionService = {
  list: async (params?: PurListParams): Promise<Cotizacion[]> => {
    const q: PurListParams = {};
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.proveedor_id) q.proveedor_id = params.proveedor_id;
    if (params?.solicitud_compra_id) q.solicitud_compra_id = params.solicitud_compra_id;
    if (params?.estado) q.estado = params.estado;
    if (params?.fecha_desde) q.fecha_desde = params.fecha_desde;
    if (params?.fecha_hasta) q.fecha_hasta = params.fecha_hasta;
    if (params?.sort_by) q.sort_by = params.sort_by;
    if (params?.order) q.order = params.order;
    if (params?.page) q.page = params.page;
    if (params?.page_size) q.page_size = params.page_size;
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

  aceptar: async (cotizacionId: string): Promise<Cotizacion> => {
    const { data } = await api.post<Cotizacion>(`${BASE}/cotizaciones/${cotizacionId}/aceptar`);
    return data;
  },

  rechazar: async (cotizacionId: string, motivo?: string): Promise<Cotizacion> => {
    const { data } = await api.post<Cotizacion>(
      `${BASE}/cotizaciones/${cotizacionId}/rechazar`,
      motivo ? { motivo_rechazo: motivo } : null,
    );
    return data;
  },

  marcarGanadora: async (cotizacionId: string): Promise<Cotizacion> => {
    const { data } = await api.post<Cotizacion>(`${BASE}/cotizaciones/${cotizacionId}/marcar-ganadora`);
    return data;
  },
};

// ─── Cotizaciones Detalle ──────────────────────────────────────────────────

export const cotizacionDetalleService = {
  listByCotizacion: async (cotizacionId: string, empresaId?: string): Promise<CotizacionDetalle[]> => {
    const q: PurListParams = { cotizacion_id: cotizacionId };
    if (empresaId) q.empresa_id = empresaId;
    const { data } = await api.get<CotizacionDetalle[]>(`${BASE}/cotizaciones-detalle`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (cotizacionDetalleId: string): Promise<CotizacionDetalle> => {
    const { data } = await api.get<CotizacionDetalle>(`${BASE}/cotizaciones-detalle/${cotizacionDetalleId}`);
    return data;
  },

  create: async (payload: CotizacionDetalleCreate): Promise<CotizacionDetalle> => {
    const { data } = await api.post<CotizacionDetalle>(`${BASE}/cotizaciones-detalle`, payload);
    return data;
  },

  update: async (cotizacionDetalleId: string, payload: CotizacionDetalleUpdate): Promise<CotizacionDetalle> => {
    const { data } = await api.put<CotizacionDetalle>(`${BASE}/cotizaciones-detalle/${cotizacionDetalleId}`, payload);
    return data;
  },

  // ⚠ DESALINEADO: este endpoint no existe en el contrato API — NO invocar desde UI
  delete: async (cotizacionDetalleId: string): Promise<void> => {
    await api.delete(`${BASE}/cotizaciones-detalle/${cotizacionDetalleId}`);
  },
};

// ─── Cotizaciones Transaccional ────────────────────────────────────────────

export const cotizacionTransaccionalService = {
  create: async (payload: CotizacionTransaccionalCreate): Promise<Cotizacion> => {
    const { data } = await api.post<Cotizacion>(`${BASE}/cotizaciones/transaccional`, payload);
    return data;
  },
};

// ─── Órdenes de Compra ──────────────────────────────────────────────────────

export const ordenCompraService = {
  list: async (params?: PurListParams): Promise<OrdenCompra[]> => {
    const q: PurListParams = {};
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.proveedor_id) q.proveedor_id = params.proveedor_id;
    if (params?.solicitud_compra_id) q.solicitud_compra_id = params.solicitud_compra_id;
    if (params?.estado) q.estado = params.estado;
    if (params?.fecha_desde) q.fecha_desde = params.fecha_desde;
    if (params?.fecha_hasta) q.fecha_hasta = params.fecha_hasta;
    if (params?.sort_by) q.sort_by = params.sort_by;
    if (params?.order) q.order = params.order;
    if (params?.page) q.page = params.page;
    if (params?.page_size) q.page_size = params.page_size;
    const { data } = await api.get<OrdenCompra[]>(`${BASE}/ordenes-compra`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (ordenCompraId: string): Promise<OrdenCompra> => {
    const { data } = await api.get<OrdenCompra>(`${BASE}/ordenes-compra/${ordenCompraId}`);
    return data;
  },

  create: async (payload: OrdenCompraCreate): Promise<OrdenCompra> => {
    const { data } = await api.post<OrdenCompra>(`${BASE}/ordenes-compra`, payload);
    return data;
  },

  update: async (ordenCompraId: string, payload: OrdenCompraUpdate): Promise<OrdenCompra> => {
    const { data } = await api.put<OrdenCompra>(`${BASE}/ordenes-compra/${ordenCompraId}`, payload);
    return data;
  },

  aprobar: async (ordenCompraId: string): Promise<OrdenCompra> => {
    const { data } = await api.post<OrdenCompra>(`${BASE}/ordenes-compra/${ordenCompraId}/aprobar`);
    return data;
  },

  emitir: async (ordenCompraId: string): Promise<OrdenCompra> => {
    const { data } = await api.post<OrdenCompra>(`${BASE}/ordenes-compra/${ordenCompraId}/emitir`);
    return data;
  },

  anular: async (ordenCompraId: string, motivo?: string): Promise<OrdenCompra> => {
    const { data } = await api.post<OrdenCompra>(
      `${BASE}/ordenes-compra/${ordenCompraId}/anular`,
      motivo ? { motivo_anulacion: motivo } : null,
    );
    return data;
  },
};

// ─── Órdenes de Compra Detalle ──────────────────────────────────────────────

export const ordenCompraDetalleService = {
  listByOrdenCompra: async (ordenCompraId: string, empresaId?: string): Promise<OrdenCompraDetalle[]> => {
    const q: PurListParams = { orden_compra_id: ordenCompraId };
    if (empresaId) q.empresa_id = empresaId;
    const { data } = await api.get<OrdenCompraDetalle[]>(`${BASE}/ordenes-compra-detalle`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (ordenCompraDetalleId: string): Promise<OrdenCompraDetalle> => {
    const { data } = await api.get<OrdenCompraDetalle>(`${BASE}/ordenes-compra-detalle/${ordenCompraDetalleId}`);
    return data;
  },

  create: async (payload: OrdenCompraDetalleCreate): Promise<OrdenCompraDetalle> => {
    const { data } = await api.post<OrdenCompraDetalle>(`${BASE}/ordenes-compra-detalle`, payload);
    return data;
  },

  update: async (ordenCompraDetalleId: string, payload: OrdenCompraDetalleUpdate): Promise<OrdenCompraDetalle> => {
    const { data } = await api.put<OrdenCompraDetalle>(`${BASE}/ordenes-compra-detalle/${ordenCompraDetalleId}`, payload);
    return data;
  },

  // ⚠ DESALINEADO: este endpoint no existe en el contrato API — NO invocar desde UI
  delete: async (ordenCompraDetalleId: string): Promise<void> => {
    await api.delete(`${BASE}/ordenes-compra-detalle/${ordenCompraDetalleId}`);
  },
};

// ─── Órdenes de Compra Transaccional ──────────────────────────────────────

export const ordenCompraTransaccionalService = {
  create: async (payload: OrdenCompraTransaccionalCreate): Promise<OrdenCompra> => {
    const { data } = await api.post<OrdenCompra>(`${BASE}/ordenes-compra/transaccional`, payload);
    return data;
  },
};

// ─── Recepciones ───────────────────────────────────────────────────────────

export const recepcionService = {
  list: async (params?: PurListParams): Promise<Recepcion[]> => {
    const q: PurListParams = {};
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.orden_compra_id) q.orden_compra_id = params.orden_compra_id;
    if (params?.proveedor_id) q.proveedor_id = params.proveedor_id;
    if (params?.almacen_id) q.almacen_id = params.almacen_id;
    if (params?.estado) q.estado = params.estado;
    if (params?.fecha_desde) q.fecha_desde = params.fecha_desde;
    if (params?.fecha_hasta) q.fecha_hasta = params.fecha_hasta;
    if (params?.sort_by) q.sort_by = params.sort_by;
    if (params?.order) q.order = params.order;
    if (params?.page) q.page = params.page;
    if (params?.page_size) q.page_size = params.page_size;
    const { data } = await api.get<Recepcion[]>(`${BASE}/recepciones`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (recepcionId: string): Promise<Recepcion> => {
    const { data } = await api.get<Recepcion>(`${BASE}/recepciones/${recepcionId}`);
    return data;
  },

  create: async (payload: RecepcionCreate): Promise<Recepcion> => {
    const { data } = await api.post<Recepcion>(`${BASE}/recepciones`, payload);
    return data;
  },

  update: async (recepcionId: string, payload: RecepcionUpdate): Promise<Recepcion> => {
    const { data } = await api.put<Recepcion>(`${BASE}/recepciones/${recepcionId}`, payload);
    return data;
  },

  anular: async (recepcionId: string): Promise<Recepcion> => {
    const { data } = await api.post<Recepcion>(`${BASE}/recepciones/${recepcionId}/anular`);
    return data;
  },

  aprobar: async (recepcionId: string): Promise<Recepcion> => {
    const { data } = await api.post<Recepcion>(`${BASE}/recepciones/${recepcionId}/aprobar`);
    return data;
  },

  procesar: async (recepcionId: string): Promise<Recepcion> => {
    const { data } = await api.post<Recepcion>(`${BASE}/recepciones/${recepcionId}/procesar`);
    return data;
  },
};

// ─── Recepciones Detalle ────────────────────────────────────────────────────

export const recepcionDetalleService = {
  listByRecepcion: async (recepcionId: string, empresaId?: string): Promise<RecepcionDetalle[]> => {
    const q: PurListParams = { recepcion_id: recepcionId };
    if (empresaId) q.empresa_id = empresaId;
    const { data } = await api.get<RecepcionDetalle[]>(`${BASE}/recepciones-detalle`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (recepcionDetalleId: string): Promise<RecepcionDetalle> => {
    const { data } = await api.get<RecepcionDetalle>(`${BASE}/recepciones-detalle/${recepcionDetalleId}`);
    return data;
  },

  create: async (payload: RecepcionDetalleCreate): Promise<RecepcionDetalle> => {
    const { data } = await api.post<RecepcionDetalle>(`${BASE}/recepciones-detalle`, payload);
    return data;
  },

  update: async (recepcionDetalleId: string, payload: RecepcionDetalleUpdate): Promise<RecepcionDetalle> => {
    const { data } = await api.put<RecepcionDetalle>(`${BASE}/recepciones-detalle/${recepcionDetalleId}`, payload);
    return data;
  },

  // ⚠ DESALINEADO: este endpoint no existe en el contrato API — NO invocar desde UI
  delete: async (recepcionDetalleId: string): Promise<void> => {
    await api.delete(`${BASE}/recepciones-detalle/${recepcionDetalleId}`);
  },
};

// ─── Recepciones Transaccional ─────────────────────────────────────────────

export const recepcionTransaccionalService = {
  create: async (payload: RecepcionTransaccionalCreate): Promise<Recepcion> => {
    const { data } = await api.post<Recepcion>(`${BASE}/recepciones/transaccional`, payload);
    return data;
  },
};
