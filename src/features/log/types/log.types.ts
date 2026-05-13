/**
 * Tipos del módulo LOG (Logística y Distribución)
 * Alineados con la documentación del backend: /api/v1/log/
 * Incluye TODOS los campos esenciales para funcionamiento completo del sistema
 */

// ─── Transportista ────────────────────────────────────────────────────────────────

export interface Transportista {
  transportista_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_transportista: string;
  razon_social: string;
  nombre_comercial?: string | null;
  tipo_documento?: string | null;
  numero_documento: string;
  numero_mtc?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  tarifa_km?: number | null;
  tarifa_hora?: number | null;
  moneda_tarifa?: string | null;
  calificacion?: number | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface TransportistaCreate {
  empresa_id: string;
  codigo_transportista: string;
  razon_social: string;
  nombre_comercial?: string | null;
  tipo_documento?: string | null;
  numero_documento: string;
  numero_mtc?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  tarifa_km?: number | null;
  tarifa_hora?: number | null;
  moneda_tarifa?: string | null;
  es_activo?: boolean;
}

export interface TransportistaUpdate {
  codigo_transportista?: string;
  razon_social?: string;
  nombre_comercial?: string | null;
  tipo_documento?: string | null;
  numero_documento?: string;
  numero_mtc?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  tarifa_km?: number | null;
  tarifa_hora?: number | null;
  moneda_tarifa?: string | null;
  calificacion?: number | null;
  es_activo?: boolean;
}

// ─── Vehículo ────────────────────────────────────────────────────────────────

export interface Vehiculo {
  vehiculo_id: string;
  cliente_id: string;
  empresa_id: string;
  placa: string;
  marca?: string | null;
  modelo?: string | null;
  año?: number | null;
  tipo_vehiculo: 'camion' | 'camioneta' | 'furgon' | 'moto' | 'trailer';
  categoria_vehiculo?: string | null;
  capacidad_kg?: number | null;
  capacidad_m3?: number | null;
  tipo_propiedad: 'propio' | 'tercero';
  transportista_id?: string | null;
  conductor_nombre?: string | null;
  conductor_licencia?: string | null;
  soat_numero?: string | null;
  soat_vencimiento?: string | null;
  tiene_gps?: boolean;
  codigo_gps?: string | null;
  estado_vehiculo: 'disponible' | 'en_ruta' | 'mantenimiento' | 'inactivo';
  es_activo: boolean;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
  // Campos relacionados
  transportista_razon_social?: string | null;
}

export interface VehiculoCreate {
  empresa_id: string;
  placa: string;
  marca?: string | null;
  modelo?: string | null;
  año?: number | null;
  tipo_vehiculo: 'camion' | 'camioneta' | 'furgon' | 'moto' | 'trailer';
  categoria_vehiculo?: string | null;
  capacidad_kg?: number | null;
  capacidad_m3?: number | null;
  tipo_propiedad: 'propio' | 'tercero';
  transportista_id?: string | null;
  conductor_nombre?: string | null;
  conductor_licencia?: string | null;
  soat_numero?: string | null;
  soat_vencimiento?: string | null;
  tiene_gps?: boolean;
  codigo_gps?: string | null;
  estado_vehiculo?: 'disponible' | 'en_ruta' | 'mantenimiento' | 'inactivo';
  es_activo?: boolean;
}

export interface VehiculoUpdate {
  placa?: string;
  marca?: string | null;
  modelo?: string | null;
  año?: number | null;
  tipo_vehiculo?: 'camion' | 'camioneta' | 'furgon' | 'moto' | 'trailer';
  categoria_vehiculo?: string | null;
  capacidad_kg?: number | null;
  capacidad_m3?: number | null;
  tipo_propiedad?: 'propio' | 'tercero';
  transportista_id?: string | null;
  conductor_nombre?: string | null;
  conductor_licencia?: string | null;
  soat_numero?: string | null;
  soat_vencimiento?: string | null;
  tiene_gps?: boolean;
  codigo_gps?: string | null;
  estado_vehiculo?: 'disponible' | 'en_ruta' | 'mantenimiento' | 'inactivo';
  es_activo?: boolean;
}

// ─── Ruta ────────────────────────────────────────────────────────────────

export interface Ruta {
  ruta_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_ruta: string;
  nombre_ruta: string;
  origen_sucursal_id?: string | null;
  destino_descripcion: string;
  distancia_km?: number | null;
  tiempo_estimado_horas?: number | null;
  costo_estimado?: number | null;
  cantidad_peajes?: number | null;
  costo_peajes?: number | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
  // Campos relacionados
  origen_sucursal_nombre?: string | null;
}

export interface RutaCreate {
  empresa_id: string;
  codigo_ruta: string;
  nombre_ruta: string;
  origen_sucursal_id?: string | null;
  destino_descripcion: string;
  distancia_km?: number | null;
  tiempo_estimado_horas?: number | null;
  costo_estimado?: number | null;
  cantidad_peajes?: number | null;
  costo_peajes?: number | null;
  es_activo?: boolean;
}

export interface RutaUpdate {
  codigo_ruta?: string;
  nombre_ruta?: string;
  origen_sucursal_id?: string | null;
  destino_descripcion?: string;
  distancia_km?: number | null;
  tiempo_estimado_horas?: number | null;
  costo_estimado?: number | null;
  cantidad_peajes?: number | null;
  costo_peajes?: number | null;
  es_activo?: boolean;
}

// ─── Guía de Remisión ────────────────────────────────────────────────────────────────

export interface GuiaRemision {
  guia_remision_id: string;
  cliente_id: string;
  empresa_id: string;
  serie: string;
  numero: string;
  fecha_emision: string;
  fecha_traslado: string;
  tipo_guia: 'remitente' | 'transportista';
  motivo_traslado: 'venta' | 'compra' | 'transferencia' | 'consignacion' | 'devolucion';
  remitente_razon_social: string;
  remitente_ruc?: string | null;
  remitente_direccion?: string | null;
  destinatario_razon_social: string;
  destinatario_ruc?: string | null;
  destinatario_direccion?: string | null;
  punto_partida: string;
  punto_llegada: string;
  modalidad_transporte: 'publico' | 'privado';
  vehiculo_id?: string | null;
  vehiculo_placa?: string | null;
  conductor_nombre?: string | null;
  conductor_licencia?: string | null;
  transportista_id?: string | null;
  transportista_razon_social?: string | null;
  total_bultos?: number | null;
  peso_total_kg?: number | null;
  estado: 'borrador' | 'emitida' | 'en_transito' | 'entregada' | 'anulada';
  codigo_hash?: string | null;
  codigo_qr?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface GuiaRemisionCreate {
  empresa_id: string;
  serie: string;
  numero: string;
  fecha_traslado: string;
  tipo_guia: 'remitente' | 'transportista';
  motivo_traslado: 'venta' | 'compra' | 'transferencia' | 'consignacion' | 'devolucion';
  remitente_razon_social: string;
  remitente_ruc?: string | null;
  remitente_direccion?: string | null;
  destinatario_razon_social: string;
  destinatario_ruc?: string | null;
  destinatario_direccion?: string | null;
  punto_partida: string;
  punto_llegada: string;
  modalidad_transporte: 'publico' | 'privado';
  vehiculo_id?: string | null;
  conductor_nombre?: string | null;
  conductor_licencia?: string | null;
  transportista_id?: string | null;
  total_bultos?: number | null;
  peso_total_kg?: number | null;
  estado?: 'borrador' | 'emitida' | 'en_transito' | 'entregada' | 'anulada';
  observaciones?: string | null;
}

export interface GuiaRemisionUpdate {
  fecha_traslado?: string;
  tipo_guia?: 'remitente' | 'transportista';
  motivo_traslado?: 'venta' | 'compra' | 'transferencia' | 'consignacion' | 'devolucion';
  remitente_razon_social?: string;
  remitente_ruc?: string | null;
  remitente_direccion?: string | null;
  destinatario_razon_social?: string;
  destinatario_ruc?: string | null;
  destinatario_direccion?: string | null;
  punto_partida?: string;
  punto_llegada?: string;
  modalidad_transporte?: 'publico' | 'privado';
  vehiculo_id?: string | null;
  conductor_nombre?: string | null;
  conductor_licencia?: string | null;
  transportista_id?: string | null;
  total_bultos?: number | null;
  peso_total_kg?: number | null;
  estado?: 'borrador' | 'emitida' | 'en_transito' | 'entregada' | 'anulada';
  observaciones?: string | null;
}

// ─── Detalle de Guía de Remisión ────────────────────────────────────────────────────────────────

export interface GuiaRemisionDetalle {
  guia_remision_detalle_id: string;
  cliente_id: string;
  guia_remision_id: string;
  producto_id: string;
  cantidad: number;
  unidad_medida_id: string;
  peso_kg?: number | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  // Campos relacionados
  producto_nombre?: string | null;
  producto_codigo?: string | null;
  unidad_medida_nombre?: string | null;
  unidad_medida_codigo?: string | null;
}

export interface GuiaRemisionDetalleCreate {
  producto_id: string;
  cantidad: number;
  unidad_medida_id: string;
  peso_kg?: number | null;
  observaciones?: string | null;
}

export interface GuiaRemisionDetalleUpdate {
  cantidad?: number;
  unidad_medida_id?: string;
  peso_kg?: number | null;
  observaciones?: string | null;
}

// ─── Despacho ────────────────────────────────────────────────────────────────

export interface Despacho {
  despacho_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_despacho: string;
  fecha_programada: string;
  hora_salida_programada?: string | null;
  ruta_id?: string | null;
  vehiculo_id?: string | null;
  conductor_nombre?: string | null;
  fecha_salida_real?: string | null;
  fecha_retorno?: string | null;
  km_inicial?: number | null;
  km_final?: number | null;
  total_guias: number;
  total_peso_kg?: number | null;
  costo_combustible?: number | null;
  costo_peajes?: number | null;
  costo_otros?: number | null;
  estado: 'planificado' | 'en_ruta' | 'completado' | 'cancelado';
  observaciones?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
  // Campos relacionados
  ruta_nombre?: string | null;
  vehiculo_placa?: string | null;
}

export interface DespachoCreate {
  empresa_id: string;
  numero_despacho: string;
  fecha_programada: string;
  hora_salida_programada?: string | null;
  ruta_id?: string | null;
  vehiculo_id?: string | null;
  conductor_nombre?: string | null;
  estado?: 'planificado' | 'en_ruta' | 'completado' | 'cancelado';
  observaciones?: string | null;
}

export interface DespachoUpdate {
  numero_despacho?: string;
  fecha_programada?: string;
  hora_salida_programada?: string | null;
  ruta_id?: string | null;
  vehiculo_id?: string | null;
  conductor_nombre?: string | null;
  fecha_salida_real?: string | null;
  fecha_retorno?: string | null;
  km_inicial?: number | null;
  km_final?: number | null;
  costo_combustible?: number | null;
  costo_peajes?: number | null;
  costo_otros?: number | null;
  estado?: 'planificado' | 'en_ruta' | 'completado' | 'cancelado';
  observaciones?: string | null;
}

// ─── Guía de Despacho (relación muchos a muchos) ────────────────────────────────────────────────────────────────

export interface DespachoGuia {
  despacho_guia_id: string;
  cliente_id: string;
  despacho_id: string;
  guia_remision_id: string;
  orden_entrega: number;
  estado_entrega: 'pendiente' | 'en_transito' | 'entregada' | 'devuelta';
  fecha_entrega?: string | null;
  receptor_nombre?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  // Campos relacionados
  guia_serie?: string | null;
  guia_numero?: string | null;
  guia_destinatario?: string | null;
}

export interface DespachoGuiaCreate {
  guia_remision_id: string;
  orden_entrega: number;
  estado_entrega?: 'pendiente' | 'en_transito' | 'entregada' | 'devuelta';
}

export interface DespachoGuiaUpdate {
  orden_entrega?: number;
  estado_entrega?: 'pendiente' | 'en_transito' | 'entregada' | 'devuelta';
  fecha_entrega?: string | null;
  receptor_nombre?: string | null;
  observaciones?: string | null;
}
