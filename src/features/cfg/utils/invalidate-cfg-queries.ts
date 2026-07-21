/**
 * Invalidación / remoción de caché React Query del módulo CFG.
 */

import type { QueryClient } from '@tanstack/react-query';
import {
  invalidateCodigoRuntimeSnapshot,
  removeCodigoRuntimeSnapshot,
} from '@/core/codigo';
import { CFG_QUERY_KEY_PREFIX, cfgQueryKeys } from '../hooks/cfg-query-keys';

export { CFG_QUERY_KEY_PREFIX };

export function invalidateCfgQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: [...CFG_QUERY_KEY_PREFIX] });
  // Admin CFG / logout / cambio tenant → Snapshot Runtime desactualizado.
  invalidateCodigoRuntimeSnapshot(queryClient);
}

export function removeCfgQueries(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: [...CFG_QUERY_KEY_PREFIX] });
  removeCodigoRuntimeSnapshot(queryClient);
}

export function invalidateCfgSecuenciasList(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({
    queryKey: [...cfgQueryKeys.secuenciasList()],
  });
}

export function invalidateCfgSecuenciaDetail(
  queryClient: QueryClient,
  secuenciaId: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: [...cfgQueryKeys.secuencia(secuenciaId)],
  });
}

export function removeCfgSecuenciaDetail(
  queryClient: QueryClient,
  secuenciaId: string,
): void {
  queryClient.removeQueries({
    queryKey: [...cfgQueryKeys.secuencia(secuenciaId)],
  });
}
