import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ClientManagementPage from '../ClientManagementPage';
import type { Cliente } from '../../types/cliente.types';

const CLIENTE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/shared/context/AuthContext', () => ({
  useAuth: () => ({ isSuperAdmin: true }),
}));

vi.mock('@/core/hooks/useClientes', () => ({
  useClientes: vi.fn(),
}));

vi.mock('@/core/hooks/useClienteMutations', () => ({
  useActivateCliente: () => ({ mutate: vi.fn(), isPending: false }),
  useDeactivateCliente: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../../config/dedicated-provisioning.config', () => ({
  shouldUseDedicatedProvisioningFlow: vi.fn(),
}));

import { useClientes } from '@/core/hooks/useClientes';
import { shouldUseDedicatedProvisioningFlow } from '../../config/dedicated-provisioning.config';

const mockUseClientes = vi.mocked(useClientes);
const mockShouldUseFlow = vi.mocked(shouldUseDedicatedProvisioningFlow);

const dedicatedCliente: Cliente = {
  cliente_id: CLIENTE_ID,
  codigo_cliente: 'ACME001',
  subdominio: 'acme',
  razon_social: 'ACME Corp',
  nombre_comercial: 'ACME',
  ruc: null,
  tipo_instalacion: 'dedicated',
  servidor_api_local: null,
  modo_autenticacion: 'local',
  logo_url: null,
  favicon_url: null,
  color_primario: '#000000',
  color_secundario: '#ffffff',
  tema_personalizado: null,
  plan_suscripcion: 'trial',
  estado_suscripcion: 'activo',
  fecha_inicio_suscripcion: null,
  fecha_fin_trial: null,
  contacto_nombre: 'Admin',
  contacto_email: 'admin@acme.test',
  contacto_telefono: null,
  es_activo: true,
  es_demo: false,
  metadata_json: null,
  api_key_sincronizacion: null,
  sincronizacion_habilitada: false,
  ultima_sincronizacion: null,
  fecha_creacion: '2026-06-25T20:00:00Z',
  fecha_actualizacion: null,
  fecha_ultimo_acceso: null,
  provisioning_state: 'failed',
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ClientManagementPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ClientManagementPage — provisioning surfaces PR-D', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClientes.mockReturnValue({
      data: {
        clientes: [dedicatedCliente],
        total_clientes: 1,
        pagina_actual: 1,
        total_paginas: 1,
        items_por_pagina: 25,
      },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useClientes>);
  });

  it('con flag off no muestra badge ni acción provisioning', () => {
    mockShouldUseFlow.mockReturnValue(false);

    renderPage();

    expect(screen.queryByText('Fallido')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Ver provisioning')).not.toBeInTheDocument();
  });

  it('dedicated F4 muestra badge y acción ver provisioning', () => {
    mockShouldUseFlow.mockReturnValue(true);

    renderPage();

    expect(screen.getByText('Fallido')).toBeInTheDocument();
    expect(screen.getByTitle('Ver provisioning')).toBeInTheDocument();
  });

  it('ver provisioning navega desde listado', () => {
    mockShouldUseFlow.mockReturnValue(true);

    renderPage();
    fireEvent.click(screen.getByTitle('Ver provisioning'));

    expect(mockNavigate).toHaveBeenCalledWith(
      `/super-admin/clientes/${CLIENTE_ID}/provisioning`,
      {
        state: {
          clienteLabel: 'ACME',
          provisioning_state: 'failed',
        },
      },
    );
  });
});
