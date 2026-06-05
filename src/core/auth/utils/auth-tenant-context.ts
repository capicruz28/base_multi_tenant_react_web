import { tenantResolver } from '@/core/services/tenant-resolver.service';

/**
 * Headers opcionales de contexto tenant (requieren CORS en backend).
 *
 * NO usarlos en login/refresh hasta que el API liste en Access-Control-Allow-Headers:
 * X-Forwarded-Host, X-Tenant-Subdomain, X-Client-Origin, etc.
 * Activar con VITE_AUTH_TENANT_HEADERS=true tras actualizar CORS del backend.
 */
export function buildAuthTenantContextHeaders(): Record<string, string> {
  if (import.meta.env.VITE_AUTH_TENANT_HEADERS !== 'true') {
    return {};
  }
  if (typeof window === 'undefined') {
    return {};
  }

  const { subdomain, source, isLocal } = tenantResolver.resolve();
  const headers: Record<string, string> = {
    'X-Forwarded-Host': window.location.host,
    'X-Forwarded-Proto': window.location.protocol.replace(':', ''),
    'X-Client-Origin': window.location.origin,
  };

  if (subdomain) {
    headers['X-Tenant-Subdomain'] = subdomain;
  }

  if (import.meta.env.DEV) {
    headers['X-Auth-Tenant-Source'] = source;
    if (isLocal) {
      headers['X-Auth-Dev-Local'] = '1';
    }
  }

  return headers;
}

/** Subdominio activo en el FE (p. ej. "platform" en platform.app.local). */
export function getFrontendSubdomain(): string | null {
  return tenantResolver.getSubdomain();
}
