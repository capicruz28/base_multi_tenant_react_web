import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import type { DashboardAlertItem } from '../utils/dashboard-alert.rules';

export interface PlatformAlertBannerProps {
  alerts: DashboardAlertItem[];
  loading?: boolean;
}

const severityStyles: Record<DashboardAlertItem['severidad'], string> = {
  info: 'border-info/30 bg-info/5 text-text-base',
  warning: 'border-warning/30 bg-warning/5 text-text-base',
  critical: 'border-error/30 bg-error/5 text-text-base',
};

const iconStyles: Record<DashboardAlertItem['severidad'], string> = {
  info: 'text-info',
  warning: 'text-warning',
  critical: 'text-error',
};

const PlatformAlertBanner: React.FC<PlatformAlertBannerProps> = ({ alerts, loading = false }) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (loading || alerts.length === 0) {
    return null;
  }

  const visibleAlerts = alerts.filter((alert) => !dismissed.has(alert.codigo + alert.mensaje));

  if (visibleAlerts.length === 0) {
    return null;
  }

  const dismissAlert = (alert: DashboardAlertItem) => {
    setDismissed((prev) => new Set(prev).add(alert.codigo + alert.mensaje));
  };

  return (
    <div className="mb-6 space-y-2" role="region" aria-label="Alertas operativas">
      {visibleAlerts.map((alert) => (
        <div
          key={`${alert.codigo}-${alert.mensaje}`}
          className={`flex items-start gap-3 rounded-lg border p-3 shadow-sm ${severityStyles[alert.severidad]}`}
        >
          <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconStyles[alert.severidad]}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{alert.mensaje}</p>
            {alert.accion_url && (
              <Link
                to={alert.accion_url}
                className="mt-1 inline-block text-xs text-brand-primary hover:text-brand-primary-hover transition-colors"
              >
                Ver detalle
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismissAlert(alert)}
            className="flex-shrink-0 p-1 rounded-md text-text-soft hover:text-text-base hover:bg-overlay transition-colors"
            aria-label="Descartar alerta"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default PlatformAlertBanner;
