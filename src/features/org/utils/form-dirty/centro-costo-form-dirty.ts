import type { CentroCostoCreate, CentroCostoUpdate } from '../../types/org.types';
import { bool, numOrUndef, optId, str } from '../org-form-dirty.helpers';

export interface EditCentroCostoFormSnapshot {
  codigo: string;
  nombre: string;
  tipo_centro_costo: string;
  descripcion: string;
  centro_costo_padre_id?: string;
  nivel?: number;
  categoria: string;
  tiene_presupuesto: boolean;
  permite_imputacion_directa: boolean;
  responsable_nombre: string;
  fecha_inicio_vigencia: string;
  fecha_fin_vigencia: string;
  es_activo: boolean;
}

function normalizeCreateFields(form: CentroCostoCreate) {
  return {
    codigo: str(form.codigo),
    nombre: str(form.nombre),
    tipo_centro_costo: str(form.tipo_centro_costo) || 'operativo',
    descripcion: str(form.descripcion),
    centro_costo_padre_id: optId(form.centro_costo_padre_id ?? undefined),
    nivel: numOrUndef(form.nivel),
    categoria: str(form.categoria),
    tiene_presupuesto: bool(form.tiene_presupuesto, false),
    permite_imputacion_directa: bool(form.permite_imputacion_directa, true),
    responsable_nombre: str(form.responsable_nombre),
    fecha_inicio_vigencia: str(form.fecha_inicio_vigencia),
    fecha_fin_vigencia: str(form.fecha_fin_vigencia),
  };
}

const CREATE_BASELINE = normalizeCreateFields({
  empresa_id: '',
  codigo: '',
  nombre: '',
  tipo_centro_costo: 'operativo',
  descripcion: '',
  tiene_presupuesto: false,
  permite_imputacion_directa: true,
  responsable_nombre: '',
  es_activo: true,
});

export function isCreateCentroCostoDirty(form: CentroCostoCreate): boolean {
  const current = normalizeCreateFields(form);
  return JSON.stringify(current) !== JSON.stringify(CREATE_BASELINE);
}

export function buildEditCentroCostoFormSnapshot(form: CentroCostoUpdate): EditCentroCostoFormSnapshot {
  return {
    codigo: str(form.codigo),
    nombre: str(form.nombre),
    tipo_centro_costo: str(form.tipo_centro_costo),
    descripcion: str(form.descripcion),
    centro_costo_padre_id: optId(form.centro_costo_padre_id ?? undefined),
    nivel: numOrUndef(form.nivel),
    categoria: str(form.categoria),
    tiene_presupuesto: bool(form.tiene_presupuesto, false),
    permite_imputacion_directa: bool(form.permite_imputacion_directa, true),
    responsable_nombre: str(form.responsable_nombre),
    fecha_inicio_vigencia: str(form.fecha_inicio_vigencia),
    fecha_fin_vigencia: str(form.fecha_fin_vigencia),
    es_activo: bool(form.es_activo, true),
  };
}

export function isEditCentroCostoDirty(
  form: CentroCostoUpdate,
  snapshot: EditCentroCostoFormSnapshot | null,
): boolean {
  if (!snapshot) return false;
  return JSON.stringify(buildEditCentroCostoFormSnapshot(form)) !== JSON.stringify(snapshot);
}
