/**
 * IAM-FE-PHASE-08 IMPL-01 — session-telemetry.flags tests.
 */
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SESSION_TELEMETRY_AUTH_SYNC_V8_ENABLED,
  DEFAULT_SESSION_TELEMETRY_DEV_V8_ENABLED,
  DEFAULT_SESSION_TELEMETRY_REFRESH_V8_ENABLED,
  DEFAULT_SESSION_TELEMETRY_TERMINATION_V8_ENABLED,
  DEFAULT_SESSION_TELEMETRY_V8_ENABLED,
  getSessionTelemetryFlagsSnapshot,
  isSessionTelemetryAuthSyncActive,
  isSessionTelemetryEffective,
  isSessionTelemetryRefreshActive,
  isSessionTelemetryTerminationActive,
  parseSessionTelemetryV8Enabled,
} from '@/core/auth/session/session-telemetry.flags';

describe('session-telemetry.flags (IMPL-01)', () => {
  it('defaults master + sub-flags ON', () => {
    expect(DEFAULT_SESSION_TELEMETRY_V8_ENABLED).toBe(true);
    expect(DEFAULT_SESSION_TELEMETRY_DEV_V8_ENABLED).toBe(true);
    expect(DEFAULT_SESSION_TELEMETRY_REFRESH_V8_ENABLED).toBe(true);
    expect(DEFAULT_SESSION_TELEMETRY_TERMINATION_V8_ENABLED).toBe(true);
    expect(DEFAULT_SESSION_TELEMETRY_AUTH_SYNC_V8_ENABLED).toBe(true);
  });

  it('parseBoolean env values', () => {
    expect(parseSessionTelemetryV8Enabled('false')).toBe(false);
    expect(parseSessionTelemetryV8Enabled('true')).toBe(true);
    expect(parseSessionTelemetryV8Enabled(undefined)).toBe(true);
  });

  it('L1 rollback — master OFF silencia sub-flags', () => {
    const flags = getSessionTelemetryFlagsSnapshot({ masterEnabled: false });
    expect(isSessionTelemetryEffective(flags)).toBe(false);
    expect(isSessionTelemetryRefreshActive(flags)).toBe(false);
    expect(isSessionTelemetryTerminationActive(flags)).toBe(false);
    expect(isSessionTelemetryAuthSyncActive(flags)).toBe(false);
  });

  it('sub-flags ortogonales a master ON', () => {
    const flags = getSessionTelemetryFlagsSnapshot({
      masterEnabled: true,
      refreshEnabled: false,
      terminationEnabled: false,
    });
    expect(isSessionTelemetryRefreshActive(flags)).toBe(false);
    expect(isSessionTelemetryTerminationActive(flags)).toBe(false);
    expect(isSessionTelemetryEffective(flags)).toBe(true);
  });
});
