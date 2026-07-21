/**
 * Formateo de labels CFG — nunca mostrar UUID en UI (E-ME4).
 */

import { getCfgScopeLabel } from '../constants/cfg-scope-labels';
import type { CfgGenerationPolicy, CfgSeparador } from '../types/cfg.types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CFG_GENERATION_POLICY_LABELS: Record<CfgGenerationPolicy, string> = {
  AUTO_REQUIRED: 'Automático obligatorio',
  AUTO_DEFAULT: 'Automático sugerido',
  MANUAL_ONLY: 'Solo manual',
};

/** Label de negocio; el value del select sigue siendo el enum técnico. */
export function formatCfgGenerationPolicyLabel(
  policy: CfgGenerationPolicy | string,
): string {
  if (policy in CFG_GENERATION_POLICY_LABELS) {
    return CFG_GENERATION_POLICY_LABELS[policy as CfgGenerationPolicy];
  }
  return policy;
}

export function formatCfgSeparadorLabel(separador: CfgSeparador): string {
  return separador === '-' ? 'Guion (-)' : 'Sin separador';
}

/**
 * Ejemplo visual local de formato (no llama API ni consume numeración).
 * p.ej. prefijo ALM, separador -, longitud 4, inicial 1 → ALM-0001
 */
export function formatCfgCodigoEjemplo(params: {
  prefijo: string;
  separador: CfgSeparador | string;
  longitud_numero: number;
  numero_inicial: number;
}): string {
  const prefijo = (params.prefijo ?? '').trim();
  const sep = params.separador === '-' ? '-' : '';
  const len =
    Number.isInteger(params.longitud_numero) && params.longitud_numero >= 1
      ? params.longitud_numero
      : 1;
  const num = Number.isFinite(params.numero_inicial)
    ? Math.max(0, Math.floor(params.numero_inicial))
    : 0;
  return `${prefijo}${sep}${String(num).padStart(len, '0')}`;
}

function looksLikeUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function formatCfgScopeType(scope: string | null | undefined): string {
  return getCfgScopeLabel(scope);
}

/**
 * Nombre enrich de scope; si falta o es UUID → "—".
 */
export function formatCfgScopeRef(
  nombre: string | null | undefined,
  idFallback?: string | null,
): string {
  const name = (nombre ?? '').trim();
  if (name && !looksLikeUuid(name)) {
    return name;
  }
  const id = (idFallback ?? '').trim();
  if (id && looksLikeUuid(id)) {
    return '—';
  }
  if (id && !looksLikeUuid(id)) {
    return id;
  }
  return '—';
}

export function formatCfgModulo(modulo: string | null | undefined): string {
  const value = (modulo ?? '').trim();
  return value === '' ? '—' : value;
}
