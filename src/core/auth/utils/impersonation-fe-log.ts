import { decodeAccessToken } from './decodeAccessToken';
import { isImpersonationToken } from './impersonation-session';
import { hasPlatformParentSession } from './platform-parent-session';

import { emitSessionDiagContext } from '@/core/auth/session/session-telemetry-auth-wiring';
import { isSessionTelemetryEffective } from '@/core/auth/session/session-telemetry.flags';
import { runLegacySessionDevLog } from '@/core/auth/utils/auth-session-log';

export function logImpersonationFe(
  tokenSource: string,
  token: string | null | undefined,
  extra?: Record<string, unknown>,
): void {
  const claims = decodeAccessToken(token);

  if (isSessionTelemetryEffective()) {
    emitSessionDiagContext('IMPERSONATION-FE', {
      token_source: tokenSource,
      is_impersonation: Boolean(claims?.is_impersonation),
      user_type: claims?.user_type ?? null,
      empresa_selection: Boolean(claims?.empresa_selection_pending),
      has_platform_parent_session: hasPlatformParentSession(),
      token_replaced: extra?.token_replaced === true,
    });
    return;
  }

  runLegacySessionDevLog(() => {
    console.log('[IMPERSONATION-FE]', {
      token_source: tokenSource,
      is_impersonation: Boolean(claims?.is_impersonation),
      token_user_type: claims?.user_type ?? null,
      empresa_selection: claims?.empresa_selection_pending ?? false,
      has_platform_parent_session: hasPlatformParentSession(),
      token_replaced: extra?.token_replaced ?? null,
    });
  });
}

export function isImpersonationSupportMode(token: string | null | undefined): boolean {
  return hasPlatformParentSession() || isImpersonationToken(token);
}
