import type { AdminSessionRead } from '@/features/admin/types/session.types';
import { SessionAdminCard } from '@/features/admin/components/iam/sessions/SessionAdminCard';
import { SessionSelfCard } from '@/features/admin/components/iam/sessions/SessionSelfCard';
import type { ActiveSessionsViewVariant } from '@/features/admin/components/iam/sessions/shared/session-view.types';
import { resolveSessionId } from '@/features/admin/utils/iam-session-id.utils';

export type { ActiveSessionsViewVariant } from '@/features/admin/components/iam/sessions/shared/session-view.types';

export interface ActiveSessionsCardsViewProps {
  sessions: AdminSessionRead[];
  onRevoke: (session: AdminSessionRead) => void;
  isCurrentSession: (session: AdminSessionRead) => boolean;
  actionsDisabled?: boolean;
  variant?: ActiveSessionsViewVariant;
  onViewDetail?: (session: AdminSessionRead) => void;
}

/** Contenedor grid — delega en SessionAdminCard o SessionSelfCard (Fase 4 Stage 2). */
export function ActiveSessionsCardsView({
  sessions,
  onRevoke,
  isCurrentSession,
  actionsDisabled = false,
  variant = 'admin',
  onViewDetail,
}: ActiveSessionsCardsViewProps) {
  const isAdminVariant = variant === 'admin';

  return (
    <div className="grid grid-cols-1 items-stretch md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-3">

      {sessions.map((session) => {
        const isCurrent = isCurrentSession(session);
        const key = resolveSessionId(session);

        if (isAdminVariant) {
          return (
            <SessionAdminCard
              key={key}
              session={session}
              isCurrent={isCurrent}
              actionsDisabled={actionsDisabled}
              onRevoke={onRevoke}
              onViewDetail={onViewDetail}
            />
          );
        }

        return (
          <SessionSelfCard
            key={key}
            session={session}
            isCurrent={isCurrent}
            actionsDisabled={actionsDisabled}
            onRevoke={onRevoke}
          />
        );
      })}
    </div>
  );
}
