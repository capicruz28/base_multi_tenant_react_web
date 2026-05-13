/**
 * Tipos del módulo WMS (Warehouse Management System)
 * Alineados con la documentación del backend: /api/v1/wms/
 */

// ─── Zona de Almacén ────────────────────────────────────────────────────────────────

export type TipoZona = 'recepcion' | 'almacenaje' | 'picking' | 'despacho' | 'cuarentena' | 'merma';

export interface ZonaAlmacen {
  zona_id: string;
  cliente_id: string;
  almacen_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo_zona: TipoZona;
  temperatura_min?: number | null;
  temperatura_max?: number | null;
  requiere_control_temperatura?: boolean;
  capacidad_m3?: number | null;
  capacidad_kg?: number | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
  almacen_nombre?: string | null;
}

export interface ZonaAlmacenCreate {
  almacen_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo_zona: TipoZona;
  temperatura_min?: number | null;
  temperatura_max?: number | null;
  requiere_control_temperatura?: boolean;
  capacidad_m3?: number | null;
  capacidad_kg?: number | null;
  es_activo?: boolean;
}

export interface ZonaAlmacenUpdate {
  codigo?: string;
  nombre?: string;
  descripcion?: string | null;
  tipo_zona?: TipoZona;
  temperatura_min?: number | null;
  temperatura_max?: number | null;
  requiere_control_temperatura?: boolean;
  capacidad_m3?: number | null;
  capacidad_kg?: number | null;
  es_activo?: boolean;
}

// ─── Ubicación ────────────────────────────────────────────────────────────────

export type TipoUbicacion = 'rack' | 'piso' | 'estanteria' | 'caja' | 'pallet';
export type EstadoUbicacion = 'disponible' | 'ocupada' | 'bloqueada' | 'mantenimiento';

export interface Ubicacion {
  ubicacion_id: string;
  cliente_id: string;
  almacen_id: string;
  zona_id?: string | null;
  codigo_ubicacion: string;
  pasillo?: string | null;
  rack?: string | null;
  nivel?: number | null;
  posicion?: string | null;
  nombre?: string | null;
  tipo_ubicacion: TipoUbicacion;
  capacidad_kg?: number | null;
  capacidad_m3?: number | null;
  capacidad_pallets?: number | null;
  alto_cm?: number | null;
  ancho_cm?: number | null;
  profundidad_cm?: number | null;
  permite_multiples_productos?: boolean;
  permite_multiples_lotes?: boolean;
  es_ubicacion_picking?: boolean;
  estado_ubicacion: EstadoUbicacion;
  es_activo: boolean;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
  zona_nombre?: string | null;
  almacen_nombre?: string | null;
}

export interface UbicacionCreate {
  almacen_id: string;
  zona_id?: string | null;
  codigo_ubicacion: string;
  pasillo?: string | null;
  rack?: string | null;
  nivel?: number | null;
  posicion?: string | null;
  nombre?: string | null;
  tipo_ubicacion: TipoUbicacion;
  capacidad_kg?: number | null;
  capacidad_m3?: number | null;
  capacidad_pallets?: number | null;
  alto_cm?: number | null;
  ancho_cm?: number | null;
  profundidad_cm?: number | null;
  permite_multiples_productos?: boolean;
  permite_multiples_lotes?: boolean;
  es_ubicacion_picking?: boolean;
  estado_ubicacion?: EstadoUbicacion;
  es_activo?: boolean;
}

export interface UbicacionUpdate {
  zona_id?: string | null;
  codigo_ubicacion?: string;
  pasillo?: string | null;
  rack?: string | null;
  nivel?: number | null;
  posicion?: string | null;
  nombre?: string | null;
  tipo_ubicacion?: TipoUbicacion;
  capacidad_kg?: number | null;
  capacidad_m3?: number | null;
  capacidad_pallets?: number | null;
  estado_ubicacion?: EstadoUbicacion;
  es_activo?: boolean;
}

// ─── Stock por Ubicación ────────────────────────────────────────────────────────────────

export type EstadoStock = 'disponible' | 'reservado' | 'bloqueado' | 'cuarentena';

export interface StockUbicacion {
  stock_ubicacion_id: string;
  cliente_id: string;
  almacen_id: string;
  ubicacion_id: string;
  producto_id: string;
  cantidad: number;
  unidad_medida_id: string;
  lote?: string | null;
  numero_serie?: string | null;
  fecha_vencimiento?: string | null;
  estado_stock: EstadoStock;
  motivo_bloqueo?: string | null;
  fecha_ingreso?: string | null;
  fecha_actualizacion?: string | null;
  producto_nombre?: string | null;
  producto_codigo?: string | null;
  ubicacion_codigo?: string | null;
  unidad_medida_codigo?: string | null;
}

export interface StockUbicacionCreate {
  almacen_id: string;
  ubicacion_id: string;
  producto_id: string;
  cantidad: number;
  unidad_medida_id: string;
  lote?: string | null;
  numero_serie?: string | null;
  fecha_vencimiento?: string | null;
  estado_stock?: EstadoStock;
  motivo_bloqueo?: string | null;
}

export interface StockUbicacionUpdate {
  cantidad?: number;
  unidad_medida_id?: string;
  lote?: string | null;
  numero_serie?: string | null;
  fecha_vencimiento?: string | null;
  estado_stock?: EstadoStock;
  motivo_bloqueo?: string | null;
}

// ─── Tarea ────────────────────────────────────────────────────────────────

export type TipoTarea = 'picking' | 'putaway' | 'reabastecimiento' | 'conteo' | 'reubicacion';
export type EstadoTarea = 'pendiente' | 'asignada' | 'en_proceso' | 'completada' | 'cancelada';

export interface Tarea {
  tarea_id: string;
  cliente_id: string;
  almacen_id: string;
  numero_tarea: string;
  tipo_tarea: TipoTarea;
  prioridad?: number | null;
  ubicacion_origen_id?: string | null;
  ubicacion_destino_id?: string | null;
  producto_id?: string | null;
  cantidad_planeada?: number | null;
  cantidad_completada?: number | null;
  unidad_medida_id?: string | null;
  documento_referencia_tipo?: string | null;
  documento_referencia_id?: string | null;
  asignado_usuario_id?: string | null;
  asignado_nombre?: string | null;
  fecha_asignacion?: string | null;
  estado: EstadoTarea;
  fecha_inicio?: string | null;
  fecha_completado?: string | null;
  instrucciones?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
  producto_nombre?: string | null;
  ubicacion_origen_codigo?: string | null;
  ubicacion_destino_codigo?: string | null;
  almacen_nombre?: string | null;
}

export interface TareaCreate {
  almacen_id: string;
  numero_tarea: string;
  tipo_tarea: TipoTarea;
  prioridad?: number | null;
  ubicacion_origen_id?: string | null;
  ubicacion_destino_id?: string | null;
  producto_id?: string | null;
  cantidad_planeada?: number | null;
  cantidad_completada?: number | null;
  unidad_medida_id?: string | null;
  documento_referencia_tipo?: string | null;
  documento_referencia_id?: string | null;
  asignado_usuario_id?: string | null;
  estado?: EstadoTarea;
  instrucciones?: string | null;
  observaciones?: string | null;
}

export interface TareaUpdate {
  prioridad?: number | null;
  ubicacion_origen_id?: string | null;
  ubicacion_destino_id?: string | null;
  cantidad_planeada?: number | null;
  cantidad_completada?: number | null;
  asignado_usuario_id?: string | null;
  estado?: EstadoTarea;
  instrucciones?: string | null;
  observaciones?: string | null;
}
