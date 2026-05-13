/**
 * Tipos del módulo HCM (Planillas y RRHH).
 * Base: /api/v1/hcm
 */

// ─── Empleado ─────────────────────────────────────────────────────────────

export type TipoDocumento = 'DNI' | 'CE' | 'PASAPORTE';
export type Sexo = 'M' | 'F';
export type EstadoEmpleado = 'activo' | 'inactivo' | 'cesado' | 'suspendido';
export type SistemaPensionario = 'AFP' | 'ONP';

export interface Empleado {
  empleado_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_empleado: string;
  tipo_documento?: string | null;
  numero_documento: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombres: string;
  nombre_completo?: string | null;
  fecha_nacimiento: string;
  sexo: Sexo;
  estado_civil?: string | null;
  direccion?: string | null;
  telefono_fijo?: string | null;
  telefono_movil?: string | null;
  email_personal?: string | null;
  email_corporativo?: string | null;
  fecha_ingreso: string;
  fecha_cese?: string | null;
  departamento_id?: string | null;
  cargo_id?: string | null;
  sucursal_id?: string | null;
  centro_costo_id?: string | null;
  banco?: string | null;
  numero_cuenta?: string | null;
  sistema_pensionario: SistemaPensionario;
  estado_empleado?: EstadoEmpleado | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

export interface EmpleadoCreate {
  empresa_id: string;
  codigo_empleado: string;
  tipo_documento?: string;
  numero_documento: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombres: string;
  fecha_nacimiento: string;
  sexo: Sexo;
  fecha_ingreso: string;
  sistema_pensionario: SistemaPensionario;
  departamento_id?: string;
  cargo_id?: string;
  sucursal_id?: string;
  centro_costo_id?: string;
  banco?: string;
  numero_cuenta?: string;
  estado_empleado?: EstadoEmpleado;
  direccion?: string;
  telefono_movil?: string;
  email_corporativo?: string;
  es_activo?: boolean;
}

export interface EmpleadoUpdate extends Partial<EmpleadoCreate> {}

// ─── Contrato ─────────────────────────────────────────────────────────────

export type TipoContrato = 'plazo_indeterminado' | 'plazo_fijo' | 'part_time' | 'locacion_servicios' | 'practicas';
export type EstadoContrato = 'vigente' | 'vencido' | 'rescindido' | 'borrador';

export interface Contrato {
  contrato_id: string;
  cliente_id: string;
  empresa_id: string;
  empleado_id: string;
  numero_contrato: string;
  tipo_contrato: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  es_contrato_vigente: boolean;
  cargo_id?: string | null;
  remuneracion_basica: number;
  moneda?: string | null;
  tipo_remuneracion?: string | null;
  tiene_periodo_prueba?: boolean | null;
  tiene_cts?: boolean | null;
  tiene_gratificacion?: boolean | null;
  estado_contrato: EstadoContrato;
  fecha_creacion?: string | null;
}

export interface ContratoCreate {
  empresa_id: string;
  empleado_id: string;
  numero_contrato: string;
  tipo_contrato: TipoContrato | string;
  fecha_inicio: string;
  fecha_fin?: string;
  cargo_id?: string;
  remuneracion_basica: number;
  moneda?: string;
  tipo_remuneracion?: string;
  tiene_periodo_prueba?: boolean;
  tiene_cts?: boolean;
  tiene_gratificacion?: boolean;
  estado_contrato?: EstadoContrato;
}

export interface ContratoUpdate extends Partial<ContratoCreate> {}

// ─── Concepto Planilla ────────────────────────────────────────────────────

export type TipoConceptoPlanilla = 'ingreso' | 'descuento' | 'aporte_empleador';

export interface ConceptoPlanilla {
  concepto_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_concepto: string;
  nombre: string;
  tipo_concepto: TipoConceptoPlanilla;
  categoria?: string | null;
  es_fijo?: boolean | null;
  monto_fijo?: number | null;
  es_porcentaje?: boolean | null;
  porcentaje_base?: number | null;
  base_calculo?: string | null;
  afecto_renta_quinta?: boolean | null;
  afecto_essalud?: boolean | null;
  afecto_cts?: boolean | null;
  afecto_gratificacion?: boolean | null;
  afecto_vacaciones?: boolean | null;
  codigo_plame?: string | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
}

export interface ConceptoPlanillaCreate {
  empresa_id: string;
  codigo_concepto: string;
  nombre: string;
  tipo_concepto: TipoConceptoPlanilla;
  categoria?: string;
  es_fijo?: boolean;
  monto_fijo?: number;
  es_porcentaje?: boolean;
  porcentaje_base?: number;
  base_calculo?: string;
  afecto_renta_quinta?: boolean;
  afecto_essalud?: boolean;
  afecto_cts?: boolean;
  afecto_gratificacion?: boolean;
  afecto_vacaciones?: boolean;
  es_activo?: boolean;
}

export interface ConceptoPlanillaUpdate extends Partial<ConceptoPlanillaCreate> {}

// ─── Planilla ─────────────────────────────────────────────────────────────

export type TipoPlanilla = 'mensual' | 'quincenal' | 'gratificacion' | 'cts' | 'utilidades';
export type EstadoPlanilla = 'borrador' | 'calculada' | 'aprobada' | 'pagada' | 'cerrada';

export interface Planilla {
  planilla_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_planilla: string;
  año: number;
  mes: number;
  periodo_descripcion?: string | null;
  tipo_planilla: TipoPlanilla;
  fecha_inicio_periodo: string;
  fecha_fin_periodo: string;
  fecha_pago?: string | null;
  total_empleados?: number | null;
  total_ingresos?: number | null;
  total_descuentos?: number | null;
  total_neto?: number | null;
  total_aportes_empleador?: number | null;
  estado: EstadoPlanilla;
  fecha_creacion?: string | null;
}

export interface PlanillaCreate {
  empresa_id: string;
  numero_planilla: string;
  año: number;
  mes: number;
  periodo_descripcion?: string;
  tipo_planilla?: TipoPlanilla;
  fecha_inicio_periodo: string;
  fecha_fin_periodo: string;
  fecha_pago?: string;
  estado?: EstadoPlanilla;
}

export interface PlanillaUpdate extends Partial<Omit<PlanillaCreate, 'empresa_id' | 'año' | 'mes'>> {}

// ─── Planilla Empleado ────────────────────────────────────────────────────

export interface PlanillaEmpleado {
  planilla_empleado_id: string;
  cliente_id: string;
  planilla_id: string;
  empleado_id: string;
  dias_laborados?: number | null;
  dias_faltas?: number | null;
  horas_ordinarias?: number | null;
  horas_extras_25?: number | null;
  horas_extras_35?: number | null;
  horas_extras_100?: number | null;
  remuneracion_basica: number;
  total_ingresos?: number | null;
  total_descuentos?: number | null;
  total_neto?: number | null;
  pagado?: boolean | null;
  metodo_pago?: string | null;
  numero_operacion?: string | null;
  fecha_creacion?: string | null;
}

export interface PlanillaEmpleadoCreate {
  planilla_id: string;
  empleado_id: string;
  dias_laborados?: number;
  dias_faltas?: number;
  horas_ordinarias?: number;
  horas_extras_25?: number;
  horas_extras_35?: number;
  horas_extras_100?: number;
  remuneracion_basica: number;
  total_ingresos?: number;
  total_descuentos?: number;
  total_neto?: number;
}

export interface PlanillaEmpleadoUpdate extends Partial<PlanillaEmpleadoCreate> {}

// ─── Planilla Detalle ─────────────────────────────────────────────────────

export interface PlanillaDetalle {
  planilla_detalle_id: string;
  cliente_id: string;
  planilla_empleado_id: string;
  concepto_id: string;
  tipo_concepto: string;
  base_calculo?: number | null;
  cantidad?: number | null;
  tasa_porcentaje?: number | null;
  monto: number;
  fecha_creacion?: string | null;
}

export interface PlanillaDetalleCreate {
  planilla_empleado_id: string;
  concepto_id: string;
  tipo_concepto: string;
  base_calculo?: number;
  cantidad?: number;
  tasa_porcentaje?: number;
  monto: number;
}

export interface PlanillaDetalleUpdate extends Partial<PlanillaDetalleCreate> {}

// ─── Asistencia ───────────────────────────────────────────────────────────

export type TipoAsistencia = 'presente' | 'falta' | 'tardanza' | 'licencia' | 'vacaciones' | 'descanso_medico';

export interface Asistencia {
  asistencia_id: string;
  cliente_id: string;
  empresa_id: string;
  empleado_id: string;
  fecha: string;
  hora_entrada?: string | null;
  hora_salida?: string | null;
  horas_trabajadas?: number | null;
  horas_extras?: number | null;
  tipo_asistencia: TipoAsistencia;
  minutos_tardanza?: number | null;
  justificacion?: string | null;
  fecha_creacion?: string | null;
}

export interface AsistenciaCreate {
  empresa_id: string;
  empleado_id: string;
  fecha: string;
  hora_entrada?: string;
  hora_salida?: string;
  horas_trabajadas?: number;
  horas_extras?: number;
  tipo_asistencia?: TipoAsistencia;
  minutos_tardanza?: number;
  justificacion?: string;
}

export interface AsistenciaUpdate extends Partial<AsistenciaCreate> {}

// ─── Vacaciones ───────────────────────────────────────────────────────────

export type EstadoVacaciones = 'pendiente' | 'programada' | 'aprobada' | 'en_curso' | 'completada' | 'vencida';

export interface Vacaciones {
  vacaciones_id: string;
  cliente_id: string;
  empresa_id: string;
  empleado_id: string;
  año_periodo: number;
  fecha_inicio_periodo: string;
  fecha_fin_periodo: string;
  dias_ganados?: number | null;
  dias_tomados?: number | null;
  fecha_inicio_programada?: string | null;
  fecha_fin_programada?: string | null;
  estado: EstadoVacaciones;
  fecha_creacion?: string | null;
}

export interface VacacionesCreate {
  empresa_id: string;
  empleado_id: string;
  año_periodo: number;
  fecha_inicio_periodo: string;
  fecha_fin_periodo: string;
  dias_ganados?: number;
  dias_tomados?: number;
  estado?: EstadoVacaciones;
}

export interface VacacionesUpdate extends Partial<VacacionesCreate> {
  fecha_inicio_programada?: string;
  fecha_fin_programada?: string;
}

// ─── Préstamo ─────────────────────────────────────────────────────────────

export type TipoPrestamo = 'adelanto_sueldo' | 'prestamo' | 'adelanto_gratificacion';
export type EstadoPrestamo = 'activo' | 'pagado' | 'cancelado';

export interface Prestamo {
  prestamo_id: string;
  cliente_id: string;
  empresa_id: string;
  empleado_id: string;
  numero_prestamo: string;
  tipo_prestamo: TipoPrestamo;
  monto_prestamo: number;
  moneda?: string | null;
  numero_cuotas: number;
  monto_cuota: number;
  cuotas_pagadas?: number | null;
  saldo_pendiente?: number | null;
  estado: EstadoPrestamo;
  fecha_creacion?: string | null;
}

export interface PrestamoCreate {
  empresa_id: string;
  empleado_id: string;
  numero_prestamo: string;
  tipo_prestamo: TipoPrestamo;
  monto_prestamo: number;
  numero_cuotas: number;
  monto_cuota: number;
  moneda?: string;
  estado?: EstadoPrestamo;
}

export interface PrestamoUpdate extends Partial<Omit<PrestamoCreate, 'empresa_id' | 'empleado_id'>> {
  cuotas_pagadas?: number;
  saldo_pendiente?: number;
}
