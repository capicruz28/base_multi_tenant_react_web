/**
 * Tipos del módulo BDG (Presupuestos).
 * Base: /api/v1/bdg
 * Nota: En API se usa "anio" (sin ñ) en JSON.
 */

export type TipoPresupuesto = 'anual' | 'mensual' | 'trimestral';
export type EstadoPresupuesto = 'borrador' | 'aprobado' | 'vigente' | 'cerrado';

export interface Presupuesto {
  presupuesto_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_presupuesto: string;
  nombre: string;
  anio: number;
  tipo_presupuesto?: string | null;
  monto_total_presupuestado?: number | null;
  monto_total_ejecutado?: number | null;
  porcentaje_ejecucion?: number | null;
  estado?: string | null;
  fecha_aprobacion?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface PresupuestoCreate {
  empresa_id: string;
  codigo_presupuesto: string;
  nombre: string;
  anio: number;
  tipo_presupuesto?: TipoPresupuesto;
  monto_total_presupuestado?: number;
  monto_total_ejecutado?: number;
  estado?: EstadoPresupuesto;
  fecha_aprobacion?: string;
  observaciones?: string;
  usuario_creacion_id?: string;
}

export interface PresupuestoUpdate {
  codigo_presupuesto?: string;
  nombre?: string;
  tipo_presupuesto?: string;
  monto_total_presupuestado?: number;
  monto_total_ejecutado?: number;
  estado?: string;
  fecha_aprobacion?: string;
  observaciones?: string;
}

export interface PresupuestoDetalle {
  presupuesto_detalle_id: string;
  cliente_id: string;
  presupuesto_id: string;
  cuenta_id: string;
  centro_costo_id?: string | null;
  mes?: number | null;
  monto_presupuestado: number;
  monto_ejecutado?: number | null;
  monto_disponible?: number | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
}

export interface PresupuestoDetalleCreate {
  presupuesto_id: string;
  cuenta_id: string;
  centro_costo_id?: string;
  mes?: number;
  monto_presupuestado: number;
  monto_ejecutado?: number;
  observaciones?: string;
}

export interface PresupuestoDetalleUpdate {
  cuenta_id?: string;
  centro_costo_id?: string;
  mes?: number;
  monto_presupuestado?: number;
  monto_ejecutado?: number;
  observaciones?: string;
}
