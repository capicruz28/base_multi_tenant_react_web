import type { ModuloV2, ModuloV2Create, ModuloV2Update } from '@/features/modulos/types/modulo-v2.types';
import { bool, str } from '@/features/org/utils/org-form-dirty.helpers';

/** Baseline único para create — fuente de verdad para reset y dirty. */
export const CREATE_MODULO_DEFAULT: ModuloV2Create = {
  codigo: '',
  nombre: '',
  descripcion: '',
  icono: 'Package',
  color: '#6366f1',
  categoria: '',
  orden: 0,
  es_activo: true,
};

export type ModuloFormNormalized = ReturnType<typeof normalizeModuloFormFields>;

function optNullable(value: string | null | undefined): string | null {
  const s = str(value);
  return s === '' ? null : s;
}

function normalizeColor(value: string | null | undefined): string {
  const s = str(value).toLowerCase();
  return s || '#6366f1';
}

export function normalizeModuloFormFields(form: ModuloV2Create | ModuloV2Update) {
  return {
    codigo: str(form.codigo).toUpperCase(),
    nombre: str(form.nombre),
    descripcion: optNullable(form.descripcion),
    icono: str(form.icono) || 'Package',
    color: normalizeColor(form.color),
    categoria: str(form.categoria),
    orden: typeof form.orden === 'number' && !Number.isNaN(form.orden) ? Math.max(0, form.orden) : 0,
    es_activo: bool(form.es_activo, true),
  };
}

function withoutEsActivo<T extends { es_activo: boolean }>(
  value: T,
): Omit<T, 'es_activo'> {
  const rest = { ...value };
  delete (rest as Partial<T>).es_activo;
  return rest as Omit<T, 'es_activo'>;
}

const CREATE_BASELINE = withoutEsActivo(normalizeModuloFormFields(CREATE_MODULO_DEFAULT));

export function isCreateModuloDirty(form: ModuloV2Create): boolean {
  const current = withoutEsActivo(normalizeModuloFormFields(form));
  return JSON.stringify(current) !== JSON.stringify(CREATE_BASELINE);
}

export function buildEditModuloFormSnapshot(modulo: ModuloV2): ModuloFormNormalized {
  return normalizeModuloFormFields({
    codigo: modulo.codigo,
    nombre: modulo.nombre,
    descripcion: modulo.descripcion,
    icono: modulo.icono,
    color: modulo.color,
    categoria: modulo.categoria,
    orden: modulo.orden,
    es_activo: modulo.es_activo,
  });
}

export function isEditModuloDirty(
  form: ModuloV2Update,
  snapshot: ModuloFormNormalized | null,
): boolean {
  if (!snapshot) return false;
  return JSON.stringify(normalizeModuloFormFields(form)) !== JSON.stringify(snapshot);
}
