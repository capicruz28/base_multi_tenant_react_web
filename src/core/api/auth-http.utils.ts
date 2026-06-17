import type { InternalAxiosRequestConfig } from 'axios';
import { decodeAccessToken } from '@/core/auth/utils/decodeAccessToken';
import { isImpersonationToken } from '@/core/auth/utils/impersonation-session';
import { isImpersonationSupportMode } from '@/core/auth/utils/impersonation-fe-log';
import type { UserData } from '@/features/auth/types/auth.types';

/** Requests que no deben disparar refresh ni retry automático con access token ERP. */
export function shouldSkipTokenRefresh(url?: string): boolean {
  if (!url) return false;
  const path = url.toLowerCase();
  return (
    path.includes('/auth/login') ||
    path.includes('/auth/refresh') ||
    path.includes('/auth/empresa/seleccionar') ||
    path.includes('/auth/impersonate')
  );
}

/** 401/403 en sesión impersonada: restaurar plataforma, no refresh. */
export function isImpersonationAuthErrorStatus(status: number | undefined): boolean {
  return status === 401 || status === 403;
}

export function hasExplicitAuthorization(
  headers: InternalAxiosRequestConfig['headers'],
): boolean {
  if (!headers) return false;
  const h = headers as Record<string, unknown>;
  const auth = h.Authorization ?? h.authorization;
  return typeof auth === 'string' && auth.trim().length > 0;
}

export function isSelectionSessionErrorStatus(status: number | undefined): boolean {
  return status === 401 || status === 403 || status === 409;
}

function normalizeRequestPath(url: string): string {
  const withoutQuery = url.split('?')[0].toLowerCase();
  try {
    if (withoutQuery.startsWith('http://') || withoutQuery.startsWith('https://')) {
      return new URL(withoutQuery).pathname.replace(/\/+$/, '');
    }
  } catch {
    // path relativo
  }
  return withoutQuery.replace(/\/+$/, '');
}

function pathEndsWithSegment(path: string, segment: string): boolean {
  return path === segment || path.endsWith(segment);
}

/**
 * Rutas auth whitelist del contrato PASSWORD_CHANGE_REQUIRED — no redirigir a /change-password.
 * @see FORCE_PASSWORD_CHANGE_FRONTEND_CONTRACT.md §5.5
 */
export function shouldSkipPasswordChangeRedirect(url?: string): boolean {
  if (!url) return false;
  const path = normalizeRequestPath(url);
  if (path.includes('/auth/impersonate')) {
    return true;
  }
  return (
    pathEndsWithSegment(path, '/auth/password/change') ||
    pathEndsWithSegment(path, '/auth/me') ||
    pathEndsWithSegment(path, '/auth/logout') ||
    pathEndsWithSegment(path, '/auth/refresh') ||
    pathEndsWithSegment(path, '/auth/empresa/seleccionar')
  );
}

/** Exclusiones oficiales: platform_admin e impersonación. */
export function shouldBypassPasswordChangeEnforcement(
  token: string | null,
  user: UserData | null,
): boolean {
  if (isImpersonationToken(token) || isImpersonationSupportMode(token)) {
    return true;
  }
  const claims = decodeAccessToken(token);
  if (claims?.is_impersonation) {
    return true;
  }
  const userType = user?.user_type ?? claims?.user_type;
  if (userType === 'platform_admin') {
    return true;
  }
  return false;
}
