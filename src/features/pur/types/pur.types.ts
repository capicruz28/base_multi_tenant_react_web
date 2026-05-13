/**
 * Tipos del módulo PUR (Compras)
 * Alineados con el contrato API: /api/v1/pur/
 */

// ─── Proveedor ──────────────────────────────────────────────────────────────

export interface Proveedor {
  proveedor_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_proveedor: string;
  razon_social: string;
  nombre_comercial?: string | null;
  tipo_documento?: string | null;
  numero_documento: string;
  tipo_proveedor?: string | null;
  categoria_proveedor?: string | null;
  direccion?: string | null;
  pais_id?: string | null;
  departamento_id?: string | null;
  provincia_id?: string | null;
  distrito_id?: string | null;
  ubigeo?: string | null;
  contacto_nombre?: string | null;
  contacto_cargo?: string | null;
  telefono_principal?: string | null;
  telefono_secundario?: string | null;
  email_principal?: string | null;
  email_cotizaciones?: string | null;
  sitio_web?: string | null;
  condicion_pago_defecto?: string | null;
  dias_credito_defecto?: number | null;
  moneda_preferida: string;
  banco?: string | null;
  numero_cuenta?: string | null;
  tipo_cuenta?: string | null;
  cci?: string | null;
  calificacion?: string | null;
  nivel_confianza?: string | null;
  es_proveedor_homologado?: boolean | null;
  fecha_homologacion?: string | null;
  limite_credito?: string | null;
  saldo_pendiente?: string | null;
  estado?: string | null;
  motivo_bloqueo?: string | null;
  es_activo: boolean;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
  usuario_creacion_id?: string | null;
  usuario_actualizacion_id?: string | null;
}

export interface ProveedorCreate {
  empresa_id: string;
  codigo_proveedor: string;
  razon_social: string;
  nombre_comercial?: string | null;
  tipo_documento?: string | null;
  numero_documento: string;
  tipo_proveedor?: string | null;
  categoria_proveedor?: string | null;
  direccion?: string | null;
  pais_id?: string | null;
  departamento_id?: string | null;
  provincia_id?: string | null;
  distrito_id?: string | null;
  ubigeo?: string | null;
  contacto_nombre?: string | null;
  contacto_cargo?: string | null;
  telefono_principal?: string | null;
  telefono_secundario?: string | null;
  email_principal?: string | null;
  email_cotizaciones?: string | null;
  sitio_web?: string | null;
  condicion_pago_defecto?: string | null;
  dias_credito_defecto?: number | null;
  moneda_preferida: string;
  banco?: string | null;
  numero_cuenta?: string | null;
  tipo_cuenta?: string | null;
  cci?: string | null;
  calificacion?: number | null;
  nivel_confianza?: string | null;
  es_proveedor_homologado?: boolean | null;
  fecha_homologacion?: string | null;
  limite_credito?: number | null;
  saldo_pendiente?: number | null;
  estado?: string | null;
  motivo_bloqueo?: string | null;
  es_activo?: boolean | null;
  observaciones?: string | null;
}

export interface ProveedorUpdate extends Partial<ProveedorCreate> {}

// ─── Contacto de Proveedor ──────────────────────────────────────────────────

export interface ContactoProveedor {
  contacto_id: string;
  cliente_id: string;
  proveedor_id: string;
  nombre_completo: string;
  cargo?: string | null;
  area?: string | null;
  telefono?: string | null;
  telefono_movil?: string | null;
  email?: string | null;
  es_contacto_principal?: boolean | null;
  es_contacto_cotizaciones?: boolean | null;
  es_contacto_cobranzas?: boolean | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
}

export interface ContactoProveedorCreate {
  proveedor_id: string;
  nombre_completo: string;
  cargo?: string | null;
  area?: string | null;
  telefono?: string | null;
  telefono_movil?: string | null;
  email?: string | null;
  es_contacto_principal?: boolean | null;
  es_contacto_cotizaciones?: boolean | null;
  es_contacto_cobranzas?: boolean | null;
  es_activo?: boolean | null;
}

