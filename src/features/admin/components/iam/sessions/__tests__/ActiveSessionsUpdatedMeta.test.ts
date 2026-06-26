import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { formatActiveSessionsUpdatedLabel } from '@/features/admin/components/iam/sessions/ActiveSessionsUpdatedMeta';

describe('formatActiveSessionsUpdatedLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-23T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns fallback when timestamp missing', () => {
    expect(formatActiveSessionsUpdatedLabel(undefined)).toBe('Actualizado recientemente');
  });

  it('returns Actualizado ahora for recent timestamp', () => {
    expect(formatActiveSessionsUpdatedLabel(Date.now() - 30_000)).toBe('Actualizado ahora');
  });

  it('returns Actualizado hace N min', () => {
    expect(formatActiveSessionsUpdatedLabel(Date.now() - 5 * 60_000)).toBe('Actualizado hace 5 min');
  });
});
