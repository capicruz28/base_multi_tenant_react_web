import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/core/api/api';
import { provisioningService } from '../provisioning.service';
import type { DedicatedProvisioningStatusRead } from '../../types/provisioning.types';

vi.mock('@/core/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const CLIENTE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const provisioningStatus: DedicatedProvisioningStatusRead = {
  cliente_id: CLIENTE_ID,
  provisioning_state: 'provisioning',
  provisioning_run_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  current_step: 'registry',
  steps: [],
  started_at: '2026-06-25T20:00:00Z',
  updated_at: '2026-06-25T20:00:05Z',
  ready_at: null,
  failed_at: null,
  last_error_code: null,
  last_error_message: null,
  retry_allowed: false,
  abort_allowed: true,
};

describe('provisioningService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getProvisioningStatus usa URL canónica con trailing slash', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: provisioningStatus });

    const result = await provisioningService.getProvisioningStatus(CLIENTE_ID);

    expect(api.get).toHaveBeenCalledWith(`/clientes/${CLIENTE_ID}/provisioning-status/`);
    expect(result).toEqual(provisioningStatus);
  });

  it('getProvisioningStatus prioriza statusUrl del 201', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: provisioningStatus });
    const customUrl = `/clientes/${CLIENTE_ID}/provisioning-status/?run=1`;

    await provisioningService.getProvisioningStatus(CLIENTE_ID, {
      statusUrl: customUrl,
    });

    expect(api.get).toHaveBeenCalledWith(customUrl);
  });

  it('retryProvisioning llama POST retry con body vacío', async () => {
    const retryResponse = {
      success: true,
      message: 'Reintento de provisioning iniciado.',
      provisioning_run_id: 'run-2',
      provisioning_state: 'provisioning' as const,
    };
    vi.mocked(api.post).mockResolvedValue({ data: retryResponse });

    const result = await provisioningService.retryProvisioning(CLIENTE_ID);

    expect(api.post).toHaveBeenCalledWith(
      `/clientes/${CLIENTE_ID}/provisioning/retry`,
      {},
    );
    expect(result).toEqual(retryResponse);
  });

  it('abortProvisioning envía reason cuando se proporciona', async () => {
    const abortResponse = {
      success: true,
      message: 'Provisioning abortado.',
      provisioning_state: 'failed' as const,
      cleanup_checklist_url: null,
    };
    vi.mocked(api.post).mockResolvedValue({ data: abortResponse });

    await provisioningService.abortProvisioning(CLIENTE_ID, '  cancelado por ops  ');

    expect(api.post).toHaveBeenCalledWith(`/clientes/${CLIENTE_ID}/provisioning/abort`, {
      reason: 'cancelado por ops',
    });
  });

  it('abortProvisioning envía body vacío sin reason', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        provisioning_state: 'failed',
        cleanup_checklist_url: null,
      },
    });

    await provisioningService.abortProvisioning(CLIENTE_ID);

    expect(api.post).toHaveBeenCalledWith(`/clientes/${CLIENTE_ID}/provisioning/abort`, {});
  });
});
