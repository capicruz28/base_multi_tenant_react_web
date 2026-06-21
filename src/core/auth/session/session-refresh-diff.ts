import { decodeAccessToken } from '@/core/auth/utils/decodeAccessToken';

import {
  normalizeSessionId,
  type SessionClaimsSnapshot,
} from './session-claims-snapshot';

/**
 * Nivel de hidratación requerido tras refresh exitoso (interceptor 401).
 * - NONE: claims sync (L1) suficiente; sin /auth/me.
 * - FULL: hidratación completa (L2) con /auth/me y menú condicional.
 */
export type HydrationLevel = 'NONE' | 'FULL';

function normalizeUserType(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readRequiresPasswordChange(claims: ReturnType<typeof decodeAccessToken>): boolean {
  return Boolean(claims?.requires_password_change);
}

/**
 * Evalúa si el nuevo access token exige hidratación FULL respecto al snapshot pre-refresh.
 * Lógica pura y determinística — IAM_FE_PHASE_01_TECHNICAL_DESIGN §8.6.
 */
export function resolveHydrationLevel(
  prior: SessionClaimsSnapshot,
  newToken: string,
): HydrationLevel {
  if (!prior.hasUser) {
    return 'FULL';
  }

  const newClaims = decodeAccessToken(newToken);
  if (!newClaims) {
    return 'FULL';
  }

  if (Boolean(newClaims.empresa_selection_pending)) {
    return 'FULL';
  }

  const newEmpresaId = normalizeSessionId(newClaims.empresa_id);
  if (newEmpresaId !== prior.empresaId) {
    return 'FULL';
  }

  const newClienteId = normalizeSessionId(newClaims.cliente_id);
  if (newClienteId !== prior.clienteId) {
    return 'FULL';
  }

  const newUsuarioId = normalizeSessionId(newClaims.sub);
  if (newUsuarioId !== prior.usuarioId) {
    return 'FULL';
  }

  const newUserType = normalizeUserType(newClaims.user_type);
  if (newUserType !== prior.userType) {
    return 'FULL';
  }

  const newImpersonation = Boolean(newClaims.is_impersonation);
  if (newImpersonation !== prior.isImpersonation) {
    return 'FULL';
  }

  const newRequiresPasswordChange = readRequiresPasswordChange(newClaims);
  if (!prior.requiresPasswordChange && newRequiresPasswordChange) {
    return 'FULL';
  }

  return 'NONE';
}
