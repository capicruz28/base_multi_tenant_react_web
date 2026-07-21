/**
 * F14 — Helpers de presentación Catalog Sync (sin recalcular métricas del backend).
 */
import { PLATFORM_CATALOG_ENTITIES } from '../config/platform-catalog.entities';
import type { PlatformCatalogApiSegment } from '../types/platform-catalog.types';

export function getCatalogTitleByApiSegment(segment: PlatformCatalogApiSegment): string {
  const match = Object.values(PLATFORM_CATALOG_ENTITIES).find(
    (entity) => entity.apiSegment === segment,
  );
  return match?.title ?? segment;
}

export function formatCatalogSyncDurationMs(duracionMs: number): string {
  if (!Number.isFinite(duracionMs) || duracionMs < 0) {
    return '—';
  }
  if (duracionMs < 1000) {
    return `${duracionMs} ms`;
  }
  return `${(duracionMs / 1000).toFixed(2)} s`;
}

export function resolveCatalogSyncTenantLabel(row: {
  razon_social?: string | null;
  nombre_comercial?: string | null;
  codigo_cliente?: string | null;
}): string {
  const razonSocial = row.razon_social?.trim();
  if (razonSocial) {
    return razonSocial;
  }
  const nombreComercial = row.nombre_comercial?.trim();
  if (nombreComercial) {
    return nombreComercial;
  }
  const codigo = row.codigo_cliente?.trim();
  if (codigo) {
    return codigo;
  }
  return '—';
}

export function isCatalogSyncFailedEstado(estado: string): boolean {
  const normalized = estado.trim().toLowerCase();
  return (
    normalized === 'fallido' ||
    normalized === 'failed' ||
    normalized === 'error' ||
    normalized.includes('fall')
  );
}

export function getCatalogSyncEstadoBadgeClass(estado: string): string {
  if (isCatalogSyncFailedEstado(estado)) {
    return 'bg-error/10 text-error';
  }
  const normalized = estado.trim().toLowerCase();
  if (
    normalized === 'completado' ||
    normalized === 'completed' ||
    normalized === 'success' ||
    normalized === 'exitoso'
  ) {
    return 'bg-success/10 text-success';
  }
  if (normalized.includes('parcial') || normalized.includes('partial')) {
    return 'bg-warning/10 text-warning';
  }
  return 'bg-info/10 text-info';
}
