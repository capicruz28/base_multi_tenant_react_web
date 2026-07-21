import axios from 'axios';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { provisioningService } from '../../services/provisioning.service';
import { useProvisioningPoll } from '../useProvisioningPoll';
import type { DedicatedProvisioningStatusRead } from '../../types/provisioning.types';
import { PROVISIONING_UI_TIMEOUT_MS } from '../../utils/provisioning-poll.utils';

vi.mock('../../services/provisioning.service', () => ({
  provisioningService: {
    getProvisioningStatus: vi.fn(),
  },
}));

const CLIENTE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function makeStatus(
  state: DedicatedProvisioningStatusRead['provisioning_state'],
): DedicatedProvisioningStatusRead {
  return {
    cliente_id: CLIENTE_ID,
    provisioning_state: state,
    provisioning_run_id: 'run-1',
    current_step: 'registry',
    steps: [],
    started_at: '2026-06-25T20:00:00Z',
    updated_at: '2026-06-25T20:00:05Z',
    ready_at: state === 'ready' ? '2026-06-25T20:10:00Z' : null,
    failed_at: state === 'failed' ? '2026-06-25T20:10:00Z' : null,
    last_error_code: state === 'failed' ? 'PROVISIONING_SCHEMA_FAILED' : null,
    last_error_message: state === 'failed' ? 'Error al aplicar esquema' : null,
    retry_allowed: state === 'failed',
    abort_allowed: state === 'provisioning',
  };
}

async function flushPromises(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('useProvisioningPoll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('detiene polling al recibir provisioning_state ready', async () => {
    vi.mocked(provisioningService.getProvisioningStatus).mockResolvedValue(
      makeStatus('ready'),
    );

    const { result } = renderHook(() =>
      useProvisioningPoll({ clienteId: CLIENTE_ID, enabled: true }),
    );

    await flushPromises();

    expect(result.current.status?.provisioning_state).toBe('ready');
    expect(result.current.isPolling).toBe(false);
    expect(provisioningService.getProvisioningStatus).toHaveBeenCalledTimes(1);
  });

  it('detiene polling al recibir provisioning_state failed', async () => {
    vi.mocked(provisioningService.getProvisioningStatus).mockResolvedValue(
      makeStatus('failed'),
    );

    const { result } = renderHook(() =>
      useProvisioningPoll({ clienteId: CLIENTE_ID, enabled: true }),
    );

    await flushPromises();

    expect(result.current.status?.provisioning_state).toBe('failed');
    expect(result.current.isPolling).toBe(false);
  });

  it('marca pollConnectionError tras 3 fallos consecutivos 5xx', async () => {
    vi.useFakeTimers();
    const serverError = new axios.AxiosError('error', undefined, undefined, undefined, {
      status: 500,
      data: {},
      statusText: 'Error',
      headers: {},
      config: {} as never,
    });
    vi.mocked(provisioningService.getProvisioningStatus).mockRejectedValue(serverError);

    const { result } = renderHook(() =>
      useProvisioningPoll({ clienteId: CLIENTE_ID, enabled: true }),
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(result.current.pollConnectionError).toBe(true);
    expect(vi.mocked(provisioningService.getProvisioningStatus).mock.calls.length).toBeGreaterThanOrEqual(
      3,
    );
  });

  it('detiene polling en cleanup al desmontar', async () => {
    vi.useFakeTimers();
    vi.mocked(provisioningService.getProvisioningStatus).mockResolvedValue(
      makeStatus('provisioning'),
    );

    const { unmount } = renderHook(() =>
      useProvisioningPoll({ clienteId: CLIENTE_ID, enabled: true }),
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    const callsBeforeUnmount = vi.mocked(provisioningService.getProvisioningStatus).mock.calls
      .length;

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(provisioningService.getProvisioningStatus).toHaveBeenCalledTimes(callsBeforeUnmount);
  });

  it('marca isTimedOut tras 30 minutos', async () => {
    vi.useFakeTimers();
    vi.mocked(provisioningService.getProvisioningStatus).mockResolvedValue(
      makeStatus('provisioning'),
    );

    const { result } = renderHook(() =>
      useProvisioningPoll({ clienteId: CLIENTE_ID, enabled: true }),
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PROVISIONING_UI_TIMEOUT_MS + 5_000);
    });

    expect(result.current.isTimedOut).toBe(true);
    expect(result.current.isPolling).toBe(false);
  });
});
