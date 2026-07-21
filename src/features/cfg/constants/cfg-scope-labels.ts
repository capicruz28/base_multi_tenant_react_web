/**
 * Labels UI para scope_type de secuencias CFG.
 */

import type { CfgScopeType } from '../types/cfg.types';

export const CFG_SCOPE_LABELS: Record<CfgScopeType, string> = {
  TENANT: 'Tenant',
  EMPRESA: 'Empresa',
  ALMACEN: 'Almacén',
  PUNTO_VENTA: 'Punto de venta',
};

export function getCfgScopeLabel(scope: string | null | undefined): string {
  if (!scope) return '—';
  const label = CFG_SCOPE_LABELS[scope as CfgScopeType];
  return label ?? '—';
}
