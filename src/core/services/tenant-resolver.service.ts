/**
 * TenantResolver - Servicio para resolver el tenant desde el subdominio
 * 
 * Este servicio extrae el subdominio desde window.location.hostname
 * y proporciona utilidades para detectar el entorno y validar subdominios.
 * 
 * Soporta:
 * - Subdominios reales: acme.tuapp.com → subdomain: 'acme'
 * - Desarrollo local: localhost:5173 → subdomain: null (o desde query param)
 * - Query params: ?subdomain=acme (para desarrollo local)
 */
export interface TenantResolverResult {
  subdomain: string | null;
  isLocal: boolean;
  isValid: boolean;
  source: 'hostname' | 'query' | 'none';
}

/**
 * Valida el formato de un subdominio según RFC 1035
 * - Solo letras minúsculas, números y guiones
 * - No puede comenzar o terminar con guión
 * - Entre 3 y 63 caracteres
 */
export const isValidSubdomain = (subdomain: string): boolean => {
  if (!subdomain || typeof subdomain !== 'string') return false;
  
  // Longitud válida
  if (subdomain.length < 3 || subdomain.length > 63) return false;
  
  // Formato válido: solo letras minúsculas, números y guiones
  // No puede comenzar o terminar con guión
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return subdomainRegex.test(subdomain);
};

/**
 * Extrae el subdominio desde window.location.hostname
 * 
 * Ejemplos:
 * - acme.tuapp.com → 'acme'
 * - banco.tuapp.com → 'banco'
 * - localhost → null
 * - 127.0.0.1 → null
 */
export const extractSubdomainFromHostname = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  
  // Si es localhost o IP, no hay subdominio
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return null;
  }
  
  // Dividir por puntos
  const parts = hostname.split('.');
  
  // Si hay menos de 2 partes, no hay subdominio
  // Ejemplo: 'tuapp.com' → no hay subdominio
  // Ejemplo: 'acme.tuapp.com' → subdomain: 'acme'
  if (parts.length < 2) {
    return null;
  }
  
  // El subdominio es la primera parte
  const subdomain = parts[0];
  
  // Validar formato
  if (!isValidSubdomain(subdomain)) {
    console.warn(`⚠️ [TenantResolver] Subdominio inválido desde hostname: ${subdomain}`);
    return null;
  }
  
  return subdomain;
};

/**
 * Extrae el subdominio desde query params (útil para desarrollo local)
 * 
 * Ejemplo: localhost:5173/login?subdomain=acme → 'acme'
 */
export const extractSubdomainFromQuery = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  const subdomain = params.get('subdomain');
  
  if (!subdomain) return null;
  
  // Validar formato
  if (!isValidSubdomain(subdomain)) {
    console.warn(`⚠️ [TenantResolver] Subdominio inválido desde query: ${subdomain}`);
    return null;
  }
  
  return subdomain;
};

/**
 * Detecta si estamos en desarrollo local
 */
export const isLocalDevelopment = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
};

/**
 * Resuelve el tenant desde el subdominio
 * 
 * Prioridad:
 * 1. Query param (para desarrollo local)
 * 2. Hostname (subdominio real)
 * 3. null (sin subdominio)
 */
export const resolveTenant = (): TenantResolverResult => {
  const isLocal = isLocalDevelopment();
  
  // Intentar desde query param primero (útil para desarrollo local)
  let subdomain = extractSubdomainFromQuery();
  let source: 'hostname' | 'query' | 'none' = subdomain ? 'query' : 'none';
  
  // Si no hay en query, intentar desde hostname
  if (!subdomain) {
    subdomain = extractSubdomainFromHostname();
    source = subdomain ? 'hostname' : 'none';
  }
  
  const isValid = subdomain !== null && isValidSubdomain(subdomain);
  
  return {
    subdomain: isValid ? subdomain : null,
    isLocal,
    isValid,
    source,
  };
};

/**
 * Servicio de resolución de tenant
 */
export const tenantResolver = {
  /**
   * Obtiene el subdominio actual
   */
  getSubdomain(): string | null {
    return resolveTenant().subdomain;
  },
  
  /**
   * Detecta si estamos en desarrollo local
   */
  isLocalDevelopment(): boolean {
    return isLocalDevelopment();
  },
  
  /**
   * Resuelve el tenant completo
   */
  resolve(): TenantResolverResult {
    return resolveTenant();
  },
  
  /**
   * Valida un subdominio
   */
  isValidSubdomain(subdomain: string): boolean {
    return isValidSubdomain(subdomain);
  },
};


