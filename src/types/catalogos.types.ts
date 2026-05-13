// Tipos compartidos para catálogos globales (SuperAdmin) y catálogos de solo lectura.
// Alineados con los schemas Cat* del backend (cat_moneda, cat_pais, cat_departamento, cat_provincia, cat_distrito).

// ─── Moneda ───────────────────────────────────────────────────────────────

export interface CatMoneda {
  moneda_id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
  decimales?: number | null;
  es_activo?: boolean | null;
}

export interface CatMonedaCreate {
  codigo: string;
  nombre: string;
  simbolo: string;
  decimales?: number | null;
  es_activo?: boolean | null;
}

export interface CatMonedaUpdate {
  nombre?: string | null;
  simbolo?: string | null;
  decimales?: number | null;
  es_activo?: boolean | null;
}

// ─── País ─────────────────────────────────────────────────────────────────

export interface CatPais {
  pais_id: string;
  codigo_iso2: string;
  codigo_iso3: string;
  nombre: string;
  es_activo?: boolean | null;
}

export interface CatPaisCreate {
  codigo_iso2: string;
  codigo_iso3: string;
  nombre: string;
  es_activo?: boolean | null;
}

export interface CatPaisUpdate {
  codigo_iso2?: string | null;
  codigo_iso3?: string | null;
  nombre?: string | null;
  es_activo?: boolean | null;
}

// ─── Departamento (cat_departamento) ─────────────────────────────────────

export interface CatDepartamento {
  departamento_id: string;
  pais_id: string;
  codigo: string;
  nombre: string;
}

export interface CatDepartamentoCreate {
  pais_id: string;
  codigo: string;
  nombre: string;
}

export interface CatDepartamentoUpdate {
  pais_id?: string | null;
  codigo?: string | null;
  nombre?: string | null;
}

// ─── Provincia (cat_provincia) ───────────────────────────────────────────

export interface CatProvincia {
  provincia_id: string;
  departamento_id: string;
  codigo: string;
  nombre: string;
}

export interface CatProvinciaCreate {
  departamento_id: string;
  codigo: string;
  nombre: string;
}

export interface CatProvinciaUpdate {
  departamento_id?: string | null;
  codigo?: string | null;
  nombre?: string | null;
}

// ─── Distrito (cat_distrito) ─────────────────────────────────────────────

export interface CatDistrito {
  distrito_id: string;
  provincia_id: string;
  codigo: string;
  nombre: string;
  ubigeo: string;
}

export interface CatDistritoCreate {
  provincia_id: string;
  codigo: string;
  nombre: string;
  ubigeo: string;
}

export interface CatDistritoUpdate {
  provincia_id?: string | null;
  codigo?: string | null;
  nombre?: string | null;
  ubigeo?: string | null;
}

