import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ClientProvisioningPage from '../ClientProvisioningPage';
import type { DedicatedProvisioningStatusRead } from '../../types/provisioning.types';

const { CLIENTE_ID, mockRefresh, mockUseProvisioningPoll, mockRetryMutateAsync, mockAbortMutateAsync } =
  vi.hoisted(() => ({
    CLIENTE_ID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    mockRefresh: vi.fn().mockResolvedValue(undefined),
    mockUseProvisioningPoll: vi.fn(),
    mockRetryMutateAsync: vi.fn().mockResolvedValue({}),
    mockAbortMutateAsync: vi.fn().mockResolvedValue({}),
  }));

vi.mock('../../hooks/useProvisioningPoll', () => ({
  useProvisioningPoll: (...args: unknown[]) => mockUseProvisioningPoll(...args),
}));

vi.mock('../../hooks/useRetryProvisioning', () => ({
  useRetryProvisioning: () => ({
    mutateAsync: mockRetryMutateAsync,
    isPending: false,
  }),
}));

vi.mock('../../hooks/useAbortProvisioning', () => ({
  useAbortProvisioning: () => ({
    mutateAsync: mockAbortMutateAsync,
    isPending: false,
  }),
}));

vi.mock('../../services/cliente.service', () => ({
  clienteService: {
    getClienteById: vi.fn().mockResolvedValue({
      cliente_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      razon_social: 'ACME Corp',
      nombre_comercial: null,
      codigo_cliente: 'ACME001',
      subdominio: 'acme',
      tipo_instalacion: 'dedicated',
    }),
  },
}));

vi.mock('@/shared/context/AuthContext', () => ({
  useAuth: () => ({ isSuperAdmin: true }),
}));

function makeStatus(
  state: DedicatedProvisioningStatusRead['provisioning_state'],
  overrides?: Partial<DedicatedProvisioningStatusRead>,
): DedicatedProvisioningStatusRead {
  return {
    cliente_id: CLIENTE_ID,
    provisioning_state: state,
    provisioning_run_id: 'run-1',
    current_step: state === 'provisioning' ? 'registry' : null,
    steps: [
      {
        code: 'registry',
        status: state === 'provisioning' ? 'running' : 'completed',
        started_at: '2026-06-25T20:00:00Z',
        completed_at: state === 'provisioning' ? null : '2026-06-25T20:00:10Z',
      },
    ],
    started_at: '2026-06-25T20:00:00Z',
    updated_at: '2026-06-25T20:00:05Z',
    ready_at: state === 'ready' ? '2026-06-25T20:10:00Z' : null,
    failed_at: state === 'failed' ? '2026-06-25T20:10:00Z' : null,
    last_error_code: state === 'failed' ? 'PROVISIONING_SCHEMA_FAILED' : null,
    last_error_message: state === 'failed' ? 'Error DDL' : null,
    retry_allowed: state === 'failed',
    abort_allowed: state === 'provisioning',
    ...overrides,
  };
}

function renderPage(initialPath = `/super-admin/clientes/${CLIENTE_ID}/provisioning`) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/super-admin/clientes/:id/provisioning"
            element={<ClientProvisioningPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ClientProvisioningPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProvisioningPoll.mockReturnValue({
      status: makeStatus('provisioning'),
      isPolling: true,
      isTimedOut: false,
      pollConnectionError: false,
      fatalError: null,
      refresh: mockRefresh,
    });
  });

  it('muestra timeline con paso en ejecución durante provisioning', () => {
    renderPage();
    expect(screen.getByText('Provisioning del tenant')).toBeInTheDocument();
    expect(screen.getByText('Provisionando')).toBeInTheDocument();
    expect(screen.getByText('Registro tenant')).toBeInTheDocument();
  });

  it('muestra panel ready cuando el estado es ready', () => {
    mockUseProvisioningPoll.mockReturnValue({
      status: makeStatus('ready'),
      isPolling: false,
      isTimedOut: false,
      pollConnectionError: false,
      fatalError: null,
      refresh: mockRefresh,
    });

    renderPage();
    expect(screen.getByText('Tenant dedicated operativo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ir al detalle del cliente/i })).toBeInTheDocument();
  });

  it('muestra panel failed y permite reintentar', async () => {
    mockUseProvisioningPoll.mockReturnValue({
      status: makeStatus('failed'),
      isPolling: false,
      isTimedOut: false,
      pollConnectionError: false,
      fatalError: null,
      refresh: mockRefresh,
    });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /reintentar provisioning/i }));

    await waitFor(() => {
      expect(mockRetryMutateAsync).toHaveBeenCalledWith(CLIENTE_ID);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('aborta provisioning desde el diálogo de confirmación', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /^abortar$/i }));
    fireEvent.click(screen.getByRole('button', { name: /abortar provisioning/i }));

    await waitFor(() => {
      expect(mockAbortMutateAsync).toHaveBeenCalledWith({
        clienteId: CLIENTE_ID,
        reason: undefined,
      });
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('muestra error fatal cuando el poll reporta fallo HTTP', () => {
    mockUseProvisioningPoll.mockReturnValue({
      status: null,
      isPolling: false,
      isTimedOut: false,
      pollConnectionError: false,
      fatalError: new Error('Tenant no encontrado'),
      refresh: mockRefresh,
    });

    renderPage();
    expect(screen.getByText('Tenant no encontrado')).toBeInTheDocument();
  });
});
