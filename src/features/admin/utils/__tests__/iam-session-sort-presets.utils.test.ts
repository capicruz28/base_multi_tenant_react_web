import { describe, expect, it } from 'vitest';

import {
  ACTIVE_SESSIONS_SORT_PRESETS,
  findActiveSessionsSortPreset,
  getActiveSessionsSortPresetLabel,
  resolveActiveSessionsSortPresetId,
} from '@/features/admin/utils/iam-session-sort-presets.utils';

describe('iam-session-sort-presets.utils', () => {
  it('expone los 5 presets enterprise', () => {
    expect(ACTIVE_SESSIONS_SORT_PRESETS).toHaveLength(5);
    expect(ACTIVE_SESSIONS_SORT_PRESETS.map((p) => p.id)).toEqual([
      'last_refresh_desc',
      'expiring_soon',
      'most_recent',
      'user_az',
      'user_za',
    ]);
  });

  it('resuelve preset id desde sortBy/sortOrder', () => {
    expect(resolveActiveSessionsSortPresetId('last_used_at', 'desc')).toBe('last_refresh_desc');
    expect(resolveActiveSessionsSortPresetId('expires_at', 'asc')).toBe('expiring_soon');
    expect(resolveActiveSessionsSortPresetId('created_at', 'desc')).toBe('most_recent');
    expect(resolveActiveSessionsSortPresetId('nombre_usuario', 'asc')).toBe('user_az');
    expect(resolveActiveSessionsSortPresetId('nombre_usuario', 'desc')).toBe('user_za');
  });

  it('devuelve vacío si el orden no coincide con ningún preset', () => {
    expect(resolveActiveSessionsSortPresetId(undefined, 'desc')).toBe('');
    expect(resolveActiveSessionsSortPresetId('last_used_at', 'asc')).toBe('');
    expect(resolveActiveSessionsSortPresetId('expires_at', 'desc')).toBe('');
  });

  it('obtiene label de preset o Predeterminado', () => {
    expect(getActiveSessionsSortPresetLabel('expires_at', 'asc')).toBe('Próximas a expirar');
    expect(getActiveSessionsSortPresetLabel(undefined, 'desc')).toBe('Predeterminado');
    expect(getActiveSessionsSortPresetLabel('last_used_at', 'asc')).toBe('Predeterminado');
  });

  it('findActiveSessionsSortPreset lanza si id desconocido', () => {
    expect(() => findActiveSessionsSortPreset('last_refresh_desc' as never)).not.toThrow();
    expect(() =>
      findActiveSessionsSortPreset('unknown' as 'last_refresh_desc'),
    ).toThrow(/Unknown sort preset/);
  });
});
