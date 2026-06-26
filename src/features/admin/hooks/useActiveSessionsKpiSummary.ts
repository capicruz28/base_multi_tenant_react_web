import { useQueries } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';

import { useTenant } from '@/features/tenant/components/TenantContext';
import { getAdminSessions } from '@/features/admin/services/session.service';
import { normalizeAdminSessionsResponse } from '@/features/admin/utils/iam-session-list-normalize';
import { invalidateActiveSessionsListQueries } from '@/features/admin/hooks/useActiveSessionsList';

export const ACTIVE_SESSIONS_KPI_QUERY_KEY = ['admin', 'sessions', 'kpi'] as const;

export const ACTIVE_SESSIONS_KPI_STALE_TIME_MS = 60_000;

type KpiSegment = 'total' | 'web' | 'mobile';

const KPI_SEGMENTS: ReadonlyArray<{ segment: KpiSegment; clientType?: 'web' | 'mobile' }> = [
  { segment: 'total' },
  { segment: 'web', clientType: 'web' },
  { segment: 'mobile', clientType: 'mobile' },
];

async function fetchKpiTotal(clientType?: 'web' | 'mobile'): Promise<number> {
  const raw = await getAdminSessions({
    page: 1,
    limit: 1,
    client_type: clientType,
  });
  const normalized = normalizeAdminSessionsResponse(raw, 1, 1);
  return normalized.total;
}

export function invalidateActiveSessionsKpiQueries(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: ACTIVE_SESSIONS_KPI_QUERY_KEY });
}

/** Invalida listado paginado + KPIs tenant (coherencia Fase 1B). */
export function invalidateActiveSessionsAdminQueries(queryClient: QueryClient): Promise<void> {
  return Promise.all([
    invalidateActiveSessionsListQueries(queryClient),
    invalidateActiveSessionsKpiQueries(queryClient),
  ]).then(() => undefined);
}

export interface UseActiveSessionsKpiSummaryOptions {
  enabled?: boolean;
}

export function useActiveSessionsKpiSummary(options: UseActiveSessionsKpiSummaryOptions = {}) {
  const { enabled = true } = options;
  const { tenantId, isTenantValid } = useTenant();

  const queryEnabled = enabled && isTenantValid && Boolean(tenantId);

  const results = useQueries({
    queries: KPI_SEGMENTS.map(({ segment, clientType }) => ({
      queryKey: [...ACTIVE_SESSIONS_KPI_QUERY_KEY, segment, tenantId],
      queryFn: () => fetchKpiTotal(clientType),
      staleTime: ACTIVE_SESSIONS_KPI_STALE_TIME_MS,
      enabled: queryEnabled,
    })),
  });

  const [totalQuery, webQuery, mobileQuery] = results;

  const isLoading = results.some((result) => result.isLoading);
  const isFetching = results.some((result) => result.isFetching);
  const isError = results.some((result) => result.isError);

  const dataUpdatedAt = results.reduce<number>(
    (latest, result) => Math.max(latest, result.dataUpdatedAt ?? 0),
    0,
  );

  return {
    totalTenant: totalQuery.data ?? 0,
    webCount: webQuery.data ?? 0,
    mobileCount: mobileQuery.data ?? 0,
    isLoading,
    isFetching,
    isError,
    dataUpdatedAt: dataUpdatedAt > 0 ? dataUpdatedAt : undefined,
  };
}
