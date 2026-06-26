import { describe, expect, it, vi } from 'vitest';

import {
  ACTIVE_SESSIONS_KPI_QUERY_KEY,
  ACTIVE_SESSIONS_KPI_STALE_TIME_MS,
  invalidateActiveSessionsAdminQueries,
  invalidateActiveSessionsKpiQueries,
} from '@/features/admin/hooks/useActiveSessionsKpiSummary';
import { ACTIVE_SESSIONS_LIST_QUERY_KEY } from '@/features/admin/hooks/useActiveSessionsList';

vi.mock('@/features/admin/services/session.service', () => ({
  getAdminSessions: vi.fn(),
}));

describe('useActiveSessionsKpiSummary exports', () => {
  it('expone query key y staleTime congelados', () => {
    expect(ACTIVE_SESSIONS_KPI_QUERY_KEY).toEqual(['admin', 'sessions', 'kpi']);
    expect(ACTIVE_SESSIONS_KPI_STALE_TIME_MS).toBe(60_000);
  });

  it('invalidateActiveSessionsAdminQueries invalida listado y KPI', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryClient = { invalidateQueries } as never;

    await invalidateActiveSessionsAdminQueries(queryClient);

    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ACTIVE_SESSIONS_LIST_QUERY_KEY });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ACTIVE_SESSIONS_KPI_QUERY_KEY });
  });

  it('invalidateActiveSessionsKpiQueries invalida solo KPI', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryClient = { invalidateQueries } as never;

    await invalidateActiveSessionsKpiQueries(queryClient);

    expect(invalidateQueries).toHaveBeenCalledOnce();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ACTIVE_SESSIONS_KPI_QUERY_KEY });
  });
});

describe('KPI total normalization contract', () => {
  it('normaliza total desde envelope paginado', async () => {
    const { getAdminSessions } = await import('@/features/admin/services/session.service');
    vi.mocked(getAdminSessions).mockResolvedValue({
      items: [],
      total: 247,
      pagina_actual: 1,
      limit: 1,
      total_paginas: 247,
    });

    const { normalizeAdminSessionsResponse } = await import(
      '@/features/admin/utils/iam-session-list-normalize'
    );
    const raw = await getAdminSessions({ page: 1, limit: 1 });
    const normalized = normalizeAdminSessionsResponse(raw, 1, 1);
    expect(normalized.total).toBe(247);
  });
});
