import type { AlmacenCreate, AlmacenUpdate } from '../../types/inv.types';
import { bool, optId, str } from './inv-form-dirty.helpers';

export interface EditAlmacenFormSnapshot {
  nombre: string;
  tipo_almacen: string;
  es_almacen_principal: boolean;
  permite_ventas: boolean;
  permite_compras: boolean;
}

/** Create dirty — sin `codigo` (lo posee el Engine / CodigoField). */
function normalizeCreateFields(form: AlmacenCreate) {
  return {
    sucursal_id: optId(form.sucursal_id ?? undefined),
    nombre: str(form.nombre),
    tipo_almacen: str(form.tipo_almacen) || 'general',
    es_almacen_principal: bool(form.es_almacen_principal, false),
    permite_ventas: bool(form.permite_ventas, false),
    permite_compras: bool(form.permite_compras, true),
  };
}

function normalizeEditFields(form: AlmacenUpdate) {
  return {
    nombre: str(form.nombre),
    tipo_almacen: str(form.tipo_almacen) || 'general',
    es_almacen_principal: bool(form.es_almacen_principal, false),
    permite_ventas: bool(form.permite_ventas, false),
    permite_compras: bool(form.permite_compras, true),
  };
}

const CREATE_BASELINE = normalizeCreateFields({
  empresa_id: '',
  nombre: '',
  tipo_almacen: 'general',
  permite_compras: true,
  es_activo: true,
});

export function isCreateAlmacenDirty(form: AlmacenCreate): boolean {
  return JSON.stringify(normalizeCreateFields(form)) !== JSON.stringify(CREATE_BASELINE);
}

export function buildEditAlmacenFormSnapshot(form: AlmacenUpdate): EditAlmacenFormSnapshot {
  return normalizeEditFields(form);
}

export function isEditAlmacenDirty(
  form: AlmacenUpdate,
  snapshot: EditAlmacenFormSnapshot | null,
): boolean {
  if (!snapshot) return false;
  return JSON.stringify(buildEditAlmacenFormSnapshot(form)) !== JSON.stringify(snapshot);
}
