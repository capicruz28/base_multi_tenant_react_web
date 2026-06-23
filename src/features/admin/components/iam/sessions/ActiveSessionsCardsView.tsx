import {
  Calendar,
  Globe,
  LogOut,
  Monitor,
  Smartphone,
} from 'lucide-react';
import type { AdminSessionRead } from '@/features/admin/types/session.types';
import {
  getCurrentSessionCardClass,
  SessionCurrentMarker,
} from '@/features/admin/components/iam/sessions/SessionCurrentMarker';
import { SessionDeviceCell } from '@/features/admin/components/iam/sessions/SessionDeviceCell';
import { SessionStatusBadge } from '@/features/admin/components/iam/sessions/SessionStatusBadge';
import type { ActiveSessionsViewVariant } from '@/features/admin/components/iam/sessions/ActiveSessionsTableView';
import {
  formatEmpresaNombre,
  formatIssuedAt,
  formatLastRefreshAt,
  formatSessionDateTime,
  formatUserDisplayName,
  getSessionCloseActionLabel,
} from '@/features/admin/utils/iam-session-display.utils';

function ClientTypeIcon({ clientType }: { clientType: string }) {
  switch (clientType.toLowerCase()) {
    case 'web':
      return <Monitor className="h-5 w-5 text-info" aria-hidden />;
    case 'mobile':
      return <Smartphone className="h-5 w-5 text-success" aria-hidden />;
    default:
      return <Globe className="h-5 w-5 text-text-soft" aria-hidden />;
  }
}

export interface ActiveSessionsCardsViewProps {
  sessions: AdminSessionRead[];
  onRevoke: (session: AdminSessionRead) => void;
  isCurrentSession: (session: AdminSessionRead) => boolean;
  actionsDisabled?: boolean;
  variant?: ActiveSessionsViewVariant;
}

export function ActiveSessionsCardsView({
  sessions,
  onRevoke,
  isCurrentSession,
  actionsDisabled = false,
  variant = 'admin',
}: ActiveSessionsCardsViewProps) {
  const isAdminVariant = variant === 'admin';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {sessions.map((session) => {
        const isCurrent = isCurrentSession(session);
        const closeLabel = getSessionCloseActionLabel(isCurrent);

        return (
          <div
            key={session.token_id}
            className={`bg-surface rounded-lg shadow border p-5 transition-all ${getCurrentSessionCardClass(isCurrent)}`}
            data-current-session={isCurrent ? 'true' : 'false'}
          >
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="flex-1 min-w-0">
                {isAdminVariant ? (
                  <>
                    <h3 className="text-base font-semibold text-text-base truncate flex flex-wrap items-center gap-2">
                      {session.nombre_usuario ?? '—'}
                      {isCurrent ? <SessionCurrentMarker /> : null}
                    </h3>
                    <p className="text-sm text-text-soft truncate">{formatUserDisplayName(session)}</p>
                  </>
                ) : (
                  <h3 className="text-base font-semibold text-text-base flex flex-wrap items-center gap-2">
                    <SessionDeviceCell device={session.device} display="label" />
                    {isCurrent ? <SessionCurrentMarker /> : null}
                  </h3>
                )}
              </div>
              <SessionStatusBadge status={session.status} />
            </div>

            <div className="space-y-2 mb-4 text-sm text-text-soft">
              {isAdminVariant ? (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0" aria-hidden />
                  <span>Empresa: {formatEmpresaNombre(session.empresa_nombre)}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <ClientTypeIcon clientType={session.client_type} />
                <span className="capitalize">{session.client_type}</span>
              </div>
              <div className="flex items-start gap-2">
                <Monitor className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <SessionDeviceCell device={session.device} display="label" />
              </div>
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <SessionDeviceCell device={session.device} display="browser" />
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" aria-hidden />
                <SessionDeviceCell device={session.device} display="ip" />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" aria-hidden />
                <span>Emitida: {formatIssuedAt(session)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" aria-hidden />
                <span>Último refresh: {formatLastRefreshAt(session)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" aria-hidden />
                <span>Expira: {formatSessionDateTime(session.expires_at)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRevoke(session)}
              disabled={actionsDisabled}
              className="w-full px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors bg-error text-white hover:bg-error/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error disabled:opacity-50 disabled:cursor-not-allowed"
              title={closeLabel}
              aria-label={closeLabel}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {closeLabel}
            </button>
          </div>
        );
      })}
    </div>
  );
}
