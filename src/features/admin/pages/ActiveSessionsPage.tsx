// src/features/admin/pages/ActiveSessionsPage.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Grid3x3, List, RefreshCw, Shield } from 'lucide-react';

import type {
  AdminSessionRead,
  AdminSessionClientTypeFilter,
  AdminSessionSortBy,
  AdminSessionSortOrder,
} from '@/features/admin/types/session.types';
import { getErrorMessage } from '@/core/services/error.service';
import { useAuth } from '@/shared/context/AuthContext';
import { useDebouncedSearch } from '@/core/list';
import { ErpPagination } from '@/shared/components/erp-list';
import { OrgCompanyToolbar } from '@/features/org/components/OrgCompanyToolbar';
import { OrgToolbarSearch } from '@/features/org/components/OrgToolbarSearch';
import { InvPageLayout } from '@/features/inv/components/InvPageLayout';
import { InvTableSkeleton } from '@/features/inv/components/InvTableSkeleton';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { IamTableEmptyState } from '@/features/admin/components/iam';
import { ActiveSessionsCardsView } from '@/features/admin/components/iam/sessions/ActiveSessionsCardsView';
import { ActiveSessionsTableView } from '@/features/admin/components/iam/sessions/ActiveSessionsTableView';
import {
  ACTIVE_SESSIONS_LIMIT_OPTIONS,
  ACTIVE_SESSIONS_TABLE_COLSPAN,
  invalidateActiveSessionsListQueries,
  useActiveSessionsList,
} from '@/features/admin/hooks/useActiveSessionsList';
import { useRevokeSession } from '@/features/admin/hooks/useRevokeSession';

export type {
  ActiveSessionRevokeDeps,
} from '@/features/admin/utils/iam-session-revoke.utils';
export { executeActiveSessionRevoke } from '@/features/admin/utils/iam-session-revoke.utils';

const VIEW_MODE_STORAGE_KEY = 'iam-active-sessions-view-mode';
const AUTO_REFRESH_MS = 30_000;

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

  const [viewMode, setViewModeState] = useState<ViewMode>(readStoredViewMode);
  const [clientTypeFilter, setClientTypeFilter] = useState<AdminSessionClientTypeFilter>('all');
  const [sortBy, setSortBy] = useState<AdminSessionSortBy | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<AdminSessionSortOrder>('desc');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  const [revokeTarget, setRevokeTarget] = useState<AdminSessionRead | null>(null);

  const { revokeSession, isRevoking, isCurrentSession: matchCurrentSession } = useRevokeSession({
    mode: 'admin',
  });

  const listEnabled = !authLoading && isAuthenticated;

  const sessionsList = useActiveSessionsList({
    debouncedSearch: search.debouncedValue || undefined,
    clientTypeFilter,
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

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      /* preferencia no disponible */
    }
  }, []);

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
    if (!autoRefreshEnabled || !listEnabled) return;
    const intervalId = setInterval(() => {
      void invalidateActiveSessionsListQueries(queryClient);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, listEnabled, queryClient]);

  const emptyTitle = hasSearch
    ? 'No se encontraron sesiones que coincidan con la búsqueda.'
    : clientTypeFilter !== 'all'
      ? `No hay sesiones activas de tipo «${clientTypeFilter}».`
      : 'No hay sesiones activas en este momento.';

  const emptyDescription = hasSearch
    ? 'Prueba con otro término o limpia la búsqueda.'
    : 'Cuando un usuario inicie sesión, aparecerá aquí.';

  return (
    <InvPageLayout>
      <OrgCompanyToolbar
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 border border-border-base rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                disabled={pageActionsLocked}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-brand-primary text-white'
                    : 'text-text-soft hover:bg-overlay'
                } disabled:opacity-50`}
                title="Vista de tabla"
                aria-label="Vista de tabla"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                disabled={pageActionsLocked}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-brand-primary text-white'
                    : 'text-text-soft hover:bg-overlay'
                } disabled:opacity-50`}
                title="Vista de tarjetas"
                aria-label="Vista de tarjetas"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAutoRefreshEnabled((v) => !v)}
              disabled={pageActionsLocked}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                autoRefreshEnabled
                  ? 'bg-brand-primary text-white hover:bg-brand-primary-hover'
                  : 'border border-border-base bg-subtle text-text-base hover:bg-overlay'
              } disabled:opacity-50`}
              title={autoRefreshEnabled ? 'Desactivar auto-actualización' : 'Activar auto-actualización'}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefreshEnabled ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{autoRefreshEnabled ? 'Auto' : 'Manual'}</span>
            </button>

            <button
              type="button"
              onClick={() => void invalidateActiveSessionsListQueries(queryClient)}
              disabled={sessionsList.isFetching || pageActionsLocked}
              className="p-2 text-text-soft hover:text-text-base hover:bg-overlay rounded-lg transition-colors disabled:opacity-50"
              title="Actualizar"
              aria-label="Actualizar listado"
            >
              <RefreshCw className={`h-5 w-5 ${sessionsList.isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      >
        <OrgToolbarSearch
          value={search.inputValue}
          onChange={search.setInputValue}
          placeholder="Buscar por usuario, nombre o IP…"
          aria-label="Buscar sesiones"
          disabled={pageActionsLocked}
        />
        <label className="flex shrink-0 items-center gap-2 text-sm text-text-soft">
          <span className="sr-only">Filtrar por tipo de cliente</span>
          <select
            value={clientTypeFilter}
            onChange={(e) => setClientTypeFilter(e.target.value as AdminSessionClientTypeFilter)}
            disabled={pageActionsLocked}
            className="px-2 py-1.5 border border-border-base rounded-md bg-surface text-text-base text-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            aria-label="Tipo de cliente"
          >
            <option value="all">Todos</option>
            <option value="web">Web</option>
            <option value="mobile">Mobile</option>
          </select>
        </label>
      </OrgCompanyToolbar>

      {listError && !sessionsList.isLoading ? (
        <div className="mb-4 rounded-lg border border-border-base bg-surface p-6">
          <p className="text-error bg-error/10 p-4 rounded-lg mb-4">{listError}</p>
          <button
            type="button"
            onClick={() => void invalidateActiveSessionsListQueries(queryClient)}
            disabled={sessionsList.isFetching}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {!listError ? (
        <div className="bg-surface rounded-lg shadow-sm border border-border-base overflow-hidden">
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
                  isCurrentSession={matchCurrentSession}
                  actionsDisabled={pageActionsLocked}
                  variant="admin"
                />
              ) : (
                <ActiveSessionsCardsView
                  sessions={sessions}
                  onRevoke={setRevokeTarget}
                  isCurrentSession={matchCurrentSession}
                  actionsDisabled={pageActionsLocked}
                  variant="admin"
                />
              )
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
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
            <ErpPagination
              pagination={sessionsList.pagination}
              onPageChange={sessionsList.setPage}
              onLimitChange={sessionsList.setLimit}
              limitOptions={ACTIVE_SESSIONS_LIMIT_OPTIONS}
              disabled={pageActionsLocked || sessionsList.isFetching}
            />
          ) : null}
        </div>
      ) : null}

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
