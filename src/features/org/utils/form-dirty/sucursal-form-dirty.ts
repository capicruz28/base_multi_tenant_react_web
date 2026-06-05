import type { SucursalCreate, SucursalUpdate } from '../../types/org.types';
import { bool, optId, str } from '../org-form-dirty.helpers';

export interface OrgGeoSelectionSnapshot {
  paisId: string;
  departamentoId: string;
  provinciaId: string;
  distritoId: string;
}

export interface CreateSucursalFormContext {
  form: SucursalCreate;
  geo: OrgGeoSelectionSnapshot;
}

export interface EditSucursalFormContext {
  form: SucursalUpdate;
  geo: OrgGeoSelectionSnapshot;
}

export interface EditSucursalFormSnapshot {
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_sucursal: string;
  direccion: string;
  referencia: string;
  pais_id?: string;
  departamento_id?: string;
  provincia_id?: string;
  distrito_id?: string;
  codigo_postal: string;
  ubigeo: string;
  telefono: string;
  email: string;
  responsable_nombre: string;
  centro_costo_id?: string;
  zona_horaria: string;
  horario_atencion: string;
  fecha_apertura: string;
  fecha_cierre: string;
  es_casa_matriz: boolean;
  es_punto_venta: boolean;
  es_almacen: boolean;
  es_planta_produccion: boolean;
  es_activo: boolean;
  geo: OrgGeoSelectionSnapshot;
}

function emptyGeo(): OrgGeoSelectionSnapshot {
  return { paisId: '', departamentoId: '', provinciaId: '', distritoId: '' };
}

function normalizeCreateFields(form: SucursalCreate, geo: OrgGeoSelectionSnapshot) {
  return {
    codigo: str(form.codigo),
    nombre: str(form.nombre),
    descripcion: str(form.descripcion),
    tipo_sucursal: str(form.tipo_sucursal) || 'sede',
    direccion: str(form.direccion),
    referencia: str(form.referencia),
    pais_id: optId(form.pais_id ?? undefined),
    departamento_id: optId(form.departamento_id ?? undefined),
    provincia_id: optId(form.provincia_id ?? undefined),
    distrito_id: optId(form.distrito_id ?? undefined),
    codigo_postal: str(form.codigo_postal),
    ubigeo: str(form.ubigeo),
    telefono: str(form.telefono),
    email: str(form.email),
    responsable_nombre: str(form.responsable_nombre),
    centro_costo_id: optId(form.centro_costo_id ?? undefined),
    zona_horaria: str(form.zona_horaria),
    horario_atencion: str(form.horario_atencion),
    fecha_apertura: str(form.fecha_apertura),
    fecha_cierre: str(form.fecha_cierre),
    es_casa_matriz: bool(form.es_casa_matriz, false),
    es_punto_venta: bool(form.es_punto_venta, false),
    es_almacen: bool(form.es_almacen, false),
    es_planta_produccion: bool(form.es_planta_produccion, false),
    geo,
  };
}

const CREATE_BASELINE = normalizeCreateFields(
  {
    empresa_id: '',
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo_sucursal: 'sede',
    direccion: '',
    referencia: '',
    telefono: '',
    email: '',
    responsable_nombre: '',
    zona_horaria: '',
    horario_atencion: '',
    es_casa_matriz: false,
    es_punto_venta: false,
    es_almacen: false,
    es_planta_produccion: false,
    es_activo: true,
  },
  emptyGeo(),
);

export function isCreateSucursalDirty(ctx: CreateSucursalFormContext): boolean {
  return JSON.stringify(normalizeCreateFields(ctx.form, ctx.geo)) !== JSON.stringify(CREATE_BASELINE);
}

export function buildEditSucursalFormSnapshot(ctx: EditSucursalFormContext): EditSucursalFormSnapshot {
  const { form, geo } = ctx;
  return {
    codigo: str(form.codigo),
    nombre: str(form.nombre),
    descripcion: str(form.descripcion),
    tipo_sucursal: str(form.tipo_sucursal),
    direccion: str(form.direccion),
    referencia: str(form.referencia),
    pais_id: optId(form.pais_id ?? undefined),
    departamento_id: optId(form.departamento_id ?? undefined),
    provincia_id: optId(form.provincia_id ?? undefined),
    distrito_id: optId(form.distrito_id ?? undefined),
    codigo_postal: str(form.codigo_postal),
    ubigeo: str(form.ubigeo),
    telefono: str(form.telefono),
    email: str(form.email),
    responsable_nombre: str(form.responsable_nombre),
    centro_costo_id: optId(form.centro_costo_id ?? undefined),
    zona_horaria: str(form.zona_horaria),
    horario_atencion: str(form.horario_atencion),
    fecha_apertura: str(form.fecha_apertura),
    fecha_cierre: str(form.fecha_cierre),
    es_casa_matriz: bool(form.es_casa_matriz, false),
    es_punto_venta: bool(form.es_punto_venta, false),
    es_almacen: bool(form.es_almacen, false),
    es_planta_produccion: bool(form.es_planta_produccion, false),
    es_activo: bool(form.es_activo, true),
    geo,
  };
}

export function isEditSucursalDirty(
  ctx: EditSucursalFormContext,
  snapshot: EditSucursalFormSnapshot | null,
): boolean {
  if (!snapshot) return false;
  return JSON.stringify(buildEditSucursalFormSnapshot(ctx)) !== JSON.stringify(snapshot);
}

export function geoFromIds(
  paisId: string,
  departamentoId: string,
  provinciaId: string,
  distritoId: string,
): OrgGeoSelectionSnapshot {
  return { paisId, departamentoId, provinciaId, distritoId };
}
