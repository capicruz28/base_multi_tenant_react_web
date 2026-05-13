/**
 * Tipos del módulo SVC (Órdenes de Servicio).
 * Base: /api/v1/svc
 */

export type EstadoOrdenServicio = 'solicitada' | 'asignada' | 'en_proceso' | 'completada' | 'cancelada';

export interface OrdenServicio {
  orden_servicio_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_os: string;
  fecha_solicitud?: string | null;
  cliente_venta_id?: string | null;
  tipo_servicio?: string | null;
  descripcion_servicio?: string | null;
  tecnico_asignado_usuario_id?: string | null;
  fecha_inicio_programada?: string | null;
  fecha_inicio_real?: string | null;
  fecha_fin_real?: string | null;
  estado?: string | null;
  monto_servicio?: number | null;
  fecha_creacion?: string | null;
}

export interface OrdenServicioCreate {
  empresa_id: string;
  numero_os: string;
  fecha_solicitud?: string;
  cliente_venta_id?: string;
  tipo_servicio: string;
  descripcion_servicio?: string;
  tecnico_asignado_usuario_id?: string;
  fecha_inicio_programada?: string;
  fecha_inicio_real?: string;
  fecha_fin_real?: string;
  estado?: EstadoOrdenServicio;
  monto_servicio?: number;
}

export interface OrdenServicioUpdate {
  numero_os?: string;
  fecha_solicitud?: string;
  cliente_venta_id?: string;
  tipo_servicio?: string;
  descripcion_servicio?: string;
  tecnico_asignado_usuario_id?: string;
  fecha_inicio_programada?: string;
  fecha_inicio_real?: string;
  fecha_fin_real?: string;
  estado?: string;
  monto_servicio?: number;
}
