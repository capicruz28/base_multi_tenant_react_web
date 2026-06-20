/**
 * FA-001 — Tipos Platform Catalog Global (Super Admin).
 * Envelopes HTTP PA-005 — Familia A (BACKEND_PLATFORM_API_CONTRACT_V2 §6–10).
 * Entidades Cat* reutilizadas desde @/types/catalogos.types (sin cambio de shape).
 */
import type { LucideIcon } from 'lucide-react';
import type {
  CatDepartamento,
  CatDepartamentoCreate,
  CatDistrito,
  CatDistritoCreate,
  CatMoneda,
  CatMonedaCreate,
  CatPais,
  CatPaisCreate,
  CatProvincia,
  CatProvinciaCreate,
} from '@/types/catalogos.types';

// ─── Identidad de entidad ───────────────────────────────────────────────────

export type PlatformCatalogEntityId =
  | 'moneda'
  | 'pais'
  | 'departamento'
  | 'provincia'
  | 'distrito';

export type PlatformCatalogApiSegment =
  | 'monedas'
  | 'paises'
  | 'departamentos'
  | 'provincias'
  | 'distritos';

// ─── Envelope HTTP — metadatos compartidos (Familia A) ─────────────────────

export interface PlatformCatalogPaginationMeta {
  pagina_actual: number;
  total_paginas: number;
  items_por_pagina: number;
}

export interface PaginatedCatMonedaResponse extends PlatformCatalogPaginationMeta {
  monedas: CatMoneda[];
  total_monedas: number;
}

export interface PaginatedCatPaisResponse extends PlatformCatalogPaginationMeta {
  paises: CatPais[];
  total_paises: number;
}

export interface PaginatedCatDepartamentoResponse extends PlatformCatalogPaginationMeta {
  departamentos: CatDepartamento[];
  total_departamentos: number;
}

export interface PaginatedCatProvinciaResponse extends PlatformCatalogPaginationMeta {
  provincias: CatProvincia[];
  total_provincias: number;
}

export interface PaginatedCatDistritoResponse extends PlatformCatalogPaginationMeta {
  distritos: CatDistrito[];
  total_distritos: number;
}

export type PlatformCatalogPaginatedResponse =
  | PaginatedCatMonedaResponse
  | PaginatedCatPaisResponse
  | PaginatedCatDepartamentoResponse
  | PaginatedCatProvinciaResponse
  | PaginatedCatDistritoResponse;

// ─── Params HTTP (service layer) ───────────────────────────────────────────

export interface PlatformCatalogListParams {
  skip?: number;
  limit?: number;
  solo_activos?: boolean;
  buscar?: string;
  /** Super Admin target tenant — reservado v1; no enviar desde UI. */
  cliente_id?: string;
  pais_id?: string;
  departamento_id?: string;
  provincia_id?: string;
  /** Distritos — filtro exacto; 1–6 caracteres. */
  ubigeo?: string;
}

// ─── Params UI (hooks / pages) ─────────────────────────────────────────────

export interface PlatformCatalogListUiState {
  page: number;
  limit: number;
  soloActivos: boolean;
  buscar?: string;
  paisId?: string | null;
  departamentoId?: string | null;
  provinciaId?: string | null;
  ubigeo?: string | null;
}

/** Serializable para query keys React Query (Scope Freeze §7.1). */
export interface PlatformCatalogListQueryParams {
  soloActivos: boolean;
  buscar: string;
  page: number;
  limit: number;
  paisId: string | null;
  departamentoId: string | null;
  provinciaId: string | null;
  ubigeo: string | null;
}

// ─── Entity Registry (config data-only — implementación en WP-01.2) ────────

export interface PlatformCatalogEnvelopeMapping {
  itemsKey: string;
  totalKey: string;
}

export type PlatformCatalogFkColumnAccessor =
  | 'fk:pais'
  | 'fk:departamento'
  | 'fk:provincia';

export type PlatformCatalogColumnAccessor<TItem> =
  | (keyof TItem & string)
  | PlatformCatalogFkColumnAccessor;

export interface PlatformCatalogColumnDef<TItem> {
  id: string;
  header: string;
  accessor: PlatformCatalogColumnAccessor<TItem>;
  hideOnMobile?: boolean;
}

export type PlatformCatalogToolbarFkFilter =
  | 'pais'
  | 'departamento'
  | 'provincia'
  | 'ubigeo';

export interface PlatformCatalogFkWarmPrefetchConfig {
  parentEntityId: PlatformCatalogEntityId;
  params?: Partial<PlatformCatalogListParams>;
}

export interface PlatformCatalogFkScope {
  paisId?: string | null;
  departamentoId?: string | null;
  provinciaId?: string | null;
}

export interface PlatformCatalogEntityConfig<
  TItem,
  TCreate,
> {
  id: PlatformCatalogEntityId;
  apiSegment: PlatformCatalogApiSegment;
  envelope: PlatformCatalogEnvelopeMapping;
  title: string;
  singularLabel: string;
  searchPlaceholder: string;
  emptyIcon: LucideIcon;
  defaultLimit: number;
  limitOptions: readonly number[];
  columns: readonly PlatformCatalogColumnDef<TItem>[];
  toolbarFkFilters: readonly PlatformCatalogToolbarFkFilter[];
  fkWarmPrefetch?: PlatformCatalogFkWarmPrefetchConfig;
  createDefault: TCreate;
  readonly requiresSuperAdmin: true;
}

// ─── Mapas tipados por entidad (consumo registry / hooks) ──────────────────

export type PlatformCatalogItemByEntityId = {
  moneda: CatMoneda;
  pais: CatPais;
  departamento: CatDepartamento;
  provincia: CatProvincia;
  distrito: CatDistrito;
};

export type PlatformCatalogCreateByEntityId = {
  moneda: CatMonedaCreate;
  pais: CatPaisCreate;
  departamento: CatDepartamentoCreate;
  provincia: CatProvinciaCreate;
  distrito: CatDistritoCreate;
};

export type PlatformCatalogPaginatedResponseByEntityId = {
  moneda: PaginatedCatMonedaResponse;
  pais: PaginatedCatPaisResponse;
  departamento: PaginatedCatDepartamentoResponse;
  provincia: PaginatedCatProvinciaResponse;
  distrito: PaginatedCatDistritoResponse;
};
