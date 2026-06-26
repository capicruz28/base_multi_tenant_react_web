import { afterEach, describe, expect, it } from 'vitest';

import {
  ACTIVE_SESSIONS_AUTO_REFRESH_STORAGE_KEY,
  getActiveSessionsAutoRefreshMs,
  isActiveSessionsAutoRefreshEnabled,
  readStoredActiveSessionsAutoRefreshInterval,
  writeStoredActiveSessionsAutoRefreshInterval,
} from '@/features/admin/utils/iam-session-auto-refresh.utils';

describe('iam-session-auto-refresh.utils', () => {
  afterEach(() => {
    localStorage.removeItem(ACTIVE_SESSIONS_AUTO_REFRESH_STORAGE_KEY);
  });

  it('mapea intervalos a milisegundos', () => {
    expect(getActiveSessionsAutoRefreshMs('manual')).toBeNull();
    expect(getActiveSessionsAutoRefreshMs('30s')).toBe(30_000);
    expect(getActiveSessionsAutoRefreshMs('60s')).toBe(60_000);
    expect(getActiveSessionsAutoRefreshMs('300s')).toBe(300_000);
  });

  it('manual deshabilita auto-refresh', () => {
    expect(isActiveSessionsAutoRefreshEnabled('manual')).toBe(false);
    expect(isActiveSessionsAutoRefreshEnabled('30s')).toBe(true);
  });

  it('lee manual por defecto si no hay preferencia', () => {
    expect(readStoredActiveSessionsAutoRefreshInterval()).toBe('manual');
  });

  it('persiste y lee preferencia en localStorage', () => {
    writeStoredActiveSessionsAutoRefreshInterval('60s');
    expect(localStorage.getItem(ACTIVE_SESSIONS_AUTO_REFRESH_STORAGE_KEY)).toBe('60s');
    expect(readStoredActiveSessionsAutoRefreshInterval()).toBe('60s');
  });

  it('ignora valores inválidos en localStorage', () => {
    localStorage.setItem(ACTIVE_SESSIONS_AUTO_REFRESH_STORAGE_KEY, 'invalid');
    expect(readStoredActiveSessionsAutoRefreshInterval()).toBe('manual');
  });
});
