import { useCallback, useEffect, useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { ErpPaginatedResponse } from '@/core/list';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getRoles } from '../services/rol.service';
import type { Rol } from '../types/rol.types';
import { normalizePaginatedRolResponse } from '../utils/iam-rol-list-normalize';

/** Filtro de vigencia. `'all'` = activos + inactivos (solo_activos=false). Extensible a `'inactive'`. */
export type RolesListActiveFilter = 'active' | 'all';

export const ROLES_LIST_QUERY_KEY = ['admin', 'roles', 'list'] as const;

/** Invalida todas las variantes del listado (filtro, página, búsqueda). Patrón INV productos. */
export function invalidateRolesListQueries(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: ROLES_LIST_QUERY_KEY });
}

export const DEFAULT_ROLES_LIST_LIMIT = 25;

export interface UseRolesListOptions {
  debouncedSearch?: string;
  activeFilter: RolesListActiveFilter;
  enabled?: boolean;
  initialLimit?: number;
}

export function useRolesList(options: UseRolesListOptions) {
  const { debouncedSearch, activeFilter, enabled = true, initialLimit = DEFAULT_ROLES_LIST_LIMIT } =
    options;

  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(initialLimit);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeFilter]);

  const query = useTenantQuery<ErpPaginatedResponse<Rol>>({
    queryKey: [...ROLES_LIST_QUERY_KEY, page, limit, debouncedSearch ?? '', activeFilter],
    queryFn: async () => {
      const response = await getRoles({
        page,
        limit,
        search: debouncedSearch || undefined,
        ...(activeFilter === 'active'
          ? { solo_activos: true }
          : activeFilter === 'all'
            ? { solo_activos: false }
            : {}),
      });
      return normalizePaginatedRolResponse(response, limit);
    },
    enabled,
  });

  const setLimit = useCallback((nextLimit: number) => {
    setLimitState(nextLimit);
    setPage(1);
  }, []);

  return {
    items: query.data?.items ?? [],
    pagination: query.data
      ? {
          total: query.data.total,
          pagina_actual: query.data.pagina_actual,
          total_paginas: query.data.total_paginas,
          limit: query.data.limit,
        }
      : undefined,
    page,
    setPage,
    limit,
    setLimit,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
