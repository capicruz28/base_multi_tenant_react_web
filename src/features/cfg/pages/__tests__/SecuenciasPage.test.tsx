import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SecuenciasPage from '../SecuenciasPage';
import { CFG_PERMISSIONS } from '../../constants/cfg-permissions';
import {
  fixtureListEnvelope,
  fixturePreviewOk,
  fixtureSecuenciaActiva,
  fixtureSecuenciaNoPreview,
} from '../../__tests__/fixtures/cfg-secuencia.fixtures';

const mockHasPermission = vi.fn();
const mockList = vi.fn();
const mockGetById = vi.fn();
const mockDesactivar = vi.fn();
const mockPreview = vi.fn();

vi.mock('@/core/auth/PermissionContext', () => ({
  usePermission: () => ({
    hasPermission: mockHasPermission,
    permissionsInitialized: true,
  }),
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

vi.mock('../../services/cfg-secuencias.service', () => ({
  cfgSecuenciaService: {
    list: (...args: unknown[]) => mockList(...args),
    getById: (...args: unknown[]) => mockGetById(...args),
    update: vi.fn(),
    desactivar: (...args: unknown[]) => mockDesactivar(...args),
    reactivar: vi.fn(),
    preview: (...args: unknown[]) => mockPreview(...args),
  },
}));

vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SecuenciasPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SecuenciasPage (Wave 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation(
      (code: string) =>
        code === CFG_PERMISSIONS.SECUENCIAS_CONSULTAR ||
        code === CFG_PERMISSIONS.SECUENCIAS_ACTUALIZAR,
    );
    mockList.mockResolvedValue(fixtureListEnvelope);
    mockGetById.mockResolvedValue(fixtureSecuenciaActiva);
    mockDesactivar.mockResolvedValue({
      ...fixtureSecuenciaActiva,
      es_activo: false,
    });
    mockPreview.mockResolvedValue(fixturePreviewOk);
  });

  it('sin consultar → Navigate unauthorized', () => {
    mockHasPermission.mockReturnValue(false);
    renderPage();
    expect(
      screen.queryByLabelText('Buscar secuencias de código'),
    ).not.toBeInTheDocument();
  });

  it('renderiza Preview en fila cuando supports_preview', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('org_departamento')).toBeInTheDocument();
    });

    expect(
      screen.getAllByLabelText('Preview código estimado').length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.queryByRole('button', { name: /crear/i }),
    ).not.toBeInTheDocument();
  });

  it('oculta Preview si supports_preview false', async () => {
    mockList.mockResolvedValue({
      items: [fixtureSecuenciaNoPreview],
      total: 1,
      pagina_actual: 1,
      total_paginas: 1,
      limit: 50,
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('inv_almacen')).toBeInTheDocument();
    });
    expect(
      screen.queryByLabelText('Preview código estimado'),
    ).not.toBeInTheDocument();
  });

  it('abre Preview Dialog y muestra estimación', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(
        screen.getAllByLabelText('Preview código estimado')[0],
      ).toBeInTheDocument();
    });
    await user.click(screen.getAllByLabelText('Preview código estimado')[0]);

    await waitFor(() => {
      expect(screen.getByText('Código estimado')).toBeInTheDocument();
      expect(screen.getByText('EMP-0011')).toBeInTheDocument();
    });
    expect(mockPreview).toHaveBeenCalledWith(
      fixtureSecuenciaActiva.secuencia_id,
    );
  });

  it('Desactivar: Confirm → DELETE', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText('Desactivar secuencia')).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText('Desactivar secuencia'));

    await waitFor(() => {
      expect(screen.getByText('Desactivar secuencia')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Desactivar' }));

    await waitFor(() => {
      expect(mockDesactivar).toHaveBeenCalledWith(
        fixtureSecuenciaActiva.secuencia_id,
      );
    });
  });
});
