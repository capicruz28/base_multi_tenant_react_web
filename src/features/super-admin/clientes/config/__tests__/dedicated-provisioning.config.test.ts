import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  isDedicatedProvisioningV2Enabled,
  shouldUseDedicatedProvisioningFlow,
} from '../dedicated-provisioning.config';

describe('dedicated-provisioning.config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('retorna false cuando la variable de entorno está ausente', () => {
    vi.stubEnv('VITE_DEDICATED_PROVISIONING_V2', '');
    expect(isDedicatedProvisioningV2Enabled()).toBe(false);
  });

  it('retorna true cuando VITE_DEDICATED_PROVISIONING_V2=true', () => {
    vi.stubEnv('VITE_DEDICATED_PROVISIONING_V2', 'true');
    expect(isDedicatedProvisioningV2Enabled()).toBe(true);
  });

  it('retorna true cuando VITE_DEDICATED_PROVISIONING_V2=1', () => {
    vi.stubEnv('VITE_DEDICATED_PROVISIONING_V2', '1');
    expect(isDedicatedProvisioningV2Enabled()).toBe(true);
  });

  it('shouldUseDedicatedProvisioningFlow solo aplica a dedicated con v2 on', () => {
    vi.stubEnv('VITE_DEDICATED_PROVISIONING_V2', 'true');
    expect(shouldUseDedicatedProvisioningFlow('dedicated')).toBe(true);
    expect(shouldUseDedicatedProvisioningFlow('shared')).toBe(false);
  });

  it('shouldUseDedicatedProvisioningFlow es false con v2 off aunque sea dedicated', () => {
    vi.stubEnv('VITE_DEDICATED_PROVISIONING_V2', 'false');
    expect(shouldUseDedicatedProvisioningFlow('dedicated')).toBe(false);
  });
});
