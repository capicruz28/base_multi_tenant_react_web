import { Grid3x3, List, RefreshCw } from 'lucide-react';

import { ActiveSessionsAutoRefreshSelect } from '@/features/admin/components/iam/sessions/ActiveSessionsAutoRefreshSelect';
import {
  formatActiveSessionsUpdatedLabel,
} from '@/features/admin/components/iam/sessions/ActiveSessionsUpdatedMeta';
import type { ActiveSessionsAutoRefreshInterval } from '@/features/admin/utils/iam-session-auto-refresh.utils';
import { isActiveSessionsAutoRefreshEnabled } from '@/features/admin/utils/iam-session-auto-refresh.utils';

export type ActiveSessionsViewMode = 'table' | 'grid';

export interface ActiveSessionsToolbarMonitoringProps {
  dataUpdatedAt?: number;
  listDataUpdatedAt?: number;
  autoRefreshInterval: ActiveSessionsAutoRefreshInterval;
  onAutoRefreshIntervalChange: (interval: ActiveSessionsAutoRefreshInterval) => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  disabled?: boolean;
  viewMode: ActiveSessionsViewMode;
  onViewModeChange: (mode: ActiveSessionsViewMode) => void;
}

/** Grupo derecho toolbar — actualizado + vista + refresh (consolidación UX + Fase 3). */
export function ActiveSessionsToolbarMonitoring({
  dataUpdatedAt,
  listDataUpdatedAt,
  autoRefreshInterval,
  onAutoRefreshIntervalChange,
  onRefreshAll,
  isRefreshing,
  disabled = false,
  viewMode,
  onViewModeChange,
}: ActiveSessionsToolbarMonitoringProps) {
  const latestUpdatedAt = Math.max(dataUpdatedAt ?? 0, listDataUpdatedAt ?? 0);
  const updatedLabel = formatActiveSessionsUpdatedLabel(
    latestUpdatedAt > 0 ? latestUpdatedAt : undefined,
  );
  const autoRefreshActive = isActiveSessionsAutoRefreshEnabled(autoRefreshInterval);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="max-w-[10rem] truncate text-sm text-text-soft sm:max-w-none" aria-live="polite">
        {updatedLabel}
      </span>

      <div className="flex items-center gap-1 rounded-lg border border-border-base p-1">
        <button
          type="button"
          onClick={() => onViewModeChange('table')}
          disabled={disabled}
          className={`rounded p-1.5 transition-colors ${
            viewMode === 'table'
              ? 'bg-brand-primary text-white'
              : 'text-text-soft hover:bg-overlay'
          } disabled:opacity-50`}
          title="Vista de tabla"
          aria-label="Vista de tabla"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('grid')}
          disabled={disabled}
          className={`rounded p-1.5 transition-colors ${
            viewMode === 'grid'
              ? 'bg-brand-primary text-white'
              : 'text-text-soft hover:bg-overlay'
          } disabled:opacity-50`}
          title="Vista de tarjetas"
          aria-label="Vista de tarjetas"
        >
          <Grid3x3 className="h-4 w-4" />
        </button>
      </div>

      <ActiveSessionsAutoRefreshSelect
        value={autoRefreshInterval}
        onChange={onAutoRefreshIntervalChange}
        disabled={disabled}
      />

      <button
        type="button"
        onClick={onRefreshAll}
        disabled={isRefreshing || disabled}
        className="rounded-lg p-2 text-text-soft transition-colors hover:bg-overlay hover:text-text-base disabled:opacity-50"
        title="Actualizar listado y métricas"
        aria-label="Actualizar listado y métricas"
      >
        <RefreshCw
          className={`h-5 w-5 ${isRefreshing || autoRefreshActive ? 'animate-spin' : ''}`}
          aria-hidden
        />
      </button>
    </div>
  );
}
