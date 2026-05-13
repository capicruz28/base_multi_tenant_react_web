/**
 * Tipos del módulo CRM (Customer Relationship Management)
 * Alineados con DOC_FRONTEND_MODULO_CRM.md — /api/v1/crm/
 */

// ─── Campaña ─────────────────────────────────────────────────────────────────

export type TipoCampana = 'email' | 'telemarketing' | 'evento' | 'digital' | 'mixta';
export type EstadoCampana = 'planificada' | 'activa' | 'pausada' | 'completada' | 'cancelada';

export interface Campana {
  campana_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_campana: string;
  nombre: string;
  descripcion?: string | null;
  tipo_campana: TipoCampana;
  objetivo?: string | null;
  fecha_inicio: string;
  fecha_fin?: string | null;
  presupuesto?: number | null;
  gasto_real?: number | null;
  moneda?: string | null;
  responsable_usuario_id?: string | null;
  responsable_nombre?: string | null;
  total_contactos?: number | null;
  total_leads_generados?: number | null;
  total_oportunidades?: number | null;
  total_ventas_cerradas?: number | null;
  monto_ventas_cerradas?: number | null;
  estado?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface CampanaCreate {
  empresa_id: string;
  codigo_campana: string;
  nombre: string;
  descripcion?: string | null;
  tipo_campana: TipoCampana;
  objetivo?: string | null;
  fecha_inicio: string;
  fecha_fin?: string | null;
  presupuesto?: number | null;
  moneda?: string | null;
  responsable_usuario_id?: string | null;
  responsable_nombre?: string | null;
  estado?: EstadoCampana | null;
  observaciones?: string | null;
}

export interface CampanaUpdate {
  codigo_campana?: string;
  nombre?: string;
  descripcion?: string | null;
  tipo_campana?: TipoCampana;
  objetivo?: string | null;
  fecha_inicio?: string;
  fecha_fin?: string | null;
  presupuesto?: number | null;
  gasto_real?: number | null;
  moneda?: string | null;
  responsable_usuario_id?: string | null;
  responsable_nombre?: string | null;
  estado?: EstadoCampana | null;
  observaciones?: string | null;
}

// ─── Lead ───────────────────────────────────────────────────────────────────

export type OrigenLead = 'web' | 'telefono' | 'referido' | 'evento' | 'campana' | 'redes_sociales';
export type CalificacionLead = 'caliente' | 'tibio' | 'frio';
export type EstadoLead = 'nuevo' | 'contactado' | 'calificado' | 'convertido' | 'descartado';

export interface Lead {
  lead_id: string;
  cliente_id: string;
  empresa_id: string;
  nombre_completo: string;
  empresa_nombre?: string | null;
  cargo?: string | null;
  telefono?: string | null;
  telefono_movil?: string | null;
  email?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  origen_lead: OrigenLead;
  campana_id?: string | null;
  referido_por?: string | null;
  calificacion?: string | null;
  puntuacion?: number | null;
  asignado_vendedor_usuario_id?: string | null;
  asignado_vendedor_nombre?: string | null;
  fecha_asignacion?: string | null;
  estado?: string | null;
  fecha_primer_contacto?: string | null;
  fecha_ultimo_contacto?: string | null;
  convertido_cliente?: boolean;
  cliente_venta_id?: string | null;
  fecha_conversion?: string | null;
  motivo_descarte?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface LeadCreate {
  empresa_id: string;
  nombre_completo: string;
  empresa_nombre?: string | null;
  cargo?: string | null;
  telefono?: string | null;
  telefono_movil?: string | null;
  email?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  origen_lead: OrigenLead;
  campana_id?: string | null;
  referido_por?: string | null;
  calificacion?: CalificacionLead | null;
  puntuacion?: number | null;
  asignado_vendedor_usuario_id?: string | null;
  asignado_vendedor_nombre?: string | null;
  estado?: EstadoLead | null;
  observaciones?: string | null;
}

export interface LeadUpdate {
  nombre_completo?: string;
  empresa_nombre?: string | null;
  cargo?: string | null;
  telefono?: string | null;
  telefono_movil?: string | null;
  email?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  origen_lead?: OrigenLead;
  campana_id?: string | null;
  calificacion?: CalificacionLead | null;
  puntuacion?: number | null;
  asignado_vendedor_usuario_id?: string | null;
  asignado_vendedor_nombre?: string | null;
  estado?: EstadoLead | null;
  convertido_cliente?: boolean;
  cliente_venta_id?: string | null;
  fecha_conversion?: string | null;
  motivo_descarte?: string | null;
  observaciones?: string | null;
}

// ─── Oportunidad ─────────────────────────────────────────────────────────────

export type EtapaOportunidad = 'calificacion' | 'necesidad_analisis' | 'propuesta' | 'negociacion' | 'cierre';
export type EstadoOportunidad = 'abierta' | 'ganada' | 'perdida' | 'cancelada';
export type TipoOportunidad = 'nuevo_negocio' | 'upselling' | 'cross_selling' | 'renovacion';

export interface Oportunidad {
  oportunidad_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_oportunidad: string;
  nombre: string;
  descripcion?: string | null;
  cliente_venta_id?: string | null;
  lead_id?: string | null;
  nombre_cliente_prospecto?: string | null;
  vendedor_usuario_id: string;
  vendedor_nombre?: string | null;
  campana_id?: string | null;
  monto_estimado: number;
  moneda?: string | null;
  probabilidad_cierre?: number | null;
  fecha_apertura: string;
  fecha_cierre_estimada?: string | null;
  fecha_cierre_real?: string | null;
  etapa: string;
  etapa_anterior?: string | null;
  fecha_cambio_etapa?: string | null;
  tipo_oportunidad?: string | null;
  productos_interes?: string | null;
  estado?: string | null;
  motivo_ganada?: string | null;
  motivo_perdida?: string | null;
  competidor?: string | null;
  cotizacion_generada?: boolean;
  cotizacion_id?: string | null;
  pedido_generado?: boolean;
  pedido_id?: string | null;
  observaciones?: string | null;
  proxima_accion?: string | null;
  fecha_proxima_accion?: string | null;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface OportunidadCreate {
  empresa_id: string;
  numero_oportunidad: string;
  nombre: string;
  descripcion?: string | null;
  cliente_venta_id?: string | null;
  lead_id?: string | null;
  nombre_cliente_prospecto?: string | null;
  vendedor_usuario_id: string;
  vendedor_nombre?: string | null;
  campana_id?: string | null;
  monto_estimado: number;
  moneda?: string | null;
  probabilidad_cierre?: number | null;
  fecha_apertura?: string | null;
  fecha_cierre_estimada?: string | null;
  etapa: EtapaOportunidad;
  tipo_oportunidad?: TipoOportunidad | null;
  estado?: EstadoOportunidad | null;
  observaciones?: string | null;
  proxima_accion?: string | null;
  fecha_proxima_accion?: string | null;
}

export interface OportunidadUpdate {
  nombre?: string;
  descripcion?: string | null;
  cliente_venta_id?: string | null;
  lead_id?: string | null;
  monto_estimado?: number;
  probabilidad_cierre?: number | null;
  fecha_cierre_estimada?: string | null;
  fecha_cierre_real?: string | null;
  etapa?: EtapaOportunidad | null;
  etapa_anterior?: string | null;
  fecha_cambio_etapa?: string | null;
  tipo_oportunidad?: TipoOportunidad | null;
  estado?: EstadoOportunidad | null;
  motivo_ganada?: string | null;
  motivo_perdida?: string | null;
  competidor?: string | null;
  cotizacion_generada?: boolean;
  cotizacion_id?: string | null;
  pedido_generado?: boolean;
  pedido_id?: string | null;
  observaciones?: string | null;
  proxima_accion?: string | null;
  fecha_proxima_accion?: string | null;
}

// ─── Actividad ──────────────────────────────────────────────────────────────

export type TipoActividad = 'llamada' | 'reunion' | 'email' | 'visita' | 'demo' | 'cotizacion_enviada';
export type EstadoActividad = 'planificada' | 'completada' | 'cancelada';
export type ResultadoActividad = 'exitosa' | 'sin_respuesta' | 'reagendar' | 'no_interesado';

export interface Actividad {
  actividad_id: string;
  cliente_id: string;
  empresa_id: string;
  tipo_actividad: TipoActividad;
  asunto: string;
  descripcion?: string | null;
  lead_id?: string | null;
  oportunidad_id?: string | null;
  cliente_venta_id?: string | null;
  fecha_actividad: string;
  duracion_minutos?: number | null;
  usuario_responsable_id: string;
  responsable_nombre?: string | null;
  resultado?: string | null;
  requiere_seguimiento?: boolean;
  fecha_seguimiento?: string | null;
  estado?: string | null;
  fecha_completado?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface ActividadCreate {
  empresa_id: string;
  tipo_actividad: TipoActividad;
  asunto: string;
  descripcion?: string | null;
  lead_id?: string | null;
  oportunidad_id?: string | null;
  cliente_venta_id?: string | null;
  fecha_actividad: string;
  duracion_minutos?: number | null;
  usuario_responsable_id: string;
  responsable_nombre?: string | null;
  resultado?: ResultadoActividad | null;
  requiere_seguimiento?: boolean;
  fecha_seguimiento?: string | null;
  estado?: EstadoActividad | null;
  observaciones?: string | null;
}

export interface ActividadUpdate {
  tipo_actividad?: TipoActividad;
  asunto?: string;
  descripcion?: string | null;
  lead_id?: string | null;
  oportunidad_id?: string | null;
  cliente_venta_id?: string | null;
  fecha_actividad?: string;
  duracion_minutos?: number | null;
  usuario_responsable_id?: string | null;
  responsable_nombre?: string | null;
  resultado?: ResultadoActividad | null;
  requiere_seguimiento?: boolean;
  fecha_seguimiento?: string | null;
  estado?: EstadoActividad | null;
  fecha_completado?: string | null;
  observaciones?: string | null;
}
