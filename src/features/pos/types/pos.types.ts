/**
 * Tipos del módulo POS (Punto de Venta)
 * Alineados con DOC_FRONTEND_MODULO_POS.md — /api/v1/pos/
 */

// ─── Punto de Venta ─────────────────────────────────────────────────────────

export type TipoPuntoVenta = 'caja' | 'autoservicio' | 'movil';
export type EstadoPuntoVenta = 'abierto' | 'cerrado' | 'bloqueado';

export interface PuntoVenta {
  punto_venta_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_punto_venta: string;
  nombre: string;
  sucursal_id: string;
  ubicacion_fisica?: string | null;
  tipo_punto_venta?: string | null;
  serie_factura_id?: string | null;
  serie_boleta_id?: string | null;
  serie_nota_credito_id?: string | null;
  almacen_id?: string | null;
  lista_precio_id?: string | null;
  acepta_efectivo?: boolean;
  acepta_tarjeta?: boolean;
  acepta_transferencia?: boolean;
  acepta_yape_plin?: boolean;
  codigo_terminal?: string | null;
  ip_terminal?: string | null;
  estado?: string | null;
  es_activo?: boolean;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
  sucursal_nombre?: string | null;
  almacen_nombre?: string | null;
}

export interface PuntoVentaCreate {
  empresa_id: string;
  codigo_punto_venta: string;
  nombre: string;
  sucursal_id: string;
  ubicacion_fisica?: string | null;
  tipo_punto_venta?: TipoPuntoVenta | null;
  serie_factura_id?: string | null;
  serie_boleta_id?: string | null;
  serie_nota_credito_id?: string | null;
  almacen_id?: string | null;
  lista_precio_id?: string | null;
  acepta_efectivo?: boolean;
  acepta_tarjeta?: boolean;
  acepta_transferencia?: boolean;
  acepta_yape_plin?: boolean;
  codigo_terminal?: string | null;
  ip_terminal?: string | null;
  estado?: EstadoPuntoVenta | null;
  es_activo?: boolean;
}

export interface PuntoVentaUpdate {
  codigo_punto_venta?: string;
  nombre?: string;
  sucursal_id?: string;
  ubicacion_fisica?: string | null;
  tipo_punto_venta?: TipoPuntoVenta | null;
  almacen_id?: string | null;
  lista_precio_id?: string | null;
  acepta_efectivo?: boolean;
  acepta_tarjeta?: boolean;
  acepta_transferencia?: boolean;
  acepta_yape_plin?: boolean;
  estado?: EstadoPuntoVenta | null;
  es_activo?: boolean;
}

// ─── Turno de Caja ─────────────────────────────────────────────────────────

export type EstadoTurno = 'abierto' | 'cerrado';

export interface TurnoCaja {
  turno_id: string;
  cliente_id: string;
  empresa_id: string;
  punto_venta_id: string;
  numero_turno: string;
  cajero_usuario_id: string;
  cajero_nombre?: string | null;
  fecha_apertura: string;
  monto_apertura: number;
  fecha_cierre?: string | null;
  monto_cierre_esperado?: number | null;
  monto_cierre_real?: number | null;
  total_ventas?: number | null;
  total_ventas_efectivo?: number | null;
  total_ventas_tarjeta?: number | null;
  total_ventas_transferencia?: number | null;
  total_ventas_otros?: number | null;
  total_egresos?: number | null;
  total_facturas?: number | null;
  total_boletas?: number | null;
  total_notas_credito?: number | null;
  estado?: string | null;
  observaciones_apertura?: string | null;
  observaciones_cierre?: string | null;
  fecha_creacion?: string | null;
  cerrado_por_usuario_id?: string | null;
  punto_venta_nombre?: string | null;
}

export interface TurnoCajaCreate {
  empresa_id: string;
  punto_venta_id: string;
  numero_turno: string;
  cajero_usuario_id: string;
  cajero_nombre?: string | null;
  monto_apertura: number;
  observaciones_apertura?: string | null;
  estado?: EstadoTurno | null;
}

