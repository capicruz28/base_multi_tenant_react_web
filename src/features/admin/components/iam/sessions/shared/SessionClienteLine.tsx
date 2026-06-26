import { SessionCurrentMarker } from '@/features/admin/components/iam/sessions/SessionCurrentMarker';
import { SessionClientTypeChip } from '@/features/admin/components/iam/sessions/shared/SessionClientTypeChip';
import { SessionClientTypeIcon } from '@/features/admin/components/iam/sessions/shared/SessionClientTypeIcon';
import type { SessionSharedLayout } from '@/features/admin/components/iam/sessions/shared/session-view.types';

export interface SessionClienteLineProps {
  clientType: string;
  deviceLabel?: string | null;
  showCurrentMarker?: boolean;
  layout?: SessionSharedLayout;
}

/** Columna Cliente — icono + chip + device_label (Fase 4 shared). */
export function SessionClienteLine({
  clientType,
  deviceLabel,
  showCurrentMarker = false,
  layout = 'table',
}: SessionClienteLineProps) {
  const label = deviceLabel?.trim() || '—';

  if (layout === 'card') {
    return (
      <div
        className="flex h-5 min-h-5 min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-sm leading-5 text-text-soft"
        data-testid="session-cliente-line"
      >
        <SessionClientTypeIcon clientType={clientType} />
        <span className="flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap">
          <SessionClientTypeChip clientType={clientType} />
          <span aria-hidden className="shrink-0 text-text-faint">
            ·
          </span>
          <span className="min-w-0 truncate">{label}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {showCurrentMarker ? <SessionCurrentMarker /> : null}
      <SessionClientTypeIcon clientType={clientType} />
      <SessionClientTypeChip clientType={clientType} />
      <span className="min-w-0 truncate text-text-soft">{label}</span>
    </div>
  );
}
