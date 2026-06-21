import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SESSION_CAMBIAR_EMPRESA_L02_V5_ENABLED,
  DEFAULT_SESSION_REFRESH_RESILIENCE_V5_ENABLED,
  DEFAULT_SESSION_REFRESH_RETRY_429_V5_ENABLED,
  DEFAULT_SESSION_REFRESH_RETRY_500_V5_ENABLED,
  parseSessionCambiarEmpresaL02V5Enabled,
  parseSessionRefreshResilienceV5Enabled,
  parseSessionRefreshRetry429V5Enabled,
  parseSessionRefreshRetry500V5Enabled,
  SESSION_CAMBIAR_EMPRESA_L02_V5_ENABLED,
  SESSION_REFRESH_RESILIENCE_V5_ENABLED,
  SESSION_REFRESH_RETRY_429_V5_ENABLED,
  SESSION_REFRESH_RETRY_500_V5_ENABLED,
} from '../session-refresh-resilience.flags';

describe('session-refresh-resilience.flags (IMPL-01)', () => {
  describe('parseSessionRefreshResilienceV5Enabled', () => {
    it('default true cuando env ausente o vacío', () => {
      expect(parseSessionRefreshResilienceV5Enabled(undefined)).toBe(true);
      expect(parseSessionRefreshResilienceV5Enabled('')).toBe(true);
    });

    it('false para valores explícitos de desactivación', () => {
      expect(parseSessionRefreshResilienceV5Enabled('false')).toBe(false);
      expect(parseSessionRefreshResilienceV5Enabled('0')).toBe(false);
    });

    it('true para valores explícitos de activación', () => {
      expect(parseSessionRefreshResilienceV5Enabled('true')).toBe(true);
      expect(parseSessionRefreshResilienceV5Enabled('1')).toBe(true);
    });
  });

  describe('sub-flags', () => {
    it('retry 500 default true', () => {
      expect(parseSessionRefreshRetry500V5Enabled(undefined)).toBe(true);
      expect(parseSessionRefreshRetry500V5Enabled('false')).toBe(false);
    });

    it('retry 429 default true', () => {
      expect(parseSessionRefreshRetry429V5Enabled(undefined)).toBe(true);
      expect(parseSessionRefreshRetry429V5Enabled('false')).toBe(false);
    });

    it('L-02 guard default true', () => {
      expect(parseSessionCambiarEmpresaL02V5Enabled(undefined)).toBe(true);
      expect(parseSessionCambiarEmpresaL02V5Enabled('false')).toBe(false);
    });
  });

  describe('constantes exportadas', () => {
    it('defaults según diseño §13.1', () => {
      expect(DEFAULT_SESSION_REFRESH_RESILIENCE_V5_ENABLED).toBe(true);
      expect(DEFAULT_SESSION_REFRESH_RETRY_500_V5_ENABLED).toBe(true);
      expect(DEFAULT_SESSION_REFRESH_RETRY_429_V5_ENABLED).toBe(true);
      expect(DEFAULT_SESSION_CAMBIAR_EMPRESA_L02_V5_ENABLED).toBe(true);
    });

    it('flags compilados son booleanos', () => {
      expect(typeof SESSION_REFRESH_RESILIENCE_V5_ENABLED).toBe('boolean');
      expect(typeof SESSION_REFRESH_RETRY_500_V5_ENABLED).toBe('boolean');
      expect(typeof SESSION_REFRESH_RETRY_429_V5_ENABLED).toBe('boolean');
      expect(typeof SESSION_CAMBIAR_EMPRESA_L02_V5_ENABLED).toBe('boolean');
    });
  });
});
