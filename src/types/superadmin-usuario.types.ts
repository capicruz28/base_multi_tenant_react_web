// Tipos para endpoints de Superadmin de usuarios
// Basados en app/schemas/superadmin_usuario.py del backend

export interface SuperadminClienteInfo {
  cliente_id: string;
  razon_social: string;
  subdominio: string;
  codigo_cliente?: string | null;
  nombre_comercial?: string | null;
  tipo_instalacion: string;
  estado_suscripcion: string;
}

export interface SuperadminRolInfo {
  rol_id: string; // UUID format
  nombre: string;
  codigo_rol?: string | null;
  nivel_acceso: number;
  es_rol_sistema: boolean;
  fecha_asignacion?: string | null;
  es_activo: boolean;
}

export interface SuperadminUsuario {
  usuario_id: string; // UUID format
  cliente_id: string; // UUID format
  cliente: SuperadminClienteInfo;
  nombre_usuario: string;
  correo?: string | null;
  nombre?: string | null;
  apellido?: string | null;
  dni?: string | null;
  telefono?: string | null;
  es_activo: boolean;
  es_eliminado: boolean;
  proveedor_autenticacion: string;
  referencia_externa_id?: string | null;
  referencia_externa_email?: string | null;
  correo_confirmado: boolean;
  intentos_fallidos: number;
  fecha_bloqueo?: string | null;
  ultimo_ip?: string | null;
  fecha_creacion: string;
  fecha_ultimo_acceso?: string | null;
  fecha_actualizacion?: string | null;
  sincronizado_desde?: string | null;
  fecha_ultima_sincronizacion?: string | null;
  roles: SuperadminRolInfo[];
  access_level: number;
  is_super_admin: boolean;
  user_type: string;
}

export interface PaginatedSuperadminUsuariosResponse {
  usuarios: SuperadminUsuario[];
  total_usuarios: number;
  pagina_actual: number;
  total_paginas: number;
}

export interface UsuarioActividadEvento {
  log_id: string; // UUID format
  fecha_evento: string | null;
  evento: string;
  exito: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
  device_info?: string | null;
  descripcion?: string | null;
  codigo_error?: string | null;
  metadata?: Record<string, any> | null;
}

export interface UsuarioActividadResponse {
  usuario_id: string; // UUID format
  ultimo_acceso?: string | null;
  ultimo_ip?: string | null;
  total_eventos: number;
  eventos: UsuarioActividadEvento[];
}

export interface RefreshTokenInfo {
  token_id: string; // UUID format
  client_type: string;
  device_name?: string | null;
  device_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  expires_at: string;
  is_revoked: boolean;
  last_used_at?: string | null;
  uso_count: number;
  revoked_at?: string | null;
  revoked_reason?: string | null;
}

export interface UsuarioSesionesResponse {
  usuario_id: string; // UUID format
  total_sesiones: number;
  sesiones_activas: number;
  sesiones: RefreshTokenInfo[];
}















