/**
 * FA-001 — Cache module-level de labels FK (id → nombre).
 * Sin React Context / Zustand / Redux / React Query.
 * ADR OB-01: merge-on-response + getFkLabel → "—" si miss.
 */
import type {
  PlatformCatalogEntityId,
  PlatformCatalogItemByEntityId,
} from '../types/platform-catalog.types';

const FK_LABEL_FALLBACK = '—';

/** Entidades usadas como padre en columnas fk:* y getFkLabel. */
type PlatformCatalogFkLabelParentId = 'pais' | 'departamento' | 'provincia';

type LabelCacheStore = {
  readonly [K in PlatformCatalogEntityId]: Record<string, string>;
};

const labelCache: LabelCacheStore = {
  moneda: {},
  pais: {},
  departamento: {},
  provincia: {},
  distrito: {},
};

function extractIdAndNombre(
  entityId: PlatformCatalogEntityId,
  item: PlatformCatalogItemByEntityId[PlatformCatalogEntityId],
): { id: string; nombre: string } | null {
  switch (entityId) {
    case 'moneda': {
      const row = item as PlatformCatalogItemByEntityId['moneda'];
      return row.moneda_id ? { id: row.moneda_id, nombre: row.nombre } : null;
    }
    case 'pais': {
      const row = item as PlatformCatalogItemByEntityId['pais'];
      return row.pais_id ? { id: row.pais_id, nombre: row.nombre } : null;
    }
    case 'departamento': {
      const row = item as PlatformCatalogItemByEntityId['departamento'];
      return row.departamento_id ? { id: row.departamento_id, nombre: row.nombre } : null;
    }
    case 'provincia': {
      const row = item as PlatformCatalogItemByEntityId['provincia'];
      return row.provincia_id ? { id: row.provincia_id, nombre: row.nombre } : null;
    }
    case 'distrito': {
      const row = item as PlatformCatalogItemByEntityId['distrito'];
      return row.distrito_id ? { id: row.distrito_id, nombre: row.nombre } : null;
    }
    default: {
      const _exhaustive: never = entityId;
      return _exhaustive;
    }
  }
}

/**
 * Fusiona ítems de una respuesta list/fk-options en el cache de labels.
 * Invocado desde queryFn de hooks (WP-04).
 */
export function mergeCatalogItemsIntoCache<E extends PlatformCatalogEntityId>(
  entityId: E,
  items: readonly PlatformCatalogItemByEntityId[E][],
): void {
  const bucket = labelCache[entityId];
  for (const item of items) {
    const pair = extractIdAndNombre(entityId, item);
    if (pair) {
      bucket[pair.id] = pair.nombre;
    }
  }
}

/**
 * Resuelve label FK para columnas de tabla. Nunca retorna UUID.
 */
export function getFkLabel(
  parentEntityId: PlatformCatalogFkLabelParentId,
  uuid: string | null | undefined,
): string {
  if (!uuid) {
    return FK_LABEL_FALLBACK;
  }
  return labelCache[parentEntityId][uuid] ?? FK_LABEL_FALLBACK;
}
