/**
 * IAM-FE-PHASE-08 IMPL-03 — redaction policy tests (V8.1 / P1-01).
 */
import { describe, expect, it } from 'vitest';

import {
  applySessionTelemetryRedaction,
  sanitizeRecord,
  SESSION_TELEMETRY_ACCESS_TOKEN_PREFIX_MAX,
  toAccessTokenPrefix,
} from '@/core/auth/session/session-telemetry-redaction.policy';

describe('session-telemetry-redaction.policy (IMPL-03)', () => {
  it('RED-01 — access token completo redactado; prefix máx 28', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    expect(toAccessTokenPrefix(token)?.length).toBeLessThanOrEqual(
      SESSION_TELEMETRY_ACCESS_TOKEN_PREFIX_MAX,
    );

    const redacted = sanitizeRecord({ accessToken: token });
    expect(redacted.accessToken).toBe('(redacted)');
  });

  it('RED-03 — prohibidos Authorization, password, refresh_token', () => {
    const redacted = sanitizeRecord({
      Authorization: 'Bearer secret',
      password: 'p',
      refresh_token: 'rt',
    });
    expect(redacted.Authorization).toBe('(redacted)');
    expect(redacted.password).toBe('(redacted)');
    expect(redacted.refresh_token).toBe('(redacted)');
  });

  it('P1-01 — redacción recursiva en objetos anidados (envelope-like)', () => {
    const redacted = applySessionTelemetryRedaction({
      type: 'SESSION_LOGIN',
      payload: {
        accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig',
        nested: { refresh_token: 'secret' },
      },
    });
    expect(redacted.payload).toEqual({
      accessToken: '(redacted)',
      nested: { refresh_token: '(redacted)' },
    });
  });

  it('RED-04 — JWT en detail string sanitizado', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig';
    const redacted = sanitizeRecord({ detail: `error ${jwt} end` });
    expect(redacted.detail).toBe('error (redacted) end');
  });
});
