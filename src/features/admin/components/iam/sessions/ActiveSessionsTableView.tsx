import type { AdminSessionRead, AdminSessionSortBy, AdminSessionSortOrder } from '@/features/admin/types/session.types';
import { getCurrentSessionLeadingCellClass, getCurrentSessionRowClass } from '@/features/admin/components/iam/sessions/SessionCurrentMarker';
import { SessionClienteLine } from '@/features/admin/components/iam/sessions/shared/SessionClienteLine';
import { SessionEstadoLine } from '@/features/admin/components/iam/sessions/shared/SessionEstadoLine';
import { SessionIpLine } from '@/features/admin/components/iam/sessions/shared/SessionIpLine';
import { SessionListActions } from '@/features/admin/components/iam/sessions/shared/SessionListActions';
import { SessionUsuarioBlock } from '@/features/admin/components/iam/sessions/shared/SessionUsuarioBlock';
import type { ActiveSessionsViewVariant } from '@/features/admin/components/iam/sessions/shared/session-view.types';
import { resolveSessionId } from '@/features/admin/utils/iam-session-id.utils';

export type { ActiveSessionsViewVariant } from '@/features/admin/components/iam/sessions/shared/session-view.types';

const ADMIN_COL_WIDTHS = ['24%', '22%', '14%', '30%', '10%'] as const;
const SELF_COL_WIDTHS = ['30%', '18%', '42%', '10%'] as const;

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
  return <span className="ml-0.5 text-text-faint">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
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
  onViewDetail?: (session: AdminSessionRead) => void;
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
  onViewDetail,
}: ActiveSessionsTableViewProps) {
  const isAdminVariant = variant === 'admin';
  const colWidths = isAdminVariant ? ADMIN_COL_WIDTHS : SELF_COL_WIDTHS;

  const sortableTh = (
    column: AdminSessionSortBy,
    label: string,
    align: 'left' | 'center' = 'left',
  ) => {
    const alignClass = align === 'center' ? 'text-center' : 'text-left';
    return (
      <th
        className={`px-4 py-3 ${alignClass} text-xs font-medium text-text-soft uppercase tracking-wider`}
      >
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

  const estadoSortTh = isAdminVariant ? (
    <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>Estado</span>
        <span className="inline-flex items-center gap-1 normal-case tracking-normal">
          <button
            type="button"
            onClick={() => onSort('last_used_at')}
            disabled={actionsDisabled}
            className="inline-flex items-center text-xs hover:text-text-base disabled:opacity-50"
          >
            Refresh
            <SortIndicator column="last_used_at" sortBy={sortBy} sortOrder={sortOrder} />
          </button>
          <span className="text-text-faint" aria-hidden>
            ·
          </span>
          <button
            type="button"
            onClick={() => onSort('expires_at')}
            disabled={actionsDisabled}
            className="inline-flex items-center text-xs hover:text-text-base disabled:opacity-50"
          >
            Expira
            <SortIndicator column="expires_at" sortBy={sortBy} sortOrder={sortOrder} />
          </button>
        </span>
      </div>
    </th>
  ) : (
    sortableTh('last_used_at', 'Estado')
  );

  return (
    <div className="overflow-x-auto lg:overflow-x-visible">
      <table className="w-full table-fixed divide-y divide-border-base">
        <colgroup>
          {colWidths.map((width, index) => (
            <col key={`${isAdminVariant ? 'admin' : 'self'}-col-${index}`} style={{ width }} />
          ))}
        </colgroup>
        <thead className="bg-subtle">
          <tr>
            {isAdminVariant ? sortableTh('nombre_usuario', 'Usuario') : null}
            {sortableTh('client_type', 'Cliente')}
            {sortableTh('ip_address', 'IP')}
            {estadoSortTh}
            <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-border-base">
          {sessions.map((session) => {
            const isCurrent = isCurrentSession(session);

            return (
              <tr
                key={resolveSessionId(session)}
                className={getCurrentSessionRowClass(isCurrent)}
                data-current-session={isCurrent ? 'true' : 'false'}
                onClick={
                  isAdminVariant && onViewDetail
                    ? (event) => {
                        const target = event.target as HTMLElement;
                        if (target.closest('button')) return;
                        onViewDetail(session);
                      }
                    : undefined
                }
              >
                {isAdminVariant ? (
                  <td
                    className={`px-4 py-3 text-sm ${getCurrentSessionLeadingCellClass(isCurrent)}`}
                  >
                    <SessionUsuarioBlock session={session} isCurrent={isCurrent} />
                  </td>
                ) : null}
                <td
                  className={`px-4 py-3 text-sm ${!isAdminVariant ? getCurrentSessionLeadingCellClass(isCurrent) : ''}`}
                >
                  <SessionClienteLine
                    clientType={session.client_type}
                    deviceLabel={session.device?.device_label}
                    showCurrentMarker={!isAdminVariant && isCurrent}
                  />
                </td>
                <td className="px-4 py-3 text-sm">
                  <SessionIpLine session={session} />
                </td>
                <td className="px-4 py-3 text-sm">
                  <SessionEstadoLine session={session} />
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  <SessionListActions
                    session={session}
                    isCurrent={isCurrent}
                    actionsDisabled={actionsDisabled}
                    onRevoke={onRevoke}
                    onViewDetail={isAdminVariant ? onViewDetail : undefined}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
