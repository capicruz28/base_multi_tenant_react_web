import { Label } from '@/shared/components/ui/label';
import { useOrgSessionScope } from '../hooks/useOrgSessionScope';
import { useOrgCanManageGlobalParametros } from '../hooks/useOrgCanManageGlobalParametros';
import type { Parametro } from '../types/org.types';

export type ParametroAlcanceKind = 'global' | 'override';

const inputClass =
  'mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm';

interface OrgParametroAlcanceFieldProps {
  mode: 'create' | 'edit';
  value: ParametroAlcanceKind | null;
  onChange?: (kind: ParametroAlcanceKind) => void;
  /** En edición: fila existente (alcance inmutable). */
  row?: Pick<Parametro, 'empresa_id'> | null;
  /** Pestaña activa fija el alcance en creación (sin selector cross-company). */
  forceAlcance?: ParametroAlcanceKind;
}

function isGlobalParam(row: Pick<Parametro, 'empresa_id'> | null | undefined): boolean {
  return !row?.empresa_id;
}

/**
 * Alcance híbrido: global tenant vs override empresa activa (sin selector cross-company).
 */
export function OrgParametroAlcanceField({
  mode,
  value,
  onChange,
  row,
  forceAlcance,
}: OrgParametroAlcanceFieldProps) {
  const { activeEmpresaLabel, scopeEmpresaId } = useOrgSessionScope();
  const canCreateGlobal = useOrgCanManageGlobalParametros();

  if (mode === 'edit' && row) {
    const global = isGlobalParam(row);
    return (
      <div>
        <Label>Alcance</Label>
        <input
          type="text"
          readOnly
          value={global ? 'Global (tenant)' : `Override — ${activeEmpresaLabel ?? 'empresa activa'}`}
          className={`${inputClass} bg-subtle cursor-default`}
        />
        <p className="mt-1 text-xs text-text-soft">
          El alcance de un parámetro existente no se puede cambiar entre global y otra empresa.
        </p>
      </div>
    );
  }

  if (forceAlcance) {
    const label =
      forceAlcance === 'global'
        ? 'Global (todo el tenant)'
        : `Override — ${activeEmpresaLabel ?? 'empresa activa'}`;
    return (
      <div>
        <Label>Alcance</Label>
        <input type="text" readOnly value={label} className={`${inputClass} bg-subtle cursor-default`} />
        {scopeEmpresaId && forceAlcance === 'override' ? (
          <input type="hidden" value={scopeEmpresaId} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Alcance del parámetro *</Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name="param_alcance"
            checked={value === 'global'}
            disabled={!canCreateGlobal}
            onChange={() => onChange?.('global')}
          />
          Global (todo el tenant)
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name="param_alcance"
            checked={value === 'override'}
            onChange={() => onChange?.('override')}
            disabled={!scopeEmpresaId}
          />
          Override — {activeEmpresaLabel ?? 'empresa activa'}
        </label>
      </div>
      {!canCreateGlobal ? (
        <p className="text-xs text-text-soft">
          Solo administradores de tenant pueden crear parámetros globales. Puede crear overrides para la
          empresa activa.
        </p>
      ) : null}
      {value === 'override' && scopeEmpresaId ? (
        <input type="hidden" value={scopeEmpresaId} />
      ) : null}
    </div>
  );
}
