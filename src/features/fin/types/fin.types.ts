/**
 * Tipos del módulo FIN (Finanzas y Contabilidad)
 * Alineados con la documentación del backend: /api/v1/fin/
 * Incluye TODOS los campos esenciales para funcionamiento completo del sistema
 */

// ─── Plan de Cuentas ────────────────────────────────────────────────────────────────

export interface PlanCuenta {
  cuenta_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_cuenta: string;
  nombre_cuenta: string;
  descripcion?: string | null;
  cuenta_padre_id?: string | null;
  nivel: number;
  tipo_cuenta: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto';
  categoria?: string | null;
  naturaleza: 'deudora' | 'acreedora';
  acepta_movimientos: boolean;
  requiere_centro_costo?: boolean;
  aparece_balance?: boolean;
  es_activo: boolean;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
  // Campos relacionados
  cuenta_padre_codigo?: string | null;
  cuenta_padre_nombre?: string | null;
}

export interface PlanCuentaCreate {
  empresa_id: string;
  codigo_cuenta: string;
  nombre_cuenta: string;
  descripcion?: string | null;
  cuenta_padre_id?: string | null;
  nivel: number;
  tipo_cuenta: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto';
  categoria?: string | null;
  naturaleza: 'deudora' | 'acreedora';
  acepta_movimientos?: boolean;
  requiere_centro_costo?: boolean;
  aparece_balance?: boolean;
  es_activo?: boolean;
}

export interface PlanCuentaUpdate {
  codigo_cuenta?: string;
  nombre_cuenta?: string;
  descripcion?: string | null;
  cuenta_padre_id?: string | null;
  nivel?: number;
  tipo_cuenta?: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto';
  categoria?: string | null;
  naturaleza?: 'deudora' | 'acreedora';
  acepta_movimientos?: boolean;
  requiere_centro_costo?: boolean;
  aparece_balance?: boolean;
  es_activo?: boolean;
}

// ─── Periodo Contable ────────────────────────────────────────────────────────────────

export interface PeriodoContable {
  periodo_id: string;
  cliente_id: string;
  empresa_id: string;
  año: number;
  mes: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'abierto' | 'cerrado' | 'bloqueado';
  fecha_cierre?: string | null;
  usuario_cierre_id?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface PeriodoContableCreate {
  empresa_id: string;
  año: number;
  mes: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: 'abierto' | 'cerrado' | 'bloqueado';
}

export interface PeriodoContableUpdate {
  año?: number;
  mes?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: 'abierto' | 'cerrado' | 'bloqueado';
  fecha_cierre?: string | null;
}

// ─── Asiento Contable ────────────────────────────────────────────────────────────────

export interface AsientoContable {
  asiento_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_asiento: string;
  fecha_asiento: string;
  periodo_id: string;
  tipo_asiento: 'apertura' | 'diario' | 'ajuste' | 'cierre' | 'provision';
  modulo_origen?: string | null;
  documento_origen_tipo?: string | null;
  documento_origen_numero?: string | null;
  glosa: string;
  moneda?: string | null;
  total_debe: number;
  total_haber: number;
  estado: 'borrador' | 'registrado' | 'aprobado' | 'anulado';
  fecha_aprobacion?: string | null;
  usuario_aprobacion_id?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
  // Campos relacionados
  periodo_año?: number | null;
  periodo_mes?: number | null;
}

export interface AsientoContableCreate {
  empresa_id: string;
  numero_asiento: string;
  fecha_asiento: string;
  periodo_id: string;
  tipo_asiento: 'apertura' | 'diario' | 'ajuste' | 'cierre' | 'provision';
  modulo_origen?: string | null;
  documento_origen_tipo?: string | null;
  documento_origen_numero?: string | null;
  glosa: string;
  moneda?: string | null;
  total_debe: number;
  total_haber: number;
  estado?: 'borrador' | 'registrado' | 'aprobado' | 'anulado';
}

export interface AsientoContableUpdate {
  numero_asiento?: string;
  fecha_asiento?: string;
  periodo_id?: string;
  tipo_asiento?: 'apertura' | 'diario' | 'ajuste' | 'cierre' | 'provision';
  modulo_origen?: string | null;
  documento_origen_tipo?: string | null;
  documento_origen_numero?: string | null;
  glosa?: string;
  moneda?: string | null;
  total_debe?: number;
  total_haber?: number;
  estado?: 'borrador' | 'registrado' | 'aprobado' | 'anulado';
}

// ─── Detalle de Asiento Contable ────────────────────────────────────────────────────────────────

export interface AsientoDetalle {
  asiento_detalle_id: string;
  cliente_id: string;
  asiento_id: string;
  item: number;
  cuenta_id: string;
  debe: number;
  haber: number;
  glosa?: string | null;
  centro_costo_id?: string | null;
  tercero_tipo?: 'cliente' | 'proveedor' | 'empleado' | null;
  tercero_id?: string | null;
  fecha_vencimiento?: string | null;
  fecha_creacion?: string | null;
  // Campos relacionados
  cuenta_codigo?: string | null;
  cuenta_nombre?: string | null;
  centro_costo_nombre?: string | null;
  tercero_nombre?: string | null;
}

export interface AsientoDetalleCreate {
  item: number;
  cuenta_id: string;
  debe: number;
  haber: number;
  glosa?: string | null;
  centro_costo_id?: string | null;
  tercero_tipo?: 'cliente' | 'proveedor' | 'empleado' | null;
  tercero_id?: string | null;
  fecha_vencimiento?: string | null;
}

export interface AsientoDetalleUpdate {
  item?: number;
  cuenta_id?: string;
  debe?: number;
  haber?: number;
  glosa?: string | null;
  centro_costo_id?: string | null;
  tercero_tipo?: 'cliente' | 'proveedor' | 'empleado' | null;
  tercero_id?: string | null;
  fecha_vencimiento?: string | null;
}
