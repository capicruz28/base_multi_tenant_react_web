/**
 * F14 — Service HTTP Catalog Sync (Platform → Dedicated).
 */
import api from '@/core/api/api';
import type { PlatformCatalogApiSegment } from '../types/platform-catalog.types';
import type {
  CatalogSyncAllParams,
  CatalogSyncBulkResponse,
  CatalogSyncSingleResponse,
} from '../types/platform-catalog-sync.types';

const GLOBAL_BASE = '/catalogos-globales';

export const platformCatalogSyncService = {
  async syncCatalog(
    catalogo: PlatformCatalogApiSegment,
    clienteId: string,
  ): Promise<CatalogSyncSingleResponse> {
    const { data } = await api.post<CatalogSyncSingleResponse>(
      `${GLOBAL_BASE}/sync/${catalogo}/${clienteId}`,
    );
    return data;
  },

  async syncCatalogAll(
    catalogo: PlatformCatalogApiSegment,
    params?: CatalogSyncAllParams,
  ): Promise<CatalogSyncBulkResponse> {
    const query: Record<string, boolean> = {};
    if (params?.continue_on_error !== undefined) {
      query.continue_on_error = params.continue_on_error;
    }

    const { data } = await api.post<CatalogSyncBulkResponse>(
      `${GLOBAL_BASE}/sync/${catalogo}`,
      undefined,
      { params: query },
    );
    return data;
  },
};
