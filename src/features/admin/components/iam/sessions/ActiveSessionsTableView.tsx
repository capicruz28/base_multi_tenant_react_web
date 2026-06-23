import { LogOut, Monitor, Smartphone, Globe } from 'lucide-react';
import type { AdminSessionRead, AdminSessionSortBy, AdminSessionSortOrder } from '@/features/admin/types/session.types';
import { SessionCurrentMarker, getCurrentSessionLeadingCellClass, getCurrentSessionRowClass } from '@/features/admin/components/iam/sessions/SessionCurrentMarker';
import { SessionDeviceCell } from '@/features/admin/components/iam/sessions/SessionDeviceCell';
import { SessionStatusBadge } from '@/features/admin/components/iam/sessions/SessionStatusBadge';
import {
  formatEmpresaNombre,
  formatIssuedAt,
  formatLastRefreshAt,
  formatSessionDateTime,
  formatUserDisplayName,
  getSessionCloseActionLabel,
} from '@/features/admin/utils/iam-session-display.utils';

export type ActiveSessionsViewVariant = 'admin' | 'self';

function SortIndicator({
  column,
  sortBy,
  sortOrder,
}: {
  column: AdminSessionSortBy;
  sortBy?: AdminSessionSortBy;
  sortOrder?: AdminSessionSortOrder;
}) {
  if (sortBy !== column) return null;
  return <span className="ml-1 text-text-faint">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
}

function ClientTypeIcon({ clientType }: { clientType: string }) {
  switch (clientType.toLowerCase()) {
    case 'web':
      return <Monitor className="h-4 w-4 text-info" aria-hidden />;
    case 'mobile':
      return <Smartphone className="h-4 w-4 text-success" aria-hidden />;
    default:
      return <Globe className="h-4 w-4 text-text-soft" aria-hidden />;
  }
}

export interface ActiveSessionsTableViewProps {
  sessions: AdminSessionRead[];
  sortBy?: AdminSessionSortBy;
  sortOrder?: AdminSessionSortOrder;
  onSort: (column: AdminSessionSortBy) => void;
  onRevoke: (session: AdminSessionRead) => void;
  isCurrentSession: (session: AdminSessionRead) => boolean;
  actionsDisabled?: boolean;
  variant?: ActiveSessionsViewVariant;
}

export function ActiveSessionsTableView({
  sessions,
  sortBy,
  sortOrder,
  onSort,
  onRevoke,
  isCurrentSession,
  actionsDisabled = false,
  variant = 'admin',
}: ActiveSessionsTableViewProps) {
  const isAdminVariant = variant === 'admin';

  const sortableTh = (
    column: AdminSessionSortBy,
    label: string,
    align: 'left' | 'center' = 'left',
  ) => {
    const alignClass = align === 'center' ? 'text-center' : 'text-left';
    return (
      <th className={`px-6 py-3 ${alignClass} text-xs font-medium text-text-soft uppercase tracking-wider`}>
        <button
          type="button"
          onClick={() => onSort(column)}
          disabled={actionsDisabled}
          className={`inline-flex items-center hover:text-text-base disabled:opacity-50 ${align === 'center' ? 'mx-auto' : ''}`}
        >
          {label}
          <SortIndicator column={column} sortBy={sortBy} sortOrder={sortOrder} />
        </button>
      </th>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border-base">
        <thead className="bg-subtle">
          <tr>
            {isAdminVariant ? sortableTh('nombre_usuario', 'Usuario') : null}
            {isAdminVariant ? (
              <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                Empresa
              </th>
            ) : null}
            {sortableTh('client_type', 'Tipo cliente')}
            <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
              Dispositivo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
              Navegador
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
              IP
            </th>
            {sortableTh('created_at', 'Emitida')}
            {sortableTh('last_used_at', 'Último refresh')}
            {sortableTh('expires_at', 'Expira')}
            <th className="px-6 py-3 text-center text-xs font-medium text-text-soft uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-border-base">
          {sessions.map((session) => {
            const isCurrent = isCurrentSession(session);
            const closeLabel = getSessionCloseActionLabel(isCurrent);

            return (
              <tr
                key={session.token_id}
                className={getCurrentSessionRowClass(isCurrent)}
                data-current-session={isCurrent ? 'true' : 'false'}
              >
                {isAdminVariant ? (
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${getCurrentSessionLeadingCellClass(isCurrent)}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div>
                        <div className="font-medium text-text-base">{session.nombre_usuario ?? '—'}</div>
                        <div className="text-text-soft text-xs">{formatUserDisplayName(session)}</div>
                      </div>
                      {isCurrent ? <SessionCurrentMarker /> : null}
                    </div>
                  </td>
                ) : null}
                {isAdminVariant ? (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                    {formatEmpresaNombre(session.empresa_nombre)}
                  </td>
                ) : null}
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm text-text-soft ${!isAdminVariant ? getCurrentSessionLeadingCellClass(isCurrent) : ''}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {!isAdminVariant && isCurrent ? <SessionCurrentMarker /> : null}
                    <span className="inline-flex items-center gap-2 capitalize">
                      <ClientTypeIcon clientType={session.client_type} />
                      {session.client_type}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <SessionDeviceCell device={session.device} display="label" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <SessionDeviceCell device={session.device} display="browser" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <SessionDeviceCell device={session.device} display="ip" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                  {formatIssuedAt(session)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                  {formatLastRefreshAt(session)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-text-soft">{formatSessionDateTime(session.expires_at)}</span>
                    <SessionStatusBadge status={session.status} />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                  <button
                    type="button"
                    onClick={() => onRevoke(session)}
                    disabled={actionsDisabled}
                    className="inline-flex items-center gap-1.5 text-error hover:text-error/80 px-2 py-1 rounded hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                    title={closeLabel}
                    aria-label={closeLabel}
                  >
                    <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="text-xs font-medium">{closeLabel}</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
