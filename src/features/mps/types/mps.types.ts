/**
 * Tipos del módulo MPS (Plan Maestro de Producción).
 * Base: /api/v1/mps
 * Nota: En API se usa "anio" (sin ñ) en JSON.
 */

// ─── Pronóstico de Demanda ───────────────────────────────────────────────────

export interface PronosticoDemanda {
  pronostico_id: string;
  cliente_id: string;
  empresa_id: string;
  producto_id: string;
  anio: number;
  mes: number;
  semana?: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_pronosticada: number;
  unidad_medida_id: string;
  metodo_pronostico?: string | null;
  confiabilidad_porcentaje?: number | null;
  cantidad_real?: number | null;
  desviacion?: number | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface PronosticoDemandaCreate {
  empresa_id: string;
  producto_id: string;
  anio: number;
  mes: number;
  semana?: number;
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_pronosticada: number;
  unidad_medida_id: string;
  metodo_pronostico?: 'historico' | 'tendencia' | 'estacional' | 'manual';
  confiabilidad_porcentaje?: number;
  cantidad_real?: number;
  observaciones?: string;
}

export interface PronosticoDemandaUpdate extends Partial<Omit<PronosticoDemandaCreate, 'empresa_id'>> {}

// ─── Plan de Producción ──────────────────────────────────────────────────────

export interface PlanProduccion {
  plan_produccion_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_plan: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: string | null;
  fecha_aprobacion?: string | null;
  aprobado_por_usuario_id?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface PlanProduccionCreate {
  empresa_id: string;
  codigo_plan: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: 'borrador' | 'aprobado' | 'ejecutado' | 'cerrado';
  observaciones?: string;
}

export interface PlanProduccionUpdate extends Partial<PlanProduccionCreate> {}

// ─── Plan de Producción Detalle ──────────────────────────────────────────────

export interface PlanProduccionDetalle {
  plan_detalle_id: string;
  cliente_id: string;
  plan_produccion_id: string;
  producto_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  pronostico_demanda?: number | null;
  pedidos_firmes?: number | null;
  stock_inicial?: number | null;
  stock_seguridad?: number | null;
  cantidad_planificada: number;
  cantidad_producida?: number | null;
  unidad_medida_id: string;
  capacidad_disponible?: number | null;
  porcentaje_uso_capacidad?: number | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
}

export interface PlanProduccionDetalleCreate {
  plan_produccion_id: string;
  producto_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  pronostico_demanda?: number;
  pedidos_firmes?: number;
  stock_inicial?: number;
  stock_seguridad?: number;
  cantidad_planificada: number;
  cantidad_producida?: number;
  unidad_medida_id: string;
  capacidad_disponible?: number;
  observaciones?: string;
}

export interface PlanProduccionDetalleUpdate extends Partial<Omit<PlanProduccionDetalleCreate, 'plan_produccion_id'>> {}
