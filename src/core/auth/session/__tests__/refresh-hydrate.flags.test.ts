import { describe, expect, it } from 'vitest';

import {
  DEFAULT_REFRESH_HYDRATE_ENABLED,
  parseRefreshHydrateEnabled,
  REFRESH_HYDRATE_ENABLED,
} from '../refresh-hydrate.flags';

describe('refresh-hydrate.flags (Paso 8)', () => {
  describe('parseRefreshHydrateEnabled', () => {
    it('default true cuando env ausente o vacío', () => {
      expect(parseRefreshHydrateEnabled(undefined)).toBe(true);
      expect(parseRefreshHydrateEnabled('')).toBe(true);
      expect(parseRefreshHydrateEnabled('   ')).toBe(true);
    });

    it('false para valores explícitos de desactivación', () => {
      expect(parseRefreshHydrateEnabled('false')).toBe(false);
      expect(parseRefreshHydrateEnabled('FALSE')).toBe(false);
      expect(parseRefreshHydrateEnabled('0')).toBe(false);
      expect(parseRefreshHydrateEnabled('no')).toBe(false);
    });

    it('true para valores explícitos de activación', () => {
      expect(parseRefreshHydrateEnabled('true')).toBe(true);
      expect(parseRefreshHydrateEnabled('TRUE')).toBe(true);
      expect(parseRefreshHydrateEnabled('1')).toBe(true);
      expect(parseRefreshHydrateEnabled('yes')).toBe(true);
    });

    it('valor desconocido conserva default true', () => {
      expect(parseRefreshHydrateEnabled('maybe')).toBe(true);
    });
  });

  describe('constantes exportadas', () => {
    it('DEFAULT_REFRESH_HYDRATE_ENABLED es true según diseño', () => {
      expect(DEFAULT_REFRESH_HYDRATE_ENABLED).toBe(true);
    });

    it('REFRESH_HYDRATE_ENABLED es booleano compilado', () => {
      expect(typeof REFRESH_HYDRATE_ENABLED).toBe('boolean');
    });
  });
});
