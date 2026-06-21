import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SESSION_AUTH_SYNC_SELECTION_ENABLED,
  DEFAULT_SESSION_AUTH_SYNC_V4_ENABLED,
  parseSessionAuthSyncSelectionEnabled,
  parseSessionAuthSyncV4Enabled,
  SESSION_AUTH_SYNC_SELECTION_ENABLED,
  SESSION_AUTH_SYNC_V4_ENABLED,
} from '../session-auth-sync.flags';

describe('session-auth-sync.flags (IMPL-01)', () => {
  describe('parseSessionAuthSyncV4Enabled', () => {
    it('default true cuando env ausente o vacío', () => {
      expect(parseSessionAuthSyncV4Enabled(undefined)).toBe(true);
      expect(parseSessionAuthSyncV4Enabled('')).toBe(true);
      expect(parseSessionAuthSyncV4Enabled('   ')).toBe(true);
    });

    it('false para valores explícitos de desactivación', () => {
      expect(parseSessionAuthSyncV4Enabled('false')).toBe(false);
      expect(parseSessionAuthSyncV4Enabled('FALSE')).toBe(false);
      expect(parseSessionAuthSyncV4Enabled('0')).toBe(false);
      expect(parseSessionAuthSyncV4Enabled('no')).toBe(false);
    });

    it('true para valores explícitos de activación', () => {
      expect(parseSessionAuthSyncV4Enabled('true')).toBe(true);
      expect(parseSessionAuthSyncV4Enabled('1')).toBe(true);
      expect(parseSessionAuthSyncV4Enabled('yes')).toBe(true);
    });
  });

  describe('parseSessionAuthSyncSelectionEnabled', () => {
    it('default true cuando env ausente o vacío', () => {
      expect(parseSessionAuthSyncSelectionEnabled(undefined)).toBe(true);
      expect(parseSessionAuthSyncSelectionEnabled('')).toBe(true);
    });

    it('false para valores explícitos de desactivación', () => {
      expect(parseSessionAuthSyncSelectionEnabled('false')).toBe(false);
      expect(parseSessionAuthSyncSelectionEnabled('0')).toBe(false);
    });
  });

  describe('constantes exportadas', () => {
    it('defaults según diseño §8.1', () => {
      expect(DEFAULT_SESSION_AUTH_SYNC_V4_ENABLED).toBe(true);
      expect(DEFAULT_SESSION_AUTH_SYNC_SELECTION_ENABLED).toBe(true);
    });

    it('flags compilados son booleanos', () => {
      expect(typeof SESSION_AUTH_SYNC_V4_ENABLED).toBe('boolean');
      expect(typeof SESSION_AUTH_SYNC_SELECTION_ENABLED).toBe('boolean');
    });
  });
});
