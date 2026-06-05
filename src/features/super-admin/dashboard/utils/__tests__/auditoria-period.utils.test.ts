import { describe, it, expect } from 'vitest';
import { getLast24HoursRange } from '../auditoria-period.utils';

describe('getLast24HoursRange', () => {
  it('returns a 24-hour window ending at the provided instant', () => {
    const now = new Date('2026-06-03T12:00:00.000Z');
    const range = getLast24HoursRange(now);

    expect(range.fecha_hasta).toBe(now.toISOString());
    expect(new Date(range.fecha_desde).getTime()).toBe(now.getTime() - 24 * 60 * 60 * 1000);
  });
});
