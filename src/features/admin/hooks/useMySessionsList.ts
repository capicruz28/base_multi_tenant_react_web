import { useCallback, useMemo } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getMySessions } from '@/features/admin/services/session.service';
import type { UserSessionRead } from '@/features/admin/types/session.types';
import { isCurrentSession } from '@/features/admin/utils/iam-current-session';
import { sortSessionsCurrentFirst } from '@/features/admin/utils/iam-session-list-order.utils';
import { useAuth } from '@/shared/context/AuthContext';

export const MY_SESSIONS_LIST_QUERY_KEY = ['auth', 'sessions', 'my'] as const;

/** Columnas tabla self-service (sin usuario/empresa admin). */
/** Columnas tabla self — alineado layout enterprise Fase 1A. */
export const MY_SESSIONS_TABLE_COLSPAN = 4;

export function invalidateMySessionsListQueries(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: MY_SESSIONS_LIST_QUERY_KEY });
}

export interface UseMySessionsListOptions {
  enabled?: boolean;
}

export function useMySessionsList(options: UseMySessionsListOptions = {}) {
  const { enabled = true } = options;
  const { auth, loading: authLoading, isAuthenticated } = useAuth();
  const currentSessionId = auth.user?.current_session_id ?? null;
  const currentTokenId = auth.user?.current_token_id ?? null;

  const query = useTenantQuery<UserSessionRead[]>({
    queryKey: MY_SESSIONS_LIST_QUERY_KEY,
    queryFn: getMySessions,
    enabled: enabled && !authLoading && isAuthenticated,
  });

  const matchCurrentSession = useCallback(
    (session: UserSessionRead) =>
      isCurrentSession(session, { currentSessionId, currentTokenId }),
    [currentSessionId, currentTokenId],
  );

  const items = useMemo(
    () => sortSessionsCurrentFirst(query.data ?? [], matchCurrentSession),
    [query.data, matchCurrentSession],
  );

  return {
    items,
    isCurrentSession: matchCurrentSession,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
