/**
 * Contrato IAM Session Management V2 — Password Authentication.
 * Referencia: IAM_SESSION_MANAGEMENT_V2_BACKEND_SPECIFICATION.md §6.10, §8.3.
 * Compat: campos legacy RC1 (`created_at`, `last_used_at`, `ip_address` raíz) permanecen opcionales.
 */

export type UserSessionStatus = 'active' | 'expiring_soon';

export interface SessionDeviceRead {
  client_type: string;
  browser: string;
  browser_version: string | null;
  os: string;
  platform: string;
  device_label: string;
  /** Última IP conocida (`last_seen_ip` en BD). */
  ip_address: string | null;
  device_id: string | null;
}

export interface UserSessionRead {
  /** Identificador estable de sesión (IAM V2). Fallback revoke/UI: `token_id` si ausente. */
  session_id?: string | null;
  /** Refresh vigente — cambia en RTR; no usar como ID de sesión en V2. */
  token_id: string;
  usuario_id: string;
  cliente_id: string;
  empresa_id: string | null;
  empresa_nombre: string | null;
  /** Inicio de sesión (`user_session.created_at` en V2). Estable tras RTR. */
  issued_at: string;
  /** Alias legacy — mismo valor que `issued_at`. */
  created_at: string;
  /** Último refresh exitoso. No refleja actividad API de negocio. */
  last_refresh_at: string | null;
  /** Alias legacy — mismo valor que `last_refresh_at`. */
  last_used_at: string | null;
  /** Expiración absoluta de sesión (`user_session.expires_at` en V2). */
  expires_at: string;
  is_current: boolean;
  status: UserSessionStatus;
  duration_seconds: number;
  device: SessionDeviceRead;
  client_type: string;
  /** IP original del login (inmutable, auditoría). No confundir con última IP. */
  login_ip?: string | null;
  /** Alias legacy de `device.ip_address` — última IP conocida (`last_seen_ip`). */
  ip_address: string | null;
  /** Alias legacy — preferir `device.device_label`. */
  device_name: string | null;
  /** Alias legacy — preferir `device.device_id`. */
  device_id: string | null;
  /** Superset V2 — método de autenticación (ej. password). */
  login_method?: string | null;
  /** Superset V2 — última actividad ERP (throttle BE); no revoca sesión. */
  last_business_activity_at?: string | null;
}

export interface AdminSessionRead extends UserSessionRead {
  nombre_usuario: string | null;
  nombre: string | null;
  apellido: string | null;
  /** Solo admin — diagnóstico; no parsear para display usuario. */
  user_agent: string | null;
}

export interface PaginatedAdminSessionsResponse {
  /** Envelope paginado canónico. */
  items?: AdminSessionRead[];
  total?: number;
  /** Dual envelope legacy — mismos datos que `items`. */
  sessions?: AdminSessionRead[];
  /** Dual envelope legacy — mismo valor que `total`. */
  total_sesiones?: number;
  pagina_actual: number;
  limit: number;
  total_paginas: number;
}

/** Whitelist sort UI admin (subset BE). */
export type AdminSessionSortBy =
  | 'nombre_usuario'
  | 'created_at'
  | 'last_used_at'
  | 'expires_at'
  | 'client_type';

export type AdminSessionSortOrder = 'asc' | 'desc';

export type AdminSessionClientTypeFilter = 'all' | 'web' | 'mobile';

export interface GetAdminSessionsParams {
  page: number;
  limit: number;
  search?: string;
  sort_by?: AdminSessionSortBy;
  sort_order?: AdminSessionSortOrder;
  client_type?: 'web' | 'mobile';
  usuario_id?: string;
}

export interface RevokeSessionResponse {
  message: string;
  /** Refresh revocado (alias compat). */
  token_id: string;
  /** Superset V2 — identificador de sesión cerrada. */
  session_id?: string | null;
}

export interface LogoutAllSessionsResponse {
  message: string;
  sessions_closed?: number;
}

/** Campos V2 adicionales tolerados en JSON superset sin tipado estricto. */
export type UserSessionReadSuperset = UserSessionRead & Record<string, unknown>;
