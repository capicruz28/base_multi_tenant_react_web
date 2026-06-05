import { decodeAccessToken } from './decodeAccessToken';

/** Token de soporte plataforma (access o selection). */
export function isImpersonationToken(token: string | null | undefined): boolean {
  if (!token?.trim()) return false;
  return Boolean(decodeAccessToken(token)?.is_impersonation);
}
