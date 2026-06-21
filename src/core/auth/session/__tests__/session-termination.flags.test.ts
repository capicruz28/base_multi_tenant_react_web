import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SESSION_TERMINATION_V2_ENABLED,
  parseSessionTerminationEnabled,
  SESSION_TERMINATION_V2_ENABLED,
} from '../session-termination.flags';

describe('session-termination.flags (Paso 9)', () => {
  describe('parseSessionTerminationEnabled', () => {
    it('default true cuando env ausente o vacío', () => {
      expect(parseSessionTerminationEnabled(undefined)).toBe(true);
      expect(parseSessionTerminationEnabled('')).toBe(true);
      expect(parseSessionTerminationEnabled('   ')).toBe(true);
    });

    it('false para valores explícitos de desactivación', () => {
      expect(parseSessionTerminationEnabled('false')).toBe(false);
      expect(parseSessionTerminationEnabled('FALSE')).toBe(false);
      expect(parseSessionTerminationEnabled('0')).toBe(false);
      expect(parseSessionTerminationEnabled('no')).toBe(false);
    });

    it('true para valores explícitos de activación', () => {
      expect(parseSessionTerminationEnabled('true')).toBe(true);
      expect(parseSessionTerminationEnabled('TRUE')).toBe(true);
      expect(parseSessionTerminationEnabled('1')).toBe(true);
      expect(parseSessionTerminationEnabled('yes')).toBe(true);
    });

    it('valor desconocido conserva default true', () => {
      expect(parseSessionTerminationEnabled('maybe')).toBe(true);
    });
  });

  describe('constantes exportadas', () => {
    it('DEFAULT_SESSION_TERMINATION_V2_ENABLED es true según diseño', () => {
      expect(DEFAULT_SESSION_TERMINATION_V2_ENABLED).toBe(true);
    });

    it('SESSION_TERMINATION_V2_ENABLED es booleano compilado', () => {
      expect(typeof SESSION_TERMINATION_V2_ENABLED).toBe('boolean');
    });
  });
});
