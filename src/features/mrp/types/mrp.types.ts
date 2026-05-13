/**
 * Tipos del módulo MRP (Planeamiento de Materiales).
 * Base: /api/v1/mrp
 */

// ─── Plan Maestro MRP ───────────────────────────────────────────────────────

export interface PlanMaestro {
  plan_maestro_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_plan: string;
  nombre: string;
  descripcion?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_periodo?: string | null;
  horizonte_planificacion_dias?: number | null;
  punto_reorden_dias?: number | null;
  estado?: string | null;
  fecha_calculo?: string | null;
  fecha_aprobacion?: string | null;
  total_productos_planificados?: number | null;
  total_requisiciones_generadas?: number | null;
  total_ordenes_sugeridas?: number | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface PlanMaestroCreate {
  empresa_id: string;
  codigo_plan: string;
  nombre: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_periodo?: 'diario' | 'semanal' | 'mensual';
  horizonte_planificacion_dias?: number;
  punto_reorden_dias?: number;
  estado?: string;
  observaciones?: string;
}

export interface PlanMaestroUpdate extends Partial<PlanMaestroCreate> {}

// ─── Necesidad Bruta ────────────────────────────────────────────────────────

export interface NecesidadBruta {
  necesidad_id: string;
  cliente_id: string;
  plan_maestro_id: string;
  producto_id: string;
  fecha_requerida: string;
  cantidad_requerida: number;
  unidad_medida_id: string;
  origen: string;
  documento_origen_id?: string | null;
  documento_origen_numero?: string | null;
  prioridad?: number | null;
  fecha_creacion?: string | null;
}

export interface NecesidadBrutaCreate {
  plan_maestro_id: string;
  producto_id: string;
  fecha_requerida: string;
  cantidad_requerida: number;
  unidad_medida_id: string;
  origen: 'pedido_venta' | 'pronostico' | 'stock_seguridad' | 'orden_produccion';
  documento_origen_id?: string;
  documento_origen_numero?: string;
  prioridad?: number;
}

export interface NecesidadBrutaUpdate extends Partial<Omit<NecesidadBrutaCreate, 'plan_maestro_id'>> {}

// ─── Explosión Materiales ────────────────────────────────────────────────────

export interface ExplosionMateriales {
  explosion_id: string;
  cliente_id: string;
  plan_maestro_id: string;
  producto_padre_id: string;
  necesidad_padre_id?: string | null;
  producto_componente_id: string;
  bom_detalle_id?: string | null;
  nivel_bom?: number | null;
  cantidad_necesaria: number;
  unidad_medida_id: string;
  fecha_requerida: string;
  stock_actual?: number | null;
  stock_reservado?: number | null;
  stock_transito?: number | null;
  stock_disponible?: number | null;
  cantidad_a_ordenar?: number | null;
  fecha_calculo?: string | null;
}

export interface ExplosionMaterialesCreate {
  plan_maestro_id: string;
  producto_padre_id: string;
  necesidad_padre_id?: string;
  producto_componente_id: string;
  bom_detalle_id?: string;
  nivel_bom?: number;
  cantidad_necesaria: number;
  unidad_medida_id: string;
  fecha_requerida: string;
  stock_actual?: number;
  stock_reservado?: number;
  stock_transito?: number;
}

export interface ExplosionMaterialesUpdate extends Partial<Omit<ExplosionMaterialesCreate, 'plan_maestro_id'>> {}

// ─── Orden Sugerida ──────────────────────────────────────────────────────────

export interface OrdenSugerida {
  orden_sugerida_id: string;
  cliente_id: string;
  plan_maestro_id: string;
  producto_id: string;
  tipo_orden: string;
  cantidad_sugerida: number;
  unidad_medida_id: string;
  fecha_requerida: string;
  fecha_orden_sugerida: string;
  explosion_materiales_id?: string | null;
  proveedor_sugerido_id?: string | null;
  lead_time_dias?: number | null;
  estado?: string | null;
  documento_generado_tipo?: string | null;
  documento_generado_id?: string | null;
  fecha_conversion?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
}

export interface OrdenSugeridaCreate {
  plan_maestro_id: string;
  producto_id: string;
  tipo_orden: 'compra' | 'produccion' | 'transferencia';
  cantidad_sugerida: number;
  unidad_medida_id: string;
  fecha_requerida: string;
  fecha_orden_sugerida: string;
  explosion_materiales_id?: string;
  proveedor_sugerido_id?: string;
  lead_time_dias?: number;
  estado?: string;
  observaciones?: string;
}

export interface OrdenSugeridaUpdate extends Partial<Omit<OrdenSugeridaCreate, 'plan_maestro_id'>> {}
