import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ClientDetailPage from '../ClientDetailPage';
import type { Cliente } from '../../types/cliente.types';

const CLIENTE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const mockNavigate = vi.fn();
const mockEnterClientErp = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: CLIENTE_ID }),
  };
});

vi.mock('@/shared/context/AuthContext', () => ({
  useAuth: () => ({ isSuperAdmin: true, isImpersonation: false }),
}));

vi.mock('@/features/auth/hooks/useImpersonation', () => ({
  useImpersonation: () => ({
    enterClientErp: mockEnterClientErp,
    loading: false,
  }),
}));

vi.mock('../../services/cliente.service', () => ({
  clienteService: {
    getClienteById: vi.fn(),
    getClienteStats: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../../config/dedicated-provisioning.config', () => ({
  shouldUseDedicatedProvisioningFlow: vi.fn(),
}));

import { clienteService } from '../../services/cliente.service';
import { shouldUseDedicatedProvisioningFlow } from '../../config/dedicated-provisioning.config';

const mockGetClienteById = vi.mocked(clienteService.getClienteById);
const mockShouldUseFlow = vi.mocked(shouldUseDedicatedProvisioningFlow);

const baseCliente: Cliente = {
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
  contacto_nombre: null,
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
  provisioning_state: 'provisioning',
};

vi.mock('../../components/EditClientModal', () => ({
  default: () => null,
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ClientDetailPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ClientDetailPage — provisioning surfaces PR-D', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClienteById.mockResolvedValue(baseCliente);
  });

  it('con flag off no muestra badge ni acción provisioning', async () => {
    mockShouldUseFlow.mockReturnValue(false);

    renderPage();

    expect(await screen.findByRole('button', { name: /entrar al erp/i })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /ver provisioning/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Provisionando')).not.toBeInTheDocument();
  });

  it('dedicated F4 provisioning deshabilita ERP y muestra badge', async () => {
    mockShouldUseFlow.mockReturnValue(true);

    renderPage();

    expect(await screen.findByText('Provisionando')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver provisioning/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar al erp/i })).toBeDisabled();
  });

  it('dedicated F4 ready habilita ERP', async () => {
    mockShouldUseFlow.mockReturnValue(true);
    mockGetClienteById.mockResolvedValue({ ...baseCliente, provisioning_state: 'ready' });

    renderPage();

    expect(await screen.findByText('Operativo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar al erp/i })).toBeEnabled();
  });

  it('ver provisioning navega con state mínimo', async () => {
    mockShouldUseFlow.mockReturnValue(true);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /ver provisioning/i }));

    expect(mockNavigate).toHaveBeenCalledWith(
      `/super-admin/clientes/${CLIENTE_ID}/provisioning`,
      {
        state: {
          clienteLabel: 'ACME',
          provisioning_state: 'provisioning',
        },
      },
    );
  });
});
