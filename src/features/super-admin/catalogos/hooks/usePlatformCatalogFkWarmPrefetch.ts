/**
 * FA-001 — Warm prefetch labels FK al mount (Scope Freeze §2.11, §6.7).
 */
import { useMemo } from 'react';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { useAuth } from '@/shared/context/AuthContext';
import { adaptPlatformCatalogEnvelope } from '../adapters/platform-catalog-envelope.adapter';
import { getPlatformCatalogEntityConfig } from '../config/platform-catalog.entities';
import {
  PLATFORM_CATALOG_GC_TIME_MS,
  platformCatalogQueryRetry,
} from './usePlatformGlobalCatalogList';
import { platformCatalogFkWarmQueryKey } from './platform-catalog-query-keys';
import { platformCatalogGlobalService } from '../services/platform-catalog-global.service';
import type {
  PlatformCatalogFkScope,
  PlatformCatalogItemByEntityId,
  PlatformCatalogListParams,
} from '../types/platform-catalog.types';
import { mergeCatalogItemsIntoCache } from '../utils/platform-catalog-fk-label-cache';

const FK_WARM_STALE_TIME_MS = 300_000;

type WarmPrefetchPageEntityId = 'departamento' | 'provincia' | 'distrito';

export function usePlatformCatalogFkWarmPrefetch(
  entityId: WarmPrefetchPageEntityId,
  enabled: boolean,
  scope?: PlatformCatalogFkScope,
): void {
  const { isSuperAdmin } = useAuth();
  const pageConfig = getPlatformCatalogEntityConfig(entityId);
  const warmConfig = pageConfig.fkWarmPrefetch;

  const scopeHash = useMemo(() => {
    if (entityId === 'distrito') {
      return scope?.departamentoId ?? 'none';
    }
    return entityId;
  }, [entityId, scope?.departamentoId]);

  const queryEnabled =
    isSuperAdmin &&
    enabled &&
    warmConfig != null &&
    (entityId !== 'distrito' || !!scope?.departamentoId);

  useTenantQuery({
    queryKey: platformCatalogFkWarmQueryKey(entityId, scopeHash),
    enabled: queryEnabled,
    staleTime: FK_WARM_STALE_TIME_MS,
    gcTime: PLATFORM_CATALOG_GC_TIME_MS,
    retry: platformCatalogQueryRetry,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!warmConfig) {
        return null;
      }

      const parentEntityId = warmConfig.parentEntityId;
      const parentConfig = getPlatformCatalogEntityConfig(parentEntityId);
      const params: PlatformCatalogListParams = {
        ...warmConfig.params,
      };

      if (entityId === 'distrito' && scope?.departamentoId) {
        params.departamento_id = scope.departamentoId;
      }

      const listFn =
        parentEntityId === 'pais'
          ? platformCatalogGlobalService.listPaises
          : parentEntityId === 'departamento'
            ? platformCatalogGlobalService.listDepartamentos
            : platformCatalogGlobalService.listProvincias;

      const raw = await listFn(params);
      const limitApplied = params.limit ?? warmConfig.params?.limit ?? 1000;
      const adapted = adaptPlatformCatalogEnvelope<
        PlatformCatalogItemByEntityId[typeof parentEntityId]
      >(raw, parentConfig.envelope, limitApplied);

      mergeCatalogItemsIntoCache(parentEntityId, adapted.items);
      return null;
    },
  });
}
