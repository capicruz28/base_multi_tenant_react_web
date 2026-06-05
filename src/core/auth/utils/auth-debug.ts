import type { AxiosError, AxiosResponse } from 'axios';
import { tenantResolver } from '@/core/services/tenant-resolver.service';

const PLATFORM_SUPERADMIN_CLIENTE_ID = '00000000-0000-0000-0000-000000000001';

/** Logs de diagnóstico auth (solo DEV). */
export function isAuthDebugEnabled(): boolean {
  return import.meta.env.DEV;
}

export function logAuthContext(label: string, extra?: Record<string, unknown>): void {
  if (!isAuthDebugEnabled()) return;

  const resolved = tenantResolver.resolve();
  const visibleCookies = typeof document !== 'undefined' ? document.cookie : '';

  console.group(`[AuthDebug] ${label}`);
  console.log('location', {
    hostname: typeof window !== 'undefined' ? window.location.hostname : null,
    host: typeof window !== 'undefined' ? window.location.host : null,
    origin: typeof window !== 'undefined' ? window.location.origin : null,
    pathname: typeof window !== 'undefined' ? window.location.pathname : null,
  });
  console.log('tenantResolver', resolved);
  console.log('apiBaseUrl', import.meta.env.VITE_API_BASE_URL ?? '/api/v1');
  console.log('withCredentials', true, '(axios apiCentral / api default)');
  console.log(
    'document.cookie (solo cookies NO HttpOnly; refresh_token HttpOnly NO aparece aquí)',
    visibleCookies || '(vacío)',
  );
  console.log('platformSuperadminClienteId', PLATFORM_SUPERADMIN_CLIENTE_ID);
  if (extra) {
    console.log('extra', extra);
  }
  console.groupEnd();
}

/** Set-Cookie no es legible desde JS en el navegador; registramos aviso + headers expuestos. */
export function logAuthResponse(
  operation: string,
  response: AxiosResponse<unknown>,
  requestUrl?: string,
): void {
  if (!isAuthDebugEnabled()) return;

  const exposed = response.headers as Record<string, unknown>;
  const setCookieRaw =
    exposed['set-cookie'] ?? exposed['Set-Cookie'] ?? '(no accesible vía JS — ver pestaña Network)';

  console.group(`[AuthDebug] ${operation} response`);
  console.log('status', response.status, response.statusText);
  console.log('requestUrl', requestUrl ?? response.config?.url);
  console.log('responseURL', response.request?.responseURL ?? null);
  console.log('set-cookie (header)', setCookieRaw);
  console.log(
    'headers expuestos',
    Object.keys(exposed).filter((k) => !k.startsWith('access-control')),
  );
  console.log(
    'nota',
    'Compare en Network → login/refresh → Set-Cookie: Domain, Path, SameSite, Secure, Max-Age',
  );
  console.groupEnd();
}

export function logAuthError(operation: string, error: unknown): void {
  if (!isAuthDebugEnabled()) return;

  const axiosError = error as AxiosError<{ detail?: string }>;
  console.group(`[AuthDebug] ${operation} ERROR`);
  console.log('status', axiosError.response?.status);
  console.log('data', axiosError.response?.data);
  console.log('message', axiosError.message);
  console.log('url', axiosError.config?.url);
  console.log('withCredentials', axiosError.config?.withCredentials);
  console.groupEnd();
}

export function logRefreshResult(
  outcome: 'ok' | 'fail',
  detail: { tokenPrefix?: string; status?: number; message?: string },
): void {
  if (!isAuthDebugEnabled()) return;
  console.log(`[AuthDebug] refreshToken() → ${outcome}`, detail);
}
