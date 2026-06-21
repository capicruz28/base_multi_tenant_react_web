import { decodeAccessToken, type AccessTokenClaims } from '@/core/auth/utils/decodeAccessToken';

import { normalizeSessionId } from './session-claims-snapshot';

/**
 * Usuario mergeable para L1 — subconjunto de UserData sin dependencias React.
 */
export interface ClaimsSyncMergeableUser {
  usuario_id?: string;
  cliente_id?: string;
  user_type?: string;
  empresa_activa?: string | null;
  es_admin_cliente?: boolean;
  requires_password_change?: boolean;
  nombre_usuario?: string;
  correo?: string;
  nombre?: string;
  apellido?: string;
  roles?: string[];
}

/** Campos actualizados desde claims JWT en L1. */
export interface ClaimsSyncUserPatch {
  requires_password_change: boolean;
  empresa_activa: string | null;
  user_type?: string;
  es_admin_cliente: boolean;
  usuario_id?: string;
  cliente_id?: string;
}

export interface ApplyClaimsSyncInput {
  newToken: string;
  currentUser: ClaimsSyncMergeableUser | null;
}

export interface ApplyClaimsSyncCallbacks {
  /** Equivalente a AuthContext.syncEmpresaSession — inyectado por el orquestador. */
  syncEmpresaSession?: (user: ClaimsSyncMergeableUser | null, token: string) => void;
  /** Equivalente a AuthContext.syncImpersonationFromToken — inyectado por el orquestador. */
  syncImpersonationFromToken?: (token: string) => void;
}

export interface ApplyClaimsSyncResult {
  token: string;
  userPatch: ClaimsSyncUserPatch | null;
  mergedUser: ClaimsSyncMergeableUser | null;
  empresaActivaId: string | null;
  requiereSeleccionEmpresa: boolean;
  esAdminCliente: boolean;
  isImpersonation: boolean;
  impersonatedBy: string | null;
  impersonatedByUsername: string | null;
}

function resolveEsAdminCliente(
  user: ClaimsSyncMergeableUser | null,
  claims: AccessTokenClaims,
): boolean {
  return Boolean(user?.es_admin_cliente) || Boolean(claims.es_admin_cliente);
}

function buildEmpresaState(
  user: ClaimsSyncMergeableUser | null,
  claims: AccessTokenClaims,
): Pick<ApplyClaimsSyncResult, 'empresaActivaId' | 'requiereSeleccionEmpresa' | 'esAdminCliente'> {
  const empresaActivaId =
    normalizeSessionId(claims.empresa_id) ??
    normalizeSessionId(user?.empresa_activa) ??
    null;

  return {
    empresaActivaId,
    requiereSeleccionEmpresa: Boolean(claims.empresa_selection_pending),
    esAdminCliente: resolveEsAdminCliente(user, claims),
  };
}

function buildImpersonationState(claims: AccessTokenClaims): Pick<
  ApplyClaimsSyncResult,
  'isImpersonation' | 'impersonatedBy' | 'impersonatedByUsername'
> {
  const isImpersonation = Boolean(claims.is_impersonation);
  return {
    isImpersonation,
    impersonatedBy: isImpersonation ? claims.impersonated_by ?? null : null,
    impersonatedByUsername: isImpersonation ? claims.impersonated_by_username ?? null : null,
  };
}

function buildUserPatch(
  user: ClaimsSyncMergeableUser | null,
  claims: AccessTokenClaims,
): ClaimsSyncUserPatch | null {
  if (!user) {
    return null;
  }

  const empresaActiva =
    normalizeSessionId(claims.empresa_id) ??
    normalizeSessionId(user.empresa_activa) ??
    null;

  const patch: ClaimsSyncUserPatch = {
    requires_password_change: Boolean(claims.requires_password_change),
    empresa_activa: empresaActiva,
    es_admin_cliente: resolveEsAdminCliente(user, claims),
  };

  if (claims.user_type !== undefined) {
    patch.user_type = claims.user_type;
  }

  const usuarioId = user.usuario_id?.trim() || claims.sub;
  if (usuarioId) {
    patch.usuario_id = usuarioId;
  }

  const clienteId = user.cliente_id?.trim() || normalizeSessionId(claims.cliente_id);
  if (clienteId) {
    patch.cliente_id = clienteId;
  }

  return patch;
}

function buildMergedUser(
  user: ClaimsSyncMergeableUser | null,
  patch: ClaimsSyncUserPatch | null,
): ClaimsSyncMergeableUser | null {
  if (!user || !patch) {
    return null;
  }

  return {
    ...user,
    requires_password_change: patch.requires_password_change,
    empresa_activa: patch.empresa_activa,
    es_admin_cliente: patch.es_admin_cliente,
    ...(patch.user_type !== undefined ? { user_type: patch.user_type } : {}),
    ...(patch.usuario_id !== undefined ? { usuario_id: patch.usuario_id } : {}),
    ...(patch.cliente_id !== undefined ? { cliente_id: patch.cliente_id } : {}),
  };
}

/**
 * L1 — sincroniza claims del nuevo access JWT al estado de sesión.
 * Puro: efectos solo vía callbacks inyectados (IAM-FE-PHASE-01 Paso 2).
 */
export function applyClaimsSync(
  input: ApplyClaimsSyncInput,
  callbacks?: ApplyClaimsSyncCallbacks,
): ApplyClaimsSyncResult {
  const { newToken, currentUser } = input;
  const claims = decodeAccessToken(newToken);

  if (!claims) {
    throw new Error('Invalid access token for claims sync');
  }

  const empresaState = buildEmpresaState(currentUser, claims);
  const impersonationState = buildImpersonationState(claims);
  const userPatch = buildUserPatch(currentUser, claims);
  const mergedUser = buildMergedUser(currentUser, userPatch);

  if (callbacks?.syncEmpresaSession) {
    callbacks.syncEmpresaSession(mergedUser, newToken);
  }

  if (callbacks?.syncImpersonationFromToken) {
    callbacks.syncImpersonationFromToken(newToken);
  }

  return {
    token: newToken,
    userPatch,
    mergedUser,
    ...empresaState,
    ...impersonationState,
  };
}
