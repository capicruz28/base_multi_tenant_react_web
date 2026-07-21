/**
 * Badges de estado compuestos — fila / dialog CFG.
 */

import { Tooltip } from '@/shared/components/ui/Tooltip';

export interface CfgSecuenciaStatusBadgesProps {
  es_activo: boolean;
  config_locked: boolean;
  policy_drift: boolean;
  className?: string;
}

const badgeBase =
  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';

/**
 * Activa|Inactiva siempre; Bloqueada / Drift opcionales.
 */
export function CfgSecuenciaStatusBadges({
  es_activo,
  config_locked,
  policy_drift,
  className = '',
}: CfgSecuenciaStatusBadgesProps) {
  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1 ${className}`.trim()}
    >
      {es_activo ? (
        <span className={`${badgeBase} bg-success/10 text-success`}>Activa</span>
      ) : (
        <span className={`${badgeBase} bg-error/10 text-error`}>Inactiva</span>
      )}
      {config_locked ? (
        <span className={`${badgeBase} bg-warning/10 text-warning`}>
          Bloqueada
        </span>
      ) : null}
      {policy_drift ? (
        <Tooltip content="La política de generación difiere de la configuración esperada.">
          <span className={`${badgeBase} bg-info/10 text-info`}>Drift</span>
        </Tooltip>
      ) : null}
    </div>
  );
}
