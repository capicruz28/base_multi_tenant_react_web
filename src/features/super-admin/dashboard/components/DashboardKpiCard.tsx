import React from 'react';
import { Loader, type LucideIcon } from 'lucide-react';
import type { DashboardMetricState } from '../hooks/usePlatformDashboardP0';

export interface DashboardKpiCardProps {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  metric: DashboardMetricState;
}

const formatMetricValue = ({ value, isLoading, isError }: DashboardMetricState): React.ReactNode => {
  if (isLoading) {
    return <Loader className="h-5 w-5 animate-spin text-text-soft" aria-label="Cargando" />;
  }
  if (isError || value === null) {
    return <span className="text-text-soft">—</span>;
  }
  return value;
};

const DashboardKpiCard: React.FC<DashboardKpiCardProps> = ({
  icon: Icon,
  iconClassName = 'text-brand-primary',
  label,
  metric,
}) => (
  <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
    <div className="flex items-center">
      <Icon className={`h-6 w-6 flex-shrink-0 ${iconClassName}`} />
      <div className="ml-3 min-w-0">
        <p className="text-sm font-medium text-text-soft">{label}</p>
        <p className="text-xl font-semibold text-text-base">{formatMetricValue(metric)}</p>
      </div>
    </div>
  </div>
);

export default DashboardKpiCard;
