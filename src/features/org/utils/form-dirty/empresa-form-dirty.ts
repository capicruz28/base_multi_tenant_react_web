import type { EmpresaCreate, EmpresaUpdate } from '../../types/org.types';
import type { OrgGeoSelectionSnapshot } from './sucursal-form-dirty';
import { bool, numOrUndef, optId, str } from '../org-form-dirty.helpers';

export interface CreateEmpresaFormContext {
  form: EmpresaCreate;
  geo: OrgGeoSelectionSnapshot;
}

export interface EditEmpresaFormContext {
  form: EmpresaUpdate;
  geo: OrgGeoSelectionSnapshot;
}

export interface EditEmpresaFormSnapshot {
  codigo_empresa: string;
  razon_social: string;
  ruc: string;
  nombre_comercial: string;
  tipo_documento_tributario: string;
  tipo_empresa: string;
  direccion_fiscal: string;
  pais_id?: string;
  departamento_id?: string;
  provincia_id?: string;
  distrito_id?: string;
  codigo_postal: string;
  ubigeo: string;
  telefono_principal: string;
  telefono_secundario: string;
  email_principal: string;
  email_facturacion: string;
  sitio_web: string;
  moneda_base_id?: string;
  maneja_multimoneda: boolean;
  zona_horaria: string;
  idioma_sistema: string;
  formato_fecha: string;
  separador_miles: string;
  separador_decimales: string;
  decimales_moneda?: number;
  actividad_economica: string;
  codigo_ciiu: string;
  rubro: string;
  representante_legal_nombre: string;
  representante_legal_dni: string;
  representante_legal_cargo: string;
  logo_url: string;
  logo_secundario_url: string;
  favicon_url: string;
  fecha_constitucion: string;
  fecha_inicio_operaciones: string;
  es_activo: boolean;
  geo: OrgGeoSelectionSnapshot;
}

export const EMPRESA_CREATE_BASELINE: EmpresaCreate = {
  codigo_empresa: '',
  razon_social: '',
  ruc: '',
  nombre_comercial: '',
  tipo_documento_tributario: 'RUC',
  tipo_empresa: '',
  direccion_fiscal: '',
  pais_id: undefined,
  departamento_id: undefined,
  provincia_id: undefined,
  distrito_id: undefined,
  codigo_postal: '',
  ubigeo: '',
  telefono_principal: '',
  telefono_secundario: '',
  email_principal: '',
  email_facturacion: '',
  sitio_web: '',
  moneda_base_id: undefined,
  maneja_multimoneda: false,
  zona_horaria: 'America/Lima',
  idioma_sistema: 'es',
  formato_fecha: 'DD/MM/YYYY',
  separador_miles: ',',
  separador_decimales: '.',
  decimales_moneda: 2,
  actividad_economica: '',
  codigo_ciiu: '',
  rubro: '',
  representante_legal_nombre: '',
  representante_legal_dni: '',
  representante_legal_cargo: '',
  logo_url: '',
  logo_secundario_url: '',
  favicon_url: '',
  fecha_constitucion: undefined,
  fecha_inicio_operaciones: undefined,
  es_activo: true,
};

function normalizeEmpresaFields(form: EmpresaCreate | EmpresaUpdate, geo: OrgGeoSelectionSnapshot) {
  return {
    codigo_empresa: str(form.codigo_empresa),
    razon_social: str(form.razon_social),
    ruc: str(form.ruc),
    nombre_comercial: str(form.nombre_comercial),
    tipo_documento_tributario: str(form.tipo_documento_tributario) || 'RUC',
    tipo_empresa: str(form.tipo_empresa),
    direccion_fiscal: str(form.direccion_fiscal),
    pais_id: optId(form.pais_id ?? undefined),
    departamento_id: optId(form.departamento_id ?? undefined),
    provincia_id: optId(form.provincia_id ?? undefined),
    distrito_id: optId(form.distrito_id ?? undefined),
    codigo_postal: str(form.codigo_postal),
    ubigeo: str(form.ubigeo),
    telefono_principal: str(form.telefono_principal),
    telefono_secundario: str(form.telefono_secundario),
    email_principal: str(form.email_principal),
    email_facturacion: str(form.email_facturacion),
    sitio_web: str(form.sitio_web),
    moneda_base_id: optId(form.moneda_base_id ?? undefined),
    maneja_multimoneda: bool(form.maneja_multimoneda, false),
    zona_horaria: str(form.zona_horaria) || 'America/Lima',
    idioma_sistema: str(form.idioma_sistema) || 'es',
    formato_fecha: str(form.formato_fecha) || 'DD/MM/YYYY',
    separador_miles: str(form.separador_miles) || ',',
    separador_decimales: str(form.separador_decimales) || '.',
    decimales_moneda: numOrUndef(form.decimales_moneda) ?? 2,
    actividad_economica: str(form.actividad_economica),
    codigo_ciiu: str(form.codigo_ciiu),
    rubro: str(form.rubro),
    representante_legal_nombre: str(form.representante_legal_nombre),
    representante_legal_dni: str(form.representante_legal_dni),
    representante_legal_cargo: str(form.representante_legal_cargo),
    logo_url: str(form.logo_url),
    logo_secundario_url: str(form.logo_secundario_url),
    favicon_url: str(form.favicon_url),
    fecha_constitucion: str(form.fecha_constitucion),
    fecha_inicio_operaciones: str(form.fecha_inicio_operaciones),
    es_activo: bool(form.es_activo, true),
    geo,
  };
}

const CREATE_BASELINE = normalizeEmpresaFields(EMPRESA_CREATE_BASELINE, {
  paisId: '',
  departamentoId: '',
  provinciaId: '',
  distritoId: '',
});

export function isCreateEmpresaDirty(ctx: CreateEmpresaFormContext): boolean {
  return JSON.stringify(normalizeEmpresaFields(ctx.form, ctx.geo)) !== JSON.stringify(CREATE_BASELINE);
}

export function buildEditEmpresaFormSnapshot(ctx: EditEmpresaFormContext): EditEmpresaFormSnapshot {
  return normalizeEmpresaFields(ctx.form, ctx.geo);
}

export function isEditEmpresaDirty(
  ctx: EditEmpresaFormContext,
  snapshot: EditEmpresaFormSnapshot | null,
): boolean {
  if (!snapshot) return false;
  return JSON.stringify(buildEditEmpresaFormSnapshot(ctx)) !== JSON.stringify(snapshot);
}
