/**
 * FA-001 — Opciones async FK para PlatformCatalogFkSelect (Scope Freeze §6.6).
 */
import { useMemo } from 'react';
import { ERP_LIST_SEARCH_DEBOUNCE_MODAL_MS } from '@/core/list/erp-list.constants';
import { useDebouncedSearch } from '@/core/list';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { useAuth } from '@/shared/context/AuthContext';
import {
  adaptPlatformCatalogEnvelope,
  buildPlatformCatalogHttpParams,
} from '../adapters/platform-catalog-envelope.adapter';
import { getPlatformCatalogEntityConfig } from '../config/platform-catalog.entities';
import {
  PLATFORM_CATALOG_GC_TIME_MS,
  platformCatalogQueryRetry,
} from './usePlatformGlobalCatalogList';
import { platformCatalogFkOptionsQueryKey } from './platform-catalog-query-keys';
import { platformCatalogGlobalService } from '../services/platform-catalog-global.service';
import type {
  PlatformCatalogFkScope,
  PlatformCatalogItemByEntityId,
  PlatformCatalogListUiState,
} from '../types/platform-catalog.types';
import { mergeCatalogItemsIntoCache } from '../utils/platform-catalog-fk-label-cache';

const FK_OPTIONS_STALE_TIME_MS = 30_000;

export type PlatformCatalogFkOptionEntityId = 'pais' | 'departamento' | 'provincia';

export interface PlatformCatalogFkOption {
  value: string;
  label: string;
  subLabel?: string;
}

export interface UsePlatformCatalogFkOptionsOptions {
  buscar?: string;
  enabled?: boolean;
  limit?: number;
  soloActivos?: boolean;
}

function isParentScopeSatisfied(
  entityId: PlatformCatalogFkOptionEntityId,
  scope: PlatformCatalogFkScope,
): boolean {
  switch (entityId) {
    case 'pais':
      return true;
    case 'departamento':
      return !!scope.paisId;
    case 'provincia':
      return !!scope.departamentoId;
    default: {
      const _exhaustive: never = entityId;
      return _exhaustive;
    }
  }
}

function mapItemsToFkOptions(
  entityId: PlatformCatalogFkOptionEntityId,
  items: PlatformCatalogItemByEntityId[PlatformCatalogFkOptionEntityId][],
): PlatformCatalogFkOption[] {
  switch (entityId) {
    case 'pais':
      return items.map((row) => ({
        value: row.pais_id,
        label: row.nombre,
        subLabel: row.codigo_iso2,
      }));
    case 'departamento':
      return items.map((row) => ({
        value: row.departamento_id,
        label: row.nombre,
        subLabel: row.codigo,
      }));
    case 'provincia':
      return items.map((row) => ({
        value: row.provincia_id,
        label: row.nombre,
        subLabel: row.codigo,
      }));
    default: {
      const _exhaustive: never = entityId;
      return _exhaustive;
    }
  }
}

export function usePlatformCatalogFkOptions(
  entityId: PlatformCatalogFkOptionEntityId,
  scope: PlatformCatalogFkScope,
  options?: UsePlatformCatalogFkOptionsOptions,
) {
  const { isSuperAdmin } = useAuth();
  const entityConfig = getPlatformCatalogEntityConfig(entityId);
  const search = useDebouncedSearch({
    debounceMs: ERP_LIST_SEARCH_DEBOUNCE_MODAL_MS,
    initialValue: options?.buscar ?? '',
  });

  const soloActivos = options?.soloActivos ?? true;
  const limit = options?.limit ?? entityConfig.defaultLimit;
  const scopeSatisfied = isParentScopeSatisfied(entityId, scope);
  const debouncedBuscar = search.debouncedValue;

  const queryKey = useMemo(
    () => platformCatalogFkOptionsQueryKey(entityId, scope, debouncedBuscar),
    [entityId, scope, debouncedBuscar],
  );

  const query = useTenantQuery<PlatformCatalogFkOption[], Error>({
    queryKey,
    enabled: isSuperAdmin && scopeSatisfied && options?.enabled !== false,
    staleTime: FK_OPTIONS_STALE_TIME_MS,
    gcTime: PLATFORM_CATALOG_GC_TIME_MS,
    retry: platformCatalogQueryRetry,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const uiState: PlatformCatalogListUiState = {
        page: 1,
        limit,
        soloActivos,
        buscar: debouncedBuscar,
        paisId: scope.paisId ?? null,
        departamentoId: scope.departamentoId ?? null,
        provinciaId: scope.provinciaId ?? null,
        ubigeo: null,
      };
      const httpParams = buildPlatformCatalogHttpParams(uiState);

      const listFn =
        entityId === 'pais'
          ? platformCatalogGlobalService.listPaises
          : entityId === 'departamento'
            ? platformCatalogGlobalService.listDepartamentos
            : platformCatalogGlobalService.listProvincias;

      const raw = await listFn(httpParams);
      const adapted = adaptPlatformCatalogEnvelope<
        PlatformCatalogItemByEntityId[PlatformCatalogFkOptionEntityId]
      >(raw, entityConfig.envelope, httpParams.limit ?? limit);

      mergeCatalogItemsIntoCache(entityId, adapted.items);
      return mapItemsToFkOptions(entityId, adapted.items);
    },
  });

  return {
    options: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    search,
  };
}
