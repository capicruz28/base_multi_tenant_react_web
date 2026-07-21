import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  resolveConnectionCreateMode,
  shouldShowDedicatedConnectionRepairAction,
  shouldShowDedicatedProvisioningConnectionBanner,
  shouldShowStandardCreateConnectionAction,
  usesDedicatedConnectionF4Governance,
} from '../cliente-connection-governance.utils';

vi.mock('../../config/dedicated-provisioning.config', () => ({
  shouldUseDedicatedProvisioningFlow: vi.fn(),
}));

import { shouldUseDedicatedProvisioningFlow } from '../../config/dedicated-provisioning.config';

const mockShouldUseFlow = vi.mocked(shouldUseDedicatedProvisioningFlow);

const principalConnection = {
  es_conexion_principal: true,
  es_activo: true,
};

describe('cliente-connection-governance.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shared mantiene flujo estándar con flag on', () => {
    mockShouldUseFlow.mockReturnValue(false);

    expect(usesDedicatedConnectionF4Governance('shared')).toBe(false);
    expect(shouldShowStandardCreateConnectionAction('shared')).toBe(true);
    expect(shouldShowDedicatedProvisioningConnectionBanner('shared')).toBe(false);
    expect(resolveConnectionCreateMode('shared')).toBe('standard');
  });

  it('dedicated con flag off mantiene comportamiento legacy', () => {
    mockShouldUseFlow.mockReturnValue(false);

    expect(shouldShowStandardCreateConnectionAction('dedicated')).toBe(true);
    expect(
      shouldShowDedicatedConnectionRepairAction('dedicated', undefined, []),
    ).toBe(false);
  });

  it('dedicated F4 oculta creación estándar y muestra banner', () => {
    mockShouldUseFlow.mockReturnValue(true);

    expect(shouldShowStandardCreateConnectionAction('dedicated')).toBe(false);
    expect(shouldShowDedicatedProvisioningConnectionBanner('dedicated')).toBe(true);
    expect(resolveConnectionCreateMode('dedicated')).toBe('repair');
  });

  it('repair solo cuando aplica según estado y conexiones', () => {
    mockShouldUseFlow.mockReturnValue(true);

    expect(
      shouldShowDedicatedConnectionRepairAction('dedicated', 'provisioning', []),
    ).toBe(false);
    expect(
      shouldShowDedicatedConnectionRepairAction('dedicated', 'failed', []),
    ).toBe(true);
    expect(
      shouldShowDedicatedConnectionRepairAction('dedicated', null, []),
    ).toBe(true);
    expect(
      shouldShowDedicatedConnectionRepairAction('dedicated', 'ready', [principalConnection]),
    ).toBe(false);
    expect(
      shouldShowDedicatedConnectionRepairAction('dedicated', 'ready', []),
    ).toBe(true);
  });
});
