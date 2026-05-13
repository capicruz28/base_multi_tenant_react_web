/**
 * Tipos del módulo MFG (Manufactura y Producción).
 * Base: /api/v1/mfg
 */

// ─── Centro de Trabajo ─────────────────────────────────────────────────────

export interface CentroTrabajo {
  centro_trabajo_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  sucursal_id?: string | null;
  ubicacion_fisica?: string | null;
  tipo_centro: string;
  capacidad_horas_dia?: number | null;
  capacidad_unidades_hora?: number | null;
  eficiencia_promedio?: number | null;
  costo_hora_maquina?: number | null;
  costo_setup?: number | null;
  centro_costo_id?: string | null;
  requiere_mantenimiento?: boolean | null;
  frecuencia_mantenimiento_dias?: number | null;
  ultima_fecha_mantenimiento?: string | null;
  estado_centro?: string | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
}

export interface CentroTrabajoCreate {
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  sucursal_id?: string;
  ubicacion_fisica?: string;
  tipo_centro: string;
  capacidad_horas_dia?: number;
  capacidad_unidades_hora?: number;
  eficiencia_promedio?: number;
  costo_hora_maquina?: number;
  costo_setup?: number;
  centro_costo_id?: string;
  requiere_mantenimiento?: boolean;
  frecuencia_mantenimiento_dias?: number;
  ultima_fecha_mantenimiento?: string;
  estado_centro?: string;
  es_activo?: boolean;
}

export interface CentroTrabajoUpdate extends Partial<CentroTrabajoCreate> {}

// ─── Operación ─────────────────────────────────────────────────────────────

export interface Operacion {
  operacion_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  centro_trabajo_id?: string | null;
  tiempo_setup_minutos?: number | null;
  tiempo_operacion_minutos?: number | null;
  requiere_herramientas?: string | null;
  requiere_habilidad?: string | null;
  requiere_inspeccion?: boolean | null;
  plan_inspeccion_id?: string | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
}

export interface OperacionCreate {
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  centro_trabajo_id?: string;
  tiempo_setup_minutos?: number;
  tiempo_operacion_minutos?: number;
  requiere_herramientas?: string;
  requiere_habilidad?: string;
  requiere_inspeccion?: boolean;
  plan_inspeccion_id?: string;
  es_activo?: boolean;
}

export interface OperacionUpdate extends Partial<OperacionCreate> {}

// ─── Lista de Materiales (BOM) ─────────────────────────────────────────────

export interface ListaMateriales {
  bom_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_bom: string;
  producto_id: string;
  version?: string | null;
  fecha_vigencia_desde: string;
  fecha_vigencia_hasta?: string | null;
  cantidad_base?: number | null;
  unidad_medida_id: string;
  tipo_bom?: string | null;
  porcentaje_desperdicio?: number | null;
  es_bom_activa: boolean;
  estado?: string | null;
  aprobado_por_usuario_id?: string | null;
  fecha_aprobacion?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
}

export interface ListaMaterialesCreate {
  empresa_id: string;
  codigo_bom: string;
  producto_id: string;
  version?: string;
  fecha_vigencia_desde: string;
  fecha_vigencia_hasta?: string;
  cantidad_base?: number;
  unidad_medida_id: string;
  tipo_bom?: string;
  porcentaje_desperdicio?: number;
  es_bom_activa?: boolean;
  estado?: string;
  observaciones?: string;
}

export interface ListaMaterialesUpdate extends Partial<Omit<ListaMaterialesCreate, 'empresa_id' | 'producto_id'>> {}

// ─── Lista Materiales Detalle ──────────────────────────────────────────────

export interface ListaMaterialesDetalle {
  bom_detalle_id: string;
  cliente_id: string;
  bom_id: string;
  producto_componente_id: string;
  cantidad: number;
  unidad_medida_id: string;
  tipo_componente?: string | null;
  es_critico?: boolean | null;
  porcentaje_desperdicio?: number | null;
  tiene_sustitutos?: boolean | null;
  productos_sustitutos?: string | null;
  secuencia?: number | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
}

export interface ListaMaterialesDetalleCreate {
  bom_id: string;
  producto_componente_id: string;
  cantidad: number;
  unidad_medida_id: string;
  tipo_componente?: string;
  es_critico?: boolean;
  porcentaje_desperdicio?: number;
  tiene_sustitutos?: boolean;
  productos_sustitutos?: string;
  secuencia?: number;
  observaciones?: string;
}

export interface ListaMaterialesDetalleUpdate extends Partial<Omit<ListaMaterialesDetalleCreate, 'bom_id'>> {}

// ─── Ruta de Fabricación ──────────────────────────────────────────────────

export interface RutaFabricacion {
  ruta_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_ruta: string;
  producto_id: string;
  bom_id?: string | null;
  nombre: string;
  descripcion?: string | null;
  version?: string | null;
  tiempo_total_setup_minutos?: number | null;
  tiempo_total_operacion_minutos?: number | null;
  es_ruta_activa: boolean;
  estado?: string | null;
  fecha_creacion?: string | null;
}

export interface RutaFabricacionCreate {
  empresa_id: string;
  codigo_ruta: string;
  producto_id: string;
  bom_id?: string;
  nombre: string;
  descripcion?: string;
  version?: string;
  tiempo_total_setup_minutos?: number;
  tiempo_total_operacion_minutos?: number;
  es_ruta_activa?: boolean;
  estado?: string;
}

export interface RutaFabricacionUpdate extends Partial<Omit<RutaFabricacionCreate, 'empresa_id' | 'producto_id'>> {}

// ─── Ruta Fabricación Detalle ─────────────────────────────────────────────

