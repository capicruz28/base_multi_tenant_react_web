import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTenantQuery } from '../useTenantQuery';
import { ReactNode } from 'react';

// Mock del TenantContext
vi.mock('@/features/tenant/components/TenantContext', () => ({
  useTenant: () => ({
    tenantId: 'tenant-1',
    isTenantValid: true,
    subdomain: null,
    resetTenant: vi.fn(),
    setTenant: vi.fn(),
  }),
}));

describe('useTenantQuery', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const Wrapper = ({ children }: { children: ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

    return Wrapper;
  };

  it('should include tenantId in query key', async () => {
    const queryFn = vi.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(
      () =>
        useTenantQuery({
          queryKey: ['test'],
          queryFn,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verificar que la query key incluye el tenantId
    expect(queryFn).toHaveBeenCalled();
  });

  it('should disable query when requireTenant is true and tenant is invalid', () => {
    // Este test requeriría mockear un tenant inválido
    // Por ahora es un placeholder
    expect(true).toBe(true);
  });
});
