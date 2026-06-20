import {
  AlertTriangle,
  Calendar,
  Globe,
  LogOut,
  Monitor,
  Smartphone,
} from 'lucide-react';
import type { AdminSessionRead } from '@/features/admin/types/session.types';
import {
  formatBrowserLabel,
  formatDeviceName,
  formatLastUsedAt,
  formatOsLabel,
  formatSessionDateTime,
  formatUserDisplayName,
  getSessionExpirationBadgeClass,
  getSessionExpirationBadgeLabel,
  getSessionExpirationStatus,
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

export interface ActiveSessionsCardsViewProps {
  sessions: AdminSessionRead[];
  onRevoke: (session: AdminSessionRead) => void;
  isOwnSession: (session: AdminSessionRead) => boolean;
  actionsDisabled?: boolean;
}

export function ActiveSessionsCardsView({
  sessions,
  onRevoke,
  isOwnSession,
  actionsDisabled = false,
}: ActiveSessionsCardsViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {sessions.map((session) => {
        const own = isOwnSession(session);
        return (
          <div
            key={session.token_id}
            className={`bg-surface rounded-lg shadow border p-5 transition-all hover:shadow-md ${
              own
                ? 'border-brand-primary ring-2 ring-brand-primary/20'
                : 'border-border-base'
            }`}
          >
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-text-base truncate flex items-center gap-2">
                  {session.nombre_usuario ?? '—'}
                  {own ? (
                    <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full shrink-0">
                      Tu sesión
                    </span>
                  ) : null}
                </h3>
                <p className="text-sm text-text-soft truncate">{formatUserDisplayName(session)}</p>
              </div>
              <ExpirationBadge expiresAt={session.expires_at} />
            </div>

            <div className="space-y-2 mb-4 text-sm text-text-soft">
              <div className="flex items-center gap-2">
                <ClientTypeIcon clientType={session.client_type} />
                <span className="capitalize">{session.client_type}</span>
              </div>
              <div className="flex items-start gap-2">
                <Monitor className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <span>Dispositivo: {formatDeviceName(session.device_name)}</span>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <span>
                  {formatBrowserLabel(session.user_agent)} · {formatOsLabel(session.user_agent)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" aria-hidden />
                <span className="truncate">{session.ip_address ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" aria-hidden />
                <span>Creada: {formatSessionDateTime(session.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" aria-hidden />
                <span>Última actividad: {formatLastUsedAt(session.last_used_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" aria-hidden />
                <span>Expira: {formatSessionDateTime(session.expires_at)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRevoke(session)}
              disabled={own || actionsDisabled}
              className={`w-full px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                own
                  ? 'bg-subtle text-text-soft cursor-not-allowed opacity-60'
                  : 'bg-error text-white hover:bg-error/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error'
              }`}
              title={own ? 'No puedes revocar tu propia sesión' : 'Revocar sesión'}
            >
              <LogOut className="h-4 w-4" />
              {own ? 'Tu sesión activa' : 'Revocar sesión'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
