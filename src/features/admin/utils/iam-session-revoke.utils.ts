import type { QueryClient } from '@tanstack/react-query';
import { SESSION_LOGOUT_V3_ENABLED } from '@/core/auth/session/session-logout-v3.flags';
import { getErrorMessage } from '@/core/services/error.service';
import type { AdminSessionRead, UserSessionRead } from '@/features/admin/types/session.types';

/** Dependencias inyectables del flujo revoke admin (IMPL-08 — tests). */
export interface ActiveSessionRevokeDeps {
  revokeSessionById: (tokenId: string) => Promise<void>;
  invalidateActiveSessionsListQueries: (queryClient: QueryClient) => Promise<void>;
  runSessionValidityProbe: () => Promise<void>;
  isCurrentSession: (session: AdminSessionRead) => boolean;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
}

/** Dependencias inyectables del flujo self-revoke. */
export interface SelfSessionRevokeDeps {
  revokeSessionSelf: (tokenId: string) => Promise<{ message: string; token_id: string }>;
  invalidateMySessionsListQueries: (queryClient: QueryClient) => Promise<void>;
  runSessionValidityProbe: () => Promise<void>;
  isCurrentSession: (session: UserSessionRead) => boolean;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
}

/**
 * Orquesta revoke admin + invalidate + probe post-revoke si sesión propia (§15.1).
 * No invoca terminateSession — probe delega al interceptor vía AuthContext.
 */
export async function executeActiveSessionRevoke(
  target: AdminSessionRead,
  queryClient: QueryClient,
  deps: ActiveSessionRevokeDeps,
): Promise<void> {
  try {
    await deps.revokeSessionById(target.token_id);
    deps.showSuccessToast(
      `Sesión de ${target.nombre_usuario ?? 'usuario'} revocada correctamente.`,
    );
    await deps.invalidateActiveSessionsListQueries(queryClient);

    if (SESSION_LOGOUT_V3_ENABLED && deps.isCurrentSession(target)) {
      await deps.runSessionValidityProbe();
    }
  } catch (err) {
    deps.showErrorToast(getErrorMessage(err).message || 'Error al revocar sesión.');
    throw err;
  }
}

/**
 * Self-revoke idempotente + invalidate + probe si cierra la sesión actual.
 */
export async function executeSelfSessionRevoke(
  target: UserSessionRead,
  queryClient: QueryClient,
  deps: SelfSessionRevokeDeps,
): Promise<void> {
  try {
    await deps.revokeSessionSelf(target.token_id);
    deps.showSuccessToast('Sesión cerrada correctamente.');
    await deps.invalidateMySessionsListQueries(queryClient);

    if (SESSION_LOGOUT_V3_ENABLED && deps.isCurrentSession(target)) {
      await deps.runSessionValidityProbe();
    }
  } catch (err) {
    deps.showErrorToast(getErrorMessage(err).message || 'Error al cerrar sesión.');
    throw err;
  }
}
