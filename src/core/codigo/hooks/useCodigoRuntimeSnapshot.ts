/**
 * React Query — Runtime Snapshot del tenant.
 * Contrato: GET /cfg/runtime/snapshot (sin query params).
 */

import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { codigoRuntimeSnapshotService } from '../runtime/runtime-snapshot.service';
import { codigoRuntimeQueryKeys } from '../runtime/runtime-snapshot.query-keys';
import type { CodigoRuntimeSnapshot } from '../runtime/runtime-snapshot.types';

/** Snapshot cambia poco; forms reusan cache. */
export const CODIGO_RUNTIME_SNAPSHOT_STALE_TIME_MS = 60_000;

export function useCodigoRuntimeSnapshot(options?: { enabled?: boolean }) {
  return useTenantQuery<CodigoRuntimeSnapshot, Error>({
    queryKey: codigoRuntimeQueryKeys.snapshot(),
    queryFn: () => codigoRuntimeSnapshotService.getSnapshot(),
    staleTime: CODIGO_RUNTIME_SNAPSHOT_STALE_TIME_MS,
    enabled: options?.enabled !== false,
  });
}
