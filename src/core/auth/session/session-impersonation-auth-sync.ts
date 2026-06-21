/**
 * Helper emit auth-sync post-restore impersonation — IAM-FE-PHASE-06 IMPL-05.
 */

import { emitSessionLoginSync } from './session-auth-sync-emit';
import { SESSION_AUTH_SYNC_V4_ENABLED } from './session-auth-sync.flags';
import type { AuthSyncSessionLoginPayload } from './session-auth-sync.types';
import { SESSION_IMPERSONATION_AUTH_SYNC_V6_ENABLED } from './session-impersonation.flags';
import type { ImpersonationExitSource } from './session-impersonation.types';
import type { SessionClaimsSnapshot } from './session-claims-snapshot';

export interface EmitImpersonationPostRestoreSyncInput {
  readonly accessToken: string;
  readonly claimsSnapshot: SessionClaimsSnapshot;
  readonly empresaActivaId: string | null;
  readonly source: ImpersonationExitSource;
}

export function buildImpersonationPostRestoreLoginPayload(
  input: EmitImpersonationPostRestoreSyncInput,
): AuthSyncSessionLoginPayload {
  const base: AuthSyncSessionLoginPayload = {
    accessToken: input.accessToken,
    claimsSnapshot: input.claimsSnapshot,
    empresaActivaId: input.empresaActivaId,
  };

  if (!SESSION_IMPERSONATION_AUTH_SYNC_V6_ENABLED) {
    return base;
  }

  return {
    ...base,
    impersonationExitSource: input.source,
  };
}

/**
 * Emite SESSION_LOGIN con parent token tras restore impersonation.
 * Respeta flags V4 master y V6 auth-sync sub-flag.
 */
export function emitImpersonationPostRestoreSync(
  input: EmitImpersonationPostRestoreSyncInput,
): boolean {
  if (!SESSION_AUTH_SYNC_V4_ENABLED || !SESSION_IMPERSONATION_AUTH_SYNC_V6_ENABLED) {
    return false;
  }

  return emitSessionLoginSync(buildImpersonationPostRestoreLoginPayload(input));
}
