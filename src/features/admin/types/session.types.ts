/** Contrato IAM-SESSIONS-PA-001 — AdminSessionRead (BACKEND_PLATFORM_API_CONTRACT_V2 §1d). */
export interface AdminSessionRead {
  token_id: string;
  usuario_id: string;
  cliente_id: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string;
  device_name: string | null;
  device_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  client_type: string;
  nombre_usuario: string | null;
  nombre: string | null;
  apellido: string | null;
}

export interface PaginatedAdminSessionsResponse {
  sessions: AdminSessionRead[];
  total_sesiones: number;
  pagina_actual: number;
  limit: number;
  total_paginas: number;
}

/** Whitelist sort UI (subset contract §1d). */
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
  token_id?: string;
}

export interface LogoutAllSessionsResponse {
  message: string;
  sessions_closed?: number;
}
