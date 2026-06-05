import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePlatformDashboardP1B } from '../usePlatformDashboardP1B';
import * as snapshotUtils from '../../utils/clientes-snapshot.utils';
import { SubscriptionPlan, SubscriptionStatus } from '@/core/constants';
import type { Cliente } from '@/features/super-admin/clientes/types/cliente.types';

vi.mock('../../utils/clientes-snapshot.utils', async (importOriginal) => {
  const actual = await importOriginal<typeof snapshotUtils>();
  return {
    ...actual,
    fetchClientesSnapshot: vi.fn(),
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

const sampleCliente: Cliente = {
  cliente_id: 'c1',
  codigo_cliente: 'ACME',
  subdominio: 'acme',
  razon_social: 'ACME',
  nombre_comercial: null,
  ruc: null,
  tipo_instalacion: 'shared',
  servidor_api_local: null,
  modo_autenticacion: 'local',
  logo_url: null,
  favicon_url: null,
  color_primario: '#000',
  color_secundario: '#fff',
  tema_personalizado: null,
  plan_suscripcion: SubscriptionPlan.BASIC,
  estado_suscripcion: SubscriptionStatus.SUSPENDED,
  fecha_inicio_suscripcion: null,
  fecha_fin_trial: null,
  contacto_nombre: null,
  contacto_email: 'a@acme.com',
  contacto_telefono: null,
  es_activo: true,
  es_demo: false,
  metadata_json: null,
  api_key_sincronizacion: null,
  sincronizacion_habilitada: false,
  ultima_sincronizacion: null,
  fecha_creacion: '2025-01-01',
  fecha_actualizacion: null,
  fecha_ultimo_acceso: null,
};

describe('usePlatformDashboardP1B', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(snapshotUtils.fetchClientesSnapshot).mockResolvedValue({
      clientes: [sampleCliente],
      totalReported: 1,
      isPartial: false,
    });
  });

  it('loads portfolio KPIs and alerts from snapshot', async () => {
    const { result } = renderHook(() => usePlatformDashboardP1B(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.suspendidos.isLoading).toBe(false);
    });

    expect(result.current.suspendidos.value).toBe(1);
    expect(snapshotUtils.fetchClientesSnapshot).toHaveBeenCalledTimes(1);
    expect(result.current.portfolioAlerts.some((a) => a.codigo === 'CLIENT_SUSPENDED')).toBe(
      true,
    );
    expect(result.current.planDistribution.length).toBeGreaterThan(0);
  });

  it('does not fetch when disabled', () => {
    renderHook(() => usePlatformDashboardP1B(false), { wrapper: createWrapper() });
    expect(snapshotUtils.fetchClientesSnapshot).not.toHaveBeenCalled();
  });
});
