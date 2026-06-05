/**
 * API Configuration Helper
 * 
 * Determina el baseURL dinámico según el tipo de instalación del tenant.
 * 
 * Tipos de instalación:
 * - shared/dedicated: Usa servidor central
 * - onpremise/hybrid: Usa servidor_api_local del cliente
 */
import { ClienteInfo } from '../../types/auth.types';
import { InstallationType } from '../constants';

/**
 * Base URL por defecto (servidor central)
 */
export const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Valida si una URL es válida
 */
export const isValidUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Normaliza una URL (agrega /api/v1 si no está presente)
 */
export const normalizeApiUrl = (url: string): string => {
  if (!url) return DEFAULT_API_BASE_URL;
  
  // Si la URL ya termina con /api/v1, retornarla tal cual
  if (url.endsWith('/api/v1')) {
    return url;
  }
  
  // Si termina con /, agregar api/v1
  if (url.endsWith('/')) {
    return `${url}api/v1`;
  }
  
  // Si no termina con /, agregar /api/v1
  return `${url}/api/v1`;
};

/**
 * Determina si debe usarse el servidor local según el tipo de instalación
 */
export const shouldUseLocalApi = (clienteInfo: ClienteInfo | null): boolean => {
  if (!clienteInfo) return false;
  
  const { tipo_instalacion, servidor_api_local } = clienteInfo;
  
  // Solo usar servidor local si es onpremise o hybrid Y tiene servidor_api_local válido
  if ((tipo_instalacion === InstallationType.ONPREMISE || tipo_instalacion === InstallationType.HYBRID) && servidor_api_local) {
    return isValidUrl(servidor_api_local);
  }
  
  return false;
};

/**
 * Obtiene el baseURL según la configuración del tenant
 * 
 * @param clienteInfo - Información del cliente (puede ser null si no hay autenticación)
 * @returns Base URL para las peticiones API
 */
export const getApiBaseUrl = (clienteInfo: ClienteInfo | null): string => {
  // Si no hay clienteInfo, usar servidor central
  if (!clienteInfo) {
    return DEFAULT_API_BASE_URL;
  }
  
  const { tipo_instalacion, servidor_api_local } = clienteInfo;
  
  // Para onpremise o hybrid, usar servidor local si está disponible y es válido
  if ((tipo_instalacion === InstallationType.ONPREMISE || tipo_instalacion === InstallationType.HYBRID) && servidor_api_local) {
    if (isValidUrl(servidor_api_local)) {
      const normalized = normalizeApiUrl(servidor_api_local);
      console.log(`🌐 [ApiConfig] Usando servidor local: ${normalized}`);
      return normalized;
    } else {
      console.warn(`⚠️ [ApiConfig] servidor_api_local inválido, usando servidor central: ${servidor_api_local}`);
    }
  }
  
  // Para shared, dedicated, o si no hay servidor local válido, usar servidor central
  console.log(`🌐 [ApiConfig] Usando servidor central: ${DEFAULT_API_BASE_URL}`);
  return DEFAULT_API_BASE_URL;
};

/**
 * Determina si un endpoint debe usar siempre el servidor central
 * (útil para login/refresh que no dependen del tenant)
 */
export const shouldUseCentralServer = (url?: string): boolean => {
  if (!url) return false;
  
  const normalizedUrl = url.toLowerCase();
  
  // Endpoints de autenticación siempre usan servidor central
  const authEndpoints = [
    '/auth/login',
    '/auth/refresh',
    '/auth/logout',
    '/auth/empresa/seleccionar',
  ];
  
  return authEndpoints.some(endpoint => normalizedUrl.includes(endpoint));
};


