/**
 * Hook para obtener la instancia de Axios correcta según el tipo de instalación
 * 
 * Soluciona race conditions al seleccionar la instancia correcta en tiempo de ejecución
 * en lugar de modificar el baseURL del singleton global.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const api = useApi();
 *   
 *   const fetchData = async () => {
 *     const response = await api.get('/clientes');
 *     return response.data;
 *   };
 * }
 * ```
 */
import { useMemo } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { apiCentral, createLocalApi } from './axios-instances';
import { shouldUseLocalApi } from './api-config';
import type { AxiosInstance } from 'axios';

/**
 * Hook que retorna la instancia de Axios correcta según el tenant
 * 
 * - Si el cliente tiene instalación on-premise/hybrid y tiene servidor_api_local,
 *   retorna una instancia configurada para ese servidor.
 * - En caso contrario, retorna la instancia del servidor central.
 * 
 * @returns Instancia de Axios configurada correctamente
 */
export const useApi = (): AxiosInstance => {
  const { clienteInfo } = useAuth();

  const api = useMemo(() => {
    // Si debe usar servidor local, crear/obtener instancia local
    if (shouldUseLocalApi(clienteInfo) && clienteInfo?.servidor_api_local) {
      return createLocalApi(clienteInfo.servidor_api_local);
    }

    // En caso contrario, usar servidor central
    return apiCentral;
  }, [clienteInfo]);

  return api;
};

