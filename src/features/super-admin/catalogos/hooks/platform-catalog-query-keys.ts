/**
 * FA-001 — Query keys oficiales Platform Catalog Global.
 * Scope Freeze §7.1 — no modificar namespace ni estructura.
 */
import type {
  PlatformCatalogEntityId,
  PlatformCatalogFkScope,
  PlatformCatalogListQueryParams,
} from '../types/platform-catalog.types';

export const PLATFORM_CATALOG_QUERY_ROOT = ['platform-catalog-global'] as const;

export function platformCatalogListQueryKey(
  entityId: PlatformCatalogEntityId,
  q: PlatformCatalogListQueryParams,
): readonly [
  'platform-catalog-global',
  PlatformCatalogEntityId,
  'list',
  boolean,
  string,
  number,
  number,
  string | null,
  string | null,
  string | null,
  string | null,
] {
  return [
    ...PLATFORM_CATALOG_QUERY_ROOT,
    entityId,
    'list',
    q.soloActivos,
    q.buscar ?? '',
    q.page,
    q.limit,
    q.paisId ?? null,
    q.departamentoId ?? null,
    q.provinciaId ?? null,
    q.ubigeo ?? null,
  ] as const;
}

export function platformCatalogListPrefixKey(
  entityId: PlatformCatalogEntityId,
): readonly ['platform-catalog-global', PlatformCatalogEntityId, 'list'] {
  return [...PLATFORM_CATALOG_QUERY_ROOT, entityId, 'list'] as const;
}

export function platformCatalogAllListsPrefixKey(): readonly ['platform-catalog-global'] {
  return [...PLATFORM_CATALOG_QUERY_ROOT] as const;
}

export function platformCatalogFkOptionsQueryKey(
  entityId: PlatformCatalogEntityId,
  scope: PlatformCatalogFkScope,
  buscar: string,
): readonly [
  'platform-catalog-global',
  PlatformCatalogEntityId,
  'fk-options',
  string | null | undefined,
  string | null | undefined,
  string | null | undefined,
  string,
] {
  return [
    ...PLATFORM_CATALOG_QUERY_ROOT,
    entityId,
    'fk-options',
    scope.paisId ?? null,
    scope.departamentoId ?? null,
    scope.provinciaId ?? null,
    buscar,
  ] as const;
}

export function platformCatalogFkOptionsPrefixKey(
  entityId: PlatformCatalogEntityId,
): readonly ['platform-catalog-global', PlatformCatalogEntityId, 'fk-options'] {
  return [...PLATFORM_CATALOG_QUERY_ROOT, entityId, 'fk-options'] as const;
}

export function platformCatalogFkWarmQueryKey(
  entityId: PlatformCatalogEntityId,
  scopeHash: string,
): readonly ['platform-catalog-global', 'fk-warm', PlatformCatalogEntityId, string] {
  return [...PLATFORM_CATALOG_QUERY_ROOT, 'fk-warm', entityId, scopeHash] as const;
}
