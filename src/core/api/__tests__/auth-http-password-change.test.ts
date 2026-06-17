import { describe, it, expect } from 'vitest';
import {
  shouldSkipPasswordChangeRedirect,
  shouldBypassPasswordChangeEnforcement,
} from '@/core/api/auth-http.utils';

describe('auth-http password change helpers', () => {
  it('shouldSkipPasswordChangeRedirect cubre whitelist oficial', () => {
    expect(shouldSkipPasswordChangeRedirect('/api/v1/auth/password/change/')).toBe(true);
    expect(shouldSkipPasswordChangeRedirect('/api/v1/auth/me/')).toBe(true);
    expect(shouldSkipPasswordChangeRedirect('/api/v1/auth/logout/')).toBe(true);
    expect(shouldSkipPasswordChangeRedirect('/api/v1/auth/refresh/')).toBe(true);
    expect(shouldSkipPasswordChangeRedirect('/api/v1/auth/empresa/seleccionar/')).toBe(true);
    expect(shouldSkipPasswordChangeRedirect('/api/v1/auth/impersonate/start/')).toBe(true);
    expect(shouldSkipPasswordChangeRedirect('/api/v1/auth/impersonate/end/')).toBe(true);
    expect(shouldSkipPasswordChangeRedirect('/api/v1/auth/menu')).toBe(false);
    expect(shouldSkipPasswordChangeRedirect('/api/v1/inv/almacenes/')).toBe(false);
  });

  it('shouldBypassPasswordChangeEnforcement excluye platform_admin', () => {
    expect(
      shouldBypassPasswordChangeEnforcement(null, {
        user_type: 'platform_admin',
      } as never),
    ).toBe(true);
    expect(
      shouldBypassPasswordChangeEnforcement(null, {
        user_type: 'user',
      } as never),
    ).toBe(false);
  });
});
