/**
 * Normalización de campos formato para dirty compare (B.1.1).
 */

import type { CfgSecuenciaFormatoForm } from '../types/cfg-list.types';
import {
  normalizeCfgGenerationPolicy,
  normalizeCfgPrefijoInput,
} from './cfg-secuencia-form.utils';

export function normalizeCfgFormatoForDirty(
  form: CfgSecuenciaFormatoForm,
): CfgSecuenciaFormatoForm {
  return {
    prefijo: normalizeCfgPrefijoInput(form.prefijo),
    separador: form.separador === '-' ? '-' : '',
    longitud_numero: form.longitud_numero,
    numero_inicial: form.numero_inicial,
    generation_policy: normalizeCfgGenerationPolicy(form.generation_policy),
  };
}
