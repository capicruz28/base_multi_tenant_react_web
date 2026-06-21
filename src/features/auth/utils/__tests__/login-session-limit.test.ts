/**
 * IAM-FE-PHASE-07 IMPL-11 — login session limit + query extension tests.
 */
import { describe, expect, it } from 'vitest';

import {
  parseSessionLoginQueryParam,
  resolveLoginBannerFromSessionQuery,
} from '@/features/auth/utils/login-session-termination';
import {
  resolveLoginSessionLimitBanner,
} from '@/features/auth/utils/login-session-limit';
import { SESSION_LIMIT_LOGIN_QUERY } from '@/core/auth/session/session-limit-ux.policy';
import { SESSION_LIMIT_VICTIM_MESSAGE } from '@/core/auth/session/session-limit-ux.policy';

describe('login-session-limit (IMPL-11)', () => {
  it('V7.2 — parse ?session=limit', () => {
    expect(parseSessionLoginQueryParam('limit')).toBe('limit');
    expect(parseSessionLoginQueryParam('expired')).toBe('expired');
    expect(parseSessionLoginQueryParam('invalid')).toBeNull();
  });

  it('banner login limit copy dedicado', () => {
    const banner = resolveLoginBannerFromSessionQuery(SESSION_LIMIT_LOGIN_QUERY);
    expect(banner?.message).toBe(SESSION_LIMIT_VICTIM_MESSAGE);
    expect(banner?.severity).toBe('info');
  });

  it('resolveLoginSessionLimitBanner directo', () => {
    expect(resolveLoginSessionLimitBanner().message).toBe(SESSION_LIMIT_VICTIM_MESSAGE);
  });
});
