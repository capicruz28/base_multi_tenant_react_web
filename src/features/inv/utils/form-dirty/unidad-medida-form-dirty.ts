import type { UnidadMedidaCreate, UnidadMedidaUpdate } from '../../types/inv.types';
import { bool, str } from './inv-form-dirty.helpers';

export interface EditUnidadMedidaFormSnapshot {
  codigo: string;
  nombre: string;
  simbolo: string;
  tipo_unidad: string;
  es_unidad_base: boolean;
}

function normalizeCreateFields(form: UnidadMedidaCreate) {
  return {
    codigo: str(form.codigo),
    nombre: str(form.nombre),
    simbolo: str(form.simbolo),
    tipo_unidad: str(form.tipo_unidad) || 'cantidad',
    es_unidad_base: bool(form.es_unidad_base, false),
  };
}

const CREATE_BASELINE = normalizeCreateFields({
  empresa_id: '',
  codigo: '',
  nombre: '',
  tipo_unidad: 'cantidad',
  es_unidad_base: false,
  decimales_permitidos: 2,
  es_activo: true,
});

export function isCreateUnidadMedidaDirty(form: UnidadMedidaCreate): boolean {
  return JSON.stringify(normalizeCreateFields(form)) !== JSON.stringify(CREATE_BASELINE);
}

export function buildEditUnidadMedidaFormSnapshot(form: UnidadMedidaUpdate): EditUnidadMedidaFormSnapshot {
  return {
    codigo: str(form.codigo),
    nombre: str(form.nombre),
    simbolo: str(form.simbolo),
    tipo_unidad: str(form.tipo_unidad),
    es_unidad_base: bool(form.es_unidad_base, false),
  };
}

export function isEditUnidadMedidaDirty(
  form: UnidadMedidaUpdate,
  snapshot: EditUnidadMedidaFormSnapshot | null,
): boolean {
  if (!snapshot) return false;
  return JSON.stringify(buildEditUnidadMedidaFormSnapshot(form)) !== JSON.stringify(snapshot);
}
