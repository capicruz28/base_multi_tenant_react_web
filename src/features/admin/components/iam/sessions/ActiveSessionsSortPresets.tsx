import type { AdminSessionSortBy, AdminSessionSortOrder } from '@/features/admin/types/session.types';
import {
  ACTIVE_SESSIONS_SORT_PRESETS,
  type ActiveSessionsSortPresetId,
  findActiveSessionsSortPreset,
  resolveActiveSessionsSortPresetId,
} from '@/features/admin/utils/iam-session-sort-presets.utils';

const selectClass =
  'rounded-md border border-border-base bg-surface px-2 py-2 text-sm text-text-base shadow-sm focus:border-brand-primary focus:outline-none focus:ring-brand-primary';

export interface ActiveSessionsSortPresetsProps {
  sortBy: AdminSessionSortBy | undefined;
  sortOrder: AdminSessionSortOrder;
  onPresetChange: (sortBy: AdminSessionSortBy | undefined, sortOrder: AdminSessionSortOrder) => void;
  disabled?: boolean;
}

/** Selector presets orden — Fase 3. */
export function ActiveSessionsSortPresets({
  sortBy,
  sortOrder,
  onPresetChange,
  disabled = false,
}: ActiveSessionsSortPresetsProps) {
  const selectedPresetId = resolveActiveSessionsSortPresetId(sortBy, sortOrder);

  return (
    <label className="flex shrink-0 items-center gap-2 text-sm text-text-soft">
      <span className="sr-only">Ordenar sesiones</span>
      <select
        value={selectedPresetId}
        onChange={(event) => {
          const next = event.target.value as ActiveSessionsSortPresetId | '';
          if (next === '') {
            onPresetChange(undefined, 'desc');
            return;
          }
          const preset = findActiveSessionsSortPreset(next);
          onPresetChange(preset.sortBy, preset.sortOrder);
        }}
        disabled={disabled}
        className={selectClass}
        aria-label="Ordenar sesiones"
      >
        <option value="">Predeterminado</option>
        {ACTIVE_SESSIONS_SORT_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
    </label>
  );
}
