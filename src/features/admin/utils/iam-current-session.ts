import type { UserSessionRead } from '@/features/admin/types/session.types';

function coerceIsCurrentFlag(value: unknown): boolean | undefined {
  if (value === true || value === 1) {
    return true;
  }
  if (value === false || value === 0) {
    return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }
  return undefined;
}

function normalizeTokenId(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : null;
}

function tokensMatch(
  sessionTokenId: string,
  currentTokenId: string | null | undefined,
): boolean {
  const sessionToken = normalizeTokenId(sessionTokenId);
  const currentToken = normalizeTokenId(currentTokenId);
  return sessionToken !== null && currentToken !== null && sessionToken === currentToken;
}

/**
 * Identifica la sesión refresh actual del cliente autenticado.
 * RC1: `is_current === true` del Backend; fallback `current_token_id === token_id`.
 * HOTFIX RC1: si el Backend envía `is_current: false` pero el token coincide, confiar en el token.
 */
export function isCurrentSession(
  session: Pick<UserSessionRead, 'token_id' | 'is_current'>,
  currentTokenId: string | null | undefined,
): boolean {
  if (coerceIsCurrentFlag(session.is_current) === true) {
    return true;
  }

  if (tokensMatch(session.token_id, currentTokenId)) {
    return true;
  }

  return false;
}
