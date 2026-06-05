import { Tooltip } from '@/shared/components/ui/Tooltip';
import type { Parametro, ParametroEfectivo } from '../types/org.types';
import { isParametroEfectivo } from '../utils/org-parametro-resolve';
import type { ParametroHybridTab } from '../hooks/parametro-query-keys';

export type ParametroBadgeKind = 'GLOBAL' | 'OVERRIDE' | 'EFECTIVO';

const BADGE_CLASS: Record<ParametroBadgeKind, string> = {
  GLOBAL:
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-subtle text-text-soft border border-border-base',
  OVERRIDE:
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-brand-primary/10 text-brand-primary',
  EFECTIVO:
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-success/10 text-success',
};

const PRECEDENCE_TOOLTIP =
  'El valor de la empresa activa (override) sobrescribe el parámetro global del tenant cuando ambos existen para el mismo código.';

function badgeKindForRow(
  row: Parametro | ParametroEfectivo,
  tab: ParametroHybridTab,
): ParametroBadgeKind {
  if (tab === 'effective') return 'EFECTIVO';
  if (tab === 'global' || !row.empresa_id) return 'GLOBAL';
  return 'OVERRIDE';
}

function resolvedSourceLabel(row: Parametro | ParametroEfectivo): string | null {
  if (!isParametroEfectivo(row)) return null;
  return row.alcance_efectivo === 'override' ? 'Resuelto vía override' : 'Resuelto vía global tenant';
}

interface OrgParametroAlcanceBadgeProps {
  row: Parametro | ParametroEfectivo;
  tab: ParametroHybridTab;
  showPrecedenceTooltip?: boolean;
}

export function OrgParametroAlcanceBadge({
  row,
  tab,
  showPrecedenceTooltip = tab === 'effective',
}: OrgParametroAlcanceBadgeProps) {
  const kind = badgeKindForRow(row, tab);
  const source = resolvedSourceLabel(row);

  const badge = <span className={BADGE_CLASS[kind]}>{kind}</span>;

  if (!showPrecedenceTooltip) {
    return (
      <span className="inline-flex flex-col gap-0.5 items-start">
        {badge}
        {source ? <span className="text-[10px] text-text-soft">{source}</span> : null}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      {badge}
      <Tooltip content={PRECEDENCE_TOOLTIP} />
      {source ? <span className="text-[10px] text-text-soft hidden sm:inline">{source}</span> : null}
    </span>
  );
}
