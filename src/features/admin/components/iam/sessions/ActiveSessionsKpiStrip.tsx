import type { AdminSessionClientTypeFilter } from '@/features/admin/types/session.types';

export interface ActiveSessionsKpiStripProps {
  totalTenant: number;
  webCount: number;
  mobileCount: number;
  hasActiveFilters: boolean;
  activeClientTypeFilter?: AdminSessionClientTypeFilter;
  disabled?: boolean;
  onTotalClick: () => void;
  onWebClick: () => void;
  onMobileClick: () => void;
  onExpiringSoonClick: () => void;
}

function KpiTile({
  label,
  value,
  onClick,
  disabled,
  dimmed,
  active,
  title,
}: {
  label: string;
  value?: number;
  onClick: () => void;
  disabled?: boolean;
  dimmed?: boolean;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-lg border bg-surface px-4 py-3 text-left shadow-sm transition-colors hover:bg-overlay disabled:cursor-not-allowed disabled:opacity-50 ${
        active ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-border-base'
      } ${dimmed ? 'opacity-90' : ''}`}
    >
      {value !== undefined ? (
        <div className="text-2xl font-semibold text-text-base tabular-nums">{value}</div>
      ) : null}
      <div className="text-sm text-text-soft">{label}</div>
    </button>
  );
}

/** Franja KPI admin — spec v1.1 §6.1 (Fase 1B). */
export function ActiveSessionsKpiStrip({
  totalTenant,
  webCount,
  mobileCount,
  hasActiveFilters,
  activeClientTypeFilter = 'all',
  disabled = false,
  onTotalClick,
  onWebClick,
  onMobileClick,
  onExpiringSoonClick,
}: ActiveSessionsKpiStripProps) {
  const tenantTooltip = hasActiveFilters ? 'Totales del tenant' : undefined;

  return (
    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiTile
        label="totales tenant"
        value={totalTenant}
        onClick={onTotalClick}
        disabled={disabled}
        dimmed={hasActiveFilters}
        title={tenantTooltip}
      />
      <KpiTile
        label="Web"
        value={webCount}
        onClick={onWebClick}
        disabled={disabled}
        dimmed={hasActiveFilters}
        active={activeClientTypeFilter === 'web'}
        title={tenantTooltip}
      />
      <KpiTile
        label="Mobile"
        value={mobileCount}
        onClick={onMobileClick}
        disabled={disabled}
        dimmed={hasActiveFilters}
        active={activeClientTypeFilter === 'mobile'}
        title={tenantTooltip}
      />
      <button
        type="button"
        onClick={onExpiringSoonClick}
        disabled={disabled}
        className="flex items-center rounded-lg border border-border-base bg-surface px-4 py-3 text-left text-sm font-medium text-brand-primary shadow-sm transition-colors hover:bg-overlay disabled:cursor-not-allowed disabled:opacity-50"
      >
        Ver próximas a expirar →
      </button>
    </div>
  );
}
