import type { InternalAxiosRequestConfig } from 'axios';

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
