import { formatSessionRelativeTime } from '@/features/admin/utils/iam-session-display.utils';

export interface ActiveSessionsUpdatedMetaProps {
  dataUpdatedAt?: number;
  listDataUpdatedAt?: number;
}

/** Etiqueta «Actualizado hace…» — spec v1.1 Fase 1B (sin polling). */
export function formatActiveSessionsUpdatedLabel(
  dataUpdatedAtMs: number | undefined,
  now: Date = new Date(),
): string {
  if (dataUpdatedAtMs == null || dataUpdatedAtMs <= 0) {
    return 'Actualizado recientemente';
  }

  const relative = formatSessionRelativeTime(
    new Date(dataUpdatedAtMs).toISOString(),
    'past',
    now,
  );

  if (relative === 'Ahora') {
    return 'Actualizado ahora';
  }

  if (relative.startsWith('Hace ')) {
    return `Actualizado ${relative.charAt(0).toLowerCase()}${relative.slice(1)}`;
  }

  return `Actualizado el ${relative}`;
}

export function ActiveSessionsUpdatedMeta({
  dataUpdatedAt,
  listDataUpdatedAt,
}: ActiveSessionsUpdatedMetaProps) {
  const latestUpdatedAt = Math.max(dataUpdatedAt ?? 0, listDataUpdatedAt ?? 0);
  const label = formatActiveSessionsUpdatedLabel(
    latestUpdatedAt > 0 ? latestUpdatedAt : undefined,
  );

  return <p className="mb-4 text-sm text-text-soft">{label}</p>;
}
