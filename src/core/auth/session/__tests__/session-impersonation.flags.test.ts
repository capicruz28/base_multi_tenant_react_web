import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SESSION_IMPERSONATION_AUTH_SYNC_V6_ENABLED,
  DEFAULT_SESSION_IMPERSONATION_CAMBIAR_EMPRESA_V6_ENABLED,
  DEFAULT_SESSION_IMPERSONATION_EXIT_INTERCEPTOR_V6_ENABLED,
  DEFAULT_SESSION_IMPERSONATION_V6_ENABLED,
  parseSessionImpersonationAuthSyncV6Enabled,
  parseSessionImpersonationCambiarEmpresaV6Enabled,
  parseSessionImpersonationExitInterceptorV6Enabled,
  parseSessionImpersonationV6Enabled,
  SESSION_IMPERSONATION_AUTH_SYNC_V6_ENABLED,
  SESSION_IMPERSONATION_CAMBIAR_EMPRESA_V6_ENABLED,
  SESSION_IMPERSONATION_EXIT_INTERCEPTOR_V6_ENABLED,
  SESSION_IMPERSONATION_V6_ENABLED,
} from '../session-impersonation.flags';

describe('session-impersonation.flags (IMPL-01)', () => {
  describe('parseSessionImpersonationV6Enabled', () => {
    it('default true cuando env ausente o vacío', () => {
      expect(parseSessionImpersonationV6Enabled(undefined)).toBe(true);
      expect(parseSessionImpersonationV6Enabled('')).toBe(true);
    });

    it('false para valores explícitos de desactivación', () => {
      expect(parseSessionImpersonationV6Enabled('false')).toBe(false);
      expect(parseSessionImpersonationV6Enabled('0')).toBe(false);
    });

    it('true para valores explícitos de activación', () => {
      expect(parseSessionImpersonationV6Enabled('true')).toBe(true);
      expect(parseSessionImpersonationV6Enabled('1')).toBe(true);
    });
  });

  describe('sub-flags', () => {
    it('interceptor default true', () => {
      expect(parseSessionImpersonationExitInterceptorV6Enabled(undefined)).toBe(true);
      expect(parseSessionImpersonationExitInterceptorV6Enabled('false')).toBe(false);
    });

    it('cambiar empresa default true', () => {
      expect(parseSessionImpersonationCambiarEmpresaV6Enabled(undefined)).toBe(true);
      expect(parseSessionImpersonationCambiarEmpresaV6Enabled('false')).toBe(false);
    });

    it('auth-sync default true', () => {
      expect(parseSessionImpersonationAuthSyncV6Enabled(undefined)).toBe(true);
      expect(parseSessionImpersonationAuthSyncV6Enabled('false')).toBe(false);
    });
  });

  it('defaults de diseño', () => {
    expect(DEFAULT_SESSION_IMPERSONATION_V6_ENABLED).toBe(true);
    expect(DEFAULT_SESSION_IMPERSONATION_EXIT_INTERCEPTOR_V6_ENABLED).toBe(true);
    expect(DEFAULT_SESSION_IMPERSONATION_CAMBIAR_EMPRESA_V6_ENABLED).toBe(true);
    expect(DEFAULT_SESSION_IMPERSONATION_AUTH_SYNC_V6_ENABLED).toBe(true);
  });

  it('constantes runtime exportadas', () => {
    expect(typeof SESSION_IMPERSONATION_V6_ENABLED).toBe('boolean');
    expect(typeof SESSION_IMPERSONATION_EXIT_INTERCEPTOR_V6_ENABLED).toBe('boolean');
    expect(typeof SESSION_IMPERSONATION_CAMBIAR_EMPRESA_V6_ENABLED).toBe('boolean');
    expect(typeof SESSION_IMPERSONATION_AUTH_SYNC_V6_ENABLED).toBe('boolean');
  });
});
