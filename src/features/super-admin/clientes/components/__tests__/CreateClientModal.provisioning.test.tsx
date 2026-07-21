import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import CreateClientModal from '../CreateClientModal';
import type { ClienteCreateResult } from '../../types/cliente.types';

const mockNavigate = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../hooks/useProvisionCliente', () => ({
  useProvisionCliente: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock('../../services/cliente.service', () => ({
  clienteService: {
    validateSubdominio: vi.fn().mockResolvedValue({ disponible: true }),
  },
}));

vi.mock('@/features/tenant/components/TenantContext', () => ({
  useTenant: () => ({ tenantId: null }),
}));

const sharedResult: ClienteCreateResult = {
  cliente: {
    cliente_id: '11111111-1111-1111-1111-111111111111',
    codigo_cliente: 'SHARED01',
    subdominio: 'shared-tenant',
    razon_social: 'Shared Tenant',
    nombre_comercial: null,
    ruc: null,
    tipo_instalacion: 'shared',
    servidor_api_local: null,
    modo_autenticacion: 'local',
    logo_url: null,
    favicon_url: null,
    color_primario: '#000',
    color_secundario: '#111',
    tema_personalizado: null,
    plan_suscripcion: 'trial',
    estado_suscripcion: 'activo',
    fecha_inicio_suscripcion: null,
    fecha_fin_trial: null,
    contacto_nombre: null,
    contacto_email: 'admin@shared.com',
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
  },
  credenciales: {
    nombre_usuario: 'admin',
    contrasena: 'secret-shared',
    requiere_cambio: true,
  },
  message: 'Cliente creado exitosamente',
};

const dedicatedResult: ClienteCreateResult = {
  ...sharedResult,
  cliente: {
    ...sharedResult.cliente,
    cliente_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    codigo_cliente: 'ACME001',
    subdominio: 'acme',
    razon_social: 'ACME Corp',
    tipo_instalacion: 'dedicated',
  },
  provisioningState: 'provisioning',
  provisioning: {
    status_url: '/api/v1/clientes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/provisioning-status/',
  },
};

function renderModal() {
  const queryClient = new QueryClient();
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <CreateClientModal isOpen onClose={onClose} onSuccess={onSuccess} />
    </QueryClientProvider>,
  );

  return { onClose, onSuccess };
}

async function fillBasicFields() {
  fireEvent.change(screen.getByLabelText(/código de cliente/i), {
    target: { value: 'ACME001' },
  });
  fireEvent.change(screen.getByLabelText(/subdominio/i), {
    target: { value: 'acme' },
  });
  fireEvent.change(screen.getByLabelText(/razón social/i), {
    target: { value: 'ACME Corp' },
  });
  fireEvent.change(screen.getByLabelText(/email de contacto/i), {
    target: { value: 'admin@acme.com' },
  });

  await act(async () => {
    await vi.advanceTimersByTimeAsync(600);
  });
}

async function goToSubscriptionSection() {
  fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
}

async function submitCreateForm() {
  await fillBasicFields();
  await goToSubscriptionSection();
  fireEvent.click(screen.getByRole('button', { name: /crear cliente/i }));
}

async function acknowledgeAndFinalize() {
  fireEvent.click(screen.getByRole('checkbox'));
  const finalizeButton = screen.getByRole('button', {
    name: /finalizar|continuar al provisioning/i,
  });
  fireEvent.click(finalizeButton);
}

describe('CreateClientModal — flujo PR-C', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubEnv('VITE_DEDICATED_PROVISIONING_V2', 'true');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('shared no navega a provisioning tras finalizar credenciales', async () => {
    mockMutateAsync.mockResolvedValue(sharedResult);
    const { onClose } = renderModal();

    await submitCreateForm();

    await waitFor(() => {
      expect(screen.getByText('Credenciales del administrador')).toBeInTheDocument();
    });

    await acknowledgeAndFinalize();

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('dedicated F4 navega a provisioning con location.state del 201', async () => {
    mockMutateAsync.mockResolvedValue(dedicatedResult);
    renderModal();

    await fillBasicFields();
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    fireEvent.change(screen.getByLabelText(/tipo de instalación/i), {
      target: { value: 'dedicated' },
    });

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    fireEvent.click(screen.getByRole('button', { name: /crear cliente/i }));

    await waitFor(() => {
      expect(screen.getByText(/acceso al ERP permanecerá bloqueado/i)).toBeInTheDocument();
    });

    await acknowledgeAndFinalize();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/super-admin/clientes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/provisioning',
        {
          state: {
            credenciales: dedicatedResult.credenciales,
            clienteLabel: 'ACME Corp',
            statusUrl: dedicatedResult.provisioning?.status_url,
            provisioning_state: 'provisioning',
          },
        },
      );
    });
  });

  it('dedicated con flag off no navega a provisioning', async () => {
    vi.stubEnv('VITE_DEDICATED_PROVISIONING_V2', 'false');
    mockMutateAsync.mockResolvedValue(dedicatedResult);
    renderModal();

    await fillBasicFields();
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    fireEvent.change(screen.getByLabelText(/tipo de instalación/i), {
      target: { value: 'dedicated' },
    });
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    fireEvent.click(screen.getByRole('button', { name: /crear cliente/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciales del administrador')).toBeInTheDocument();
    });
    expect(screen.queryByText(/acceso al ERP permanecerá bloqueado/i)).not.toBeInTheDocument();

    await acknowledgeAndFinalize();

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
