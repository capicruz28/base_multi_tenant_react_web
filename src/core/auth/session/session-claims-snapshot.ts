import { decodeAccessToken } from '@/core/auth/utils/decodeAccessToken';

/**
 * Subconjunto de UserData usado para capturar estado pre-refresh.
 * Sin dependencias React — módulo puro (IAM-FE-PHASE-01 Paso 1).
 */
export interface SessionSnapshotUserInput {
  usuario_id?: string;
  cliente_id?: string;
  user_type?: string;
  empresa_activa?: string | null;
  es_admin_cliente?: boolean;
  requires_password_change?: boolean;
}

/**
 * Instantánea normalizada del contexto de sesión para política diff post-refresh.
 */
export interface SessionClaimsSnapshot {
  empresaId: string | null;
  clienteId: string | null;
  usuarioId: string | null;
  userType: string | null;
  esAdminCliente: boolean;
  requiresPasswordChange: boolean;
  selectionPending: boolean;
  isImpersonation: boolean;
  /** false cuando no había user en memoria al capturar el snapshot. */
  hasUser: boolean;
}

export function normalizeSessionId(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUserType(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveBooleanFlag(value: unknown): boolean {
  if (value === true || value === 1) {
    return true;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
  return false;
}

/**
 * Captura el estado de sesión previo a un refresh (token + user + empresa activa de AuthContext).
 * Prioridad empresa: `empresaActivaId` → `user.empresa_activa` → claim JWT `empresa_id`.
 */
export function buildSessionClaimsSnapshot(
  token: string | null,
  user: SessionSnapshotUserInput | null,
  empresaActivaId: string | null,
): SessionClaimsSnapshot {
  const claims = decodeAccessToken(token);

  const empresaId =
    normalizeSessionId(empresaActivaId) ??
    normalizeSessionId(user?.empresa_activa) ??
    normalizeSessionId(claims?.empresa_id);

  const clienteId =
    normalizeSessionId(user?.cliente_id) ?? normalizeSessionId(claims?.cliente_id);

  const usuarioId = normalizeSessionId(user?.usuario_id) ?? normalizeSessionId(claims?.sub);

  const userType = normalizeUserType(user?.user_type) ?? normalizeUserType(claims?.user_type);

  const esAdminCliente =
    user?.es_admin_cliente !== undefined
      ? resolveBooleanFlag(user.es_admin_cliente)
      : resolveBooleanFlag(claims?.es_admin_cliente);

  const requiresPasswordChange =
    user?.requires_password_change !== undefined
      ? resolveBooleanFlag(user.requires_password_change)
      : resolveBooleanFlag(claims?.requires_password_change);

  return {
    empresaId,
    clienteId,
    usuarioId,
    userType,
    esAdminCliente,
    requiresPasswordChange,
    selectionPending: Boolean(claims?.empresa_selection_pending),
    isImpersonation: Boolean(claims?.is_impersonation),
    hasUser: user !== null,
  };
}
