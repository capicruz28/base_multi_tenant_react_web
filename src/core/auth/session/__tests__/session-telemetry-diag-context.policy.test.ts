/**
 * PATCH-01 — session-telemetry-diag-context.policy tests.
 */
import { describe, expect, it } from 'vitest';

import {
  pickAllowlistedSessionDiagContextFields,
  prepareSessionDiagContextFields,
} from '@/core/auth/session/session-telemetry-diag-context.policy';

describe('session-telemetry-diag-context.policy (PATCH-01)', () => {
  it('A-P1-02 — elimina username y PII', () => {
    const picked = pickAllowlistedSessionDiagContextFields({
      username: 'admin@acme.com',
      email: 'admin@acme.com',
      nombre_usuario: 'Admin',
      hasCredentials: true,
      user_type: 'tenant_admin',
    });
    expect(picked).toEqual({
      hasCredentials: true,
      user_type: 'tenant_admin',
    });
  });

  it('A-P1-01 — elimina token prefixes legacy', () => {
    const picked = pickAllowlistedSessionDiagContextFields({
      tokenPrefix: 'eyJhbGciOiJIUzI1NiIs',
      accessTokenPrefix: 'eyJhbGciOiJIUzI1NiIs',
      previous_token_prefix: 'abc',
      refreshOk: true,
    });
    expect(picked).toEqual({ refreshOk: true });
  });

  it('A-P1-03 — prepare aplica whitelist + redaction', () => {
    const prepared = prepareSessionDiagContextFields({
      username: 'secret',
      detail: 'error eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig',
      status: 401,
    });
    expect(prepared.username).toBeUndefined();
    expect(prepared.status).toBe(401);
    expect(prepared.detail).toBe('error (redacted)');
  });
});