export interface RutaFabricacionDetalle {
  ruta_detalle_id: string;
  cliente_id: string;
  ruta_id: string;
  secuencia: number;
  operacion_id: string;
  centro_trabajo_id: string;
  tiempo_setup_minutos?: number | null;
  tiempo_operacion_minutos?: number | null;
  es_operacion_critica?: boolean | null;
  permite_operaciones_paralelas?: boolean | null;
  instrucciones?: string | null;
  fecha_creacion?: string | null;
}

export interface RutaFabricacionDetalleCreate {
  ruta_id: string;
  secuencia: number;
  operacion_id: string;
  centro_trabajo_id: string;
  tiempo_setup_minutos?: number;
  tiempo_operacion_minutos?: number;
  es_operacion_critica?: boolean;
  permite_operaciones_paralelas?: boolean;
  instrucciones?: string;
}

export interface RutaFabricacionDetalleUpdate extends Partial<Omit<RutaFabricacionDetalleCreate, 'ruta_id'>> {}

// ─── Orden de Producción ──────────────────────────────────────────────────

export interface OrdenProduccion {
  orden_produccion_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_op: string;
  fecha_emision?: string | null;
  fecha_inicio_programada: string;
  fecha_fin_programada: string;
  producto_id: string;
  bom_id: string;
  ruta_fabricacion_id?: string | null;
  cantidad_planeada: number;
  cantidad_producida?: number | null;
  cantidad_defectuosa?: number | null;
  unidad_medida_id: string;
  almacen_destino_id?: string | null;
  prioridad?: number | null;
  tipo_orden?: string | null;
  costo_materiales?: number | null;
  costo_mano_obra?: number | null;
  costo_cif?: number | null;
  moneda?: string | null;
  centro_costo_id?: string | null;
  estado?: string | null;
  responsable_nombre?: string | null;
  observaciones?: string | null;
  fecha_inicio_real?: string | null;
  fecha_fin_real?: string | null;
  fecha_creacion?: string | null;
}

export interface OrdenProduccionCreate {
  empresa_id: string;
  numero_op: string;
  fecha_emision?: string;
  fecha_inicio_programada: string;
  fecha_fin_programada: string;
  producto_id: string;
  bom_id: string;
  ruta_fabricacion_id?: string;
  cantidad_planeada: number;
  cantidad_producida?: number;
  cantidad_defectuosa?: number;
  unidad_medida_id: string;
  almacen_destino_id?: string;
  prioridad?: number;
  tipo_orden?: string;
  costo_materiales?: number;
  costo_mano_obra?: number;
  costo_cif?: number;
  moneda?: string;
  centro_costo_id?: string;
  estado?: string;
  responsable_usuario_id?: string;
  responsable_nombre?: string;
  observaciones?: string;
}

export interface OrdenProduccionUpdate extends Partial<Omit<OrdenProduccionCreate, 'empresa_id'>> {}

// ─── Orden Producción Operación ────────────────────────────────────────────

export interface OrdenProduccionOperacion {
  op_operacion_id: string;
  cliente_id: string;
  orden_produccion_id: string;
  ruta_detalle_id?: string | null;
  operacion_id: string;
  centro_trabajo_id: string;
  secuencia: number;
  tiempo_setup_planificado_minutos?: number | null;
  tiempo_operacion_planificado_minutos?: number | null;
  tiempo_setup_real_minutos?: number | null;
  tiempo_operacion_real_minutos?: number | null;
  fecha_inicio_programada?: string | null;
  fecha_fin_programada?: string | null;
  fecha_inicio_real?: string | null;
  fecha_fin_real?: string | null;
  cantidad_procesada?: number | null;
  cantidad_aprobada?: number | null;
  cantidad_rechazada?: number | null;
  operario_nombre?: string | null;
  estado?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
}

export interface OrdenProduccionOperacionCreate {
  orden_produccion_id: string;
  ruta_detalle_id?: string;
  operacion_id: string;
  centro_trabajo_id: string;
  secuencia: number;
  tiempo_setup_planificado_minutos?: number;
  tiempo_operacion_planificado_minutos?: number;
  tiempo_setup_real_minutos?: number;
  tiempo_operacion_real_minutos?: number;
  fecha_inicio_programada?: string;
  fecha_fin_programada?: string;
  fecha_inicio_real?: string;
  fecha_fin_real?: string;
  cantidad_procesada?: number;
  cantidad_aprobada?: number;
  cantidad_rechazada?: number;
  operario_usuario_id?: string;
  operario_nombre?: string;
  estado?: string;
  observaciones?: string;
}

export interface OrdenProduccionOperacionUpdate extends Partial<Omit<OrdenProduccionOperacionCreate, 'orden_produccion_id'>> {}

// ─── Consumo Materiales ────────────────────────────────────────────────────

export interface ConsumoMateriales {
  consumo_id: string;
  cliente_id: string;
  orden_produccion_id: string;
  producto_id: string;
  cantidad_planificada: number;
  cantidad_consumida: number;
  unidad_medida_id: string;
  lote?: string | null;
  almacen_origen_id?: string | null;
  costo_unitario?: number | null;
  movimiento_inventario_id?: string | null;
  observaciones?: string | null;
  fecha_consumo?: string | null;
}

export interface ConsumoMaterialesCreate {
  orden_produccion_id: string;
  producto_id: string;
  cantidad_planificada: number;
  cantidad_consumida: number;
  unidad_medida_id: string;
  lote?: string;
  almacen_origen_id?: string;
  costo_unitario?: number;
  movimiento_inventario_id?: string;
  observaciones?: string;
}

export interface ConsumoMaterialesUpdate extends Partial<Omit<ConsumoMaterialesCreate, 'orden_produccion_id'>> {}
