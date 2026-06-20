import { useCallback, useEffect, useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { ErpPaginatedResponse } from '@/core/list';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getUsers } from '../services/usuario.service';
import type { UserWithRoles } from '../types/usuario.types';
import { normalizePaginatedUsersResponse } from '../utils/iam-usuario-list-normalize';

/** Filtro vigencia IAM-PA-001: active | all (todos) | inactive (futuro selector). */
export type UsersListActiveFilter = 'active' | 'all' | 'inactive';

export const USERS_LIST_QUERY_KEY = ['admin', 'users', 'list'] as const;

/** Invalida todas las variantes del listado (filtro, página, búsqueda). Patrón INV productos. */
export function invalidateUsersListQueries(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: USERS_LIST_QUERY_KEY });
}

export const DEFAULT_USERS_LIST_LIMIT = 25;

export interface UseUsersListOptions {
  debouncedSearch?: string;
  activeFilter: UsersListActiveFilter;
  enabled?: boolean;
  initialLimit?: number;
}

export function useUsersList(options: UseUsersListOptions) {
  const { debouncedSearch, activeFilter, enabled = true, initialLimit = DEFAULT_USERS_LIST_LIMIT } =
    options;

  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(initialLimit);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeFilter]);

  const query = useTenantQuery<ErpPaginatedResponse<UserWithRoles>>({
    queryKey: [...USERS_LIST_QUERY_KEY, page, limit, debouncedSearch ?? '', activeFilter],
    queryFn: async () => {
      const response = await getUsers({
        page,
        limit,
        search: debouncedSearch || undefined,
        ...(activeFilter === 'active'
          ? { solo_activos: true }
          : activeFilter === 'inactive'
            ? { solo_inactivos: true }
            : activeFilter === 'all'
              ? { solo_activos: false, solo_inactivos: false }
              : {}),
      });
      return normalizePaginatedUsersResponse(response, limit);
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
