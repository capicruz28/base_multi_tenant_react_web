export type ActiveSessionsAutoRefreshInterval = 'manual' | '30s' | '60s' | '300s';

export const ACTIVE_SESSIONS_AUTO_REFRESH_STORAGE_KEY = 'iam-active-sessions-auto-refresh-interval';

export const ACTIVE_SESSIONS_AUTO_REFRESH_OPTIONS: readonly {
  value: ActiveSessionsAutoRefreshInterval;
  label: string;
}[] = [
  { value: 'manual', label: 'Manual' },
  { value: '30s', label: '30 segundos' },
  { value: '60s', label: '1 minuto' },
  { value: '300s', label: '5 minutos' },
] as const;

export function getActiveSessionsAutoRefreshMs(
  interval: ActiveSessionsAutoRefreshInterval,
): number | null {
  switch (interval) {
    case 'manual':
      return null;
    case '30s':
      return 30_000;
    case '60s':
      return 60_000;
    case '300s':
      return 300_000;
    default:
      return null;
  }
}

export function readStoredActiveSessionsAutoRefreshInterval(): ActiveSessionsAutoRefreshInterval {
  try {
    const stored = localStorage.getItem(ACTIVE_SESSIONS_AUTO_REFRESH_STORAGE_KEY);
    if (stored === 'manual' || stored === '30s' || stored === '60s' || stored === '300s') {
      return stored;
    }
  } catch {
    /* preferencia no disponible */
  }
  return 'manual';
}

export function writeStoredActiveSessionsAutoRefreshInterval(
  interval: ActiveSessionsAutoRefreshInterval,
): void {
  try {
    localStorage.setItem(ACTIVE_SESSIONS_AUTO_REFRESH_STORAGE_KEY, interval);
  } catch {
    /* preferencia no disponible */
  }
}

export function isActiveSessionsAutoRefreshEnabled(
  interval: ActiveSessionsAutoRefreshInterval,
): boolean {
  return interval !== 'manual';
}
