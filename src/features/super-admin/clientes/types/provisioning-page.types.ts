import type { CredencialesInicialesRead } from '../types/cliente.types';
import type { ProvisioningState } from './provisioning.types';

/** State vía navigate post-alta Dedicated (PR-C) — lectura en ClientProvisioningPage. */
export interface ClientProvisioningLocationState {
  credenciales?: CredencialesInicialesRead;
  clienteLabel?: string;
  statusUrl?: string;
  provisioning_state?: ProvisioningState;
}