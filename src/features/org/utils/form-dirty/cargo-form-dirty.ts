import type { CargoCreate, CargoUpdate } from '../../types/org.types';
import { bool, numOrUndef, optId, str } from '../org-form-dirty.helpers';

export interface EditCargoFormSnapshot {
  codigo: string;
  nombre: string;
  descripcion: string;
  departamento_id?: string;
  nivel_jerarquico?: number;
  categoria: string;
  area_funcional: string;
  cargo_jefe_id?: string;
  rango_salarial_min: string;
  rango_salarial_max: string;
  moneda_salarial: string;
  nivel_educacion_minimo: string;
  experiencia_minima_meses?: number;
  requisitos_especificos: string;
  es_activo: boolean;
}

function salaryStr(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeCreateFields(form: CargoCreate) {
  return {
    codigo: str(form.codigo),
    nombre: str(form.nombre),
    descripcion: str(form.descripcion),
    departamento_id: optId(form.departamento_id ?? undefined),
    nivel_jerarquico: numOrUndef(form.nivel_jerarquico),
    categoria: str(form.categoria),
    area_funcional: str(form.area_funcional),
    cargo_jefe_id: optId(form.cargo_jefe_id ?? undefined),
    rango_salarial_min: salaryStr(form.rango_salarial_min),
    rango_salarial_max: salaryStr(form.rango_salarial_max),
    nivel_educacion_minimo: str(form.nivel_educacion_minimo),
    experiencia_minima_meses: numOrUndef(form.experiencia_minima_meses),
    requisitos_especificos: str(form.requisitos_especificos),
  };
}

/** No cuenta moneda_salarial auto-prefill al abrir crear. */
export function isCreateCargoDirty(form: CargoCreate): boolean {
  const f = normalizeCreateFields(form);
  return (
    f.codigo !== '' ||
    f.nombre !== '' ||
    f.descripcion !== '' ||
    f.departamento_id !== undefined ||
    f.nivel_jerarquico !== undefined ||
    f.categoria !== '' ||
    f.area_funcional !== '' ||
    f.cargo_jefe_id !== undefined ||
    f.rango_salarial_min !== '' ||
    f.rango_salarial_max !== '' ||
    f.nivel_educacion_minimo !== '' ||
    f.experiencia_minima_meses !== undefined ||
    f.requisitos_especificos !== ''
  );
}

export function buildEditCargoFormSnapshot(form: CargoUpdate): EditCargoFormSnapshot {
  return {
    codigo: str(form.codigo),
    nombre: str(form.nombre),
    descripcion: str(form.descripcion),
    departamento_id: optId(form.departamento_id ?? undefined),
    nivel_jerarquico: numOrUndef(form.nivel_jerarquico),
    categoria: str(form.categoria),
    area_funcional: str(form.area_funcional),
    cargo_jefe_id: optId(form.cargo_jefe_id ?? undefined),
    rango_salarial_min: salaryStr(form.rango_salarial_min),
    rango_salarial_max: salaryStr(form.rango_salarial_max),
    moneda_salarial: str(form.moneda_salarial),
    nivel_educacion_minimo: str(form.nivel_educacion_minimo),
    experiencia_minima_meses: numOrUndef(form.experiencia_minima_meses),
    requisitos_especificos: str(form.requisitos_especificos),
    es_activo: bool(form.es_activo, true),
  };
}

export function isEditCargoDirty(form: CargoUpdate, snapshot: EditCargoFormSnapshot | null): boolean {
  if (!snapshot) return false;
  return JSON.stringify(buildEditCargoFormSnapshot(form)) !== JSON.stringify(snapshot);
}
