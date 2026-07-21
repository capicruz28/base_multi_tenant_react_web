/**
 * F14 — Mutaciones React Query Catalog Sync (separadas del CRUD).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/core/services/error.service';
import { getPlatformCatalogEntityConfig } from '../config/platform-catalog.entities';
import { platformCatalogSyncService } from '../services/platform-catalog-sync.service';
import {
  getCatalogTitleByApiSegment,
  resolveCatalogSyncTenantLabel,
} from '../utils/catalog-sync-display.utils';
import type {
  CatalogSyncAllParams,
  CatalogSyncBulkResponse,
  CatalogSyncSingleResponse,
} from '../types/platform-catalog-sync.types';
import type { PlatformCatalogEntityId } from '../types/platform-catalog.types';

function invalidateSyncRelatedQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ['platform-dashboard', 'sync-logs'] });
  void queryClient.invalidateQueries({ queryKey: ['platform-dashboard'] });
}

export function usePlatformCatalogSync(entityId: PlatformCatalogEntityId) {
  const queryClient = useQueryClient();
  const { apiSegment, title: catalogTitle } = getPlatformCatalogEntityConfig(entityId);

  const syncCatalogMutation = useMutation<
    CatalogSyncSingleResponse,
    Error,
    string
  >({
    mutationFn: (clienteId) => platformCatalogSyncService.syncCatalog(apiSegment, clienteId),
    retry: 0,
    onSuccess: (data) => {
      invalidateSyncRelatedQueries(queryClient);
      const tenantLabel = resolveCatalogSyncTenantLabel(data);
      const label = getCatalogTitleByApiSegment(data.catalogo) || catalogTitle;
      toast.success(`Catálogo ${label} sincronizado con ${tenantLabel}.`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error).message);
    },
  });

  const syncCatalogAllMutation = useMutation<
    CatalogSyncBulkResponse,
    Error,
    CatalogSyncAllParams | undefined
  >({
    mutationFn: (params) =>
      platformCatalogSyncService.syncCatalogAll(apiSegment, {
        continue_on_error: true,
        ...params,
      }),
    retry: 0,
    onSuccess: () => {
      invalidateSyncRelatedQueries(queryClient);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error).message);
    },
  });

  return {
    syncCatalog: syncCatalogMutation.mutateAsync,
    syncCatalogAll: syncCatalogAllMutation.mutateAsync,
    syncCatalogMutation,
    syncCatalogAllMutation,
    isSyncing: syncCatalogMutation.isPending || syncCatalogAllMutation.isPending,
  };
}
