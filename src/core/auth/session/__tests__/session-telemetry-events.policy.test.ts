/**
 * IAM-FE-PHASE-08 IMPL-04/05 — events + correlation tests.
 */
import { describe, expect, it, beforeEach } from 'vitest';

import {
  buildSessionRefreshTelemetryPayload,
  resolveRefreshTelemetryEventName,
  resolveTerminationCaller,
} from '@/core/auth/session/session-telemetry-events.policy';
import {
  ensureCorrelationId,
  getActiveCorrelationId,
  rememberRefreshFailureEventId,
  consumeLastRefreshFailureEventId,
  resetCorrelationId,
  resetSessionTelemetryCorrelationForTests,
} from '@/core/auth/session/session-telemetry-correlation';
import { resetAuthSyncTabIdForTests } from '@/core/auth/session/session-auth-sync-emit';

describe('session-telemetry-events.policy (IMPL-04)', () => {
  it('resolveRefreshTelemetryEventName — success vs failure', () => {
    expect(
      resolveRefreshTelemetryEventName('ROTATED'),
    ).toBe('SESSION_REFRESH_SUCCESS');
    expect(
      resolveRefreshTelemetryEventName('REFRESH_FAILED_401'),
    ).toBe('SESSION_REFRESH_FAILURE');
  });

  it('buildSessionRefreshTelemetryPayload — solo metadata allowlisted', () => {
    const payload = buildSessionRefreshTelemetryPayload({
      metadata: {
        outcome: 'ROTATED',
        attemptCount: 1,
        backoffMsApplied: 0,
        source: 'interceptor',
        l02GuardActive: false,
        singleFlightRole: 'leader',
      },
      accessTokenPrefix: 'eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp',
    });
    expect(payload.outcome).toBe('ROTATED');
    expect(payload).not.toHaveProperty('accessToken');
    expect(payload.accessTokenPrefix).toBeDefined();
  });

  it('resolveTerminationCaller — refresh_fail vs manual', () => {
    expect(resolveTerminationCaller('REFRESH_UNAUTHORIZED')).toBe('refresh_fail');
    expect(resolveTerminationCaller('MANUAL_LOGOUT')).toBe('manual_logout');
  });
});

describe('session-telemetry-correlation (IMPL-05 / P1-04)', () => {
  beforeEach(() => {
    resetSessionTelemetryCorrelationForTests();
    resetAuthSyncTabIdForTests();
  });

  it('login rota correlationId — no mezcla sesiones', () => {
    ensureCorrelationId('bootstrap');
    const first = getActiveCorrelationId();
    ensureCorrelationId('login');
    const second = getActiveCorrelationId();
    expect(first).not.toBe(second);
  });

  it('terminate resetea correlationId', () => {
    ensureCorrelationId('login');
    expect(getActiveCorrelationId()).not.toBeNull();
    resetCorrelationId('terminate');
    expect(getActiveCorrelationId()).toBeNull();
  });

  it('V8.2 — parentEventId desde refresh failure', () => {
    rememberRefreshFailureEventId('evt-refresh-fail');
    expect(consumeLastRefreshFailureEventId()).toBe('evt-refresh-fail');
  });
});
