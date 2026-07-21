/**
 * Validación local y payload PATCH de formato CFG.
 */

import type {
  CfgGenerationPolicy,
  CfgSecuenciaUpdate,
} from '../types/cfg.types';
import { CFG_GENERATION_POLICIES } from '../types/cfg.types';
import type {
  CfgSecuenciaFieldErrors,
  CfgSecuenciaFormatoForm,
} from '../types/cfg-list.types';

const PREFIJO_MAX = 10;
const PREFIJO_ALNUM_RE = /^[A-Z0-9]+$/;

export function normalizeCfgPrefijoInput(value: string): string {
  return value.trim().toUpperCase();
}

export function isCfgGenerationPolicy(
  value: string,
): value is CfgGenerationPolicy {
  return (CFG_GENERATION_POLICIES as readonly string[]).includes(value);
}

/** Normaliza policy de lectura API a valor editable del form. */
export function normalizeCfgGenerationPolicy(
  value: string | null | undefined,
): CfgGenerationPolicy {
  if (value && isCfgGenerationPolicy(value)) {
    return value;
  }
  return 'AUTO_DEFAULT';
}

export function validateCfgSecuenciaFormato(
  form: CfgSecuenciaFormatoForm,
): CfgSecuenciaFieldErrors {
  const errors: CfgSecuenciaFieldErrors = {};
  const prefijo = normalizeCfgPrefijoInput(form.prefijo);

  if (!prefijo) {
    errors.prefijo = 'El prefijo es obligatorio.';
  } else if (prefijo.length > PREFIJO_MAX) {
    errors.prefijo =
      'El prefijo no es válido. Use hasta 10 caracteres alfanuméricos.';
  } else if (!PREFIJO_ALNUM_RE.test(prefijo)) {
    errors.prefijo =
      'El prefijo no es válido. Use hasta 10 caracteres alfanuméricos.';
  }

  if (form.separador !== '' && form.separador !== '-') {
    errors.separador = "El separador solo puede estar vacío o ser '-'.";
  }

  if (
    !Number.isInteger(form.longitud_numero) ||
    form.longitud_numero < 1
  ) {
    errors.longitud_numero =
      'La longitud del número debe ser un entero mayor o igual a 1.';
  }

  if (
    !Number.isInteger(form.numero_inicial) ||
    form.numero_inicial < 1
  ) {
    errors.numero_inicial =
      'El número inicial debe ser mayor o igual a 1.';
  }

  if (!isCfgGenerationPolicy(form.generation_policy)) {
    errors.generation_policy = 'Seleccione una política de generación válida.';
  }

  return errors;
}

export function buildCfgSecuenciaUpdatePayload(
  baseline: CfgSecuenciaFormatoForm,
  current: CfgSecuenciaFormatoForm,
): CfgSecuenciaUpdate {
  const payload: CfgSecuenciaUpdate = {};

  const basePrefijo = normalizeCfgPrefijoInput(baseline.prefijo);
  const currPrefijo = normalizeCfgPrefijoInput(current.prefijo);
  if (currPrefijo !== basePrefijo) {
    payload.prefijo = currPrefijo;
  }

  if (current.separador !== baseline.separador) {
    payload.separador = current.separador;
  }

  if (current.longitud_numero !== baseline.longitud_numero) {
    payload.longitud_numero = current.longitud_numero;
  }

  if (current.numero_inicial !== baseline.numero_inicial) {
    payload.numero_inicial = current.numero_inicial;
  }

  if (current.generation_policy !== baseline.generation_policy) {
    payload.generation_policy = current.generation_policy;
  }

  return payload;
}

export function isCfgUpdatePayloadEmpty(payload: CfgSecuenciaUpdate): boolean {
  return (
    payload.prefijo === undefined &&
    payload.separador === undefined &&
    payload.longitud_numero === undefined &&
    payload.numero_inicial === undefined &&
    payload.generation_policy === undefined
  );
}
