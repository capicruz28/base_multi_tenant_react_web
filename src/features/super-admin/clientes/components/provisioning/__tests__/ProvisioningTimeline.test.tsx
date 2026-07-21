import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ProvisioningTimeline } from '../ProvisioningTimeline';
import type { DedicatedProvisioningStatusRead } from '../../../types/provisioning.types';

const CLIENTE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function makeStatus(
  overrides?: Partial<DedicatedProvisioningStatusRead>,
): DedicatedProvisioningStatusRead {
  return {
    cliente_id: CLIENTE_ID,
    provisioning_state: 'provisioning',
    provisioning_run_id: 'run-1',
    current_step: 'create_database',
    steps: [
      {
        code: 'registry',
        status: 'completed',
        started_at: '2026-06-25T20:00:00Z',
        completed_at: '2026-06-25T20:00:10Z',
      },
      {
        code: 'storage_allocation',
        status: 'completed',
        started_at: '2026-06-25T20:00:10Z',
        completed_at: '2026-06-25T20:00:20Z',
      },
      {
        code: 'create_database',
        status: 'running',
        started_at: '2026-06-25T20:00:20Z',
        completed_at: null,
      },
    ],
    started_at: '2026-06-25T20:00:00Z',
    updated_at: '2026-06-25T20:00:25Z',
    ready_at: null,
    failed_at: null,
    last_error_code: null,
    last_error_message: null,
    retry_allowed: false,
    abort_allowed: true,
    ...overrides,
  };
}

describe('ProvisioningTimeline', () => {
  it('renderiza los 10 pasos y resalta el paso en curso', () => {
    render(<ProvisioningTimeline status={makeStatus()} />);

    expect(screen.getByText('Registro tenant')).toBeInTheDocument();
    expect(screen.getByText('Creación base de datos')).toBeInTheDocument();
    expect(screen.getByText('Tenant Ready')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
