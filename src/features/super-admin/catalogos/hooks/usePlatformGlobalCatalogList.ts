/**
 * FA-001 — Wrapper delgado useErpListQuery para listados catálogo global (PA-005).
 * Scope Freeze §6.4, §7.5 — sin placeholderData / keepPreviousData.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useDebouncedSearch, useErpListQuery, type ErpListResourceConfig } from '@/core/list';
import { getErrorMessage } from '@/core/services/error.service';
import { useAuth } from '@/shared/context/AuthContext';
import {
  adaptPlatformCatalogEnvelope,
  buildPlatformCatalogHttpParams,
} from '../adapters/platform-catalog-envelope.adapter';
import { getPlatformCatalogEntityConfig } from '../config/platform-catalog.entities';
import { platformCatalogListPrefixKey } from './platform-catalog-query-keys';
import { platformCatalogGlobalService } from '../services/platform-catalog-global.service';
import type {
  PlatformCatalogEntityId,
  PlatformCatalogItemByEntityId,
  PlatformCatalogListParams,
  PlatformCatalogListUiState,
  PlatformCatalogPaginatedResponseByEntityId,
} from '../types/platform-catalog.types';
import { mergeCatalogItemsIntoCache } from '../utils/platform-catalog-fk-label-cache';

const PLATFORM_CATALOG_LIST_CONFIG: ErpListResourceConfig = {
  tier: 'B',
  forcePagination: true,
  defaultLimit: 50,
  sortableColumns: [],
};

const PLATFORM_CATALOG_LIST_STALE_TIME_MS = 0;

export interface PlatformCatalogInitialFkFilters {
  paisId?: string | null;
  departamentoId?: string | null;
  provinciaId?: string | null;
  ubigeo?: string | null;
}

export interface UsePlatformGlobalCatalogListOptions {
  enabled?: boolean;
  initialPage?: number;
  initialLimit?: number;
  initialSoloActivos?: boolean;
  initialFkFilters?: PlatformCatalogInitialFkFilters;
}

export interface PlatformCatalogListFkState {
  paisId: string | null;
  departamentoId: string | null;
  provinciaId: string | null;
  ubigeo: string | null;
}

async function fetchPlatformCatalogList<E extends PlatformCatalogEntityId>(
  entityId: E,
  params?: PlatformCatalogListParams,
): Promise<PlatformCatalogPaginatedResponseByEntityId[E]> {
  switch (entityId) {
    case 'moneda':
      return platformCatalogGlobalService.listMonedas(params) as Promise<
        PlatformCatalogPaginatedResponseByEntityId[E]
      >;
    case 'pais':
      return platformCatalogGlobalService.listPaises(params) as Promise<
        PlatformCatalogPaginatedResponseByEntityId[E]
      >;
    case 'departamento':
      return platformCatalogGlobalService.listDepartamentos(params) as Promise<
        PlatformCatalogPaginatedResponseByEntityId[E]
      >;
    case 'provincia':
      return platformCatalogGlobalService.listProvincias(params) as Promise<
        PlatformCatalogPaginatedResponseByEntityId[E]
      >;
    case 'distrito':
      return platformCatalogGlobalService.listDistritos(params) as Promise<
        PlatformCatalogPaginatedResponseByEntityId[E]
      >;
    default: {
      const _exhaustive: never = entityId;
      return _exhaustive;
    }
  }
}

export function usePlatformGlobalCatalogList<E extends PlatformCatalogEntityId>(
  entityId: E,
  options?: UsePlatformGlobalCatalogListOptions,
) {
  const { isSuperAdmin } = useAuth();
  const entityConfig = getPlatformCatalogEntityConfig(entityId);
  const search = useDebouncedSearch();

  const [soloActivos, setSoloActivos] = useState(options?.initialSoloActivos ?? true);
  const [paisId, setPaisId] = useState<string | null>(
    options?.initialFkFilters?.paisId ?? null,
  );
  const [departamentoId, setDepartamentoId] = useState<string | null>(
    options?.initialFkFilters?.departamentoId ?? null,
  );
  const [provinciaId, setProvinciaId] = useState<string | null>(
    options?.initialFkFilters?.provinciaId ?? null,
  );
  const [ubigeo, setUbigeo] = useState<string | null>(
    options?.initialFkFilters?.ubigeo ?? null,
  );

  const baseFilters = useMemo(
    () => ({
      soloActivos,
      paisId,
      departamentoId,
      provinciaId,
      ubigeo,
    }),
    [soloActivos, paisId, departamentoId, provinciaId, ubigeo],
  );

  const listQuery = useErpListQuery<
    PlatformCatalogItemByEntityId[E],
    typeof baseFilters
  >({
    queryKeyPrefix: platformCatalogListPrefixKey(entityId),
    baseFilters,
    debouncedBuscar: search.debouncedValue,
    config: {
      ...PLATFORM_CATALOG_LIST_CONFIG,
      defaultLimit: entityConfig.defaultLimit,
    },
    enabled: isSuperAdmin && options?.enabled !== false,
    staleTime: PLATFORM_CATALOG_LIST_STALE_TIME_MS,
    initialPage: options?.initialPage ?? 1,
    initialLimit: options?.initialLimit ?? entityConfig.defaultLimit,
    fetcher: async (params) => {
      const uiState: PlatformCatalogListUiState = {
        page: params.page ?? 1,
        limit: params.limit ?? entityConfig.defaultLimit,
        soloActivos: baseFilters.soloActivos,
        buscar: params.buscar,
        paisId: baseFilters.paisId,
        departamentoId: baseFilters.departamentoId,
        provinciaId: baseFilters.provinciaId,
        ubigeo: baseFilters.ubigeo,
      };
      const httpParams = buildPlatformCatalogHttpParams(uiState);
      const raw = await fetchPlatformCatalogList(entityId, httpParams);
      const adapted = adaptPlatformCatalogEnvelope<PlatformCatalogItemByEntityId[E]>(
        raw,
        entityConfig.envelope,
        httpParams.limit ?? entityConfig.defaultLimit,
      );
      mergeCatalogItemsIntoCache(entityId, adapted.items);
      return adapted;
    },
  });

  const { setPage } = listQuery;

  useEffect(() => {
    setPage(1);
  }, [
    search.debouncedValue,
    soloActivos,
    paisId,
    departamentoId,
    provinciaId,
    ubigeo,
    setPage,
  ]);

  const setPaisIdAndReset = useCallback(
    (value: string | null) => {
      setPaisId(value);
      setDepartamentoId(null);
      setProvinciaId(null);
      setUbigeo(null);
      setPage(1);
    },
    [setPage],
  );

  const setDepartamentoIdAndReset = useCallback(
    (value: string | null) => {
      setDepartamentoId(value);
      setProvinciaId(null);
      setUbigeo(null);
      setPage(1);
    },
    [setPage],
  );

  const setProvinciaIdAndReset = useCallback(
    (value: string | null) => {
      setProvinciaId(value);
      setPage(1);
    },
    [setPage],
  );

  const setUbigeoAndReset = useCallback(
    (value: string | null) => {
      setUbigeo(value);
      setPage(1);
    },
    [setPage],
  );

  const resetFilters = useCallback(() => {
    setSoloActivos(true);
    setPaisId(null);
    setDepartamentoId(null);
    setProvinciaId(null);
    setUbigeo(null);
    search.clear();
    setPage(1);
  }, [search, setPage]);

  const errorMessage = listQuery.error
    ? getErrorMessage(listQuery.error).message
    : undefined;

  const fkState: PlatformCatalogListFkState = {
    paisId,
    departamentoId,
    provinciaId,
    ubigeo,
  };

  return {
    items: listQuery.items,
    pagination: listQuery.pagination,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    error: listQuery.error,
    errorMessage,
    search,
    soloActivos,
    setSoloActivos,
    fkState,
    setPaisId: setPaisIdAndReset,
    setDepartamentoId: setDepartamentoIdAndReset,
    setProvinciaId: setProvinciaIdAndReset,
    setUbigeo: setUbigeoAndReset,
    page: listQuery.page,
    setPage: listQuery.setPage,
    limit: listQuery.limit,
    setLimit: listQuery.setLimit,
    refetch: listQuery.refetch,
    resetFilters,
    fetchParams: listQuery.fetchParams,
  };
}

/** Retry Scope Freeze §7.3 — 1 intento; no reintentar 403/422. */
export function platformCatalogQueryRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= 1) {
    return false;
  }
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 403 || status === 422) {
      return false;
    }
  }
  return true;
}

export const PLATFORM_CATALOG_GC_TIME_MS = 300_000;
