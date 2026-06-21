import { describe, expect, it } from 'vitest';

import {
  getLoadMenuUxOptionsForMode,
  shouldPreserveMenuUxOnPostRefresh,
  shouldReloadMenuAfterHydrate,
} from '../session-menu-ux';

describe('session-menu-ux (Paso 7)', () => {
  describe('getLoadMenuUxOptionsForMode', () => {
    it('interceptor preserva menú visible durante recarga', () => {
      expect(getLoadMenuUxOptionsForMode('interceptor')).toEqual({
        preserveVisibleMenuDuringReload: true,
      });
    });

    it('bootstrap no preserva (spinner bootstrap esperado)', () => {
      expect(getLoadMenuUxOptionsForMode('bootstrap')).toEqual({});
    });

    it('full-session-token no preserva por defecto', () => {
      expect(getLoadMenuUxOptionsForMode('full-session-token')).toEqual({});
    });
  });

  describe('shouldReloadMenuAfterHydrate', () => {
    it('NONE no recarga menú', () => {
      expect(shouldReloadMenuAfterHydrate('NONE', false, false)).toBe(false);
    });

    it('FULL recarga menú cuando no hay skip ni selection pending', () => {
      expect(shouldReloadMenuAfterHydrate('FULL', false, false)).toBe(true);
    });

    it('FULL con selection pending no recarga menú', () => {
      expect(shouldReloadMenuAfterHydrate('FULL', true, false)).toBe(false);
    });

    it('FULL con skipMenu no recarga menú', () => {
      expect(shouldReloadMenuAfterHydrate('FULL', false, true)).toBe(false);
    });
  });

  describe('shouldPreserveMenuUxOnPostRefresh', () => {
    it('NONE no activa preservación UX', () => {
      expect(shouldPreserveMenuUxOnPostRefresh('NONE')).toBe(false);
    });

    it('FULL activa preservación UX', () => {
      expect(shouldPreserveMenuUxOnPostRefresh('FULL')).toBe(true);
    });
  });
});
