import type { QueryClient } from '@tanstack/react-query';

import { invalidateInvQueries } from '@/features/inv/utils/invalidate-inv-queries';
import { invalidateOrgQueries } from '@/features/org/utils/invalidate-org-queries';
import { invalidateCfgQueries } from '@/features/cfg/utils/invalidate-cfg-queries';

import { normalizeSessionId, type SessionClaimsSnapshot } from './session-claims-snapshot';
import type { HydrationLevel } from './session-refresh-diff';

/**
 * Acción de invalidación React Query post-refresh (IAM-FE-PHASE-01 Paso 6).
 */
export type PostRefreshRqAction = 'none' | 'org-inv' | 'clear-all';

/** Estado de sesión post-orquestador para comparar con priorSnapshot (sin decodificar JWT). */
export interface PostRefreshSessionState {
  empresaId: string | null;
  clienteId: string | null;
}

/**
 * Resuelve la política RQ a partir del diff ya calculado (hydrationLevel + ids de sesión).
 * Prioridad: cambio tenant (clear) > cambio empresa (ORG+INV+CFG).
 */
export function resolvePostRefreshRqAction(
  priorSnapshot: SessionClaimsSnapshot,
  hydrationLevel: HydrationLevel,
  currentSession: PostRefreshSessionState,
): PostRefreshRqAction {
  if (hydrationLevel === 'NONE') {
    return 'none';
  }

  const currentClienteId = normalizeSessionId(currentSession.clienteId);
  if (currentClienteId !== priorSnapshot.clienteId) {
    return 'clear-all';
  }

  const currentEmpresaId = normalizeSessionId(currentSession.empresaId);
  if (currentEmpresaId !== priorSnapshot.empresaId) {
    return 'org-inv';
  }

  return 'none';
}

/**
 * Ejecuta la invalidación React Query según la matriz §7.6.
 */
export function applyPostRefreshRqInvalidation(
  action: PostRefreshRqAction,
  queryClient: QueryClient,
): void {
  switch (action) {
    case 'none':
      return;
    case 'org-inv':
      invalidateOrgQueries(queryClient);
      invalidateInvQueries(queryClient);
      invalidateCfgQueries(queryClient);
      return;
    case 'clear-all':
      queryClient.clear();
      return;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
