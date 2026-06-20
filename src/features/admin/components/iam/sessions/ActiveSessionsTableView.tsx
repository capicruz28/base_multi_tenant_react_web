import { AlertTriangle, LogOut, Monitor, Smartphone, Globe } from 'lucide-react';
import type { AdminSessionRead, AdminSessionSortBy, AdminSessionSortOrder } from '@/features/admin/types/session.types';
import {
  formatBrowserLabel,
  formatDeviceName,
  formatLastUsedAt,
  formatSessionDateTime,
  formatUserDisplayName,
  getSessionExpirationBadgeClass,
  getSessionExpirationBadgeLabel,
  getSessionExpirationStatus,
} from '@/features/admin/utils/iam-session-display.utils';

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

function ExpirationBadge({ expiresAt }: { expiresAt: string }) {
  const status = getSessionExpirationStatus(expiresAt);
  const label = getSessionExpirationBadgeLabel(status);
  const className = getSessionExpirationBadgeClass(status);
  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${className}`}
    >
      {status === 'expiring_soon' ? <AlertTriangle className="h-3 w-3" aria-hidden /> : null}
      {label}
    </span>
  );
}

export interface ActiveSessionsTableViewProps {
  sessions: AdminSessionRead[];
  sortBy?: AdminSessionSortBy;
  sortOrder?: AdminSessionSortOrder;
  onSort: (column: AdminSessionSortBy) => void;
  onRevoke: (session: AdminSessionRead) => void;
  isOwnSession: (session: AdminSessionRead) => boolean;
  actionsDisabled?: boolean;
}

export function ActiveSessionsTableView({
  sessions,
  sortBy,
  sortOrder,
  onSort,
  onRevoke,
  isOwnSession,
  actionsDisabled = false,
}: ActiveSessionsTableViewProps) {
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
            {sortableTh('nombre_usuario', 'Usuario')}
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
            {sortableTh('created_at', 'Creada')}
            {sortableTh('last_used_at', 'Última actividad')}
            {sortableTh('expires_at', 'Expira')}
            <th className="px-6 py-3 text-center text-xs font-medium text-text-soft uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-border-base">
          {sessions.map((session) => {
            const own = isOwnSession(session);
            return (
              <tr key={session.token_id} className="hover:bg-overlay/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-medium text-text-base">{session.nombre_usuario ?? '—'}</div>
                  <div className="text-text-soft text-xs">{formatUserDisplayName(session)}</div>
                  {own ? (
                    <span className="mt-1 inline-block text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">
                      Tu sesión
                    </span>
                  ) : null}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                  <span className="inline-flex items-center gap-2 capitalize">
                    <ClientTypeIcon clientType={session.client_type} />
                    {session.client_type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                  {formatDeviceName(session.device_name)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                  {formatBrowserLabel(session.user_agent)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                  {session.ip_address ?? '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                  {formatSessionDateTime(session.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                  {formatLastUsedAt(session.last_used_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-text-soft">{formatSessionDateTime(session.expires_at)}</span>
                    <ExpirationBadge expiresAt={session.expires_at} />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                  <button
                    type="button"
                    onClick={() => onRevoke(session)}
                    disabled={own || actionsDisabled}
                    className="inline-flex items-center gap-1 text-error hover:text-error/80 p-1 rounded hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                    title={own ? 'No puedes revocar tu propia sesión' : 'Revocar sesión'}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Revocar sesión</span>
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
