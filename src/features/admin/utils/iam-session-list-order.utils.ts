import type { UserSessionRead } from '@/features/admin/types/session.types';

/**
 * Ordena sesiones: actual primero, resto mantiene orden relativo.
 * Usar con `isCurrentSession` (RC1 `is_current` + fallback token).
 */
export function sortSessionsCurrentFirst<T extends UserSessionRead>(
  sessions: T[],
  isCurrent: (session: T) => boolean,
): T[] {
  if (sessions.length <= 1) {
    return sessions;
  }

  const current: T[] = [];
  const rest: T[] = [];

  for (const session of sessions) {
    if (isCurrent(session)) {
      current.push(session);
    } else {
      rest.push(session);
    }
  }

  return [...current, ...rest];
}

/** Adapta fila self-service para reutilizar views admin con `variant="self"`. */
export function toActiveSessionRow(session: UserSessionRead): UserSessionRead & {
  nombre_usuario: null;
  nombre: null;
  apellido: null;
  user_agent: null;
} {
  return {
    ...session,
    nombre_usuario: null,
    nombre: null,
    apellido: null,
    user_agent: null,
  };
}
