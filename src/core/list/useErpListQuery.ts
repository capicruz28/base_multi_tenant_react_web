import { useCallback, useMemo, useState } from 'react';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { ERP_LIST_DEFAULT_LIMIT } from './erp-list.constants';
import { normalizeListResponse } from './erp-list-normalize';
import { resolveErpListFetchParams } from './erp-list-query-params';
import type {
  ErpListQueryBase,
  ErpListResourceConfig,
  ErpListSortState,
  ErpPaginatedResponse,
} from './erp-list.types';

export interface UseErpListQueryOptions<T, F extends Record<string, unknown>> {
  /** Prefijo queryKey sin tenant (useTenantQuery añade tenantId). */
  queryKeyPrefix: readonly unknown[];
  /** Fetcher del módulo — retorna `list[]` o envelope según presencia de `page`. */
  fetcher: (params: F & ErpListQueryBase) => Promise<T[] | ErpPaginatedResponse<T>>;
  /** Filtros de dominio (sin page/limit/buscar/sort). */
  baseFilters: F;
  config: ErpListResourceConfig;
  /** Valor debounced de búsqueda (useDebouncedSearch). */
  debouncedBuscar?: string;
  enabled?: boolean;
  staleTime?: number;
  initialPage?: number;
  initialLimit?: number;
  initialSort?: ErpListSortState;
}

function nextSortState(
  column: string,
  current: ErpListSortState,
  sortableColumns: readonly string[],
): ErpListSortState {
  if (!sortableColumns.includes(column)) {
    return current;
  }
  if (current.sort_by !== column) {
    return { sort_by: column, sort_dir: 'asc' };
  }
  if (current.sort_dir === 'asc') {
    return { sort_by: column, sort_dir: 'desc' };
  }
  return {};
}

export function useErpListQuery<T, F extends Record<string, unknown>>(
  options: UseErpListQueryOptions<T, F>,
) {
  const {
    queryKeyPrefix,
    fetcher,
    baseFilters,
    config,
    debouncedBuscar,
    enabled = true,
    staleTime,
    initialPage = 1,
    initialLimit = config.defaultLimit ?? ERP_LIST_DEFAULT_LIMIT,
    initialSort,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sort, setSort] = useState<ErpListSortState>(
    initialSort ?? config.defaultSort ?? {},
  );

  const fetchParams = useMemo(
    () =>
      resolveErpListFetchParams(
        baseFilters as Partial<ErpListQueryBase>,
        config,
        {
          page,
          limit,
          sort_by: sort.sort_by,
          sort_dir: sort.sort_dir,
          debouncedBuscar,
        },
      ),
    [baseFilters, config, page, limit, sort, debouncedBuscar],
  );

  const queryKey = useMemo(
    () => [
      ...queryKeyPrefix,
      fetchParams.page ?? null,
      fetchParams.limit ?? null,
      fetchParams.buscar ?? '',
      fetchParams.sort_by ?? null,
      fetchParams.sort_dir ?? null,
      baseFilters,
    ],
    [queryKeyPrefix, fetchParams, baseFilters],
  );

  const query = useTenantQuery<ErpPaginatedResponse<T>, Error>({
    queryKey,
    enabled,
    staleTime,
    queryFn: async () => {
      const raw = await fetcher({ ...baseFilters, ...fetchParams } as F & ErpListQueryBase);
      return normalizeListResponse(raw, config.tier);
    },
  });

  const toggleSort = useCallback(
    (column: string) => {
      setSort((prev) => nextSortState(column, prev, config.sortableColumns));
      setPage(1);
    },
    [config.sortableColumns],
  );

  const clearSort = useCallback(() => {
    setSort({});
    setPage(1);
  }, []);

  const resetSortState = useCallback(() => {
    setSort(config.defaultSort ?? {});
  }, [config.defaultSort]);

  const setLimitAndReset = useCallback((nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  }, []);

  const setPageSafe = useCallback((nextPage: number) => {
    setPage(Math.max(1, nextPage));
  }, []);

  return {
    data: query.data,
    items: query.data?.items ?? [],
    pagination: query.data
      ? {
          total: query.data.total,
          pagina_actual: query.data.pagina_actual,
          total_paginas: query.data.total_paginas,
          limit: query.data.limit,
        }
      : undefined,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    page,
    setPage: setPageSafe,
    limit,
    setLimit: setLimitAndReset,
    sort,
    toggleSort,
    clearSort,
    resetSortState,
    fetchParams,
  };
}
