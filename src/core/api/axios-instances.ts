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
import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { DEFAULT_API_BASE_URL } from './api-config';

/** Mensaje global para errores 5xx y timeout; usada por api central (AuthContext) y por instancias locales */
export function showServerErrorToast(error: AxiosError): void {
  const status = error.response?.status;
  const is5xx = status != null && status >= 500;
  const isTimeout = (error as AxiosError & { code?: string }).code === 'ECONNABORTED';
  if (!is5xx && !isTimeout) return;
  const message = isTimeout
    ? 'La solicitud tardó demasiado. Revisa tu conexión e intenta de nuevo.'
    : status === 503
      ? 'El servicio no está disponible temporalmente. Intenta en unos momentos.'
      : 'Error del servidor. Si el problema persiste, contacta a soporte.';
  toast.error(message, { duration: 5000 });
}

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

  // Corrección crítica: mismo manejo de 5xx/timeout que en api central
  localApi.interceptors.response.use(
    (res) => res,
    (error: AxiosError) => {
      showServerErrorToast(error);
      return Promise.reject(error);
    }
  );

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

