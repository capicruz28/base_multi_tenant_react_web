import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePlatformDashboardP1A } from '../usePlatformDashboardP1A';
import { superadminAuditoriaService } from '@/services/superadmin-auditoria.service';
import { AUTH_LOGIN_FAILURES_THRESHOLD } from '../../utils/dashboard-alert.rules';

vi.mock('@/services/superadmin-auditoria.service', () => ({
  superadminAuditoriaService: {
    getAuditoriaEstadisticas: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('usePlatformDashboardP1A', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(superadminAuditoriaService.getAuditoriaEstadisticas).mockResolvedValue({
      periodo: {
        fecha_desde: '2026-06-02T00:00:00',
        fecha_hasta: '2026-06-03T00:00:00',
      },
      autenticacion: {
        total_eventos: 1250,
        login_exitosos: 1180,
        login_fallidos: 70,
        eventos_por_tipo: { login_success: 1180, login_failed: 70 },
      },
      sincronizacion: {
        total_sincronizaciones: 45,
        exitosas: 42,
        fallidas: 3,
        por_tipo: { manual: 10, scheduled: 35 },
      },
      top_ips: [
        {
          ip_address: '203.0.113.50',
          total_eventos: 320,
          eventos_fallidos: 15,
        },
      ],
      top_usuarios: [],
    });
  });

  it('loads W3, W4, W5 from getAuditoriaEstadisticas with 24h window', async () => {
    const { result } = renderHook(() => usePlatformDashboardP1A(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loginsFallidos.isLoading).toBe(false);
    });

    expect(result.current.loginsFallidos.value).toBe(70);
    expect(result.current.loginsExitosos.value).toBe(1180);
    expect(result.current.syncFallidas.value).toBe(3);
    expect(superadminAuditoriaService.getAuditoriaEstadisticas).toHaveBeenCalledTimes(1);

    const call = vi.mocked(superadminAuditoriaService.getAuditoriaEstadisticas).mock.calls[0][0];
    expect(call?.fecha_desde).toBeDefined();
    expect(call?.fecha_hasta).toBeDefined();
  });

  it('builds security alerts from estadisticas response', async () => {
    const { result } = renderHook(() => usePlatformDashboardP1A(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loginsFallidos.isLoading).toBe(false);
    });

    expect(
      result.current.securityAlerts.some((a) => a.codigo === 'AUTH_LOGIN_FAILURES_HIGH'),
    ).toBe(true);
    expect(result.current.securityAlerts.some((a) => a.codigo === 'AUTH_SYNC_FAILURES')).toBe(
      true,
    );
    expect(result.current.loginsFallidos.value).toBeGreaterThanOrEqual(
      AUTH_LOGIN_FAILURES_THRESHOLD,
    );
  });

  it('does not fetch when disabled', () => {
    renderHook(() => usePlatformDashboardP1A(false), { wrapper: createWrapper() });
    expect(superadminAuditoriaService.getAuditoriaEstadisticas).not.toHaveBeenCalled();
  });
});
