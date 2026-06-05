import type { ParametroAlcanceKind } from '../../components/OrgParametroAlcanceField';
import type { ParametroCreate, ParametroUpdate } from '../../types/org.types';
import { bool, numOrUndef, str } from '../org-form-dirty.helpers';

export interface CreateParametroFormContext {
  form: ParametroCreate;
  createAlcance: ParametroAlcanceKind;
}

export interface EditParametroFormContext {
  form: ParametroUpdate;
  valorJsonStr: string;
  tipoDato: string;
}

export interface EditParametroFormSnapshot {
  codigo_parametro: string;
  nombre_parametro: string;
  tipo_dato: string;
  descripcion: string;
  valor_texto: string;
  valor_numerico?: number;
  valor_booleano: boolean;
  valor_fecha: string;
  valor_json: string;
  valor_defecto: string;
  es_editable: boolean;
  es_obligatorio: boolean;
  es_activo: boolean;
}

function jsonStable(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function normalizeCreateContext({ form, createAlcance }: CreateParametroFormContext) {
  return {
    modulo_codigo: str(form.modulo_codigo),
    codigo_parametro: str(form.codigo_parametro),
    nombre_parametro: str(form.nombre_parametro),
    tipo_dato: form.tipo_dato,
    descripcion: str(form.descripcion),
    valor_texto: str(form.valor_texto),
    valor_numerico: numOrUndef(form.valor_numerico ?? undefined),
    valor_booleano: bool(form.valor_booleano, false),
    valor_fecha: str(form.valor_fecha),
    valor_json: jsonStable(form.valor_json),
    valor_defecto: str(form.valor_defecto),
    es_editable: bool(form.es_editable, true),
    es_obligatorio: bool(form.es_obligatorio, false),
    createAlcance,
  };
}

const CREATE_BASELINE = normalizeCreateContext({
  form: {
    modulo_codigo: 'ORG',
    codigo_parametro: '',
    nombre_parametro: '',
    tipo_dato: 'texto',
    es_editable: true,
    es_obligatorio: false,
    es_activo: true,
  },
  createAlcance: 'override',
});

export function isCreateParametroDirty(ctx: CreateParametroFormContext): boolean {
  const current = normalizeCreateContext(ctx);
  const baseline = {
    ...CREATE_BASELINE,
    modulo_codigo: str(ctx.form.modulo_codigo) || CREATE_BASELINE.modulo_codigo,
    createAlcance: ctx.createAlcance,
  };
  return JSON.stringify(current) !== JSON.stringify(baseline);
}

export function buildEditParametroFormSnapshot(ctx: EditParametroFormContext): EditParametroFormSnapshot {
  const { form, valorJsonStr, tipoDato } = ctx;
  const valorJson =
    tipoDato === 'json' ? valorJsonStr.trim() : jsonStable(form.valor_json);
  return {
    codigo_parametro: str(form.codigo_parametro),
    nombre_parametro: str(form.nombre_parametro),
    tipo_dato: str(form.tipo_dato),
    descripcion: str(form.descripcion),
    valor_texto: str(form.valor_texto),
    valor_numerico: numOrUndef(form.valor_numerico ?? undefined),
    valor_booleano: bool(form.valor_booleano, false),
    valor_fecha: str(form.valor_fecha),
    valor_json: valorJson,
    valor_defecto: str(form.valor_defecto),
    es_editable: bool(form.es_editable, true),
    es_obligatorio: bool(form.es_obligatorio, false),
    es_activo: bool(form.es_activo, true),
  };
}

export function isEditParametroDirty(
  ctx: EditParametroFormContext,
  snapshot: EditParametroFormSnapshot | null,
): boolean {
  if (!snapshot) return false;
  return JSON.stringify(buildEditParametroFormSnapshot(ctx)) !== JSON.stringify(snapshot);
}
