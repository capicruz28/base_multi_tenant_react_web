import type { UserData } from '@/features/auth/types/auth.types';

export interface PasswordChangeFormInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Reglas cliente alineadas con BE — compartidas force + voluntario. */
export function validateNewPasswordRules(password: string): string | null {
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Debe incluir al menos una letra mayúscula.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Debe incluir al menos una letra minúscula.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Debe incluir al menos un número.';
  }
  return null;
}

export function validatePasswordChangeForm(input: PasswordChangeFormInput): string | null {
  const current = input.currentPassword.trim();
  const next = input.newPassword.trim();
  const confirm = input.confirmPassword.trim();

  if (!current || !next || !confirm) {
    return 'Complete todos los campos.';
  }

  const passwordRuleError = validateNewPasswordRules(next);
  if (passwordRuleError) {
    return passwordRuleError;
  }

  if (next !== confirm) {
    return 'La confirmación no coincide con la nueva contraseña.';
  }

  if (current === next) {
    return 'La nueva contraseña debe ser diferente a la actual.';
  }

  return null;
}

function readAuthProvider(user: UserData): string | null {
  const record = user as UserData & Record<string, unknown>;
  const value = record.proveedor_autenticacion ?? record.tipo_autenticacion;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** true cuando la contraseña local no aplica (SSO / externo). */
export function isExternalPasswordAuth(user: UserData | null): boolean {
  if (!user) return false;
  const provider = readAuthProvider(user);
  if (!provider) return false;
  return provider.toLowerCase() !== 'local';
}
