/**
 * Tipos del módulo SLS (Ventas)
 * Alineados con la documentación del backend: /api/v1/sls/
 * Incluye TODOS los campos esenciales para funcionamiento completo del sistema
 */

// ─── Cliente ────────────────────────────────────────────────────────────────

export interface Cliente {
  cliente_venta_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_cliente: string;
  tipo_cliente?: string | null; // 'empresa' | 'persona'
  razon_social: string;
  nombre_comercial?: string | null;
  tipo_documento?: string | null; // 'RUC' | 'DNI' | 'CE' | 'PASAPORTE'
  numero_documento: string;
  categoria_cliente?: string | null;
  segmento?: string | null;
  canal_venta?: string | null;
  direccion?: string | null;
  pais?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  ubigeo?: string | null;
  contacto_nombre?: string | null;
  contacto_cargo?: string | null;
  telefono_principal?: string | null;
  telefono_secundario?: string | null;
  email_principal?: string | null;
  email_facturacion?: string | null;
  sitio_web?: string | null;
  condicion_pago_defecto?: string | null;
  dias_credito_defecto?: number | null;
  moneda_preferida?: string | null;
  lista_precio_id?: string | null;
  limite_credito?: number | null;
  saldo_pendiente?: number | null;
  saldo_vencido?: number | null;
  vendedor_usuario_id?: string | null;
  vendedor_nombre?: string | null;
  banco?: string | null;
  numero_cuenta?: string | null;
  calificacion?: number | null;
  nivel_riesgo?: string | null; // 'bajo' | 'medio' | 'alto'
  estado?: string | null; // 'prospecto' | 'activo' | 'inactivo' | 'bloqueado'
  motivo_bloqueo?: string | null;
  es_activo: boolean;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
  fecha_primera_compra?: string | null;
  fecha_ultima_compra?: string | null;
  usuario_creacion_id?: string | null;
}

export interface ClienteCreate {
  empresa_id: string;
  codigo_cliente: string;
  tipo_cliente?: string | null;
  razon_social: string;
  nombre_comercial?: string | null;
  tipo_documento?: string | null;
  numero_documento: string;
  categoria_cliente?: string | null;
  segmento?: string | null;
  canal_venta?: string | null;
  direccion?: string | null;
  pais?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  ubigeo?: string | null;
  contacto_nombre?: string | null;
  contacto_cargo?: string | null;
  telefono_principal?: string | null;
  telefono_secundario?: string | null;
  email_principal?: string | null;
  email_facturacion?: string | null;
  sitio_web?: string | null;
  condicion_pago_defecto?: string | null;
  dias_credito_defecto?: number | null;
  moneda_preferida?: string | null;
  limite_credito?: number | null;
  vendedor_usuario_id?: string | null;
  vendedor_nombre?: string | null;
  banco?: string | null;
  numero_cuenta?: string | null;
  calificacion?: number | null;
  nivel_riesgo?: string | null;
  estado?: string | null;
  motivo_bloqueo?: string | null;
  es_activo?: boolean;
  observaciones?: string | null;
}

export interface ClienteUpdate extends Partial<ClienteCreate> {}

// ─── Contacto de Cliente ────────────────────────────────────────────────────

export interface ContactoCliente {
  contacto_id: string;
  cliente_id: string;
  cliente_venta_id: string;
  nombre_completo: string;
  cargo?: string | null;
  area?: string | null;
  telefono?: string | null;
  telefono_movil?: string | null;
  email?: string | null;
  es_contacto_principal?: boolean;
  es_contacto_comercial?: boolean;
  es_contacto_cobranzas?: boolean;
  fecha_nacimiento?: string | null;
  observaciones?: string | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
}

export interface ContactoClienteCreate {
  cliente_venta_id: string;
  nombre_completo: string;
  cargo?: string | null;
  area?: string | null;
  telefono?: string | null;
  telefono_movil?: string | null;
  email?: string | null;
  es_contacto_principal?: boolean;
  es_contacto_comercial?: boolean;
  es_contacto_cobranzas?: boolean;
  fecha_nacimiento?: string | null;
  observaciones?: string | null;
  es_activo?: boolean;
}

export interface ContactoClienteUpdate extends Partial<ContactoClienteCreate> {}

// ─── Dirección de Cliente ────────────────────────────────────────────────────

export interface DireccionCliente {
  direccion_id: string;
  cliente_id: string;
  cliente_venta_id: string;
  codigo_direccion?: string | null;
  nombre_direccion?: string | null;
  direccion?: string | null;
  referencia?: string | null;
  pais?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  ubigeo?: string | null;
  codigo_postal?: string | null;
  contacto_nombre?: string | null;
  contacto_telefono?: string | null;
  es_direccion_fiscal?: boolean;
  es_direccion_entrega_defecto?: boolean;
  es_activo: boolean;
  fecha_creacion?: string | null;
}

export interface DireccionClienteCreate {
  cliente_venta_id: string;
  codigo_direccion?: string | null;
  nombre_direccion?: string | null;
  direccion?: string | null;
  referencia?: string | null;
  pais?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  ubigeo?: string | null;
  codigo_postal?: string | null;
  contacto_nombre?: string | null;
  contacto_telefono?: string | null;
  es_direccion_fiscal?: boolean;
  es_direccion_entrega_defecto?: boolean;
  es_activo?: boolean;
}

