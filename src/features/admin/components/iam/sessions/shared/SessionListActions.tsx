import { Eye, LogOut } from 'lucide-react';

import type { AdminSessionRead } from '@/features/admin/types/session.types';
import { getSessionCloseActionLabel } from '@/features/admin/utils/iam-session-display.utils';

export interface SessionListActionsProps {
  session: AdminSessionRead;
  isCurrent: boolean;
  actionsDisabled: boolean;
  onRevoke: (session: AdminSessionRead) => void;
  onViewDetail?: (session: AdminSessionRead) => void;
}

/** Acciones fila/card — Eye + LogOut (Fase 4 shared). */
export function SessionListActions({
  session,
  isCurrent,
  actionsDisabled,
  onRevoke,
  onViewDetail,
}: SessionListActionsProps) {
  const closeLabel = getSessionCloseActionLabel(isCurrent);

  return (
    <div className="inline-flex items-center justify-center gap-1">
      {onViewDetail ? (
        <button
          type="button"
          onClick={() => onViewDetail(session)}
          disabled={actionsDisabled}
          className="inline-flex items-center justify-center p-1.5 rounded text-text-soft hover:text-text-base hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
          title="Ver detalle"
          aria-label="Ver detalle"
        >
          <Eye className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center p-1.5 rounded text-text-faint cursor-not-allowed opacity-50"
          title="Ver detalle (próximamente)"
          aria-label="Ver detalle"
          aria-disabled="true"
        >
          <Eye className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      )}
      <button
        type="button"
        onClick={() => onRevoke(session)}
        disabled={actionsDisabled}
        className="inline-flex items-center justify-center p-1.5 rounded text-error hover:text-error/80 hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
        title={closeLabel}
        aria-label={closeLabel}
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden />
      </button>
    </div>
  );
}
