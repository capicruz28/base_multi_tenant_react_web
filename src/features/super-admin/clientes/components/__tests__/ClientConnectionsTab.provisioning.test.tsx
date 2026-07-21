import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import ClientConnectionsTab from '../ClientConnectionsTab';

vi.mock('../../config/dedicated-provisioning.config', () => ({
  shouldUseDedicatedProvisioningFlow: vi.fn(),
}));

vi.mock('../../services/conexion.service', () => ({
  conexionService: {
    getConexiones: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/cliente.service', () => ({
  clienteService: {
    getClienteById: vi.fn().mockResolvedValue({
      provisioning_state: 'provisioning',
    }),
  },
}));

import { shouldUseDedicatedProvisioningFlow } from '../../config/dedicated-provisioning.config';
import { conexionService } from '../../services/conexion.service';

const mockShouldUseFlow = vi.mocked(shouldUseDedicatedProvisioningFlow);
const mockGetConexiones = vi.mocked(conexionService.getConexiones);

const CLIENTE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

describe('ClientConnectionsTab — gobernanza F4 PR-E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConexiones.mockResolvedValue([]);
  });

  it('shared mantiene acción estándar de creación', async () => {
    mockShouldUseFlow.mockReturnValue(false);

    render(
      <ClientConnectionsTab clienteId={CLIENTE_ID} tipoInstalacion="shared" />,
    );

    expect(await screen.findByRole('button', { name: /nueva conexión/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reparar conexión/i })).not.toBeInTheDocument();
    expect(
      screen.queryByText(/provisioning f4 crea automáticamente/i),
    ).not.toBeInTheDocument();
  });

  it('dedicated F4 muestra banner y oculta creación estándar durante provisioning', async () => {
    mockShouldUseFlow.mockReturnValue(true);

    render(
      <ClientConnectionsTab clienteId={CLIENTE_ID} tipoInstalacion="dedicated" />,
    );

    expect(
      await screen.findByText(/provisioning f4 crea automáticamente/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /nueva conexión/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reparar conexión/i })).not.toBeInTheDocument();
  });

  it('dedicated F4 failed sin conexiones muestra repair', async () => {
    mockShouldUseFlow.mockReturnValue(true);
    const { clienteService } = await import('../../services/cliente.service');
    vi.mocked(clienteService.getClienteById).mockResolvedValue({
      provisioning_state: 'failed',
    } as Awaited<ReturnType<typeof clienteService.getClienteById>>);

    render(
      <ClientConnectionsTab clienteId={CLIENTE_ID} tipoInstalacion="dedicated" />,
    );

    expect(
      (await screen.findAllByRole('button', { name: /reparar conexión/i })).length,
    ).toBeGreaterThan(0);
  });

  it('dedicated legacy con flag off mantiene creación estándar', async () => {
    mockShouldUseFlow.mockReturnValue(false);

    render(
      <ClientConnectionsTab clienteId={CLIENTE_ID} tipoInstalacion="dedicated" />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /nueva conexión/i })).toBeInTheDocument();
    });
  });
});
