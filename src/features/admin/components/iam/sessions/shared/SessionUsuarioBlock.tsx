import type { AdminSessionRead } from '@/features/admin/types/session.types';
import { SessionCurrentMarker } from '@/features/admin/components/iam/sessions/SessionCurrentMarker';
import type { SessionSharedLayout } from '@/features/admin/components/iam/sessions/shared/session-view.types';
import {
  formatEmpresaNombre,
  formatUserDisplayName,
} from '@/features/admin/utils/iam-session-display.utils';

export interface SessionUsuarioBlockProps {
  session: AdminSessionRead;
  isCurrent: boolean;
  layout?: SessionSharedLayout;
}

function SessionCurrentMarkerSlot({ isCurrent }: { isCurrent: boolean }) {
  return (
    <div className="shrink-0" aria-hidden={!isCurrent}>
      {isCurrent ? (
        <SessionCurrentMarker />
      ) : (
        <span className="pointer-events-none invisible inline-flex">
          <SessionCurrentMarker />
        </span>
      )}
    </div>
  );
}

/** Columna Usuario admin — 3 líneas (Fase 4 shared). */
export function SessionUsuarioBlock({
  session,
  isCurrent,
  layout = 'table',
}: SessionUsuarioBlockProps) {
  if (layout === 'card') {
    return (
      <div className="min-w-0">
        <div className="flex h-6 min-h-6 min-w-0 items-center gap-2 overflow-hidden">
          <span className="min-w-0 flex-1 truncate text-sm font-medium leading-5 text-text-base">
            {session.nombre_usuario ?? '—'}
          </span>
          <SessionCurrentMarkerSlot isCurrent={isCurrent} />
        </div>
        <div className="h-5 min-h-5 truncate text-xs leading-5 text-text-soft">
          {formatUserDisplayName(session)}
        </div>
        <div
          className="h-5 min-h-5 truncate text-xs leading-5 text-text-faint"
          title={formatEmpresaNombre(session.empresa_nombre)}
        >
          {formatEmpresaNombre(session.empresa_nombre)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="truncate font-medium text-text-base">
          {session.nombre_usuario ?? '—'}
        </span>
        {isCurrent ? <SessionCurrentMarker /> : null}
      </div>
      <div className="truncate text-xs text-text-soft">{formatUserDisplayName(session)}</div>
      <div
        className="truncate text-xs text-text-faint"
        title={formatEmpresaNombre(session.empresa_nombre)}
      >
        {formatEmpresaNombre(session.empresa_nombre)}
      </div>
    </div>
  );
}
