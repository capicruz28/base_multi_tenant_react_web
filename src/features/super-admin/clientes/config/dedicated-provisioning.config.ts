/**
 * Feature flag Dedicated Provisioning F4 (FE).
 * Alineado con DEDICATED_ENABLED en backend.
 *
 * §12.1 PLATFORM_ADMIN_TENANT_ONBOARDING_UI_CONTRACT:
 * si v2 deshabilitado, el alta Dedicated se trata como Shared (sin polling).
 */
export type TipoInstalacionProvisioning = 'shared' | 'dedicated' | 'onpremise' | 'hybrid';

export function isDedicatedProvisioningV2Enabled(): boolean {
  const raw = import.meta.env.VITE_DEDICATED_PROVISIONING_V2;
  if (raw === undefined || raw === '') {
    return false;
  }
  return raw === 'true' || raw === '1';
}

export function shouldUseDedicatedProvisioningFlow(
  tipoInstalacion: TipoInstalacionProvisioning,
): boolean {
  return tipoInstalacion === 'dedicated' && isDedicatedProvisioningV2Enabled();
}
