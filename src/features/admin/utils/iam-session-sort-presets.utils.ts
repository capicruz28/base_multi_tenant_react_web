import type { AdminSessionSortBy, AdminSessionSortOrder } from '@/features/admin/types/session.types';

export type ActiveSessionsSortPresetId =
  | 'last_refresh_desc'
  | 'expiring_soon'
  | 'most_recent'
  | 'user_az'
  | 'user_za';

export interface ActiveSessionsSortPreset {
  id: ActiveSessionsSortPresetId;
  label: string;
  sortBy: AdminSessionSortBy;
  sortOrder: AdminSessionSortOrder;
}

/** Presets enterprise — Fase 3 (extiende §4.2 con usuario A-Z / Z-A). */
export const ACTIVE_SESSIONS_SORT_PRESETS: readonly ActiveSessionsSortPreset[] = [
  { id: 'last_refresh_desc', label: 'Último refresh', sortBy: 'last_used_at', sortOrder: 'desc' },
  { id: 'expiring_soon', label: 'Próximas a expirar', sortBy: 'expires_at', sortOrder: 'asc' },
  { id: 'most_recent', label: 'Más recientes', sortBy: 'created_at', sortOrder: 'desc' },
  { id: 'user_az', label: 'Usuario A-Z', sortBy: 'nombre_usuario', sortOrder: 'asc' },
  { id: 'user_za', label: 'Usuario Z-A', sortBy: 'nombre_usuario', sortOrder: 'desc' },
] as const;

export function findActiveSessionsSortPreset(
  id: ActiveSessionsSortPresetId,
): ActiveSessionsSortPreset {
  const preset = ACTIVE_SESSIONS_SORT_PRESETS.find((item) => item.id === id);
  if (!preset) {
    throw new Error(`Unknown sort preset: ${id}`);
  }
  return preset;
}

export function resolveActiveSessionsSortPresetId(
  sortBy: AdminSessionSortBy | undefined,
  sortOrder: AdminSessionSortOrder,
): ActiveSessionsSortPresetId | '' {
  if (sortBy === undefined) {
    return '';
  }

  const match = ACTIVE_SESSIONS_SORT_PRESETS.find(
    (preset) => preset.sortBy === sortBy && preset.sortOrder === sortOrder,
  );

  return match?.id ?? '';
}

export function getActiveSessionsSortPresetLabel(
  sortBy: AdminSessionSortBy | undefined,
  sortOrder: AdminSessionSortOrder,
): string {
  const presetId = resolveActiveSessionsSortPresetId(sortBy, sortOrder);
  if (presetId === '') {
    return 'Predeterminado';
  }
  return findActiveSessionsSortPreset(presetId).label;
}
