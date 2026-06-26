import type { AdminSessionClientTypeFilter } from '@/features/admin/types/session.types';
import type { AdminSessionSortBy, AdminSessionSortOrder } from '@/features/admin/types/session.types';
import { getActiveSessionsSortPresetLabel } from '@/features/admin/utils/iam-session-sort-presets.utils';

function formatPlatformLabel(clientTypeFilter: AdminSessionClientTypeFilter): string {
  switch (clientTypeFilter) {
    case 'web':
      return 'Web';
    case 'mobile':
      return 'Mobile';
    default:
      return 'Todas';
  }
}

export interface ActiveSessionsFiltersSummaryProps {
  usuarioLabel: string | null;
  clientTypeFilter: AdminSessionClientTypeFilter;
  sortBy: AdminSessionSortBy | undefined;
  sortOrder: AdminSessionSortOrder;
}

/** Resumen visual filtros activos — Fase 3 (sin chips removibles). */
export function ActiveSessionsFiltersSummary({
  usuarioLabel,
  clientTypeFilter,
  sortBy,
  sortOrder,
}: ActiveSessionsFiltersSummaryProps) {
  const usuarioText = usuarioLabel ?? 'Todos';
  const platformText = formatPlatformLabel(clientTypeFilter);
  const sortText = getActiveSessionsSortPresetLabel(sortBy, sortOrder);

  return (
    <p className="mb-3 text-sm text-text-soft" aria-live="polite">
      <span className="text-text-faint">Usuario:</span>{' '}
      <span className="text-text-base">{usuarioText}</span>
      <span className="mx-2 text-text-faint" aria-hidden>
        ·
      </span>
      <span className="text-text-faint">Plataforma:</span>{' '}
      <span className="text-text-base">{platformText}</span>
      <span className="mx-2 text-text-faint" aria-hidden>
        ·
      </span>
      <span className="text-text-faint">Orden:</span>{' '}
      <span className="text-text-base">{sortText}</span>
    </p>
  );
}
