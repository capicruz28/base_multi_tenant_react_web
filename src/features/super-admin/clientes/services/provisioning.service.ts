/**
 * Servicio HTTP — Dedicated Provisioning F4 (Super Admin).
 * Errores propagan AxiosError para resolución en hooks vía getErrorMessage.
 */
import api from '@/core/api/api';
import type {
  DedicatedProvisioningStatusRead,
  ProvisioningAbortResponse,
  ProvisioningRetryResponse,
} from '../types/provisioning.types';

const CLIENTES_BASE_URL = '/clientes';

function buildProvisioningStatusUrl(clienteId: string): string {
  return `${CLIENTES_BASE_URL}/${clienteId}/provisioning-status/`;
}

export const provisioningService = {
  /**
   * GET /api/v1/clientes/{cliente_id}/provisioning-status/
   * @param statusUrl — prioridad sobre URL canónica (campo `provisioning.status_url` del 201).
   */
  async getProvisioningStatus(
    clienteId: string,
    options?: { statusUrl?: string },
  ): Promise<DedicatedProvisioningStatusRead> {
    const url = options?.statusUrl?.trim() || buildProvisioningStatusUrl(clienteId);
    const { data } = await api.get<DedicatedProvisioningStatusRead>(url);
    return data;
  },

  /** POST /api/v1/clientes/{cliente_id}/provisioning/retry — éxito HTTP 202 */
  async retryProvisioning(clienteId: string): Promise<ProvisioningRetryResponse> {
    const { data } = await api.post<ProvisioningRetryResponse>(
      `${CLIENTES_BASE_URL}/${clienteId}/provisioning/retry`,
      {},
    );
    return data;
  },

  /** POST /api/v1/clientes/{cliente_id}/provisioning/abort — body opcional { reason } */
  async abortProvisioning(
    clienteId: string,
    reason?: string,
  ): Promise<ProvisioningAbortResponse> {
    const trimmedReason = reason?.trim();
    const body = trimmedReason ? { reason: trimmedReason } : {};
    const { data } = await api.post<ProvisioningAbortResponse>(
      `${CLIENTES_BASE_URL}/${clienteId}/provisioning/abort`,
      body,
    );
    return data;
  },
};