export interface ContactoProveedorUpdate extends Partial<ContactoProveedorCreate> {}

// ─── Producto por Proveedor ─────────────────────────────────────────────────

export interface ProductoProveedor {
  producto_proveedor_id: string;
  cliente_id: string;
  proveedor_id: string;
  producto_id: string;
  codigo_proveedor?: string | null;
  descripcion_proveedor?: string | null;
  precio_unitario: string;
  moneda_id: string;
  unidad_medida_id: string;
  cantidad_minima?: string | null;
  multiplo_compra?: string | null;
  tiempo_entrega_dias?: number | null;
  fecha_vigencia_desde?: string | null;
  fecha_vigencia_hasta?: string | null;
  es_proveedor_preferido?: boolean | null;
  prioridad?: number | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

export interface ProductoProveedorCreate {
  proveedor_id: string;
  producto_id: string;
  codigo_proveedor?: string | null;
  descripcion_proveedor?: string | null;
  precio_unitario: number;
  moneda_id: string;
  unidad_medida_id: string;
  cantidad_minima?: number | null;
  multiplo_compra?: number | null;
  tiempo_entrega_dias?: number | null;
  fecha_vigencia_desde?: string | null;
  fecha_vigencia_hasta?: string | null;
  es_proveedor_preferido?: boolean | null;
  prioridad?: number | null;
  es_activo?: boolean | null;
}

export interface ProductoProveedorUpdate extends Partial<ProductoProveedorCreate> {}

// ─── Solicitud de Compra ───────────────────────────────────────────────────

export interface SolicitudCompra {
  solicitud_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_solicitud: string;
  fecha_solicitud: string;
  fecha_requerida: string;
  departamento_solicitante_id?: string | null;
  usuario_solicitante_id: string;
  solicitante_nombre?: string | null;
  almacen_destino_id?: string | null;
  centro_costo_id?: string | null;
  tipo_solicitud?: string | null;
  motivo_solicitud?: string | null;
  total_items?: number | null;
  total_estimado?: string | null;
  moneda_id: string;
  estado: string;
  requiere_aprobacion?: boolean | null;
  aprobado_por_usuario_id?: string | null;
  fecha_aprobacion?: string | null;
  orden_compra_generada?: boolean | null;
  observaciones?: string | null;
  motivo_rechazo?: string | null;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface SolicitudCompraCreate {
  empresa_id: string;
  numero_solicitud: string;
  fecha_solicitud?: string | null;
  fecha_requerida: string;
  departamento_solicitante_id?: string | null;
  usuario_solicitante_id: string;
  solicitante_nombre?: string | null;
  almacen_destino_id?: string | null;
  centro_costo_id?: string | null;
  tipo_solicitud?: string | null;
  motivo_solicitud?: string | null;
  total_items?: number | null;
  total_estimado?: number | null;
  moneda_id: string;
  estado?: string | null;
  requiere_aprobacion?: boolean | null;
  observaciones?: string | null;
}

export interface SolicitudCompraUpdate extends Partial<SolicitudCompraCreate> {
  aprobado_por_usuario_id?: string | null;
  fecha_aprobacion?: string | null;
  orden_compra_generada?: boolean | null;
  motivo_rechazo?: string | null;
}

// ─── Solicitud de Compra Detalle ────────────────────────────────────────────

export interface SolicitudCompraDetalle {
  solicitud_detalle_id: string;
  cliente_id: string;
  empresa_id: string;
  solicitud_id: string;
  producto_id: string;
  cantidad_solicitada: string;
  unidad_medida_id: string;
  precio_referencial?: string | null;
  cantidad_atendida?: string | null;
  total_referencial?: string | null;
  cantidad_pendiente?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
}

export interface SolicitudCompraDetalleCreate {
  empresa_id: string;
  solicitud_id: string;
  producto_id: string;
  cantidad_solicitada: number;
  unidad_medida_id: string;
  precio_referencial?: number | null;
  cantidad_atendida?: number | null;
  observaciones?: string | null;
}

export interface SolicitudCompraDetalleUpdate {
  cantidad_solicitada?: number | null;
  unidad_medida_id?: string | null;
  precio_referencial?: number | null;
  cantidad_atendida?: number | null;
  observaciones?: string | null;
}

// ─── Cotización ────────────────────────────────────────────────────────────

export interface Cotizacion {
  cotizacion_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_cotizacion: string;
  fecha_cotizacion: string;
  fecha_vencimiento?: string | null;
  proveedor_id: string;
  solicitud_compra_id?: string | null;
  condicion_pago?: string | null;
  dias_credito?: number | null;
  tiempo_entrega_dias?: number | null;
  lugar_entrega?: string | null;
  moneda_id: string;
  tipo_cambio?: string | null;
  subtotal?: string | null;
  descuento?: string | null;
  igv?: string | null;
  total?: string | null;
  estado: string;
  es_ganadora?: boolean | null;
  observaciones?: string | null;
  motivo_rechazo?: string | null;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface CotizacionCreate {
  empresa_id: string;
  numero_cotizacion: string;
  fecha_cotizacion?: string | null;
  fecha_vencimiento?: string | null;
  proveedor_id: string;
  solicitud_compra_id?: string | null;
  condicion_pago?: string | null;
  dias_credito?: number | null;
  tiempo_entrega_dias?: number | null;
  lugar_entrega?: string | null;
  moneda_id: string;
  tipo_cambio?: string | null;
  subtotal?: string | null;
  descuento?: string | null;
  igv?: string | null;
  total?: string | null;
  estado?: string | null;
  es_ganadora?: boolean | null;
  observaciones?: string | null;
}

export interface CotizacionUpdate extends Partial<CotizacionCreate> {
  motivo_rechazo?: string | null;
}

// ─── Cotización Detalle ────────────────────────────────────────────────────

export interface CotizacionDetalle {
  cotizacion_detalle_id: string;
  cliente_id: string;
  empresa_id: string;
  cotizacion_id: string;
  producto_id: string;
  cantidad: string;
  unidad_medida_id: string;
  precio_unitario: string;
  descuento_porcentaje?: string | null;
  precio_neto?: string | null;
  total?: string | null;
  tiempo_entrega_dias?: number | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
}

export interface CotizacionDetalleCreate {
  empresa_id: string;
  cotizacion_id: string;
  producto_id: string;
  cantidad: number;
  unidad_medida_id: string;
  precio_unitario: number;
  descuento_porcentaje?: number | null;
  tiempo_entrega_dias?: number | null;
  observaciones?: string | null;
}

export interface CotizacionDetalleUpdate {
  cantidad?: number | null;
  unidad_medida_id?: string | null;
  precio_unitario?: number | null;
  descuento_porcentaje?: number | null;
  tiempo_entrega_dias?: number | null;
  observaciones?: string | null;
}

// ─── Orden de Compra ───────────────────────────────────────────────────────

export interface OrdenCompra {
  orden_compra_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_oc: string;
  fecha_emision: string;
  fecha_requerida: string;
  proveedor_id: string;
  proveedor_razon_social?: string | null;
  proveedor_ruc?: string | null;
  almacen_destino_id?: string | null;
  direccion_entrega?: string | null;
  solicitud_compra_id?: string | null;
  cotizacion_id?: string | null;
  condicion_pago: string;
  dias_credito?: number | null;
  moneda_id: string;
  tipo_cambio?: string | null;
  subtotal?: string | null;
  descuento_global?: string | null;
  igv?: string | null;
  total?: string | null;
  total_items?: number | null;
  items_recepcionados?: number | null;
  porcentaje_recepcion?: string | null;
  estado: string;
  requiere_aprobacion?: boolean | null;
  aprobado_por_usuario_id?: string | null;
  fecha_aprobacion?: string | null;
  centro_costo_id?: string | null;
  observaciones?: string | null;
  terminos_condiciones?: string | null;
  motivo_anulacion?: string | null;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
  fecha_anulacion?: string | null;
  usuario_creacion_id?: string | null;
  usuario_aprobacion_id?: string | null;
}

export interface OrdenCompraCreate {
  empresa_id: string;
  numero_oc: string;
  fecha_emision?: string | null;
  fecha_requerida: string;
  proveedor_id: string;
  proveedor_razon_social?: string | null;
  proveedor_ruc?: string | null;
  almacen_destino_id?: string | null;
  direccion_entrega?: string | null;
  solicitud_compra_id?: string | null;
  cotizacion_id?: string | null;
  condicion_pago: string;
  dias_credito?: number | null;
  moneda_id: string;
  tipo_cambio?: string | null;
  subtotal?: string | null;
  descuento_global?: string | null;
  igv?: string | null;
  total?: string | null;
  total_items?: number | null;
  estado?: string | null;
  requiere_aprobacion?: boolean | null;
  centro_costo_id?: string | null;
  observaciones?: string | null;
  terminos_condiciones?: string | null;
}

export interface OrdenCompraUpdate extends Partial<OrdenCompraCreate> {
  items_recepcionados?: number | null;
  porcentaje_recepcion?: string | null;
  aprobado_por_usuario_id?: string | null;
  fecha_aprobacion?: string | null;
  motivo_anulacion?: string | null;
  fecha_anulacion?: string | null;
}

// ─── Orden de Compra Detalle ──────────────────────────────────────────────

export interface OrdenCompraDetalle {
  orden_compra_detalle_id: string;
  cliente_id: string;
  empresa_id: string;
  orden_compra_id: string;
  producto_id: string;
  cantidad_ordenada: string;
  unidad_medida_id: string;
  precio_unitario: string;
  descuento_porcentaje?: string | null;
  precio_neto?: string | null;
  subtotal?: string | null;
  igv?: string | null;
  total?: string | null;
  cantidad_recepcionada?: string | null;
  cantidad_pendiente?: string | null;
  observaciones?: string | null;
  especificaciones?: string | null;
  fecha_creacion?: string | null;
}

export interface OrdenCompraDetalleCreate {
  empresa_id: string;
  orden_compra_id: string;
  producto_id: string;
  cantidad_ordenada: number;
  unidad_medida_id: string;
  precio_unitario: number;
  descuento_porcentaje?: number | null;
  cantidad_recepcionada?: number | null;
  observaciones?: string | null;
  especificaciones?: string | null;
}

export interface OrdenCompraDetalleUpdate {
  cantidad_ordenada?: number | null;
  unidad_medida_id?: string | null;
  precio_unitario?: number | null;
  descuento_porcentaje?: number | null;
  cantidad_recepcionada?: number | null;
  observaciones?: string | null;
  especificaciones?: string | null;
}

// ─── Recepción ────────────────────────────────────────────────────────────

export interface Recepcion {
  recepcion_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_recepcion: string;
  fecha_recepcion: string;
  orden_compra_id: string;
  proveedor_id: string;
  almacen_id: string;
  guia_remision_numero?: string | null;
  guia_remision_fecha?: string | null;
  transportista?: string | null;
  placa_vehiculo?: string | null;
  recepcionado_por_usuario_id?: string | null;
  recepcionado_por_nombre?: string | null;
  total_items?: number | null;
  total_cantidad?: string | null;
  estado: string;
  requiere_inspeccion?: boolean | null;
  inspeccion_id?: string | null;
  movimiento_inventario_id?: string | null;
  observaciones?: string | null;
  incidencias?: string | null;
  fecha_creacion?: string | null;
  fecha_procesado?: string | null;
  usuario_creacion_id?: string | null;
  usuario_procesado_id?: string | null;
}

export interface RecepcionCreate {
  empresa_id: string;
  numero_recepcion: string;
  fecha_recepcion?: string | null;
  orden_compra_id: string;
  proveedor_id: string;
  almacen_id: string;
  guia_remision_numero?: string | null;
  guia_remision_fecha?: string | null;
  transportista?: string | null;
  placa_vehiculo?: string | null;
  recepcionado_por_usuario_id?: string | null;
  recepcionado_por_nombre?: string | null;
  total_items?: number | null;
  total_cantidad?: number | null;
  estado?: string | null;
  requiere_inspeccion?: boolean | null;
  inspeccion_id?: string | null;
  movimiento_inventario_id?: string | null;
  observaciones?: string | null;
  incidencias?: string | null;
}

export interface RecepcionUpdate extends Partial<RecepcionCreate> {
  fecha_procesado?: string | null;
  usuario_procesado_id?: string | null;
}

// ─── Recepción Detalle ─────────────────────────────────────────────────────

export interface RecepcionDetalle {
  recepcion_detalle_id: string;
  cliente_id: string;
  empresa_id: string;
  recepcion_id: string;
  orden_compra_detalle_id: string;
  producto_id: string;
  cantidad_ordenada: string;
  cantidad_recepcionada: string;
  unidad_medida_id: string;
  lote?: string | null;
  fecha_vencimiento?: string | null;
  precio_unitario?: string | null;
  diferencia?: string | null;
  total?: string | null;
  ubicacion_almacen?: string | null;
  observaciones?: string | null;
  motivo_diferencia?: string | null;
  fecha_creacion?: string | null;
}

export interface RecepcionDetalleCreate {
  empresa_id: string;
  recepcion_id: string;
  orden_compra_detalle_id: string;
  producto_id: string;
  cantidad_ordenada: number;
  cantidad_recepcionada: number;
  unidad_medida_id: string;
  lote?: string | null;
  fecha_vencimiento?: string | null;
  precio_unitario?: number | null;
  ubicacion_almacen?: string | null;
  observaciones?: string | null;
  motivo_diferencia?: string | null;
}

export interface RecepcionDetalleUpdate {
  cantidad_recepcionada?: number | null;
  lote?: string | null;
  fecha_vencimiento?: string | null;
  precio_unitario?: number | null;
  ubicacion_almacen?: string | null;
  observaciones?: string | null;
  motivo_diferencia?: string | null;
}

// ─── Tipos Transaccionales ─────────────────────────────────────────────────

export interface SolicitudCompraTransaccionalCreate {
  cabecera: SolicitudCompraCreate;
  detalle: SolicitudCompraDetalleCreate[];
}

export interface CotizacionTransaccionalCreate {
  cabecera: CotizacionCreate;
  detalle: CotizacionDetalleCreate[];
}

export interface OrdenCompraTransaccionalCreate {
  cabecera: OrdenCompraCreate;
  detalle: OrdenCompraDetalleCreate[];
}

export interface RecepcionTransaccionalCreate {
  cabecera: RecepcionCreate;
  detalle: RecepcionDetalleCreate[];
}

// ─── Filtros de listado ────────────────────────────────────────────────────

export interface PurListParams {
  empresa_id?: string;
  proveedor_id?: string;
  producto_id?: string;
  solicitud_compra_id?: string;
  cotizacion_id?: string;
  orden_compra_id?: string;
  recepcion_id?: string;
  almacen_id?: string;
  estado?: string;
  solo_activos?: boolean;
  buscar?: string;
  tipo_proveedor?: string;
  categoria_proveedor?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  sort_by?: string;
  order?: string;
  page?: number;
  page_size?: number;
}
