import type { AdminSessionRead } from '@/features/admin/types/session.types';
import { SessionStatusBadge } from '@/features/admin/components/iam/sessions/SessionStatusBadge';
import type { SessionSharedLayout } from '@/features/admin/components/iam/sessions/shared/session-view.types';
import {
  formatSessionAbsoluteTooltip,
  formatSessionExpiresRelative,
  formatSessionLastRefreshRelative,
} from '@/features/admin/utils/iam-session-display.utils';

export interface SessionEstadoLineProps {
  session: AdminSessionRead;
  layout?: SessionSharedLayout;
}

/** Columna Estado — refresh + expiración relativos + badge (Fase 4 shared). */
export function SessionEstadoLine({ session, layout = 'table' }: SessionEstadoLineProps) {
  const refreshRelative = formatSessionLastRefreshRelative(session);
  const expiresRelative = formatSessionExpiresRelative(session);
  const refreshTooltip = formatSessionAbsoluteTooltip(
    session.last_refresh_at ?? session.last_used_at,
  );
  const expiresTooltip = formatSessionAbsoluteTooltip(session.expires_at);

  if (layout === 'card') {
    return (
      <div className="min-w-0">
        <div
          className="h-5 min-h-5 truncate text-sm leading-5 text-text-soft"
          title={refreshTooltip}
        >
          Último refresh: {refreshRelative}
        </div>
        <div
          className="flex h-6 min-h-6 min-w-0 items-center gap-1.5 overflow-hidden text-sm leading-5 text-text-soft"
          title={expiresTooltip}
        >
          <span className="min-w-0 truncate">{expiresRelative}</span>
          <span className="shrink-0">
            <SessionStatusBadge status={session.status} />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="text-text-soft" title={refreshTooltip}>
        Último refresh: {refreshRelative}
      </span>
      <span
        className="inline-flex flex-wrap items-center gap-1.5 text-text-soft"
        title={expiresTooltip}
      >
        <span>{expiresRelative}</span>
        <SessionStatusBadge status={session.status} />
      </span>
    </div>
  );
}