export interface DireccionClienteUpdate extends Partial<DireccionClienteCreate> {}

// ─── Cotización ──────────────────────────────────────────────────────────────

export interface Cotizacion {
  cotizacion_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_cotizacion: string;
  fecha_cotizacion: string;
  fecha_vencimiento?: string | null;
  cliente_venta_id: string;
  cliente_razon_social?: string | null;
  cliente_ruc?: string | null;
  contacto_nombre?: string | null;
  vendedor_usuario_id?: string | null;
  vendedor_nombre?: string | null;
  oportunidad_id?: string | null;
  condicion_pago?: string | null;
  dias_credito?: number | null;
  tiempo_entrega_dias?: number | null;
  moneda?: string | null;
  tipo_cambio?: number | null;
  subtotal?: number | null;
  descuento_global?: number | null;
  igv?: number | null;
  total?: number | null;
  estado?: string | null; // 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'vencida' | 'convertida'
  fecha_envio?: string | null;
  fecha_respuesta?: string | null;
  motivo_rechazo?: string | null;
  convertida_pedido?: boolean;
  pedido_venta_id?: string | null;
  fecha_conversion?: string | null;
  observaciones?: string | null;
  terminos_condiciones?: string | null;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface CotizacionCreate {
  empresa_id: string;
  numero_cotizacion?: string | null;
  fecha_cotizacion: string;
  fecha_vencimiento?: string | null;
  cliente_venta_id: string;
  cliente_razon_social?: string | null;
  cliente_ruc?: string | null;
  contacto_nombre?: string | null;
  vendedor_usuario_id?: string | null;
  vendedor_nombre?: string | null;
  condicion_pago?: string | null;
  dias_credito?: number | null;
  tiempo_entrega_dias?: number | null;
  moneda?: string | null;
  tipo_cambio?: number | null;
  subtotal?: number | null;
  descuento_global?: number | null;
  igv?: number | null;
  total?: number | null;
  estado?: string | null;
  observaciones?: string | null;
  terminos_condiciones?: string | null;
}

export interface CotizacionUpdate extends Partial<CotizacionCreate> {}

// ─── Pedido ─────────────────────────────────────────────────────────────────

export interface Pedido {
  pedido_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_pedido: string;
  fecha_pedido: string;
  fecha_entrega_prometida?: string | null;
  cliente_venta_id: string;
  cliente_razon_social?: string | null;
  cliente_ruc?: string | null;
  direccion_entrega_id?: string | null;
  direccion_entrega_texto?: string | null;
  cotizacion_id?: string | null;
  orden_compra_cliente?: string | null;
  vendedor_usuario_id?: string | null;
  vendedor_nombre?: string | null;
  condicion_pago?: string | null;
  dias_credito?: number | null;
  moneda?: string | null;
  tipo_cambio?: number | null;
  subtotal?: number | null;
  descuento_global?: number | null;
  igv?: number | null;
  total?: number | null;
  total_items?: number | null;
  items_despachados?: number | null;
  porcentaje_despacho?: number | null;
  estado?: string | null; // 'borrador' | 'confirmado' | 'aprobado' | 'parcial' | 'completo' | 'facturado' | 'anulado'
  requiere_aprobacion?: boolean;
  aprobado_por_usuario_id?: string | null;
  fecha_aprobacion?: string | null;
  prioridad?: number | null; // 1=Urgente, 2=Alta, 3=Normal, 4=Baja
  centro_costo_id?: string | null;
  observaciones?: string | null;
  instrucciones_despacho?: string | null;
  motivo_anulacion?: string | null;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
  fecha_anulacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface PedidoCreate {
  empresa_id: string;
  numero_pedido?: string | null;
  fecha_pedido: string;
  fecha_entrega_prometida?: string | null;
  cliente_venta_id: string;
  cliente_razon_social?: string | null;
  cliente_ruc?: string | null;
  direccion_entrega_id?: string | null;
  direccion_entrega_texto?: string | null;
  cotizacion_id?: string | null;
  orden_compra_cliente?: string | null;
  vendedor_usuario_id?: string | null;
  vendedor_nombre?: string | null;
  condicion_pago?: string | null;
  dias_credito?: number | null;
  moneda?: string | null;
  tipo_cambio?: number | null;
  subtotal?: number | null;
  descuento_global?: number | null;
  igv?: number | null;
  total?: number | null;
  total_items?: number | null;
  items_despachados?: number | null;
  porcentaje_despacho?: number | null;
  estado?: string | null;
  requiere_aprobacion?: boolean;
  prioridad?: number | null;
  centro_costo_id?: string | null;
  observaciones?: string | null;
  instrucciones_despacho?: string | null;
}

export interface PedidoUpdate extends Partial<PedidoCreate> {}

// ─── Filtros de listado ────────────────────────────────────────────────────

export interface SlsListParams {
  empresa_id?: string;
  cliente_venta_id?: string;
  vendedor_usuario_id?: string;
  cotizacion_id?: string;
  estado?: string;
  solo_activos?: boolean;
  buscar?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}
