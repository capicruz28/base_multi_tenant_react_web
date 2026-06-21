import type { AxiosError, AxiosResponse } from 'axios';
import { tenantResolver } from '@/core/services/tenant-resolver.service';

import {
  emitSessionDiagContext,
  isSessionTelemetryEffective,
} from '@/core/auth/session/session-telemetry-auth-wiring';
import { prepareSessionDiagContextFields } from '@/core/auth/session/session-telemetry-diag-context.policy';

/** Logs de diagnóstico auth — delega a telemetría F8 cuando master ON (P1-02). */
export function isAuthDebugEnabled(): boolean {
  if (isSessionTelemetryEffective()) {
    return false;
  }
  return import.meta.env.DEV;
}

export function logAuthContext(label: string, extra?: Record<string, unknown>): void {
  if (isSessionTelemetryEffective()) {
    emitSessionDiagContext(label, extra ?? {});
    return;
  }

  if (!import.meta.env.DEV) {
    return;
  }

  const resolved = tenantResolver.resolve();

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
  if (extra) {
    console.log('extra', extra);
  }
  console.groupEnd();
}

/** Set-Cookie no es legible desde JS; telemetría redacta headers expuestos. */
export function logAuthResponse(
  operation: string,
  response: AxiosResponse<unknown>,
  requestUrl?: string,
): void {
  if (isSessionTelemetryEffective()) {
    const exposed = response.headers as Record<string, unknown>;
    emitSessionDiagContext(`${operation} response`, {
      status: response.status,
      requestUrl: requestUrl ?? response.config?.url,
      headerKeys: Object.keys(exposed).filter((k) => !k.startsWith('access-control')),
    });
    return;
  }

  if (!import.meta.env.DEV) {
    return;
  }

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
  console.groupEnd();
}

export function logAuthError(operation: string, error: unknown): void {
  if (isSessionTelemetryEffective()) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    emitSessionDiagContext(`${operation} ERROR`, {
      status: axiosError.response?.status,
      message: axiosError.message,
      url: axiosError.config?.url,
    });
    return;
  }

  if (!import.meta.env.DEV) {
    return;
  }

  const axiosError = error as AxiosError<{ detail?: string }>;
  console.group(`[AuthDebug] ${operation} ERROR`);
  console.log('status', axiosError.response?.status);
  console.log('data', axiosError.response?.data);
  console.log('message', axiosError.message);
  console.log('url', axiosError.config?.url);
  console.groupEnd();
}

export function logRefreshResult(
  outcome: 'ok' | 'fail',
  detail: { tokenPrefix?: string; status?: number; message?: string },
): void {
  if (isSessionTelemetryEffective()) {
    emitSessionDiagContext(`refreshToken() → ${outcome}`, prepareSessionDiagContextFields({ ...detail }));
    return;
  }

  if (!import.meta.env.DEV) {
    return;
  }

  console.log(`[AuthDebug] refreshToken() → ${outcome}`, detail);
}
