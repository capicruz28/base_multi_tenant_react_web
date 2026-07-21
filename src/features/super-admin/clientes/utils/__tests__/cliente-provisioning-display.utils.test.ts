import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  buildClientProvisioningNavigationState,
  buildClientProvisioningPath,
  canEnterClientErp,
  getClientErpEntryDisabledReason,
  getDedicatedProvisioningStateForDisplay,
  shouldShowDedicatedProvisioningSurfaces,
} from '../cliente-provisioning-display.utils';
import type { Cliente } from '../../types/cliente.types';

vi.mock('../../config/dedicated-provisioning.config', () => ({
  shouldUseDedicatedProvisioningFlow: vi.fn(),
}));

import { shouldUseDedicatedProvisioningFlow } from '../../config/dedicated-provisioning.config';

const mockShouldUse = vi.mocked(shouldUseDedicatedProvisioningFlow);

const baseCliente: Pick<
  Cliente,
  'cliente_id' | 'tipo_instalacion' | 'provisioning_state' | 'nombre_comercial' | 'razon_social'
> = {
  cliente_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  tipo_instalacion: 'dedicated',
  provisioning_state: 'provisioning',
  nombre_comercial: 'ACME',
  razon_social: 'ACME Corp',
};

describe('cliente-provisioning-display.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no muestra superficies F4 con flag off', () => {
    mockShouldUse.mockReturnValue(false);

    expect(shouldShowDedicatedProvisioningSurfaces(baseCliente)).toBe(false);
    expect(getDedicatedProvisioningStateForDisplay(baseCliente)).toBeNull();
    expect(canEnterClientErp(baseCliente)).toBe(true);
  });

  it('badge solo cuando dedicated F4 expone provisioning_state', () => {
    mockShouldUse.mockReturnValue(true);

    expect(getDedicatedProvisioningStateForDisplay(baseCliente)).toBe('provisioning');
    expect(
      getDedicatedProvisioningStateForDisplay({
        ...baseCliente,
        provisioning_state: null,
      }),
    ).toBeNull();
  });

  it('canEnterClientErp según estado dedicated F4', () => {
    mockShouldUse.mockReturnValue(true);

    expect(canEnterClientErp({ ...baseCliente, provisioning_state: 'provisioning' })).toBe(false);
    expect(canEnterClientErp({ ...baseCliente, provisioning_state: 'failed' })).toBe(false);
    expect(canEnterClientErp({ ...baseCliente, provisioning_state: 'ready' })).toBe(true);
    expect(canEnterClientErp({ ...baseCliente, provisioning_state: null })).toBe(true);
  });

  it('razones de bloqueo ERP', () => {
    mockShouldUse.mockReturnValue(true);

    expect(
      getClientErpEntryDisabledReason({ ...baseCliente, provisioning_state: 'provisioning' }),
    ).toMatch(/provisionando/i);
    expect(
      getClientErpEntryDisabledReason({ ...baseCliente, provisioning_state: 'failed' }),
    ).toMatch(/Ver provisioning/i);
    expect(getClientErpEntryDisabledReason(baseCliente, { isImpersonation: true })).toMatch(
      /modo soporte/i,
    );
  });

  it('buildClientProvisioningPath y navigation state', () => {
    expect(buildClientProvisioningPath(baseCliente.cliente_id)).toBe(
      `/super-admin/clientes/${baseCliente.cliente_id}/provisioning`,
    );
    expect(buildClientProvisioningNavigationState(baseCliente)).toEqual({
      clienteLabel: 'ACME',
      provisioning_state: 'provisioning',
    });
  });
});
