import type { UserSessionRead } from '@/features/admin/types/session.types';

/** Sesión con identificadores V2 (`session_id`) y compat RC1 (`token_id`). */
export type SessionIdentifiable = Pick<UserSessionRead, 'session_id' | 'token_id'>;

/**
 * Identificador canónico de sesión para UI, keys y revoke (IAM V2).
 * Compat RC1: si el backend no envía `session_id`, usa `token_id`.
 */
export function resolveSessionId(session: SessionIdentifiable): string {
  const sessionId = session.session_id?.trim();
  if (sessionId && sessionId.length > 0) {
    return sessionId;
  }
  return session.token_id;
}
