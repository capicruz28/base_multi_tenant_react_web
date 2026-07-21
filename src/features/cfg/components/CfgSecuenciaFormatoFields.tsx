/**
 * Campos editables de formato de secuencia CFG (controlled).
 */

import { Label } from '@/shared/components/ui/label';
import {
  iamInputClass,
  iamInputErrorClass,
} from '@/features/admin/components/iam/iam-form-classes';
import type {
  CfgSecuenciaFieldErrors,
  CfgSecuenciaFormatoForm,
} from '../types/cfg-list.types';
import type { CfgGenerationPolicy, CfgSeparador } from '../types/cfg.types';
import { CFG_GENERATION_POLICIES } from '../types/cfg.types';
import {
  formatCfgCodigoEjemplo,
  formatCfgGenerationPolicyLabel,
  formatCfgSeparadorLabel,
} from '../utils/cfg-display.utils';
import { normalizeCfgPrefijoInput } from '../utils/cfg-secuencia-form.utils';

const CFG_SEPARADOR_OPTIONS: readonly CfgSeparador[] = ['', '-'];

export interface CfgSecuenciaFormatoFieldsProps {
  value: CfgSecuenciaFormatoForm;
  onChange: (next: CfgSecuenciaFormatoForm) => void;
  errors: CfgSecuenciaFieldErrors;
  disabled: boolean;
  idPrefix: string;
}

export function CfgSecuenciaFormatoFields({
  value,
  onChange,
  errors,
  disabled,
  idPrefix,
}: CfgSecuenciaFormatoFieldsProps) {
  const prefijoId = `${idPrefix}-prefijo`;
  const separadorId = `${idPrefix}-separador`;
  const longitudId = `${idPrefix}-longitud`;
  const numeroInicialId = `${idPrefix}-numero-inicial`;
  const policyId = `${idPrefix}-generation-policy`;
  const ejemploId = `${idPrefix}-ejemplo`;

  const ejemplo = formatCfgCodigoEjemplo(value);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={prefijoId}>Prefijo</Label>
          <input
            id={prefijoId}
            type="text"
            value={value.prefijo}
            disabled={disabled}
            maxLength={10}
            autoComplete="off"
            aria-invalid={Boolean(errors.prefijo)}
            aria-describedby={errors.prefijo ? `${prefijoId}-error` : undefined}
            className={`${iamInputClass} uppercase ${errors.prefijo ? iamInputErrorClass : ''}`.trim()}
            onChange={(e) =>
              onChange({
                ...value,
                prefijo: normalizeCfgPrefijoInput(e.target.value),
              })
            }
          />
          {errors.prefijo ? (
            <p id={`${prefijoId}-error`} className="mt-1 text-xs text-error">
              {errors.prefijo}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor={separadorId}>Separador</Label>
          <select
            id={separadorId}
            value={value.separador}
            disabled={disabled}
            aria-invalid={Boolean(errors.separador)}
            aria-describedby={
              errors.separador ? `${separadorId}-error` : undefined
            }
            className={`${iamInputClass} ${errors.separador ? iamInputErrorClass : ''}`.trim()}
            onChange={(e) =>
              onChange({
                ...value,
                separador: e.target.value as CfgSeparador,
              })
            }
          >
            {CFG_SEPARADOR_OPTIONS.map((sep) => (
              <option key={sep || 'none'} value={sep}>
                {formatCfgSeparadorLabel(sep)}
              </option>
            ))}
          </select>
          {errors.separador ? (
            <p id={`${separadorId}-error`} className="mt-1 text-xs text-error">
              {errors.separador}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor={longitudId}>Longitud del número</Label>
          <input
            id={longitudId}
            type="number"
            min={1}
            step={1}
            value={value.longitud_numero}
            disabled={disabled}
            aria-invalid={Boolean(errors.longitud_numero)}
            aria-describedby={
              errors.longitud_numero ? `${longitudId}-error` : undefined
            }
            className={`${iamInputClass} ${errors.longitud_numero ? iamInputErrorClass : ''}`.trim()}
            onChange={(e) =>
              onChange({
                ...value,
                longitud_numero: Number(e.target.value),
              })
            }
          />
          {errors.longitud_numero ? (
            <p id={`${longitudId}-error`} className="mt-1 text-xs text-error">
              {errors.longitud_numero}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor={numeroInicialId}>Número inicial</Label>
          <input
            id={numeroInicialId}
            type="number"
            min={1}
            step={1}
            value={value.numero_inicial}
            disabled={disabled}
            aria-invalid={Boolean(errors.numero_inicial)}
            aria-describedby={
              errors.numero_inicial ? `${numeroInicialId}-error` : undefined
            }
            className={`${iamInputClass} ${errors.numero_inicial ? iamInputErrorClass : ''}`.trim()}
            onChange={(e) =>
              onChange({
                ...value,
                numero_inicial: Number(e.target.value),
              })
            }
          />
          {errors.numero_inicial ? (
            <p
              id={`${numeroInicialId}-error`}
              className="mt-1 text-xs text-error"
            >
              {errors.numero_inicial}
            </p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={policyId}>Política de generación</Label>
          <select
            id={policyId}
            value={value.generation_policy}
            disabled={disabled}
            aria-invalid={Boolean(errors.generation_policy)}
            aria-describedby={
              errors.generation_policy ? `${policyId}-error` : undefined
            }
            className={`${iamInputClass} ${errors.generation_policy ? iamInputErrorClass : ''}`.trim()}
            onChange={(e) =>
              onChange({
                ...value,
                generation_policy: e.target.value as CfgGenerationPolicy,
              })
            }
          >
            {CFG_GENERATION_POLICIES.map((policy) => (
              <option key={policy} value={policy}>
                {formatCfgGenerationPolicyLabel(policy)}
              </option>
            ))}
          </select>
          {errors.generation_policy ? (
            <p id={`${policyId}-error`} className="mt-1 text-xs text-error">
              {errors.generation_policy}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className="rounded-md border border-border-base bg-subtle px-3 py-2"
        aria-live="polite"
      >
        <p className="text-xs text-text-soft">Ejemplo</p>
        <p
          id={ejemploId}
          className="mt-0.5 font-mono text-sm text-text-base tracking-wide"
        >
          {ejemplo || '—'}
        </p>
      </div>
    </div>
  );
}
