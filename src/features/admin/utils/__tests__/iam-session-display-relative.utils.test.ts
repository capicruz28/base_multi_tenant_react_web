import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  formatSessionAbsoluteTooltip,
  formatSessionExpiresRelative,
  formatSessionLastRefreshRelative,
  formatSessionRelativeTime,
} from '@/features/admin/utils/iam-session-display.utils';

describe('formatSessionRelativeTime — spec v1.1 §10', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-23T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('mode past', () => {
    it('returns Sin refresh for null', () => {
      expect(formatSessionRelativeTime(null, 'past')).toBe('Sin refresh');
    });

    it('returns Ahora for less than 1 minute', () => {
      expect(formatSessionRelativeTime('2026-06-23T11:59:30Z', 'past')).toBe('Ahora');
    });

    it('returns Hace N min', () => {
      expect(formatSessionRelativeTime('2026-06-23T11:30:00Z', 'past')).toBe('Hace 30 min');
    });

    it('returns Hace N h', () => {
      expect(formatSessionRelativeTime('2026-06-23T08:00:00Z', 'past')).toBe('Hace 4 h');
    });

    it('returns Hace N días', () => {
      expect(formatSessionRelativeTime('2026-06-20T12:00:00Z', 'past')).toBe('Hace 3 días');
    });

    it('returns short date for 7+ days', () => {
      expect(formatSessionRelativeTime('2026-06-01T12:00:00Z', 'past')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe('mode future', () => {
    it('returns — for null', () => {
      expect(formatSessionRelativeTime(null, 'future')).toBe('—');
    });

    it('returns Expirada when in the past', () => {
      expect(formatSessionRelativeTime('2026-06-22T12:00:00Z', 'future')).toBe('Expirada');
    });

    it('returns Expira en N min', () => {
      expect(formatSessionRelativeTime('2026-06-23T12:45:00Z', 'future')).toBe('Expira en 45 min');
    });

    it('returns Expira en N h', () => {
      expect(formatSessionRelativeTime('2026-06-23T16:00:00Z', 'future')).toBe('Expira en 4 h');
    });

    it('returns Expira en N días', () => {
      expect(formatSessionRelativeTime('2026-06-25T12:00:00Z', 'future')).toBe('Expira en 2 días');
    });
  });

  describe('session helpers', () => {
    it('formatSessionLastRefreshRelative uses last_refresh_at', () => {
      expect(
        formatSessionLastRefreshRelative({
          last_refresh_at: '2026-06-23T11:00:00Z',
          last_used_at: '2026-06-22T11:00:00Z',
        }),
      ).toBe('Hace 1 h');
    });

    it('formatSessionExpiresRelative formats expires_at', () => {
      expect(formatSessionExpiresRelative({ expires_at: '2026-06-25T12:00:00Z' })).toBe(
        'Expira en 2 días',
      );
    });

    it('formatSessionAbsoluteTooltip returns formatted datetime', () => {
      const tooltip = formatSessionAbsoluteTooltip('2026-06-23T11:00:00Z');
      expect(tooltip).toBeTruthy();
      expect(tooltip).not.toBe('—');
    });
  });
});
