/**
 * IAM-FE-PHASE-08 IMPL-06/07 — emitter + mock sink tests.
 */
import { describe, expect, it, beforeEach } from 'vitest';

import {
  emitSessionRefreshTelemetry,
  emitSessionTerminationTelemetry,
} from '@/core/auth/session/session-telemetry.emitter';
import {
  ensureCorrelationId,
  resetSessionTelemetryCorrelationForTests,
} from '@/core/auth/session/session-telemetry-correlation';
import { resetAuthSyncTabIdForTests } from '@/core/auth/session/session-auth-sync-emit';
import type { SessionTelemetryEnvelope, SessionTelemetrySink } from '@/core/auth/session/session-telemetry.types';

describe('session-telemetry.emitter (IMPL-06)', () => {
  const envelopes: SessionTelemetryEnvelope[] = [];
  const mockSink: SessionTelemetrySink = {
    emit(envelope) {
      envelopes.push(envelope);
    },
  };

  beforeEach(() => {
    envelopes.length = 0;
    resetSessionTelemetryCorrelationForTests();
    resetAuthSyncTabIdForTests();
    ensureCorrelationId('login');
  });

  it('V8.1 — refresh success sin token completo en payload', () => {
    const fullToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';

    emitSessionRefreshTelemetry(
      {
        metadata: {
          outcome: 'ROTATED',
          attemptCount: 1,
          backoffMsApplied: 0,
          source: 'interceptor',
          l02GuardActive: false,
          singleFlightRole: 'leader',
        },
        accessTokenPrefix: fullToken.slice(0, 28),
      },
      { flags: { masterEnabled: true, devSinkEnabled: true, refreshEnabled: true, terminationEnabled: true, authSyncEnabled: true }, sink: mockSink },
    );

    expect(envelopes).toHaveLength(1);
    expect(envelopes[0]?.eventName).toBe('SESSION_REFRESH_SUCCESS');
    expect(JSON.stringify(envelopes[0]?.payload)).not.toContain(fullToken);
    expect(envelopes[0]?.payload.accessTokenPrefix).toBe(fullToken.slice(0, 28));
  });

  it('V8.2 — cadena refresh fail → terminate mismo correlationId', () => {
    const flags = {
      masterEnabled: true,
      devSinkEnabled: true,
      refreshEnabled: true,
      terminationEnabled: true,
      authSyncEnabled: true,
    };

    const refreshEventId = emitSessionRefreshTelemetry(
      {
        metadata: {
          outcome: 'REFRESH_FAILED_401',
          httpStatus: 401,
          attemptCount: 1,
          backoffMsApplied: 0,
          source: 'interceptor',
          l02GuardActive: false,
          singleFlightRole: 'leader',
        },
      },
      { flags, sink: mockSink },
    );

    emitSessionTerminationTelemetry(
      {
        reason: 'REFRESH_UNAUTHORIZED',
        caller: 'refresh_fail',
        isSecurityTermination: true,
        parentEventId: refreshEventId ?? undefined,
      },
      { flags, sink: mockSink },
    );

    expect(envelopes).toHaveLength(2);
    expect(envelopes[0]?.correlationId).toBe(envelopes[1]?.correlationId);
    expect(envelopes[1]?.parentEventId).toBe(refreshEventId);
  });

  it('L1 rollback — master OFF no emite', () => {
    emitSessionRefreshTelemetry(
      {
        metadata: {
          outcome: 'ROTATED',
          attemptCount: 1,
          backoffMsApplied: 0,
          source: 'bootstrap',
          l02GuardActive: false,
          singleFlightRole: 'leader',
        },
      },
      {
        flags: {
          masterEnabled: false,
          devSinkEnabled: true,
          refreshEnabled: true,
          terminationEnabled: true,
          authSyncEnabled: true,
        },
        sink: mockSink,
      },
    );
    expect(envelopes).toHaveLength(0);
  });
});
