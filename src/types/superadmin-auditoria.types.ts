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