export interface TurnoCajaUpdate {
  fecha_cierre?: string | null;
  monto_cierre_esperado?: number | null;
  monto_cierre_real?: number | null;
  total_ventas?: number | null;
  total_ventas_efectivo?: number | null;
  total_ventas_tarjeta?: number | null;
  total_ventas_transferencia?: number | null;
  total_ventas_otros?: number | null;
  total_egresos?: number | null;
  total_facturas?: number | null;
  total_boletas?: number | null;
  total_notas_credito?: number | null;
  estado?: EstadoTurno | null;
  observaciones_cierre?: string | null;
  cerrado_por_usuario_id?: string | null;
}

// ─── Venta POS ─────────────────────────────────────────────────────────────

export type FormaPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';
export type EstadoVenta = 'borrador' | 'completada' | 'anulada';

export interface Venta {
  venta_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_venta: string;
  fecha_venta: string;
  punto_venta_id: string;
  turno_caja_id: string;
  vendedor_usuario_id: string;
  vendedor_nombre?: string | null;
  cliente_venta_id?: string | null;
  cliente_nombre?: string | null;
  cliente_documento_tipo?: string | null;
  cliente_documento_numero?: string | null;
  moneda?: string | null;
  subtotal?: number | null;
  descuento_global?: number | null;
  igv?: number | null;
  total?: number | null;
  redondeo?: number | null;
  forma_pago: string;
  monto_efectivo?: number | null;
  monto_tarjeta?: number | null;
  monto_transferencia?: number | null;
  monto_otros?: number | null;
  monto_recibido?: number | null;
  comprobante_id?: string | null;
  tipo_comprobante?: string | null;
  numero_comprobante?: string | null;
  estado?: string | null;
  fecha_anulacion?: string | null;
  motivo_anulacion?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface VentaCreate {
  empresa_id: string;
  numero_venta: string;
  punto_venta_id: string;
  turno_caja_id: string;
  vendedor_usuario_id: string;
  vendedor_nombre?: string | null;
  cliente_venta_id?: string | null;
  cliente_nombre?: string | null;
  cliente_documento_tipo?: string | null;
  cliente_documento_numero?: string | null;
  moneda?: string | null;
  subtotal: number;
  descuento_global?: number;
  igv: number;
  total: number;
  redondeo?: number;
  forma_pago: FormaPago;
  monto_efectivo?: number;
  monto_tarjeta?: number;
  monto_transferencia?: number;
  monto_otros?: number;
  monto_recibido?: number;
  estado?: EstadoVenta | null;
  observaciones?: string | null;
}

export interface VentaUpdate {
  comprobante_id?: string | null;
  tipo_comprobante?: string | null;
  numero_comprobante?: string | null;
  estado?: EstadoVenta | null;
  fecha_anulacion?: string | null;
  motivo_anulacion?: string | null;
  observaciones?: string | null;
}

// ─── Venta Detalle ─────────────────────────────────────────────────────────

export interface VentaDetalle {
  venta_detalle_id: string;
  cliente_id: string;
  venta_id: string;
  item: number;
  producto_id: string;
  descripcion?: string | null;
  cantidad: number;
  unidad_medida_id: string;
  precio_unitario: number;
  descuento_porcentaje?: number | null;
  promocion_id?: string | null;
  lote?: string | null;
  fecha_creacion?: string | null;
  producto_codigo?: string | null;
}

export interface VentaDetalleCreate {
  venta_id: string;
  item: number;
  producto_id: string;
  descripcion?: string | null;
  cantidad: number;
  unidad_medida_id: string;
  precio_unitario: number;
  descuento_porcentaje?: number;
  promocion_id?: string | null;
  lote?: string | null;
}

export interface VentaDetalleUpdate {
  cantidad?: number;
  precio_unitario?: number;
  descuento_porcentaje?: number;
  descripcion?: string | null;
}
