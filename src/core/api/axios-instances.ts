/**
 * Factory de instancias Axios para API Híbrida
 * 
 * Soluciona el problema de race conditions al modificar baseURL dinámicamente
 * en el interceptor. En su lugar, crea instancias separadas según el tipo de instalación.
 * 
 * Uso:
 * ```tsx
 * const api = useApi(); // Hook que selecciona la instancia correcta
 * const response = await api.get('/clientes');
 * ```
 */
import axios, { AxiosInstance } from 'axios';
import { DEFAULT_API_BASE_URL } from './api-config';

/**
 * Instancia de Axios para servidor central (SaaS)
 * Usada por defecto para clientes shared/dedicated
 */
export const apiCentral: AxiosInstance = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  withCredentials: true, // Importante para enviar cookies HttpOnly
  timeout: 30000, // 30 segundos timeout
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Type': 'web',
  },
});

/**
 * Cache de instancias locales por URL
 * Evita crear múltiples instancias para la misma URL
 */
const localApiInstances: Map<string, AxiosInstance> = new Map();

/**
 * Crea una instancia de Axios para servidor local (on-premise/hybrid)
 * 
 * @param localUrl - URL del servidor API local
 * @returns Instancia de Axios configurada para el servidor local
 */
export const createLocalApi = (localUrl: string): AxiosInstance => {
  // Normalizar URL (agregar /api/v1 si no está presente)
  const normalizedUrl = localUrl.endsWith('/api/v1')
    ? localUrl
    : localUrl.endsWith('/')
    ? `${localUrl}api/v1`
    : `${localUrl}/api/v1`;

  // Reutilizar instancia si ya existe
  if (localApiInstances.has(normalizedUrl)) {
    return localApiInstances.get(normalizedUrl)!;
  }

  // Crear nueva instancia
  const localApi = axios.create({
    baseURL: normalizedUrl,
    withCredentials: true,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Type': 'web',
    },
  });

  // Cachear instancia
  localApiInstances.set(normalizedUrl, localApi);

  console.log(`🌐 [AxiosInstances] Instancia local creada para: ${normalizedUrl}`);
  return localApi;
};

/**
 * Limpia el cache de instancias locales
 * Útil para testing o cuando se necesita forzar recreación
 */
export const clearLocalApiCache = (): void => {
  localApiInstances.clear();
  console.log('🧹 [AxiosInstances] Cache de instancias locales limpiado');
};

