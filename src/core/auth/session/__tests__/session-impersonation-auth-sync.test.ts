import { describe, expect, it, vi } from 'vitest';

import { emitSessionLoginSync } from '../session-auth-sync-emit';
import {
  buildImpersonationPostRestoreLoginPayload,
  emitImpersonationPostRestoreSync,
} from '../session-impersonation-auth-sync';
import { buildSessionClaimsSnapshot } from '../session-claims-snapshot';

vi.mock('../session-auth-sync-emit', () => ({
  emitSessionLoginSync: vi.fn(() => true),
}));

vi.mock('../session-auth-sync.flags', () => ({
  SESSION_AUTH_SYNC_V4_ENABLED: true,
}));

vi.mock('../session-impersonation.flags', () => ({
  SESSION_IMPERSONATION_AUTH_SYNC_V6_ENABLED: true,
}));

describe('session-impersonation-auth-sync (IMPL-05)', () => {
  it('buildImpersonationPostRestoreLoginPayload incluye impersonationExitSource', () => {
    const token = 'parent-token';
    const snapshot = buildSessionClaimsSnapshot(token, null, null);

    const payload = buildImpersonationPostRestoreLoginPayload({
      accessToken: token,
      claimsSnapshot: snapshot,
      empresaActivaId: null,
      source: 'INTERCEPTOR_ERP_401',
    });

    expect(payload.impersonationExitSource).toBe('INTERCEPTOR_ERP_401');
  });

  it('emitImpersonationPostRestoreSync delega emitSessionLoginSync', () => {
    const token = 'parent-token';
    const snapshot = buildSessionClaimsSnapshot(token, null, null);

    emitImpersonationPostRestoreSync({
      accessToken: token,
      claimsSnapshot: snapshot,
      empresaActivaId: 'empresa-1',
      source: 'MANUAL_END',
    });

    expect(emitSessionLoginSync).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: token,
        impersonationExitSource: 'MANUAL_END',
      }),
    );
  });
});
