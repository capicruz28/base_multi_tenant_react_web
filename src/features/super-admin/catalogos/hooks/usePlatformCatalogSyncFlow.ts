/**
 * F14 — Orquestación UI Catalog Sync (diálogos + mutaciones) reutilizable en las 5 páginas.
 */
import { useCallback, useState } from 'react';
import { getPlatformCatalogEntityConfig } from '../config/platform-catalog.entities';
import { usePlatformCatalogSync } from './usePlatformCatalogSync';
import type { CatalogSyncBulkResponse, CatalogSyncScope } from '../types/platform-catalog-sync.types';
import type { PlatformCatalogEntityId } from '../types/platform-catalog.types';

export function usePlatformCatalogSyncFlow(entityId: PlatformCatalogEntityId) {
  const config = getPlatformCatalogEntityConfig(entityId);
  const { syncCatalog, syncCatalogAll, isSyncing } = usePlatformCatalogSync(entityId);

  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState<CatalogSyncBulkResponse | null>(null);

  const openSyncDialog = useCallback(() => {
    setSyncDialogOpen(true);
  }, []);

  const closeSyncDialog = useCallback(() => {
    if (!isSyncing) {
      setSyncDialogOpen(false);
    }
  }, [isSyncing]);

  const closeResultDialog = useCallback(() => {
    setResultDialogOpen(false);
    setBulkResult(null);
  }, []);

  const handleSyncConfirm = useCallback(
    async (scope: CatalogSyncScope) => {
      if (scope.mode === 'all') {
        const result = await syncCatalogAll({ continue_on_error: true });
        setSyncDialogOpen(false);
        setBulkResult(result);
        setResultDialogOpen(true);
        return;
      }

      await syncCatalog(scope.clienteId);
      setSyncDialogOpen(false);
    },
    [syncCatalog, syncCatalogAll],
  );

  return {
    openSyncDialog,
    isSyncing,
    syncDialogProps: {
      isOpen: syncDialogOpen,
      onClose: closeSyncDialog,
      catalogTitle: config.title,
      onConfirm: handleSyncConfirm,
      isLoading: isSyncing,
    },
    resultDialogProps: {
      isOpen: resultDialogOpen,
      onClose: closeResultDialog,
      result: bulkResult,
    },
  };
}
