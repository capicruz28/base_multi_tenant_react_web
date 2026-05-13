/**
 * Tipos del módulo TKT (Mesa de Ayuda / Ticketing).
 * Base: /api/v1/tkt
 */

export type CategoriaTicket = 'soporte_tecnico' | 'consulta' | 'incidencia' | 'requerimiento';
export type PrioridadTicket = 'urgente' | 'alta' | 'media' | 'baja';
export type EstadoTicket = 'abierto' | 'asignado' | 'en_proceso' | 'resuelto' | 'cerrado';

export interface Ticket {
  ticket_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_ticket: string;
  fecha_creacion?: string | null;
  solicitante_usuario_id?: string | null;
  solicitante_nombre?: string | null;
  solicitante_email?: string | null;
  asunto?: string | null;
  descripcion?: string | null;
  categoria?: string | null;
  prioridad?: string | null;
  asignado_usuario_id?: string | null;
  fecha_asignacion?: string | null;
  estado?: string | null;
  fecha_resolucion?: string | null;
  tiempo_resolucion_horas?: number | null;
  solucion?: string | null;
}

export interface TicketCreate {
  empresa_id: string;
  numero_ticket: string;
  solicitante_usuario_id?: string;
  solicitante_nombre?: string;
  solicitante_email?: string;
  asunto: string;
  descripcion?: string;
  categoria?: CategoriaTicket;
  prioridad?: PrioridadTicket;
  asignado_usuario_id?: string;
  fecha_asignacion?: string;
  estado?: EstadoTicket;
  fecha_resolucion?: string;
  solucion?: string;
}

export interface TicketUpdate {
  numero_ticket?: string;
  solicitante_nombre?: string;
  solicitante_email?: string;
  asunto?: string;
  descripcion?: string;
  categoria?: string;
  prioridad?: string;
  asignado_usuario_id?: string;
  fecha_asignacion?: string;
  estado?: string;
  fecha_resolucion?: string;
  solucion?: string;
}
