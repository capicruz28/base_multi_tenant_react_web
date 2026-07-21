import { shouldUseDedicatedProvisioningFlow } from '../config/dedicated-provisioning.config';
import type { ClienteCreateResult } from '../types/cliente.types';
import type { ClientProvisioningLocationState } from '../types/provisioning-page.types';

export type ClientCredentialsRevealVariant = 'shared' | 'dedicated-provisioning';

export function shouldNavigateToDedicatedProvisioning(result: ClienteCreateResult): boolean {
  return (
    shouldUseDedicatedProvisioningFlow(result.cliente.tipo_instalacion) &&
    result.provisioningState === 'provisioning'
  );
}

export function getCredentialsRevealVariant(
  result: ClienteCreateResult,
): ClientCredentialsRevealVariant {
  return shouldNavigateToDedicatedProvisioning(result) ? 'dedicated-provisioning' : 'shared';
}

/** State para navigate post-reveal — solo datos del 201, sin re-fetch. */
export function buildProvisioningLocationState(
  result: ClienteCreateResult,
): ClientProvisioningLocationState {
  return {
    credenciales: result.credenciales,
    clienteLabel: result.cliente.nombre_comercial || result.cliente.razon_social,
    statusUrl: result.provisioning?.status_url,
    provisioning_state: result.provisioningState,
  };
}
