import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/core/api/api';
import { platformCatalogSyncService } from '../platform-catalog-sync.service';
import type {
  CatalogSyncBulkResponse,
  CatalogSyncSingleResponse,
} from '../../types/platform-catalog-sync.types';

vi.mock('@/core/api/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

const CLIENTE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const singleResponse: CatalogSyncSingleResponse = {
  catalogo: 'monedas',
  estado: 'completado',
  duracion_ms: 850,
  insertados: 2,
  actualizados: 1,
  desactivados: 0,
  omitidos: 0,
  cliente_id: CLIENTE_ID,
  razon_social: 'Acme Dedicated S.A.',
};

const bulkResponse: CatalogSyncBulkResponse = {
  catalogo: 'monedas',
  estado: 'completado_parcial',
  duracion_ms: 4200,
  insertados: 5,
  actualizados: 3,
  desactivados: 1,
  omitidos: 0,
  tenants_procesados: 2,
  completados: 1,
  fallidos: 1,
  resultados: [
    {
      cliente_id: CLIENTE_ID,
      razon_social: 'Acme Dedicated S.A.',
      catalogo: 'monedas',
      estado: 'completado',
      duracion_ms: 900,
      insertados: 5,
      actualizados: 3,
      desactivados: 1,
      omitidos: 0,
      mensaje_error: null,
    },
  ],
};

describe('platformCatalogSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('syncCatalog llama POST /catalogos-globales/sync/{catalogo}/{cliente_id}', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: singleResponse });

    const result = await platformCatalogSyncService.syncCatalog('monedas', CLIENTE_ID);

    expect(api.post).toHaveBeenCalledWith(
      `/catalogos-globales/sync/monedas/${CLIENTE_ID}`,
    );
    expect(result).toEqual(singleResponse);
  });

  it('syncCatalogAll envía continue_on_error como query param', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: bulkResponse });

    const result = await platformCatalogSyncService.syncCatalogAll('paises', {
      continue_on_error: true,
    });

    expect(api.post).toHaveBeenCalledWith(
      '/catalogos-globales/sync/paises',
      undefined,
      { params: { continue_on_error: true } },
    );
    expect(result).toEqual(bulkResponse);
  });
});
