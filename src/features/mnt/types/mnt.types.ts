/**
 * Tipos del módulo MNT (Mantenimiento de Activos).
 * Base: /api/v1/mnt
 * Nota: anio_fabricacion (sin ñ) en JSON.
 */

// ─── Activo ─────────────────────────────────────────────────────────────────

export interface Activo {
  activo_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_activo: string;
  nombre: string;
  descripcion?: string | null;
  tipo_activo: string;
  categoria?: string | null;
  marca?: string | null;
  modelo?: string | null;
  numero_serie?: string | null;
  anio_fabricacion?: number | null;
  sucursal_id?: string | null;
  centro_trabajo_id?: string | null;
  ubicacion_detalle?: string | null;
  vehiculo_id?: string | null;
  especificaciones_tecnicas?: string | null;
  capacidad?: string | null;
  potencia?: string | null;
  fabricante?: string | null;
  proveedor_id?: string | null;
  fecha_adquisicion?: string | null;
  fecha_puesta_operacion?: string | null;
  vida_util_años?: number | null;
  criticidad?: string | null;
  valor_adquisicion?: number | null;
  valor_actual?: number | null;
  moneda?: string | null;
  estado_activo?: string | null;
  observaciones?: string | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface ActivoCreate {
  empresa_id: string;
  codigo_activo: string;
  nombre: string;
  descripcion?: string;
  tipo_activo: 'maquinaria' | 'vehiculo' | 'equipo' | 'instalacion' | 'herramienta';
  categoria?: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  anio_fabricacion?: number;
  sucursal_id?: string;
  centro_trabajo_id?: string;
  ubicacion_detalle?: string;
  vehiculo_id?: string;
  especificaciones_tecnicas?: string;
  capacidad?: string;
  potencia?: string;
  fabricante?: string;
  proveedor_id?: string;
  fecha_adquisicion?: string;
  fecha_puesta_operacion?: string;
  vida_util_años?: number;
  criticidad?: 'critica' | 'alta' | 'media' | 'baja';
  valor_adquisicion?: number;
  valor_actual?: number;
  moneda?: string;
  estado_activo?: 'operativo' | 'mantenimiento' | 'averiado' | 'baja';
  observaciones?: string;
  es_activo?: boolean;
}

export interface ActivoUpdate extends Partial<ActivoCreate> {}

// ─── Plan Mantenimiento ─────────────────────────────────────────────────────

export interface PlanMantenimiento {
  plan_mantenimiento_id: string;
  cliente_id: string;
  activo_id: string;
  codigo_plan: string;
  nombre: string;
  descripcion?: string | null;
  tipo_mantenimiento: string;
  frecuencia_tipo: string;
  frecuencia_valor: number;
  fecha_ultimo_mantenimiento?: string | null;
  fecha_proximo_mantenimiento?: string | null;
  horas_uso_ultimo?: number | null;
  horas_uso_proximo?: number | null;
  responsable_usuario_id?: string | null;
  responsable_nombre?: string | null;
  tareas_mantenimiento?: string | null;
  costo_estimado?: number | null;
  moneda?: string | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface PlanMantenimientoCreate {
  activo_id: string;
  codigo_plan: string;
  nombre: string;
  descripcion?: string;
  tipo_mantenimiento: 'preventivo' | 'predictivo';
  frecuencia_tipo: 'dias' | 'horas_uso' | 'kilometros' | 'ciclos';
  frecuencia_valor: number;
  fecha_ultimo_mantenimiento?: string;
  fecha_proximo_mantenimiento?: string;
  horas_uso_ultimo?: number;
  horas_uso_proximo?: number;
  responsable_nombre?: string;
  tareas_mantenimiento?: string;
  costo_estimado?: number;
  moneda?: string;
  es_activo?: boolean;
}

export interface PlanMantenimientoUpdate extends Partial<Omit<PlanMantenimientoCreate, 'activo_id'>> {}

// ─── Orden Trabajo ──────────────────────────────────────────────────────────

export interface OrdenTrabajo {
  orden_trabajo_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_ot: string;
  fecha_solicitud?: string | null;
  activo_id: string;
  plan_mantenimiento_id?: string | null;
  tipo_mantenimiento: string;
  prioridad?: string | null;
  problema_detectado?: string | null;
  trabajo_a_realizar: string;
  tecnico_asignado_usuario_id?: string | null;
  tecnico_nombre?: string | null;
  fecha_programada?: string | null;
  fecha_inicio_real?: string | null;
  fecha_fin_real?: string | null;
  duracion_horas?: number | null;
  trabajo_realizado?: string | null;
  repuestos_utilizados?: string | null;
  costo_mano_obra?: number | null;
  costo_repuestos?: number | null;
  costo_servicios_terceros?: number | null;
  costo_total?: number | null;
  moneda?: string | null;
  estado?: string | null;
  fecha_cierre?: string | null;
  cerrado_por_usuario_id?: string | null;
  calificacion_trabajo?: number | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface OrdenTrabajoCreate {
  empresa_id: string;
  numero_ot: string;
  activo_id: string;
  plan_mantenimiento_id?: string;
  tipo_mantenimiento: string;
  prioridad?: 'urgente' | 'alta' | 'media' | 'baja';
  problema_detectado?: string;
  trabajo_a_realizar: string;
  tecnico_nombre?: string;
  fecha_programada?: string;
  fecha_inicio_real?: string;
  fecha_fin_real?: string;
  trabajo_realizado?: string;
  repuestos_utilizados?: string;
  costo_mano_obra?: number;
  costo_repuestos?: number;
  costo_servicios_terceros?: number;
  moneda?: string;
  estado?: string;
  observaciones?: string;
}

export interface OrdenTrabajoUpdate extends Partial<Omit<OrdenTrabajoCreate, 'empresa_id' | 'numero_ot'>> {}

// ─── Historial Mantenimiento ────────────────────────────────────────────────

export interface HistorialMantenimiento {
  historial_id: string;
  cliente_id: string;
  activo_id: string;
  orden_trabajo_id?: string | null;
  fecha_mantenimiento: string;
  tipo_mantenimiento: string;
  descripcion_trabajo?: string | null;
  tecnico_nombre?: string | null;
  horas_uso_activo?: number | null;
  kilometraje?: number | null;
  costo_total?: number | null;
  moneda?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
}

export interface HistorialMantenimientoCreate {
  activo_id: string;
  orden_trabajo_id?: string;
  fecha_mantenimiento: string;
  tipo_mantenimiento: string;
  descripcion_trabajo?: string;
  tecnico_nombre?: string;
  horas_uso_activo?: number;
  kilometraje?: number;
  costo_total?: number;
  moneda?: string;
  observaciones?: string;
}

export interface HistorialMantenimientoUpdate extends Partial<Omit<HistorialMantenimientoCreate, 'activo_id'>> {}
