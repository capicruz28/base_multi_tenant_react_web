/**
 * Tipos del módulo AUD (Auditoría y Trazabilidad).
 * Base: /api/v1/aud
 * El log es inmutable: no hay Update ni Delete.
 */

export type AccionAuditoria = 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';

export interface LogAuditoriaCreate {
  empresa_id: string;
  usuario_id?: string;
  usuario_nombre?: string;
  modulo: string;
  tabla: string;
  accion: AccionAuditoria;
  registro_id?: string;
  registro_descripcion?: string;
  valores_anteriores?: string;
  valores_nuevos?: string;
  ip_address?: string;
  user_agent?: string;
  observaciones?: string;
}

export interface LogAuditoriaRead {
  log_id: string;
  cliente_id: string;
  empresa_id: string;
  fecha_evento: string;
  usuario_id?: string | null;
  usuario_nombre?: string | null;
  modulo: string;
  tabla: string;
  accion: string;
  registro_id?: string | null;
  registro_descripcion?: string | null;
  valores_anteriores?: string | null;
  valores_nuevos?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  observaciones?: string | null;
}
