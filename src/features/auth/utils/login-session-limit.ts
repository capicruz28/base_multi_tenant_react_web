/**
 * Helper banner session limit en login — IAM-FE-PHASE-07 IMPL-11.
 * Extensión FE query `?session=limit` sin modificar session-termination-ux.ts F2.
 */

import {
  resolveSessionLimitBannerSeverity,
  resolveSessionLimitUxMessage,
  SESSION_LIMIT_LOGIN_QUERY,
} from '@/core/auth/session/session-limit-ux.policy';
import type { SessionLoginQueryParamV7 } from '@/core/auth/session/session-ux.types';
import type { SessionTerminationSeverity } from '@/core/auth/session/session-termination-reason';

export interface LoginSessionLimitBannerModel {
  readonly message: string;
  readonly severity: SessionTerminationSeverity;
}

export function isSessionLimitLoginQuery(
  value: string | null,
): value is typeof SESSION_LIMIT_LOGIN_QUERY {
  return value === SESSION_LIMIT_LOGIN_QUERY;
}

export function resolveLoginSessionLimitBanner(): LoginSessionLimitBannerModel {
  return {
    message: resolveSessionLimitUxMessage(),
    severity: resolveSessionLimitBannerSeverity(),
  };
}

export function isLoginSessionQueryParamV7(
  value: string | null,
): value is SessionLoginQueryParamV7 {
  return (
    value === 'expired' ||
    value === 'security' ||
    value === 'idle' ||
    value === 'error' ||
    value === SESSION_LIMIT_LOGIN_QUERY
  );
}
