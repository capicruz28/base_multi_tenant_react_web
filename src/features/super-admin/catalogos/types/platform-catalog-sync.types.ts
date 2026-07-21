/**
 * F14 — Contratos HTTP Catalog Sync (Platform → Dedicated).
 * Tipos alineados al response del backend; no recalcular en UI.
 */
import type { PlatformCatalogApiSegment } from './platform-catalog.types';

/** Métricas de sincronización devueltas por el backend. */
export interface CatalogSyncMetrics {
  insertados: number;
  actualizados: number;
  desactivados: number;
  omitidos: number;
}

/** Resultado por tenant en sincronización masiva. */
export interface CatalogSyncTenantResult extends CatalogSyncMetrics {
  cliente_id: string;
  razon_social?: string | null;
  nombre_comercial?: string | null;
  codigo_cliente?: string | null;
  catalogo: PlatformCatalogApiSegment;
  estado: string;
  duracion_ms: number;
  mensaje_error?: string | null;
}

/** Response POST /catalogos-globales/sync/{catalogo}/{cliente_id} */
export interface CatalogSyncSingleResponse extends CatalogSyncMetrics {
  catalogo: PlatformCatalogApiSegment;
  estado: string;
  duracion_ms: number;
  cliente_id: string;
  razon_social?: string | null;
  nombre_comercial?: string | null;
  codigo_cliente?: string | null;
  mensaje_error?: string | null;
}

/** Response POST /catalogos-globales/sync/{catalogo} */
export interface CatalogSyncBulkResponse extends CatalogSyncMetrics {
  catalogo: PlatformCatalogApiSegment;
  estado: string;
  duracion_ms: number;
  tenants_procesados: number;
  completados: number;
  fallidos: number;
  resultados: CatalogSyncTenantResult[];
}

export interface CatalogSyncAllParams {
  continue_on_error?: boolean;
}

export type CatalogSyncScope =
  | { mode: 'all' }
  | { mode: 'single'; clienteId: string };
