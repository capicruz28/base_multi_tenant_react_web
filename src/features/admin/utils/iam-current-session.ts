import type { AdminSessionRead } from '@/features/admin/types/session.types';

/**
 * Identifica la sesión refresh actual del cliente autenticado.
 * Fuente: GET /auth/me → current_token_id (IAM-FE-CURRENT-TOKEN-ID-01).
 */
export function isCurrentSession(
  session: AdminSessionRead,
  currentTokenId: string | null | undefined,
): boolean {
  if (!currentTokenId) {
    return false;
  }
  return session.token_id === currentTokenId;
}
