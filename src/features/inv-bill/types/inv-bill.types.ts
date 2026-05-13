/**
 * Tipos del módulo INV_BILL (Facturación Electrónica)
 * Alineados con la documentación del backend: /api/v1/inv-bill/
 * Incluye TODOS los campos esenciales para funcionamiento completo del sistema
 */

// ─── Serie de Comprobante ───────────────────────────────────────────────────

export interface SerieComprobante {
  serie_id: string;
  cliente_id: string;
  empresa_id: string;
  tipo_comprobante?: string | null; // '01'=Factura, '03'=Boleta, '07'=NC, '08'=ND
  serie?: string | null; // 'F001', 'B001', etc
  numero_actual?: number | null;
  numero_inicial?: number | null;
  numero_final?: number | null;
  sucursal_id?: string | null;
  punto_venta_id?: string | null;
  es_electronica?: boolean;
  requiere_autorizacion_sunat?: boolean;
  es_activo: boolean;
  fecha_activacion?: string | null;
  fecha_baja?: string | null;
  motivo_baja?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface SerieComprobanteCreate {
  empresa_id: string;
  tipo_comprobante: string; // '01' | '03' | '07' | '08'
  serie: string;
  numero_actual?: number | null;
  numero_inicial?: number | null;
  numero_final?: number | null;
  sucursal_id?: string | null;
  punto_venta_id?: string | null;
  es_electronica?: boolean;
  requiere_autorizacion_sunat?: boolean;
  es_activo?: boolean;
  fecha_activacion?: string | null;
}

export interface SerieComprobanteUpdate extends Partial<SerieComprobanteCreate> {}

// ─── Comprobante ───────────────────────────────────────────────────────────

export interface Comprobante {
  comprobante_id: string;
  cliente_id: string;
  empresa_id: string;
  tipo_comprobante?: string | null; // '01' | '03' | '07' | '08'
  serie?: string | null;
  numero?: string | null;
  fecha_emision?: string | null;
  fecha_vencimiento?: string | null;
  hora_emision?: string | null;
  cliente_venta_id?: string | null;
  cliente_tipo_documento?: string | null; // '6'=RUC, '1'=DNI, etc
  cliente_numero_documento?: string | null;
  cliente_razon_social?: string | null;
  cliente_direccion?: string | null;
  pedido_id?: string | null;
  venta_id?: string | null;
  guia_remision_id?: string | null;
  comprobante_referencia_id?: string | null;
  tipo_nota?: string | null;
  motivo_nota?: string | null;
  moneda?: string | null;
  tipo_cambio?: number | null;
  subtotal_gravado?: number | null;
  subtotal_exonerado?: number | null;
  subtotal_inafecto?: number | null;
  subtotal_gratuito?: number | null;
  descuento_global?: number | null;
  igv?: number | null;
  total?: number | null;
  aplica_detraccion?: boolean;
  porcentaje_detraccion?: number | null;
  monto_detraccion?: number | null;
  aplica_retencion?: boolean;
  monto_retencion?: number | null;
  aplica_percepcion?: boolean;
  monto_percepcion?: number | null;
  condicion_pago?: string | null;
  forma_pago?: string | null; // 'contado' | 'credito'
  codigo_hash?: string | null;
  firma_digital?: string | null;
  codigo_qr?: string | null;
  estado_sunat?: string | null; // 'pendiente' | 'aceptado' | 'rechazado' | 'baja'
  codigo_respuesta_sunat?: string | null;
  mensaje_respuesta_sunat?: string | null;
  fecha_envio_sunat?: string | null;
  fecha_respuesta_sunat?: string | null;
  cdr_xml?: string | null;
  cdr_fecha?: string | null;
  xml_comprobante?: string | null;
  pdf_url?: string | null;
  estado?: string | null; // 'borrador' | 'emitido' | 'anulado' | 'dado_baja'
  fecha_anulacion?: string | null;
  motivo_anulacion?: string | null;
  observaciones?: string | null;
  vendedor_usuario_id?: string | null;
  vendedor_nombre?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface ComprobanteCreate {
  empresa_id: string;
  tipo_comprobante: string; // '01' | '03' | '07' | '08'
  serie?: string | null;
  numero?: string | null;
  fecha_emision: string;
  fecha_vencimiento?: string | null;
  hora_emision?: string | null;
  cliente_venta_id?: string | null;
  cliente_tipo_documento?: string | null;
  cliente_numero_documento?: string | null;
  cliente_razon_social?: string | null;
  cliente_direccion?: string | null;
  pedido_id?: string | null;
  moneda?: string | null;
  tipo_cambio?: number | null;
  subtotal_gravado?: number | null;
  subtotal_exonerado?: number | null;
  subtotal_inafecto?: number | null;
  subtotal_gratuito?: number | null;
  descuento_global?: number | null;
  igv?: number | null;
  total?: number | null;
  condicion_pago?: string | null;
  forma_pago?: string | null;
  estado?: string | null;
  observaciones?: string | null;
  vendedor_usuario_id?: string | null;
  vendedor_nombre?: string | null;
}

export interface ComprobanteUpdate extends Partial<ComprobanteCreate> {}

// ─── Comprobante Detalle ───────────────────────────────────────────────────

export interface ComprobanteDetalle {
  comprobante_detalle_id: string;
  cliente_id: string;
  comprobante_id: string;
  item?: number | null;
  producto_id?: string | null;
  codigo_producto?: string | null;
  descripcion?: string | null;
  cantidad?: number | null;
  unidad_medida_codigo?: string | null; // Código SUNAT: 'NIU', 'ZZ', etc
  unidad_medida_id?: string | null;
  precio_unitario?: number | null;
  descuento_unitario?: number | null;
  tipo_afectacion_igv?: string | null; // '10'=Gravado, '20'=Exonerado, etc
  porcentaje_igv?: number | null;
  codigo_producto_sunat?: string | null;
  lote?: string | null;
  fecha_creacion?: string | null;
}

export interface ComprobanteDetalleCreate {
  comprobante_id: string;
  item?: number | null;
  producto_id?: string | null;
  codigo_producto?: string | null;
  descripcion: string;
  cantidad: number;
  unidad_medida_codigo?: string | null;
  unidad_medida_id?: string | null;
  precio_unitario: number;
  descuento_unitario?: number | null;
  tipo_afectacion_igv?: string | null;
  porcentaje_igv?: number | null;
  codigo_producto_sunat?: string | null;
  lote?: string | null;
}

export interface ComprobanteDetalleUpdate extends Partial<ComprobanteDetalleCreate> {}

// ─── Filtros de listado ────────────────────────────────────────────────────

export interface InvBillListParams {
  empresa_id?: string;
  tipo_comprobante?: string;
  cliente_venta_id?: string;
  pedido_id?: string;
  comprobante_id?: string;
  estado?: string;
  estado_sunat?: string;
  solo_activos?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
}
