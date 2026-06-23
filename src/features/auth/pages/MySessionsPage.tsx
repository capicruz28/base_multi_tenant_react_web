import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Grid3x3, List, MonitorSmartphone, RefreshCw } from 'lucide-react';

import type { AdminSessionRead } from '@/features/admin/types/session.types';
import { getErrorMessage } from '@/core/services/error.service';
import { useAuth } from '@/shared/context/AuthContext';
import { OrgCompanyToolbar } from '@/features/org/components/OrgCompanyToolbar';
import { InvPageLayout } from '@/features/inv/components/InvPageLayout';
import { InvTableSkeleton } from '@/features/inv/components/InvTableSkeleton';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { IamTableEmptyState } from '@/features/admin/components/iam';
import { ActiveSessionsCardsView } from '@/features/admin/components/iam/sessions/ActiveSessionsCardsView';
import { ActiveSessionsTableView } from '@/features/admin/components/iam/sessions/ActiveSessionsTableView';
import {
  invalidateMySessionsListQueries,
  MY_SESSIONS_TABLE_COLSPAN,
  useMySessionsList,
} from '@/features/admin/hooks/useMySessionsList';
import { useRevokeSession } from '@/features/admin/hooks/useRevokeSession';
import { toActiveSessionRow } from '@/features/admin/utils/iam-session-list-order.utils';
import { getSessionCloseActionLabel } from '@/features/admin/utils/iam-session-display.utils';

const VIEW_MODE_STORAGE_KEY = 'iam-my-sessions-view-mode';

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

const MySessionsPage: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [viewMode, setViewModeState] = useState<ViewMode>(readStoredViewMode);
  const [revokeTarget, setRevokeTarget] = useState<AdminSessionRead | null>(null);

  const { revokeSession, isRevoking } = useRevokeSession({ mode: 'self' });

  const listEnabled = !authLoading && isAuthenticated;
  const sessionsList = useMySessionsList({ enabled: listEnabled });
  const matchCurrentSession = sessionsList.isCurrentSession;

  const sessionRows: AdminSessionRead[] = sessionsList.items.map((session) =>
    toActiveSessionRow(session) as AdminSessionRead,
  );

  const listError = sessionsList.isError
    ? getErrorMessage(sessionsList.error).message || 'Error al cargar tus sesiones activas.'
    : null;

  const showInitialSkeleton =
    (authLoading || sessionsList.isLoading) && sessionRows.length === 0;
  const listIsRefreshing = sessionsList.isFetching && sessionRows.length > 0;
  const pageActionsLocked = isRevoking || revokeTarget !== null;

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      /* preferencia no disponible */
    }
  }, []);

  const noopSort = useCallback(() => undefined, []);

  const confirmRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeSession(revokeTarget);
      setRevokeTarget(null);
    } catch (err) {
      console.error('Error closing session:', err);
    }
  };

  const revokeIsCurrent = revokeTarget ? matchCurrentSession(revokeTarget) : false;
  const closeLabel = getSessionCloseActionLabel(revokeIsCurrent);

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
              onClick={() => void invalidateMySessionsListQueries(queryClient)}
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
        <span className="text-sm text-text-soft">Sesiones activas de tu cuenta</span>
      </OrgCompanyToolbar>

      {listError && !sessionsList.isLoading ? (
        <div className="mb-4 rounded-lg border border-border-base bg-surface p-6">
          <p className="text-error bg-error/10 p-4 rounded-lg mb-4">{listError}</p>
          <button
            type="button"
            onClick={() => void invalidateMySessionsListQueries(queryClient)}
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
                <InvTableSkeleton columns={MY_SESSIONS_TABLE_COLSPAN} />
              ) : (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-48 rounded-lg bg-subtle animate-pulse" />
                  ))}
                </div>
              )
            ) : sessionRows.length > 0 ? (
              viewMode === 'table' ? (
                <ActiveSessionsTableView
                  sessions={sessionRows}
                  onSort={noopSort}
                  onRevoke={setRevokeTarget}
                  isCurrentSession={matchCurrentSession}
                  actionsDisabled={pageActionsLocked}
                  variant="self"
                />
              ) : (
                <ActiveSessionsCardsView
                  sessions={sessionRows}
                  onRevoke={setRevokeTarget}
                  isCurrentSession={matchCurrentSession}
                  actionsDisabled={pageActionsLocked}
                  variant="self"
                />
              )
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <tbody>
                    <IamTableEmptyState
                      colSpan={MY_SESSIONS_TABLE_COLSPAN}
                      icon={MonitorSmartphone}
                      title="No tienes otras sesiones activas."
                      description="Cuando inicies sesión en otro dispositivo, aparecerá aquí."
                    />
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <MonitorSmartphone className="mx-auto h-12 w-12 text-text-soft mb-4" aria-hidden />
                <p className="text-text-soft text-lg">No tienes otras sesiones activas.</p>
                <p className="text-sm text-text-faint mt-2">
                  Cuando inicies sesión en otro dispositivo, aparecerá aquí.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={!!revokeTarget}
        onClose={() => !isRevoking && setRevokeTarget(null)}
        onConfirm={() => void confirmRevoke()}
        title={closeLabel}
        message={
          revokeTarget
            ? revokeIsCurrent
              ? '¿Cerrar la sesión en este dispositivo? Tendrás que iniciar sesión nuevamente aquí.'
              : '¿Cerrar esta sesión remota? El dispositivo deberá iniciar sesión nuevamente.'
            : ''
        }
        confirmText={closeLabel}
        cancelText="Cancelar"
        variant="danger"
        loading={isRevoking}
      />
    </InvPageLayout>
  );
};

export default MySessionsPage;
