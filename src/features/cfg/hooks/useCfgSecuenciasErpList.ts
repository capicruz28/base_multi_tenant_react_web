/**
 * Listado Tier B — CFG secuencias (tenant-first, sin company gate).
 */

import { useEffect, useMemo } from 'react';
import { useErpListQuery } from '@/core/list';
import { SECUENCIAS_LIST_CONFIG } from '../constants/cfg-list.constants';
import { cfgSecuenciaService } from '../services/cfg-secuencias.service';
import type { CfgScopeType, CfgSecuencia } from '../types/cfg.types';
import { CFG_LIST_STALE_TIME_MS } from './cfg-query-defaults';
import { cfgQueryKeys } from './cfg-query-keys';

export interface UseCfgSecuenciasErpListOptions {
  modulo_codigo?: string;
  es_activo?: boolean;
  scope_type?: CfgScopeType;
  debouncedBuscar?: string;
  enabled?: boolean;
}

function buildFilterSignature(options: UseCfgSecuenciasErpListOptions): string {
  const esActivo =
    options.es_activo === undefined ? 'all' : String(options.es_activo);
  return [
    options.modulo_codigo ?? '',
    esActivo,
    options.scope_type ?? '',
  ].join('|');
}

export function useCfgSecuenciasErpList(
  options: UseCfgSecuenciasErpListOptions = {},
) {
  const {
    modulo_codigo,
    es_activo,
    scope_type,
    debouncedBuscar,
    enabled = true,
  } = options;

  const filterSignature = useMemo(
    () => buildFilterSignature({ modulo_codigo, es_activo, scope_type }),
    [modulo_codigo, es_activo, scope_type],
  );

  const baseFilters = useMemo(
    () => ({
      modulo_codigo,
      es_activo,
      scope_type,
    }),
    [modulo_codigo, es_activo, scope_type],
  );

  const listQuery = useErpListQuery<CfgSecuencia, typeof baseFilters>({
    queryKeyPrefix: [...cfgQueryKeys.secuenciasList(), filterSignature],
    fetcher: (params) => cfgSecuenciaService.list(params),
    baseFilters,
    debouncedBuscar,
    config: SECUENCIAS_LIST_CONFIG,
    enabled,
    staleTime: CFG_LIST_STALE_TIME_MS,
  });

  const { setPage } = listQuery;

  useEffect(() => {
    setPage(1);
  }, [debouncedBuscar, modulo_codigo, es_activo, scope_type, setPage]);

  return listQuery;
}
