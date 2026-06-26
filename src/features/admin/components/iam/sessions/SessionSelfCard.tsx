import { Calendar, Globe, LogOut, Monitor } from 'lucide-react';

import type { AdminSessionRead } from '@/features/admin/types/session.types';
import {
  getCurrentSessionCardClass,
  SessionCurrentMarker,
} from '@/features/admin/components/iam/sessions/SessionCurrentMarker';
import { SessionDeviceCell } from '@/features/admin/components/iam/sessions/SessionDeviceCell';
import { SessionStatusBadge } from '@/features/admin/components/iam/sessions/SessionStatusBadge';
import { SessionClientTypeIcon } from '@/features/admin/components/iam/sessions/shared/SessionClientTypeIcon';
import { resolveLastSeenIp } from '@/features/admin/utils/iam-session-ip.utils';
import {
  formatIssuedAt,
  formatLastRefreshAt,
  formatSessionDateTime,
  getSessionCloseActionLabel,
} from '@/features/admin/utils/iam-session-display.utils';

export interface SessionSelfCardProps {
  session: AdminSessionRead;
  isCurrent: boolean;
  actionsDisabled: boolean;
  onRevoke: (session: AdminSessionRead) => void;
}

/** Card self (MySessions) — comportamiento legacy; arquitectura Fase 4 Stage 2. */
export function SessionSelfCard({
  session,
  isCurrent,
  actionsDisabled,
  onRevoke,
}: SessionSelfCardProps) {
  const closeLabel = getSessionCloseActionLabel(isCurrent);

  return (
    <div
      className={`bg-surface rounded-lg shadow border p-5 transition-all ${getCurrentSessionCardClass(isCurrent)}`}
      data-current-session={isCurrent ? 'true' : 'false'}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-text-base flex flex-wrap items-center gap-2">
            <SessionDeviceCell device={session.device} display="label" />
            {isCurrent ? <SessionCurrentMarker /> : null}
          </h3>
        </div>
        <SessionStatusBadge status={session.status} />
      </div>

      <div className="space-y-2 mb-4 text-sm text-text-soft">
        <div className="flex items-center gap-2">
          <SessionClientTypeIcon clientType={session.client_type} size="md" />
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
          <SessionDeviceCell
            device={session.device}
            display="ip"
            lastSeenIp={resolveLastSeenIp(session)}
          />
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
}
