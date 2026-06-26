import { describe, expect, it } from 'vitest';

import {
  isExternalPasswordAuth,
  validateNewPasswordRules,
  validatePasswordChangeForm,
} from '@/features/auth/utils/password-validation.utils';
import type { UserData } from '@/features/auth/types/auth.types';

describe('password-validation.utils', () => {
  it('valida reglas mínimas de contraseña', () => {
    expect(validateNewPasswordRules('abc')).toMatch(/8 caracteres/i);
    expect(validateNewPasswordRules('abcdefgh')).toMatch(/mayúscula/i);
    expect(validateNewPasswordRules('Abcdefgh')).toMatch(/número/i);
    expect(validateNewPasswordRules('Abcdefg1')).toBeNull();
  });

  it('valida formulario completo', () => {
    expect(
      validatePasswordChangeForm({
        currentPassword: '',
        newPassword: 'Abcdefg1',
        confirmPassword: 'Abcdefg1',
      }),
    ).toMatch(/Complete todos los campos/i);

    expect(
      validatePasswordChangeForm({
        currentPassword: 'OldPass1',
        newPassword: 'Abcdefg1',
        confirmPassword: 'Abcdefg2',
      }),
    ).toMatch(/confirmación no coincide/i);

    expect(
      validatePasswordChangeForm({
        currentPassword: 'Abcdefg1',
        newPassword: 'Abcdefg1',
        confirmPassword: 'Abcdefg1',
      }),
    ).toMatch(/diferente a la actual/i);
  });

  it('detecta SSO externo', () => {
    const user = {
      proveedor_autenticacion: 'azure',
    } as UserData;

    expect(isExternalPasswordAuth(user)).toBe(true);
    expect(isExternalPasswordAuth({} as UserData)).toBe(false);
  });
});
