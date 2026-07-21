import { describe, expect, it } from 'vitest';

import {
  getProvisioningPollIntervalMs,
  isProvisioningPollTimedOut,
  isTerminalProvisioningState,
  PROVISIONING_POLL_INITIAL_MS,
  PROVISIONING_POLL_LONG_MS,
  PROVISIONING_POLL_MEDIUM_MS,
  PROVISIONING_UI_TIMEOUT_MS,
} from '../provisioning-poll.utils';

describe('provisioning-poll.utils', () => {
  it('mapea intervalos por fase de backoff §10', () => {
    expect(getProvisioningPollIntervalMs(0)).toBe(PROVISIONING_POLL_INITIAL_MS);
    expect(getProvisioningPollIntervalMs(119_999)).toBe(PROVISIONING_POLL_INITIAL_MS);
    expect(getProvisioningPollIntervalMs(120_000)).toBe(PROVISIONING_POLL_MEDIUM_MS);
    expect(getProvisioningPollIntervalMs(599_999)).toBe(PROVISIONING_POLL_MEDIUM_MS);
    expect(getProvisioningPollIntervalMs(600_000)).toBe(PROVISIONING_POLL_LONG_MS);
  });

  it('detecta timeout UI de 30 minutos', () => {
    const startedAt = 1_000;
    expect(isProvisioningPollTimedOut(startedAt, startedAt + PROVISIONING_UI_TIMEOUT_MS - 1)).toBe(
      false,
    );
    expect(isProvisioningPollTimedOut(startedAt, startedAt + PROVISIONING_UI_TIMEOUT_MS)).toBe(
      true,
    );
  });

  it('identifica estados terminales ready y failed', () => {
    expect(isTerminalProvisioningState('ready')).toBe(true);
    expect(isTerminalProvisioningState('failed')).toBe(true);
    expect(isTerminalProvisioningState('provisioning')).toBe(false);
  });
});
