import type { DepartamentoCreate, DepartamentoUpdate } from '../../types/org.types';
import { bool, optId, str } from '../org-form-dirty.helpers';

export interface EditDepartamentoFormSnapshot {
  codigo: string;
  nombre: string;
  descripcion: string;
  departamento_padre_id?: string;
  tipo_departamento: string;
  jefe_nombre: string;
  centro_costo_id?: string;
  sucursal_id?: string;
  es_activo: boolean;
}

function normalizeCreateFields(form: DepartamentoCreate) {
  return {
    codigo: str(form.codigo),
    nombre: str(form.nombre),
    descripcion: str(form.descripcion),
    departamento_padre_id: optId(form.departamento_padre_id ?? undefined),
    tipo_departamento: str(form.tipo_departamento),
    jefe_nombre: str(form.jefe_nombre),
    centro_costo_id: optId(form.centro_costo_id ?? undefined),
    sucursal_id: optId(form.sucursal_id ?? undefined),
  };
}

const CREATE_BASELINE = normalizeCreateFields({
  empresa_id: '',
  codigo: '',
  nombre: '',
  es_activo: true,
});

export function isCreateDepartamentoDirty(form: DepartamentoCreate): boolean {
  return JSON.stringify(normalizeCreateFields(form)) !== JSON.stringify(CREATE_BASELINE);
}

export function buildEditDepartamentoFormSnapshot(form: DepartamentoUpdate): EditDepartamentoFormSnapshot {
  return {
    codigo: str(form.codigo),
    nombre: str(form.nombre),
    descripcion: str(form.descripcion),
    departamento_padre_id: optId(form.departamento_padre_id ?? undefined),
    tipo_departamento: str(form.tipo_departamento),
    jefe_nombre: str(form.jefe_nombre),
    centro_costo_id: optId(form.centro_costo_id ?? undefined),
    sucursal_id: optId(form.sucursal_id ?? undefined),
    es_activo: bool(form.es_activo, true),
  };
}

export function isEditDepartamentoDirty(
  form: DepartamentoUpdate,
  snapshot: EditDepartamentoFormSnapshot | null,
): boolean {
  if (!snapshot) return false;
  return JSON.stringify(buildEditDepartamentoFormSnapshot(form)) !== JSON.stringify(snapshot);
}
