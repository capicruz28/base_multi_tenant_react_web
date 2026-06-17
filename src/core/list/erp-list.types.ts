/**
 * Tipos compartidos listados ERP — FRONTEND_LISTADOS_CONTRACT_V1 §2–3.
 * Consumo: ORG/INV PERF-01…06.
 */

/** Envelope paginado backend (`ErpPaginatedResponse`). */
export interface ErpPaginatedResponse<T> {
  items: T[];
  total: number;
  pagina_actual: number;
  total_paginas: number;
  limit: number;
}

export type ErpSortDirection = 'asc' | 'desc';

/** Query params transversales de listado (contrato §1). */
export interface ErpListQueryBase {
  page?: number;
  limit?: number;
  buscar?: string;
  sort_by?: string;
  sort_dir?: ErpSortDirection;
  solo_activos?: boolean;
}

export type ErpListTier = 'A' | 'B' | 'C';

export interface ErpListSortState {
  sort_by?: string;
  sort_dir?: ErpSortDirection;
}

/** Configuración por recurso para hooks y UI de listado. */
export interface ErpListResourceConfig {
  tier: ErpListTier;
  sortableColumns: readonly string[];
  defaultSort?: ErpListSortState;
  defaultLimit?: number;
  /** Tier C: siempre enviar page/limit al API. */
  forcePagination?: boolean;
  searchPlaceholder?: string;
}

export interface ErpListPaginationMeta {
  total: number;
  pagina_actual: number;
  total_paginas: number;
  limit: number;
  hasPrev: boolean;
  hasNext: boolean;
}
