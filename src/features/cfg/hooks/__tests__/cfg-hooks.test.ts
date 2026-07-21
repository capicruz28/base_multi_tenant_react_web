import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useCfgSecuenciasErpList } from '../useCfgSecuenciasErpList';
import { useCfgSecuencia } from '../useCfgSecuencia';
import { useUpdateCfgSecuencia } from '../useUpdateCfgSecuencia';
import { useDesactivarCfgSecuencia } from '../useDesactivarCfgSecuencia';
import { useReactivarCfgSecuencia } from '../useReactivarCfgSecuencia';
import { usePreviewCfgSecuencia } from '../usePreviewCfgSecuencia';
import { cfgSecuenciaService } from '../../services/cfg-secuencias.service';
import {
  fixturePreviewOk,
  fixtureSecuenciaActiva,
} from '../../__tests__/fixtures/cfg-secuencia.fixtures';

vi.mock('../../services/cfg-secuencias.service', () => ({
  cfgSecuenciaService: {
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    desactivar: vi.fn(),
    reactivar: vi.fn(),
    preview: vi.fn(),
  },
}));

vi.mock('@/features/tenant/components/TenantContext', () => ({
  useTenant: () => ({
    tenantId: 'tenant-test',
    isTenantValid: true,
    subdomain: 'test',
    resetTenant: vi.fn(),
    setTenant: vi.fn(),
  }),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { wrapper, queryClient };
}

describe('CFG React Query hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useCfgSecuenciasErpList enabled false → no fetch', () => {
    const { wrapper } = createWrapper();
    renderHook(() => useCfgSecuenciasErpList({ enabled: false }), {
      wrapper,
    });
    expect(cfgSecuenciaService.list).not.toHaveBeenCalled();
  });

  it('useCfgSecuenciasErpList al cambiar filtro resetea page a 1', async () => {
    vi.mocked(cfgSecuenciaService.list).mockResolvedValue({
      items: [fixtureSecuenciaActiva],
      total: 1,
      pagina_actual: 1,
      total_paginas: 1,
      limit: 50,
    });

    const { wrapper } = createWrapper();
    const { result, rerender } = renderHook(
      (props: { modulo_codigo?: string }) =>
        useCfgSecuenciasErpList({
          modulo_codigo: props.modulo_codigo,
          enabled: true,
        }),
      { wrapper, initialProps: { modulo_codigo: 'ORG' } },
    );

    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => {
      result.current.setPage(3);
    });
    expect(result.current.page).toBe(3);

    rerender({ modulo_codigo: 'INV' });

    await waitFor(() => expect(result.current.page).toBe(1));
  });

  it('useCfgSecuencia sin id → no fetch', () => {
    const { wrapper } = createWrapper();
    renderHook(() => useCfgSecuencia(null), { wrapper });
    expect(cfgSecuenciaService.getById).not.toHaveBeenCalled();
  });

  it('useUpdateCfgSecuencia invalida list y toast success', async () => {
    vi.mocked(cfgSecuenciaService.update).mockResolvedValue(
      fixtureSecuenciaActiva,
    );
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateCfgSecuencia(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: fixtureSecuenciaActiva.secuencia_id,
        body: { prefijo: 'DEP' },
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Configuración actualizada.');
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['cfg', 'secuencias', 'list'],
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          'cfg',
          'secuencia',
          fixtureSecuenciaActiva.secuencia_id,
        ],
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['codigo', 'runtime', 'snapshot'],
      }),
    );
  });

  it('useDesactivarCfgSecuencia invalida list + detail', async () => {
    vi.mocked(cfgSecuenciaService.desactivar).mockResolvedValue({
      ...fixtureSecuenciaActiva,
      es_activo: false,
    });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDesactivarCfgSecuencia(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(fixtureSecuenciaActiva.secuencia_id);
    });

    expect(toast.success).toHaveBeenCalledWith('Secuencia desactivada.');
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['cfg', 'secuencias', 'list'] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          'cfg',
          'secuencia',
          fixtureSecuenciaActiva.secuencia_id,
        ],
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['codigo', 'runtime', 'snapshot'],
      }),
    );
  });

  it('useReactivarCfgSecuencia invalida list + detail', async () => {
    vi.mocked(cfgSecuenciaService.reactivar).mockResolvedValue(
      fixtureSecuenciaActiva,
    );
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useReactivarCfgSecuencia(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(fixtureSecuenciaActiva.secuencia_id);
    });

    expect(toast.success).toHaveBeenCalledWith('Secuencia reactivada.');
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['cfg', 'secuencias', 'list'] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          'cfg',
          'secuencia',
          fixtureSecuenciaActiva.secuencia_id,
        ],
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['codigo', 'runtime', 'snapshot'],
      }),
    );
  });

  it('usePreviewCfgSecuencia NO invalida listado', async () => {
    vi.mocked(cfgSecuenciaService.preview).mockResolvedValue(fixturePreviewOk);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => usePreviewCfgSecuencia(), { wrapper });

    let previewData: typeof fixturePreviewOk | undefined;
    await act(async () => {
      previewData = await result.current.mutateAsync(
        fixtureSecuenciaActiva.secuencia_id,
      );
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(previewData).toEqual(fixturePreviewOk);
    await waitFor(() =>
      expect(result.current.data).toEqual(fixturePreviewOk),
    );
  });
});
