// src/features/admin/pages/ActiveSessionsPage.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Shield } from 'lucide-react';

import type {
  AdminSessionRead,
  AdminSessionClientTypeFilter,
  AdminSessionSortBy,
  AdminSessionSortOrder,
} from '@/features/admin/types/session.types';
import { getErrorMessage } from '@/core/services/error.service';
import { useAuth } from '@/shared/context/AuthContext';
import { useDebouncedSearch } from '@/core/list';
import { OrgCompanyToolbar } from '@/features/org/components/OrgCompanyToolbar';
import { OrgToolbarSearch } from '@/features/org/components/OrgToolbarSearch';
import { InvPageLayout } from '@/features/inv/components/InvPageLayout';
import { InvTableSkeleton } from '@/features/inv/components/InvTableSkeleton';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { IamTableEmptyState } from '@/features/admin/components/iam';
import { ActiveSessionsCardsView } from '@/features/admin/components/iam/sessions/ActiveSessionsCardsView';
import { ActiveSessionsKpiStrip } from '@/features/admin/components/iam/sessions/ActiveSessionsKpiStrip';
import { ActiveSessionsKpiStripSkeleton } from '@/features/admin/components/iam/sessions/ActiveSessionsKpiStripSkeleton';
import { ActiveSessionsPanelPagination } from '@/features/admin/components/iam/sessions/ActiveSessionsPanelPagination';
import { ActiveSessionsTableView } from '@/features/admin/components/iam/sessions/ActiveSessionsTableView';
import { ActiveSessionsFiltersSummary } from '@/features/admin/components/iam/sessions/ActiveSessionsFiltersSummary';
import { ActiveSessionsSortPresets } from '@/features/admin/components/iam/sessions/ActiveSessionsSortPresets';
import { ActiveSessionsUserFilter } from '@/features/admin/components/iam/sessions/ActiveSessionsUserFilter';
import { SessionDetailDialog } from '@/features/admin/components/iam/sessions/SessionDetailDialog';
import {
  ACTIVE_SESSIONS_LIMIT_OPTIONS,
  ACTIVE_SESSIONS_TABLE_COLSPAN,
  useActiveSessionsList,
} from '@/features/admin/hooks/useActiveSessionsList';
import {
  invalidateActiveSessionsAdminQueries,
  useActiveSessionsKpiSummary,
} from '@/features/admin/hooks/useActiveSessionsKpiSummary';
import { useRevokeSession } from '@/features/admin/hooks/useRevokeSession';
import { ActiveSessionsToolbarMonitoring } from '@/features/admin/components/iam/sessions/ActiveSessionsToolbarMonitoring';
import {
  getActiveSessionsAutoRefreshMs,
  readStoredActiveSessionsAutoRefreshInterval,
  type ActiveSessionsAutoRefreshInterval,
  writeStoredActiveSessionsAutoRefreshInterval,
} from '@/features/admin/utils/iam-session-auto-refresh.utils';

export type {
  ActiveSessionRevokeDeps,
} from '@/features/admin/utils/iam-session-revoke.utils';
export { executeActiveSessionRevoke } from '@/features/admin/utils/iam-session-revoke.utils';

const VIEW_MODE_STORAGE_KEY = 'iam-active-sessions-view-mode';

const platformSelectBaseClass =
  'rounded-md border bg-surface px-2 py-2 text-sm text-text-base shadow-sm focus:border-brand-primary focus:outline-none focus:ring-brand-primary';

function platformSelectClass(clientTypeFilter: AdminSessionClientTypeFilter): string {
  const active = clientTypeFilter === 'web' || clientTypeFilter === 'mobile';
  return `${platformSelectBaseClass} ${
    active ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-border-base'
  }`;
}

type ViewMode = 'table' | 'grid';

function readStoredViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === 'table' || stored === 'grid') return stored;
  } catch {
    /* preferencia no disponible */
  }
  return 'table';
}

