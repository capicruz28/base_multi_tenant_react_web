import { useCallback, useEffect, useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { ErpPaginatedResponse } from '@/core/list';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getAdminSessions } from '@/features/admin/services/session.service';
import type {
  AdminSessionRead,
  AdminSessionClientTypeFilter,
  AdminSessionSortBy,
  AdminSessionSortOrder,
} from '@/features/admin/types/session.types';
import { normalizeAdminSessionsResponse } from '@/features/admin/utils/iam-session-list-normalize';

export const ACTIVE_SESSIONS_LIST_QUERY_KEY = ['admin', 'sessions', 'list'] as const;

export const DEFAULT_ACTIVE_SESSIONS_LIST_LIMIT = 25;

export const ACTIVE_SESSIONS_TABLE_COLSPAN = 9;

export const ACTIVE_SESSIONS_LIMIT_OPTIONS = [10, 25, 50] as const;

export function invalidateActiveSessionsListQueries(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: ACTIVE_SESSIONS_LIST_QUERY_KEY });
}

export interface UseActiveSessionsListOptions {
  debouncedSearch?: string;
  clientTypeFilter?: AdminSessionClientTypeFilter;
  usuarioId?: string;
  sortBy?: AdminSessionSortBy;
  sortOrder?: AdminSessionSortOrder;
  enabled?: boolean;
  initialLimit?: number;
}

export function useActiveSessionsList(options: UseActiveSessionsListOptions) {
  const {
    debouncedSearch,
    clientTypeFilter = 'all',
    usuarioId,
    sortBy,
    sortOrder = 'desc',
    enabled = true,
    initialLimit = DEFAULT_ACTIVE_SESSIONS_LIST_LIMIT,
  } = options;

  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(initialLimit);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, clientTypeFilter, usuarioId, sortBy, sortOrder]);

  const query = useTenantQuery<ErpPaginatedResponse<AdminSessionRead>>({
    queryKey: [
      ...ACTIVE_SESSIONS_LIST_QUERY_KEY,
      page,
      limit,
      debouncedSearch ?? '',
      clientTypeFilter,
      usuarioId ?? '',
      sortBy ?? '',
      sortOrder,
    ],
    queryFn: async () => {
      const raw = await getAdminSessions({
        page,
        limit,
        search: debouncedSearch || undefined,
        sort_by: sortBy,
        sort_order: sortBy ? sortOrder : undefined,
        client_type: clientTypeFilter === 'all' ? undefined : clientTypeFilter,
        usuario_id: usuarioId,
      });
      return normalizeAdminSessionsResponse(raw, page, limit);
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
