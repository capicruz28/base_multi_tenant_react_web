/**
 * Tipos del módulo QMS (Quality Management System)
 * Alineados con DOC_FRONTEND_MODULO_QMS.md — /api/v1/qms/
 */

// ─── Parámetro de Calidad ───────────────────────────────────────────────────

export type TipoParametro = 'cuantitativo' | 'cualitativo' | 'pasa_no_pasa';

export interface ParametroCalidad {
  parametro_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo_parametro: TipoParametro;
  unidad_medida_id?: string | null;
  valor_minimo?: number | null;
  valor_maximo?: number | null;
  valor_objetivo?: number | null;
  opciones_permitidas?: string | null;
  metodo_inspeccion?: string | null;
  requiere_equipo?: string | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface ParametroCalidadCreate {
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo_parametro: TipoParametro;
  unidad_medida_id?: string | null;
  valor_minimo?: number | null;
  valor_maximo?: number | null;
  valor_objetivo?: number | null;
  opciones_permitidas?: string | null;
  metodo_inspeccion?: string | null;
  requiere_equipo?: string | null;
  es_activo?: boolean;
}

export interface ParametroCalidadUpdate {
  codigo?: string;
  nombre?: string;
  descripcion?: string | null;
  tipo_parametro?: TipoParametro;
  unidad_medida_id?: string | null;
  valor_minimo?: number | null;
  valor_maximo?: number | null;
  valor_objetivo?: number | null;
  opciones_permitidas?: string | null;
  metodo_inspeccion?: string | null;
  requiere_equipo?: string | null;
  es_activo?: boolean;
}

// ─── Plan de Inspección ────────────────────────────────────────────────────

export type AplicaA = 'producto' | 'categoria' | 'todos';
export type TipoInspeccion = 'recepcion' | 'proceso' | 'final' | 'salida';
export type TipoMuestreo = 'total' | 'aleatorio' | 'estadistico';

export interface PlanInspeccion {
  plan_inspeccion_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  aplica_a: AplicaA;
  producto_id?: string | null;
  categoria_id?: string | null;
  tipo_inspeccion: TipoInspeccion;
  tipo_muestreo?: string | null;
  porcentaje_muestreo?: number | null;
  tabla_muestreo?: string | null;
  nivel_aceptacion_criticos?: number | null;
  nivel_aceptacion_mayores?: number | null;
  nivel_aceptacion_menores?: number | null;
  es_activo: boolean;
  fecha_vigencia_desde?: string | null;
  fecha_vigencia_hasta?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface PlanInspeccionCreate {
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  aplica_a: AplicaA;
  producto_id?: string | null;
  categoria_id?: string | null;
  tipo_inspeccion: TipoInspeccion;
  tipo_muestreo?: TipoMuestreo | null;
  porcentaje_muestreo?: number | null;
  tabla_muestreo?: string | null;
  nivel_aceptacion_criticos?: number | null;
  nivel_aceptacion_mayores?: number | null;
  nivel_aceptacion_menores?: number | null;
  es_activo?: boolean;
  fecha_vigencia_desde?: string | null;
  fecha_vigencia_hasta?: string | null;
}

export interface PlanInspeccionUpdate {
  codigo?: string;
  nombre?: string;
  descripcion?: string | null;
  aplica_a?: AplicaA;
  producto_id?: string | null;
  categoria_id?: string | null;
  tipo_inspeccion?: TipoInspeccion;
  tipo_muestreo?: TipoMuestreo | null;
  porcentaje_muestreo?: number | null;
  tabla_muestreo?: string | null;
  nivel_aceptacion_criticos?: number | null;
  nivel_aceptacion_mayores?: number | null;
  nivel_aceptacion_menores?: number | null;
  es_activo?: boolean;
  fecha_vigencia_desde?: string | null;
  fecha_vigencia_hasta?: string | null;
}

// ─── Plan Inspección Detalle ────────────────────────────────────────────────

export type CriticidadPlan = 'critico' | 'mayor' | 'menor';

export interface PlanInspeccionDetalle {
  plan_detalle_id: string;
  cliente_id: string;
  plan_inspeccion_id: string;
  parametro_calidad_id: string;
  orden?: number | null;
  es_obligatorio?: boolean;
  criticidad?: string | null;
  valor_minimo_plan?: number | null;
  valor_maximo_plan?: number | null;
  valor_objetivo_plan?: number | null;
  instrucciones_especificas?: string | null;
  fecha_creacion?: string | null;
  parametro_nombre?: string | null;
  parametro_codigo?: string | null;
}

export interface PlanInspeccionDetalleCreate {
  parametro_calidad_id: string;
  orden?: number | null;
  es_obligatorio?: boolean;
  criticidad?: CriticidadPlan | null;
  valor_minimo_plan?: number | null;
  valor_maximo_plan?: number | null;
  valor_objetivo_plan?: number | null;
  instrucciones_especificas?: string | null;
}

// ─── Inspección ──────────────────────────────────────────────────────────────

export type ResultadoInspeccion = 'aprobado' | 'rechazado' | 'aprobado_condicional' | 'pendiente';

export interface Inspeccion {
  inspeccion_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_inspeccion: string;
  fecha_inspeccion: string;
  plan_inspeccion_id: string;
  producto_id: string;
  lote?: string | null;
  tipo_documento_origen?: string | null;
  documento_origen_id?: string | null;
  almacen_id?: string | null;
  ubicacion_almacen?: string | null;
  cantidad_total: number;
  cantidad_inspeccionada: number;
  unidad_medida_id: string;
  cantidad_aprobada?: number | null;
  cantidad_rechazada?: number | null;
  cantidad_observada?: number | null;
  defectos_criticos?: number | null;
  defectos_mayores?: number | null;
  defectos_menores?: number | null;
  resultado?: string | null;
  inspector_usuario_id?: string | null;
  inspector_nombre?: string | null;
  observaciones?: string | null;
  acciones_correctivas?: string | null;
  aprobado_por_usuario_id?: string | null;
  fecha_aprobacion?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
  plan_nombre?: string | null;
  producto_nombre?: string | null;
  producto_codigo?: string | null;
}

export interface InspeccionCreate {
  empresa_id: string;
  numero_inspeccion: string;
  fecha_inspeccion?: string | null;
  plan_inspeccion_id: string;
  producto_id: string;
  lote?: string | null;
  tipo_documento_origen?: string | null;
  documento_origen_id?: string | null;
  almacen_id?: string | null;
  ubicacion_almacen?: string | null;
  cantidad_total: number;
  cantidad_inspeccionada: number;
  unidad_medida_id: string;
  cantidad_aprobada?: number | null;
  cantidad_rechazada?: number | null;
  cantidad_observada?: number | null;
  defectos_criticos?: number | null;
  defectos_mayores?: number | null;
  defectos_menores?: number | null;
  resultado?: ResultadoInspeccion | null;
  inspector_usuario_id?: string | null;
  inspector_nombre?: string | null;
  observaciones?: string | null;
  acciones_correctivas?: string | null;
}

export interface InspeccionUpdate {
  fecha_inspeccion?: string | null;
  cantidad_inspeccionada?: number | null;
  cantidad_aprobada?: number | null;
  cantidad_rechazada?: number | null;
  cantidad_observada?: number | null;
  defectos_criticos?: number | null;
  defectos_mayores?: number | null;
  defectos_menores?: number | null;
  resultado?: ResultadoInspeccion | null;
  inspector_usuario_id?: string | null;
  inspector_nombre?: string | null;
  observaciones?: string | null;
  acciones_correctivas?: string | null;
}

// ─── Inspección Detalle ─────────────────────────────────────────────────────

export interface InspeccionDetalle {
  inspeccion_detalle_id: string;
  cliente_id: string;
  inspeccion_id: string;
  parametro_calidad_id: string;
  valor_medido?: number | null;
  valor_cualitativo?: string | null;
  resultado_pasa_no_pasa?: boolean | null;
  cumple_especificacion?: boolean | null;
  criticidad_defecto?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  parametro_nombre?: string | null;
}

export interface InspeccionDetalleCreate {
  parametro_calidad_id: string;
  valor_medido?: number | null;
  valor_cualitativo?: string | null;
  resultado_pasa_no_pasa?: boolean | null;
  cumple_especificacion?: boolean | null;
  criticidad_defecto?: 'critico' | 'mayor' | 'menor' | null;
  observaciones?: string | null;
}

// ─── No Conformidad ─────────────────────────────────────────────────────────

export type OrigenNC = 'inspeccion' | 'reclamo_cliente' | 'auditoria' | 'proceso';
export type TipoNC = 'critica' | 'mayor' | 'menor';
export type EstadoNC = 'abierta' | 'en_analisis' | 'en_accion' | 'cerrada' | 'cancelada';

export interface NoConformidad {
  no_conformidad_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_nc: string;
  fecha_deteccion: string;
  origen: OrigenNC;
  inspeccion_id?: string | null;
  documento_referencia?: string | null;
  producto_id?: string | null;
  lote?: string | null;
  cantidad_afectada?: number | null;
  descripcion_nc: string;
  tipo_nc: TipoNC;
  area_responsable?: string | null;
  responsable_usuario_id?: string | null;
  analisis_causa_raiz?: string | null;
  causa_raiz_identificada?: string | null;
  accion_inmediata?: string | null;
  accion_correctiva?: string | null;
  accion_preventiva?: string | null;
  responsable_accion_usuario_id?: string | null;
  fecha_compromiso_cierre?: string | null;
  estado?: string | null;
  fecha_cierre?: string | null;
  cerrado_por_usuario_id?: string | null;
  verificacion_eficacia?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
  producto_nombre?: string | null;
}

export interface NoConformidadCreate {
  empresa_id: string;
  numero_nc: string;
  fecha_deteccion?: string | null;
  origen: OrigenNC;
  inspeccion_id?: string | null;
  documento_referencia?: string | null;
  producto_id?: string | null;
  lote?: string | null;
  cantidad_afectada?: number | null;
  descripcion_nc: string;
  tipo_nc: TipoNC;
  area_responsable?: string | null;
  responsable_usuario_id?: string | null;
  estado?: EstadoNC | null;
}

export interface NoConformidadUpdate {
  descripcion_nc?: string;
  tipo_nc?: TipoNC;
  area_responsable?: string | null;
  responsable_usuario_id?: string | null;
  analisis_causa_raiz?: string | null;
  causa_raiz_identificada?: string | null;
  accion_inmediata?: string | null;
  accion_correctiva?: string | null;
  accion_preventiva?: string | null;
  responsable_accion_usuario_id?: string | null;
  fecha_compromiso_cierre?: string | null;
  estado?: EstadoNC | null;
  verificacion_eficacia?: string | null;
}
