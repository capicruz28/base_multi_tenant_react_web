import type { Cliente } from '../types/cliente.types';
import type {
  ProvisioningInfoRead,
  ProvisioningState,
} from '../types/provisioning.types';

export interface ParsedProvisioningCreateEnvelope {
  provisioning?: ProvisioningInfoRead;
  provisioningState?: ProvisioningState;
  provisioningRunId?: string;
}

function isProvisioningState(value: unknown): value is ProvisioningState {
  return value === 'provisioning' || value === 'ready' || value === 'failed';
}

/**
 * Extrae campos aditivos F4 del envelope POST /clientes/ sin alterar parse Shared.
 */
export function parseProvisioningCreateEnvelope(
  data: Cliente,
  rawProvisioning: unknown,
): ParsedProvisioningCreateEnvelope {
  const result: ParsedProvisioningCreateEnvelope = {};

  if (isProvisioningState(data.provisioning_state)) {
    result.provisioningState = data.provisioning_state;
  }

  if (typeof data.provisioning_run_id === 'string' && data.provisioning_run_id.trim()) {
    result.provisioningRunId = data.provisioning_run_id.trim();
  }

  if (rawProvisioning && typeof rawProvisioning === 'object') {
    const info = rawProvisioning as Record<string, unknown>;
    const statusUrl = typeof info.status_url === 'string' ? info.status_url.trim() : '';
    if (statusUrl) {
      const provisioning: ProvisioningInfoRead = { status_url: statusUrl };
      if (typeof info.estimated_duration_seconds === 'number') {
        provisioning.estimated_duration_seconds = info.estimated_duration_seconds;
      }
      result.provisioning = provisioning;
    }
  }

  return result;
}
