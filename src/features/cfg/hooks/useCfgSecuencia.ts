/**
 * Detalle de secuencia CFG.
 */

import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { cfgSecuenciaService } from '../services/cfg-secuencias.service';
import type { CfgSecuencia } from '../types/cfg.types';
import { CFG_DETAIL_STALE_TIME_MS } from './cfg-query-defaults';
import { cfgQueryKeys } from './cfg-query-keys';

export function useCfgSecuencia(
  secuenciaId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const enabled =
    !!secuenciaId && (options?.enabled !== false);

  return useTenantQuery<CfgSecuencia, Error>({
    queryKey: cfgQueryKeys.secuencia(secuenciaId ?? ''),
    queryFn: () => cfgSecuenciaService.getById(secuenciaId ?? ''),
    staleTime: CFG_DETAIL_STALE_TIME_MS,
    refetchOnMount: 'always',
    enabled,
  });
}
