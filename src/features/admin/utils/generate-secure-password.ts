const DEFAULT_CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
const DEFAULT_LENGTH = 16;
const MIN_LENGTH = 8;
const MAX_LENGTH = 64;

/**
 * Genera una contraseña aleatoria segura usando crypto.getRandomValues.
 * Solo uso client-side (formularios IAM).
 */
export function generateSecurePassword(length = DEFAULT_LENGTH): string {
  const safeLength = Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, length));
  const randomValues = new Uint32Array(safeLength);
  crypto.getRandomValues(randomValues);

  let password = '';
  for (let i = 0; i < safeLength; i += 1) {
    password += DEFAULT_CHARSET[randomValues[i]! % DEFAULT_CHARSET.length];
  }
  return password;
}
