import {
  ACTIVE_SESSIONS_AUTO_REFRESH_OPTIONS,
  type ActiveSessionsAutoRefreshInterval,
} from '@/features/admin/utils/iam-session-auto-refresh.utils';

const selectClass =
  'rounded-md border border-border-base bg-surface px-2 py-2 text-sm text-text-base shadow-sm focus:border-brand-primary focus:outline-none focus:ring-brand-primary';

export interface ActiveSessionsAutoRefreshSelectProps {
  value: ActiveSessionsAutoRefreshInterval;
  onChange: (interval: ActiveSessionsAutoRefreshInterval) => void;
  disabled?: boolean;
}

/** Selector intervalo auto-refresh — Fase 3. */
export function ActiveSessionsAutoRefreshSelect({
  value,
  onChange,
  disabled = false,
}: ActiveSessionsAutoRefreshSelectProps) {
  return (
    <label className="flex shrink-0 items-center gap-2 text-sm text-text-soft">
      <span className="sr-only">Intervalo de actualización automática</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as ActiveSessionsAutoRefreshInterval)}
        disabled={disabled}
        className={selectClass}
        aria-label="Intervalo de actualización automática"
      >
        {ACTIVE_SESSIONS_AUTO_REFRESH_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
