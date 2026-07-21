/**
 * Invalidación React Query — Runtime Snapshot FCE.
 */

import type { QueryClient } from '@tanstack/react-query';
import {
  CODIGO_RUNTIME_QUERY_KEY_PREFIX,
  codigoRuntimeQueryKeys,
} from './runtime-snapshot.query-keys';

export function invalidateCodigoRuntimeSnapshot(
  queryClient: QueryClient,
): void {
  void queryClient.invalidateQueries({
    queryKey: [...codigoRuntimeQueryKeys.snapshot()],
  });
}

export function removeCodigoRuntimeSnapshot(queryClient: QueryClient): void {
  queryClient.removeQueries({
    queryKey: [...CODIGO_RUNTIME_QUERY_KEY_PREFIX],
  });
}
