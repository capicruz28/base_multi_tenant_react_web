import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'react-hot-toast';
import { usePlatformCatalogSync } from '../usePlatformCatalogSync';
import { platformCatalogSyncService } from '../../services/platform-catalog-sync.service';

vi.mock('../../services/platform-catalog-sync.service', () => ({
  platformCatalogSyncService: {
    syncCatalog: vi.fn(),
    syncCatalogAll: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const CLIENTE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('usePlatformCatalogSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('syncCatalog muestra toast success con tenant del backend', async () => {
    vi.mocked(platformCatalogSyncService.syncCatalog).mockResolvedValue({
      catalogo: 'monedas',
      estado: 'completado',
      duracion_ms: 500,
      insertados: 1,
      actualizados: 0,
      desactivados: 0,
      omitidos: 0,
      cliente_id: CLIENTE_ID,
      razon_social: 'Tenant Dedicated Demo',
    });

    const { result } = renderHook(() => usePlatformCatalogSync('moneda'), {
      wrapper: createWrapper(),
    });

    await result.current.syncCatalog(CLIENTE_ID);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Catálogo Monedas sincronizado con Tenant Dedicated Demo.',
      );
    });
  });

  it('syncCatalogAll no muestra toast success', async () => {
    vi.mocked(platformCatalogSyncService.syncCatalogAll).mockResolvedValue({
      catalogo: 'monedas',
      estado: 'completado',
      duracion_ms: 1000,
      insertados: 2,
      actualizados: 1,
      desactivados: 0,
      omitidos: 0,
      tenants_procesados: 1,
      completados: 1,
      fallidos: 0,
      resultados: [],
    });

    const { result } = renderHook(() => usePlatformCatalogSync('moneda'), {
      wrapper: createWrapper(),
    });

    await result.current.syncCatalogAll({ continue_on_error: true });

    await waitFor(() => {
      expect(platformCatalogSyncService.syncCatalogAll).toHaveBeenCalledWith(
        'monedas',
        expect.objectContaining({ continue_on_error: true }),
      );
    });
    expect(toast.success).not.toHaveBeenCalled();
  });
});
