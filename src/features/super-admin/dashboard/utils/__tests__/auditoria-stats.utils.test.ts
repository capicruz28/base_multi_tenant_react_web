import { describe, it, expect } from 'vitest';
import { toEventTypeChartSegments } from '../auditoria-stats.utils';

describe('toEventTypeChartSegments', () => {
  it('maps eventos_por_tipo to sorted chart segments', () => {
    const segments = toEventTypeChartSegments({
      login_failed: 70,
      login_success: 1180,
      logout: 5,
    });

    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({
      key: 'login_success',
      label: 'Login Success',
      value: 1180,
    });
    expect(segments[1].key).toBe('login_failed');
    expect(segments[2].key).toBe('logout');
  });

  it('returns empty array when input is undefined or all zero', () => {
    expect(toEventTypeChartSegments(undefined)).toEqual([]);
    expect(toEventTypeChartSegments({ login_success: 0 })).toEqual([]);
  });
});
