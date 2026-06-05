import type { CategoriaCreate, CategoriaUpdate } from '../../types/inv.types';
import { optId, str } from './inv-form-dirty.helpers';

export interface EditCategoriaFormSnapshot {
  codigo: string;
  nombre: string;
  categoria_padre_id?: string;
  metodo_costeo_defecto: string;
  cuenta_contable_inventario: string;
  cuenta_contable_costo_venta: string;
}

function normalizeCreateFields(form: CategoriaCreate) {
  return {
    codigo: str(form.codigo),
    nombre: str(form.nombre),
    categoria_padre_id: optId(form.categoria_padre_id ?? undefined),
    metodo_costeo_defecto: str(form.metodo_costeo_defecto) || 'promedio',
    cuenta_contable_inventario: str(form.cuenta_contable_inventario),
    cuenta_contable_costo_venta: str(form.cuenta_contable_costo_venta),
  };
}

const CREATE_BASELINE = normalizeCreateFields({
  empresa_id: '',
  codigo: '',
  nombre: '',
  metodo_costeo_defecto: 'promedio',
  es_activo: true,
});

export function isCreateCategoriaDirty(form: CategoriaCreate): boolean {
  return JSON.stringify(normalizeCreateFields(form)) !== JSON.stringify(CREATE_BASELINE);
}

export function buildEditCategoriaFormSnapshot(form: CategoriaUpdate): EditCategoriaFormSnapshot {
  return {
    codigo: str(form.codigo),
    nombre: str(form.nombre),
    categoria_padre_id: optId(form.categoria_padre_id ?? undefined),
    metodo_costeo_defecto: str(form.metodo_costeo_defecto) || 'promedio',
    cuenta_contable_inventario: str(form.cuenta_contable_inventario),
    cuenta_contable_costo_venta: str(form.cuenta_contable_costo_venta),
  };
}

export function isEditCategoriaDirty(
  form: CategoriaUpdate,
  snapshot: EditCategoriaFormSnapshot | null,
): boolean {
  if (!snapshot) return false;
  return JSON.stringify(buildEditCategoriaFormSnapshot(form)) !== JSON.stringify(snapshot);
}
