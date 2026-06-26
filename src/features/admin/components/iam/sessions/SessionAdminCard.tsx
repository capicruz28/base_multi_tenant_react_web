import type { AdminSessionRead } from '@/features/admin/types/session.types';
import { getCurrentSessionCardClass } from '@/features/admin/components/iam/sessions/SessionCurrentMarker';
import { SessionClienteLine } from '@/features/admin/components/iam/sessions/shared/SessionClienteLine';
import { SessionEstadoLine } from '@/features/admin/components/iam/sessions/shared/SessionEstadoLine';
import { SessionIpLine } from '@/features/admin/components/iam/sessions/shared/SessionIpLine';
import { SessionListActions } from '@/features/admin/components/iam/sessions/shared/SessionListActions';
import { SessionUsuarioBlock } from '@/features/admin/components/iam/sessions/shared/SessionUsuarioBlock';

export interface SessionAdminCardProps {
  session: AdminSessionRead;
  isCurrent: boolean;
  actionsDisabled: boolean;
  onRevoke: (session: AdminSessionRead) => void;
  onViewDetail?: (session: AdminSessionRead) => void;
}

/** Card admin compacta — paridad Lista v1.2 §9.3 (Fase 4 Stage 2 + UX Polish). */
export function SessionAdminCard({
  session,
  isCurrent,
  actionsDisabled,
  onRevoke,
  onViewDetail,
}: SessionAdminCardProps) {
  return (
    <div
      className={`flex h-full min-h-0 flex-col bg-surface rounded-lg shadow border p-3 transition-all ${getCurrentSessionCardClass(isCurrent)}`}
      data-current-session={isCurrent ? 'true' : 'false'}
      data-testid="session-admin-card"
    >
      <SessionUsuarioBlock session={session} isCurrent={isCurrent} layout="card" />

      <div className="mt-1 min-w-0">
        <SessionClienteLine
          clientType={session.client_type}
          deviceLabel={session.device?.device_label}
          layout="card"
        />
        <SessionIpLine session={session} layout="card" />
        <SessionEstadoLine session={session} layout="card" />
      </div>

      <div className="mt-auto flex justify-end border-t border-border-base pt-2">
        <SessionListActions
          session={session}
          isCurrent={isCurrent}
          actionsDisabled={actionsDisabled}
          onRevoke={onRevoke}
          onViewDetail={onViewDetail}
        />
      </div>
    </div>
  );
}
