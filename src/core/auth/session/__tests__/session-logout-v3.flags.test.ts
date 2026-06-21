import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SESSION_LOGOUT_V3_ENABLED,
  DEFAULT_SESSION_REMOTE_PROBE_ENABLED,
  parseSessionLogoutV3Enabled,
  parseSessionRemoteProbeEnabled,
  SESSION_LOGOUT_V3_ENABLED,
  SESSION_REMOTE_PROBE_ENABLED,
} from '../session-logout-v3.flags';

describe('session-logout-v3.flags (IMPL-01)', () => {
  describe('parseSessionLogoutV3Enabled', () => {
    it('default true cuando env ausente o vacío', () => {
      expect(parseSessionLogoutV3Enabled(undefined)).toBe(true);
      expect(parseSessionLogoutV3Enabled('')).toBe(true);
      expect(parseSessionLogoutV3Enabled('   ')).toBe(true);
    });

    it('false para valores explícitos de desactivación', () => {
      expect(parseSessionLogoutV3Enabled('false')).toBe(false);
      expect(parseSessionLogoutV3Enabled('FALSE')).toBe(false);
      expect(parseSessionLogoutV3Enabled('0')).toBe(false);
      expect(parseSessionLogoutV3Enabled('no')).toBe(false);
    });

    it('true para valores explícitos de activación', () => {
      expect(parseSessionLogoutV3Enabled('true')).toBe(true);
      expect(parseSessionLogoutV3Enabled('TRUE')).toBe(true);
      expect(parseSessionLogoutV3Enabled('1')).toBe(true);
      expect(parseSessionLogoutV3Enabled('yes')).toBe(true);
    });

    it('valor desconocido conserva default true', () => {
      expect(parseSessionLogoutV3Enabled('maybe')).toBe(true);
    });
  });

  describe('parseSessionRemoteProbeEnabled', () => {
    it('default true cuando env ausente o vacío', () => {
      expect(parseSessionRemoteProbeEnabled(undefined)).toBe(true);
      expect(parseSessionRemoteProbeEnabled('')).toBe(true);
      expect(parseSessionRemoteProbeEnabled('   ')).toBe(true);
    });

    it('false para valores explícitos de desactivación', () => {
      expect(parseSessionRemoteProbeEnabled('false')).toBe(false);
      expect(parseSessionRemoteProbeEnabled('FALSE')).toBe(false);
      expect(parseSessionRemoteProbeEnabled('0')).toBe(false);
      expect(parseSessionRemoteProbeEnabled('no')).toBe(false);
    });

    it('true para valores explícitos de activación', () => {
      expect(parseSessionRemoteProbeEnabled('true')).toBe(true);
      expect(parseSessionRemoteProbeEnabled('TRUE')).toBe(true);
      expect(parseSessionRemoteProbeEnabled('1')).toBe(true);
      expect(parseSessionRemoteProbeEnabled('yes')).toBe(true);
    });

    it('valor desconocido conserva default true', () => {
      expect(parseSessionRemoteProbeEnabled('maybe')).toBe(true);
    });
  });

  describe('constantes exportadas', () => {
    it('DEFAULT_SESSION_LOGOUT_V3_ENABLED es true según diseño', () => {
      expect(DEFAULT_SESSION_LOGOUT_V3_ENABLED).toBe(true);
    });

    it('DEFAULT_SESSION_REMOTE_PROBE_ENABLED es true según diseño', () => {
      expect(DEFAULT_SESSION_REMOTE_PROBE_ENABLED).toBe(true);
    });

    it('SESSION_LOGOUT_V3_ENABLED es booleano compilado', () => {
      expect(typeof SESSION_LOGOUT_V3_ENABLED).toBe('boolean');
    });

    it('SESSION_REMOTE_PROBE_ENABLED es booleano compilado', () => {
      expect(typeof SESSION_REMOTE_PROBE_ENABLED).toBe('boolean');
    });
  });
});
