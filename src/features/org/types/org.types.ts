/**
 * Tipos del módulo ORG (Organización)
 * Alineados con la documentación del backend: /api/v1/org/
 */

// ─── Empresa ─────────────────────────────────────────────────────────────
// Alineado con backend OpenAPI: EmpresaRead, EmpresaCreate, EmpresaUpdate.
// Ubicación: solo IDs (pais_id, departamento_id, provincia_id, distrito_id).

export interface Empresa {
  empresa_id: string;
  cliente_id: string;
  codigo_empresa: string;
  razon_social: string;
  nombre_comercial?: string | null;
  ruc: string;
  tipo_documento_tributario?: string | null;
  tipo_empresa?: string | null;
  direccion_fiscal?: string | null;
  pais_id?: string | null;
  departamento_id?: string | null;
  provincia_id?: string | null;
  distrito_id?: string | null;
  /** Nombres desnormalizados para mostrar (si el backend los devuelve). */
  pais?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  codigo_postal?: string | null;
  ubigeo?: string | null;
  telefono_principal?: string | null;
  telefono_secundario?: string | null;
  email_principal?: string | null;
  email_facturacion?: string | null;
  sitio_web?: string | null;
  moneda_base?: string | null;
  moneda_base_id?: string | null;
  maneja_multimoneda?: boolean | null;
  zona_horaria?: string | null;
  idioma_sistema?: string | null;
  formato_fecha?: string | null;
  separador_miles?: string | null;
  separador_decimales?: string | null;
  decimales_moneda?: number | null;
  actividad_economica?: string | null;
  codigo_ciiu?: string | null;
  rubro?: string | null;
  representante_legal_nombre?: string | null;
  representante_legal_dni?: string | null;
  representante_legal_cargo?: string | null;
  logo_url?: string | null;
  logo_secundario_url?: string | null;
  favicon_url?: string | null;
  fecha_constitucion?: string | null;
  fecha_inicio_operaciones?: string | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

export interface EmpresaCreate {
  codigo_empresa: string;
  razon_social: string;
  ruc: string;
  nombre_comercial?: string | null;
  tipo_documento_tributario?: string | null;
  tipo_empresa?: string | null;
  direccion_fiscal?: string | null;
  pais_id?: string | null;
  departamento_id?: string | null;
  provincia_id?: string | null;
  distrito_id?: string | null;
  codigo_postal?: string | null;
  ubigeo?: string | null;
  telefono_principal?: string | null;
  telefono_secundario?: string | null;
  email_principal?: string | null;
  email_facturacion?: string | null;
  sitio_web?: string | null;
  moneda_base_id?: string | null;
  maneja_multimoneda?: boolean | null;
  zona_horaria?: string | null;
  idioma_sistema?: string | null;
  formato_fecha?: string | null;
  separador_miles?: string | null;
  separador_decimales?: string | null;
  decimales_moneda?: number | null;
  actividad_economica?: string | null;
  codigo_ciiu?: string | null;
  rubro?: string | null;
  representante_legal_nombre?: string | null;
  representante_legal_dni?: string | null;
  representante_legal_cargo?: string | null;
  logo_url?: string | null;
  logo_secundario_url?: string | null;
  favicon_url?: string | null;
  fecha_constitucion?: string | null;
  fecha_inicio_operaciones?: string | null;
  es_activo?: boolean;
}

export interface EmpresaUpdate extends Partial<EmpresaCreate> {}

// ─── Sucursal ────────────────────────────────────────────────────────────

export interface Sucursal {
  sucursal_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo_sucursal?: string | null;
  direccion?: string | null;
  referencia?: string | null;
  /** IDs geográficos normalizados (alineados con org_sucursal.*_id) */
  pais_id?: string | null;
  departamento_id?: string | null;
  provincia_id?: string | null;
  distrito_id?: string | null;
  /** Nombres desnormalizados (backend ya no los expone, se mantienen por compatibilidad) */
  pais?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  ubigeo?: string | null;
  codigo_postal?: string | null;
  /** Coordenadas (OpenAPI permite number|string|null; en frontend se normaliza a number|null). */
  latitud?: number | null;
  longitud?: number | null;
  telefono?: string | null;
  email?: string | null;
  es_casa_matriz?: boolean;
  es_punto_venta?: boolean;
  es_almacen?: boolean;
  es_planta_produccion?: boolean;
  responsable_nombre?: string | null;
  centro_costo_id?: string | null;
  zona_horaria?: string | null;
  horario_atencion?: string | null;
  fecha_apertura?: string | null;
  fecha_cierre?: string | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

export interface SucursalCreate {
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo_sucursal?: string | null;
  direccion?: string | null;
  referencia?: string | null;
  /** IDs geográficos normalizados (preferidos por el backend) */
  pais_id?: string | null;
  departamento_id?: string | null;
  provincia_id?: string | null;
  distrito_id?: string | null;
  /** Nombres desnormalizados (backend ya no los expone, se mantienen solo para legacy) */
  pais?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  ubigeo?: string | null;
  codigo_postal?: string | null;
  /** Coordenadas (OpenAPI permite number|string|null; en frontend se normaliza a number|null). */
  latitud?: number | null;
  longitud?: number | null;
  telefono?: string | null;
  email?: string | null;
  es_casa_matriz?: boolean;
  es_punto_venta?: boolean;
  es_almacen?: boolean;
  es_planta_produccion?: boolean;
  responsable_nombre?: string | null;
  centro_costo_id?: string | null;
  zona_horaria?: string | null;
  horario_atencion?: string | null;
  fecha_apertura?: string | null;
  fecha_cierre?: string | null;
  es_activo?: boolean;
}

export interface SucursalUpdate extends Partial<SucursalCreate> {}

// ─── Centro de costo ────────────────────────────────────────────────────

export interface CentroCosto {
  centro_costo_id: string;
  cliente_id?: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  tipo_centro_costo: string;
  descripcion?: string | null;
  centro_costo_padre_id?: string | null;
  nivel?: number | null;
  categoria?: string | null;
  tiene_presupuesto?: boolean;
  permite_imputacion_directa?: boolean;
  responsable_nombre?: string | null;
  fecha_inicio_vigencia?: string | null;
  fecha_fin_vigencia?: string | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

export interface CentroCostoCreate {
  empresa_id: string;
  codigo: string;
  nombre: string;
  tipo_centro_costo: string;
  descripcion?: string | null;
  centro_costo_padre_id?: string | null;
  nivel?: number | null;
  categoria?: string | null;
  tiene_presupuesto?: boolean;
  permite_imputacion_directa?: boolean;
  responsable_nombre?: string | null;
  fecha_inicio_vigencia?: string | null;
  fecha_fin_vigencia?: string | null;
  es_activo?: boolean;
}

export interface CentroCostoUpdate extends Partial<CentroCostoCreate> {}

// ─── Departamento ───────────────────────────────────────────────────────

export interface Departamento {
  departamento_id: string;
  cliente_id?: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  departamento_padre_id?: string | null;
  nivel?: number | null;
  tipo_departamento?: string | null;
  jefe_nombre?: string | null;
  centro_costo_id?: string | null;
  sucursal_id?: string | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

export interface DepartamentoCreate {
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  departamento_padre_id?: string | null;
  nivel?: number | null;
  tipo_departamento?: string | null;
  jefe_nombre?: string | null;
  centro_costo_id?: string | null;
  sucursal_id?: string | null;
  es_activo?: boolean;
}

export interface DepartamentoUpdate extends Partial<DepartamentoCreate> {}

// ─── Cargo ───────────────────────────────────────────────────────────────

export interface Cargo {
  cargo_id: string;
  cliente_id?: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  nivel_jerarquico?: number | null;
  categoria?: string | null;
  area_funcional?: string | null;
  departamento_id?: string | null;
  cargo_jefe_id?: string | null;
  /** OpenAPI CargoRead devuelve estos campos como string | null (representación decimal del backend). */
  rango_salarial_min?: string | null;
  rango_salarial_max?: string | null;
  moneda_salarial: string;
  nivel_educacion_minimo?: string | null;
  experiencia_minima_meses?: number | null;
  requisitos_especificos?: string | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

export interface CargoCreate {
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  nivel_jerarquico?: number | null;
  categoria?: string | null;
  area_funcional?: string | null;
  departamento_id?: string | null;
  cargo_jefe_id?: string | null;
  /** OpenAPI CargoCreate acepta number | string | null para compatibilidad con distintos formatos decimales. */
  rango_salarial_min?: number | string | null;
  rango_salarial_max?: number | string | null;
  /** UUID de cat_moneda — requerido por el contrato. */
  moneda_salarial: string;
  nivel_educacion_minimo?: string | null;
  experiencia_minima_meses?: number | null;
  requisitos_especificos?: string | null;
  es_activo?: boolean;
}

export interface CargoUpdate extends Partial<CargoCreate> {}

// ─── Parámetro ───────────────────────────────────────────────────────────

export type TipoDatoParametro = 'texto' | 'numerico' | 'booleano' | 'fecha' | 'json';

export interface Parametro {
  parametro_id: string;
  modulo_codigo: string;
  codigo_parametro: string;
  nombre_parametro: string;
  tipo_dato: TipoDatoParametro;
  empresa_id?: string | null;
  descripcion?: string | null;
  valor_texto?: string | null;
  valor_numerico?: number | null;
  valor_booleano?: boolean | null;
  valor_fecha?: string | null;
  valor_json?: unknown;
  valor_defecto?: string | null;
  es_editable?: boolean;
  es_obligatorio?: boolean;
  es_activo: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

export interface ParametroCreate {
  modulo_codigo: string;
  codigo_parametro: string;
  nombre_parametro: string;
  tipo_dato: TipoDatoParametro;
  empresa_id?: string | null;
  descripcion?: string | null;
  valor_texto?: string | null;
  valor_numerico?: number | null;
  valor_booleano?: boolean | null;
  valor_fecha?: string | null;
  valor_json?: unknown;
  valor_defecto?: string | null;
  es_editable?: boolean;
  es_obligatorio?: boolean;
  es_activo?: boolean;
}

export interface ParametroUpdate extends Partial<ParametroCreate> {}

// ─── Filtros de listado (Etapa B: sin empresa_id en query; ámbito JWT) ─────

/** Listados company-scoped: solo_activos, buscar. */
export interface OrgCompanyListParams {
  solo_activos?: boolean;
  buscar?: string;
}

/** Vista de listado híbrido (backend ORG multiempresa). */
export type ParametroVista = 'efectivo' | 'global' | 'override';

/** Parámetro con valor efectivo resuelto (precedencia override > global). */
export interface ParametroEfectivo extends Parametro {
  alcance_efectivo: 'override' | 'global';
}

/** Listados híbridos /org/parametros. */
export interface OrgParametroListParams {
  solo_activos?: boolean;
  buscar?: string;
  modulo_codigo?: string;
  /** Resolución de alcance en backend; sin query empresa_id. */
  vista?: ParametroVista;
}

/**
 * @deprecated Usar OrgCompanyListParams u OrgParametroListParams.
 * El campo empresa_id en query fue eliminado (contrato multiempresa JWT).
 */
export type OrgListParams = OrgCompanyListParams;
