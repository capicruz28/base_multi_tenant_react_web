// Tipos para endpoints de Superadmin de auditoría
// Basados en app/schemas/superadmin_auditoria.py del backend

import type { SuperadminClienteInfo } from './superadmin-usuario.types';

export interface AuditUsuarioInfo {
  usuario_id: string; // UUID format
  nombre_usuario: string;
  correo?: string | null;
}

export interface AuthAuditLog {
  log_id: string; // UUID format
  cliente_id: string; // UUID format
  cliente?: SuperadminClienteInfo | null;
  usuario_id?: string | null; // UUID format
  usuario?: AuditUsuarioInfo | null;
  evento: string;
  nombre_usuario_intento?: string | null;
  descripcion?: string | null;
  exito: boolean;
  codigo_error?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  device_info?: string | null;
  geolocation?: string | null;
  metadata_json?: Record<string, any> | null;
  fecha_evento: string;
}

export interface PaginatedAuthAuditLogResponse {
  logs: AuthAuditLog[];
  total_logs: number;
  pagina_actual: number;
  total_paginas: number;
}

export interface AuditoriaEstadisticasPeriodo {
  fecha_desde: string;
  fecha_hasta: string;
}

export interface AuditoriaEstadisticasAutenticacion {
  total_eventos: number;
  login_exitosos: number;
  login_fallidos: number;
  eventos_por_tipo: Record<string, number>;
}

export interface AuditoriaEstadisticasSincronizacion {
  total_sincronizaciones: number;
  exitosas: number;
  fallidas: number;
  por_tipo: Record<string, number>;
}

export interface AuditoriaTopIp {
  ip_address: string;
  total_eventos: number;
  eventos_fallidos: number;
}

export interface AuditoriaTopUsuario {
  usuario_id: string;
  nombre_usuario: string;
  total_eventos: number;
}

export interface AuditoriaEstadisticasResponse {
  periodo: AuditoriaEstadisticasPeriodo;
  autenticacion: AuditoriaEstadisticasAutenticacion;
  sincronizacion: AuditoriaEstadisticasSincronizacion;
  top_ips: AuditoriaTopIp[];
  top_usuarios: AuditoriaTopUsuario[];
}

export interface SyncAuditLog {
  log_id: string;
  cliente_origen_id?: string | null;
  cliente_origen?: SuperadminClienteInfo | null;
  cliente_destino_id?: string | null;
  cliente_destino?: SuperadminClienteInfo | null;
  usuario_id?: string | null;
  usuario?: AuditUsuarioInfo | null;
  tipo_sincronizacion: string;
  direccion: string;
  operacion: string;
  estado: string;
  mensaje_error?: string | null;
  fecha_sincronizacion: string;
}

export interface PaginatedSyncAuditLogResponse {
  logs: SyncAuditLog[];
  total_logs: number;
  pagina_actual: number;
  total_paginas: number;
}















