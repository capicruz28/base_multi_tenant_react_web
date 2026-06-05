import { decodeAccessToken } from './decodeAccessToken';

/** Token de fase POST login Schema A (solo selección de empresa). */
export function isSelectionPendingToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const claims = decodeAccessToken(token);
  return Boolean(claims?.empresa_selection_pending);
}

/** Solo sesión completa (Schema B) puede llamar GET /auth/me, menú y permisos ERP. */
export function canInitializeFullSession(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string' || !token.trim()) return false;
  return !isSelectionPendingToken(token);
}
