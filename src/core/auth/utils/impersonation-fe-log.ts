import { decodeAccessToken } from './decodeAccessToken';
import { isImpersonationToken } from './impersonation-session';
import { hasPlatformParentSession } from './platform-parent-session';

export function logImpersonationFe(
  tokenSource: string,
  token: string | null | undefined,
  extra?: Record<string, unknown>,
): void {
  if (!import.meta.env.DEV) return;

  const claims = decodeAccessToken(token);
  console.log('[IMPERSONATION-FE]', {
    token_source: tokenSource,
    is_impersonation: Boolean(claims?.is_impersonation),
    token_user_type: claims?.user_type ?? null,
    empresa_selection: claims?.empresa_selection_pending ?? false,
    has_platform_parent_session: hasPlatformParentSession(),
    token_replaced: extra?.token_replaced ?? null,
    previous_token_prefix: extra?.previous_token_prefix ?? null,
    new_token_prefix: token?.slice(0, 20) ?? null,
    ...extra,
  });
}

export function isImpersonationSupportMode(token: string | null | undefined): boolean {
  return hasPlatformParentSession() || isImpersonationToken(token);
}
