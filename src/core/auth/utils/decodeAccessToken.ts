/**
 * Decodifica el payload del JWT de acceso (solo lectura en cliente para UI/guards).
 * No sustituye la validación del backend.
 */
export interface AccessTokenClaims {
  empresa_id?: string | null;
  empresa_selection_pending?: boolean;
  es_admin_cliente?: boolean;
  user_type?: string;
  cliente_id?: string | null;
  sub?: string;
  is_impersonation?: boolean;
  impersonated_by?: string;
  impersonated_by_username?: string;
  /** JWT exp (epoch seconds). Usado solo para UX/rehidratación. */
  exp?: number;
}

function readImpersonationFlag(payload: Record<string, unknown>): boolean {
  const v = payload.is_impersonation;
  if (v === true || v === 1) return true;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === 'true' || s === '1';
  }
  return false;
}

export function decodeAccessToken(token: string | null | undefined): AccessTokenClaims | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    const payload = JSON.parse(json) as Record<string, unknown>;
    return {
      empresa_id: (payload.empresa_id as string) ?? null,
      empresa_selection_pending: Boolean(payload.empresa_selection_pending),
      es_admin_cliente: Boolean(payload.es_admin_cliente),
      user_type: typeof payload.user_type === 'string' ? payload.user_type : undefined,
      cliente_id: (payload.cliente_id as string) ?? null,
      sub: typeof payload.sub === 'string' ? payload.sub : undefined,
      is_impersonation: readImpersonationFlag(payload),
      impersonated_by:
        typeof payload.impersonated_by === 'string' ? payload.impersonated_by : undefined,
      impersonated_by_username:
        typeof payload.impersonated_by_username === 'string'
          ? payload.impersonated_by_username
          : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    };
  } catch {
    return null;
  }
}
