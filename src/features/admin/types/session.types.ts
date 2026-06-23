/** Contrato ERP-IAM-SESSIONS-API-CONTRACT-V1 (RC1). */

export type UserSessionStatus = 'active' | 'expiring_soon';

export interface SessionDeviceRead {
  client_type: string;
  browser: string;
  browser_version: string | null;
  os: string;
  platform: string;
  device_label: string;
  ip_address: string | null;
  device_id: string | null;
}

export interface UserSessionRead {
  token_id: string;
  usuario_id: string;
  cliente_id: string;
  empresa_id: string | null;
  empresa_nombre: string | null;
  issued_at: string;
  /** Legacy alias — mismo valor que `issued_at`. */
  created_at: string;
  last_refresh_at: string | null;
  /** Legacy alias — mismo valor que `last_refresh_at`. */
  last_used_at: string | null;
  expires_at: string;
  is_current: boolean;
  status: UserSessionStatus;
  duration_seconds: number;
  device: SessionDeviceRead;
  client_type: string;
  /** Legacy alias — preferir `device.ip_address`. */
  ip_address: string | null;
  /** Legacy — preferir `device.device_label`. */
  device_name: string | null;
  /** Legacy — preferir `device.device_id`. */
  device_id: string | null;
}

export interface AdminSessionRead extends UserSessionRead {
  nombre_usuario: string | null;
  nombre: string | null;
  apellido: string | null;
  /** Solo admin — diagnóstico; no parsear para display usuario. */
  user_agent: string | null;
}

export interface PaginatedAdminSessionsResponse {
  /** Envelope canónico RC1. */
  items?: AdminSessionRead[];
  total?: number;
  /** Legacy dual envelope — mismos datos que `items`. */
  sessions?: AdminSessionRead[];
  /** Legacy dual envelope — mismo valor que `total`. */
  total_sesiones?: number;
  pagina_actual: number;
  limit: number;
  total_paginas: number;
}

/** Whitelist sort UI (subset RC1 §7). */
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
  token_id: string;
}

export interface LogoutAllSessionsResponse {
  message: string;
  sessions_closed?: number;
}