const ActiveSessionsPage: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const search = useDebouncedSearch();
  const tablePanelRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewModeState] = useState<ViewMode>(readStoredViewMode);
  const [clientTypeFilter, setClientTypeFilter] = useState<AdminSessionClientTypeFilter>('all');
  const [sortBy, setSortBy] = useState<AdminSessionSortBy | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<AdminSessionSortOrder>('desc');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<ActiveSessionsAutoRefreshInterval>(
    readStoredActiveSessionsAutoRefreshInterval,
  );
  const [usuarioIdFilter, setUsuarioIdFilter] = useState<string | undefined>(undefined);
  const [usuarioLabel, setUsuarioLabel] = useState<string | null>(null);

  const [revokeTarget, setRevokeTarget] = useState<AdminSessionRead | null>(null);
  const [detailSession, setDetailSession] = useState<AdminSessionRead | null>(null);

  const { revokeSession, isRevoking, isCurrentSession: matchCurrentSession } = useRevokeSession({
    mode: 'admin',
  });

  const listEnabled = !authLoading && isAuthenticated;

  const kpiSummary = useActiveSessionsKpiSummary({ enabled: listEnabled });

  const sessionsList = useActiveSessionsList({
    debouncedSearch: search.debouncedValue || undefined,
    clientTypeFilter,
    usuarioId: usuarioIdFilter,
    sortBy,
    sortOrder,
    enabled: listEnabled,
  });

  const sessions = sessionsList.items;
  const listError = sessionsList.isError
    ? getErrorMessage(sessionsList.error).message || 'Error al cargar las sesiones activas.'
    : null;

  const showInitialSkeleton = (authLoading || sessionsList.isLoading) && sessions.length === 0;
  const listIsRefreshing = sessionsList.isFetching && sessions.length > 0;
  const pageActionsLocked = isRevoking || revokeTarget !== null;
  const hasSearch = search.hasSearch;
  const hasActiveFilters =
    hasSearch || clientTypeFilter !== 'all' || usuarioIdFilter !== undefined;
  const isRefreshing = sessionsList.isFetching || kpiSummary.isFetching;
  const tenantTotal = kpiSummary.totalTenant;

  const handleRefreshAll = useCallback(() => {
    void invalidateActiveSessionsAdminQueries(queryClient);
  }, [queryClient]);

  const handleKpiTotalClick = useCallback(() => {
    search.clear();
    setClientTypeFilter('all');
    setUsuarioIdFilter(undefined);
  }, [search]);

  const handleKpiWebClick = useCallback(() => {
    setClientTypeFilter('web');
  }, []);

  const handleKpiMobileClick = useCallback(() => {
    setClientTypeFilter('mobile');
  }, []);

  const handleExpiringSoonClick = useCallback(() => {
    setSortBy('expires_at');
    setSortOrder('asc');
    tablePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      /* preferencia no disponible */
    }
  }, []);

  const handleSortPresetChange = useCallback(
    (nextSortBy: AdminSessionSortBy | undefined, nextSortOrder: AdminSessionSortOrder) => {
      setSortBy(nextSortBy);
      setSortOrder(nextSortOrder);
    },
    [],
  );

  const handleAutoRefreshIntervalChange = useCallback(
    (interval: ActiveSessionsAutoRefreshInterval) => {
      setAutoRefreshInterval(interval);
      writeStoredActiveSessionsAutoRefreshInterval(interval);
    },
    [],
  );
  const handleSort = useCallback(
    (column: AdminSessionSortBy) => {
      if (sortBy !== column) {
        setSortBy(column);
        setSortOrder('asc');
        return;
      }
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    },
    [sortBy],
  );

  const handleViewDetail = useCallback((session: AdminSessionRead) => {
    setDetailSession(session);
  }, []);

  const handleDetailRevokeRequest = useCallback((session: AdminSessionRead) => {
    setDetailSession(null);
    setRevokeTarget(session);
  }, []);

  const handleDetailOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setDetailSession(null);
    }
  }, []);

  const confirmRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeSession(revokeTarget);
      setRevokeTarget(null);
    } catch (err) {
      console.error('Error revoking session:', err);
    }
  };

  useEffect(() => {
    const refreshMs = getActiveSessionsAutoRefreshMs(autoRefreshInterval);
    if (refreshMs === null || !listEnabled) return;
    const intervalId = setInterval(() => {
      void invalidateActiveSessionsAdminQueries(queryClient);
    }, refreshMs);
    return () => clearInterval(intervalId);
  }, [autoRefreshInterval, listEnabled, queryClient]);

  const emptyTitle = hasSearch
    ? 'No se encontraron sesiones que coincidan con la búsqueda.'
    : usuarioIdFilter
      ? 'No hay sesiones activas para el usuario seleccionado.'
      : clientTypeFilter !== 'all'
        ? `No hay sesiones activas de tipo «${clientTypeFilter}».`
        : 'No hay sesiones activas en este momento.';

  const emptyDescription = hasSearch
    ? 'Prueba con otro término o limpia la búsqueda.'
    : 'Cuando un usuario inicie sesión, aparecerá aquí.';

  return (
    <InvPageLayout>
      {kpiSummary.isLoading && listEnabled ? (
        <ActiveSessionsKpiStripSkeleton />
      ) : listEnabled ? (
        <ActiveSessionsKpiStrip
          totalTenant={kpiSummary.totalTenant}
          webCount={kpiSummary.webCount}
          mobileCount={kpiSummary.mobileCount}
          hasActiveFilters={hasActiveFilters}
          activeClientTypeFilter={clientTypeFilter}
          disabled={pageActionsLocked}
          onTotalClick={handleKpiTotalClick}
          onWebClick={handleKpiWebClick}
          onMobileClick={handleKpiMobileClick}
          onExpiringSoonClick={handleExpiringSoonClick}
        />
      ) : null}

      <OrgCompanyToolbar
        actions={
          <ActiveSessionsToolbarMonitoring
            dataUpdatedAt={kpiSummary.dataUpdatedAt}
            listDataUpdatedAt={sessionsList.dataUpdatedAt}
            autoRefreshInterval={autoRefreshInterval}
            onAutoRefreshIntervalChange={handleAutoRefreshIntervalChange}
            onRefreshAll={handleRefreshAll}
            isRefreshing={isRefreshing}
            disabled={pageActionsLocked}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        }
      >
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <OrgToolbarSearch
            value={search.inputValue}
            onChange={search.setInputValue}
            placeholder="Buscar por usuario, nombre o IP…"
            aria-label="Buscar sesiones"
            disabled={pageActionsLocked}
          />
          <ActiveSessionsUserFilter
            value={usuarioIdFilter}
            onChange={setUsuarioIdFilter}
            onSelectedUserLabelChange={setUsuarioLabel}
            disabled={pageActionsLocked}
          />
          <label className="flex shrink-0 items-center gap-2 text-sm text-text-soft">
            <span className="sr-only">Filtrar por tipo de cliente</span>
            <select
              value={clientTypeFilter}
              onChange={(e) => setClientTypeFilter(e.target.value as AdminSessionClientTypeFilter)}
              disabled={pageActionsLocked}
              className={platformSelectClass(clientTypeFilter)}
              aria-label="Tipo de cliente"
            >
              <option value="all">Todos</option>
              <option value="web">Web</option>
              <option value="mobile">Mobile</option>
            </select>
          </label>
          <ActiveSessionsSortPresets
            sortBy={sortBy}
            sortOrder={sortOrder}
            onPresetChange={handleSortPresetChange}
            disabled={pageActionsLocked}
          />
        </div>
      </OrgCompanyToolbar>

      <ActiveSessionsFiltersSummary
        usuarioLabel={usuarioLabel}
        clientTypeFilter={clientTypeFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

      <p className="mb-3 text-xs text-text-faint">
        La búsqueda no incluye nombre de empresa. Use el listado o filtre por usuario.
      </p>

      {listError && !sessionsList.isLoading ? (
        <div className="mb-4 rounded-lg border border-border-base bg-surface p-6">
          <p className="text-error bg-error/10 p-4 rounded-lg mb-4">{listError}</p>
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={sessionsList.isFetching}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {!listError ? (
        <div
          ref={tablePanelRef}
          className="bg-surface rounded-lg shadow-sm border border-border-base overflow-hidden"
        >
          <div
            className={`transition-opacity duration-150 ${listIsRefreshing ? 'opacity-70' : 'opacity-100'}`}
            aria-busy={listIsRefreshing}
          >
            {showInitialSkeleton ? (
              viewMode === 'table' ? (
                <InvTableSkeleton columns={ACTIVE_SESSIONS_TABLE_COLSPAN} />
              ) : (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-48 rounded-lg bg-subtle animate-pulse" />
                  ))}
                </div>
              )
            ) : sessions.length > 0 ? (
              viewMode === 'table' ? (
                <ActiveSessionsTableView
                  sessions={sessions}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  onRevoke={setRevokeTarget}
                  onViewDetail={handleViewDetail}
                  isCurrentSession={matchCurrentSession}
                  actionsDisabled={pageActionsLocked}
                  variant="admin"
                />
              ) : (
                <ActiveSessionsCardsView
                  sessions={sessions}
                  onRevoke={setRevokeTarget}
                  onViewDetail={handleViewDetail}
                  isCurrentSession={matchCurrentSession}
                  actionsDisabled={pageActionsLocked}
                  variant="admin"
                />
              )
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto lg:overflow-x-visible">
                <table className="w-full table-fixed">
                  <tbody>
                    <IamTableEmptyState
                      colSpan={ACTIVE_SESSIONS_TABLE_COLSPAN}
                      icon={Shield}
                      title={emptyTitle}
                      description={emptyDescription}
                    />
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <Shield className="mx-auto h-12 w-12 text-text-soft mb-4" aria-hidden />
                <p className="text-text-soft text-lg">{emptyTitle}</p>
                {emptyDescription ? (
                  <p className="text-sm text-text-faint mt-2">{emptyDescription}</p>
                ) : null}
              </div>
            )}
          </div>

          {sessionsList.pagination && sessions.length > 0 ? (
            <ActiveSessionsPanelPagination
              pagination={sessionsList.pagination}
              hasActiveFilters={hasActiveFilters}
              tenantTotal={tenantTotal}
              onPageChange={sessionsList.setPage}
              onLimitChange={sessionsList.setLimit}
              limitOptions={ACTIVE_SESSIONS_LIMIT_OPTIONS}
              disabled={pageActionsLocked || sessionsList.isFetching}
            />
          ) : null}
        </div>
      ) : null}

      <SessionDetailDialog
        session={detailSession}
        open={detailSession !== null}
        onOpenChange={handleDetailOpenChange}
        isCurrentSession={detailSession ? matchCurrentSession(detailSession) : false}
        onRevokeRequest={handleDetailRevokeRequest}
        revokeDisabled={pageActionsLocked}
      />

      <ConfirmDialog
        isOpen={!!revokeTarget}
        onClose={() => !isRevoking && setRevokeTarget(null)}
        onConfirm={() => void confirmRevoke()}
        title="Revocar sesión"
        message={
          revokeTarget
            ? `¿Revocar la sesión de «${revokeTarget.nombre_usuario ?? 'usuario'}»? El usuario deberá iniciar sesión nuevamente.`
            : ''
        }
        confirmText="Revocar sesión"
        cancelText="Cancelar"
        variant="danger"
        loading={isRevoking}
      />
    </InvPageLayout>
  );
};

export default ActiveSessionsPage;
