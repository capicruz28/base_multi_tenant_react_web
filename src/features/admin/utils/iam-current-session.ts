import type { UserSessionRead } from '@/features/admin/types/session.types';

/** Contexto de sesión actual desde GET /auth/me/ (IAM V2 + fallback RC1). */
export interface CurrentSessionMatchContext {
  currentSessionId: string | null | undefined;
  currentTokenId: string | null | undefined;
}

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

function normalizeId(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : null;
}

function idsMatch(
  sessionValue: string | null | undefined,
  currentValue: string | null | undefined,
): boolean {
  const sessionId = normalizeId(sessionValue);
  const currentId = normalizeId(currentValue);
  return sessionId !== null && currentId !== null && sessionId === currentId;
}

/**
 * Identifica la sesión actual del cliente autenticado.
 * Prioridad: `is_current` → `session_id` vs `current_session_id` → `token_id` vs `current_token_id` (RC1).
 */
export function isCurrentSession(
  session: Pick<UserSessionRead, 'session_id' | 'token_id' | 'is_current'>,
  context: CurrentSessionMatchContext,
): boolean {
  if (coerceIsCurrentFlag(session.is_current) === true) {
    return true;
  }

  if (idsMatch(session.session_id, context.currentSessionId)) {
    return true;
  }

  if (idsMatch(session.token_id, context.currentTokenId)) {
    return true;
  }

  return false;
}
