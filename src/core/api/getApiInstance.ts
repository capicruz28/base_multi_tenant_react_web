/**
 * Helper para obtener la instancia de Axios correcta en servicios
 * 
 * ⚠️ NOTA: Esta función es para servicios que no pueden usar hooks.
 * En componentes, preferir usar useApi() hook.
 * 
 * Esta función requiere que se pase clienteInfo explícitamente porque
 * los servicios no tienen acceso al contexto de React.
 * 
 * @example
 * ```ts
 * // En un servicio
 * import { getApiInstance } from '@/core/api/getApiInstance';
 * import { getClienteInfo } from '@/shared/context/AuthContext';
 * 
 * export const clienteService = {
 *   async getClientes(clienteInfo: ClienteInfo | null) {
 *     const api = getApiInstance(clienteInfo);
 *     return api.get('/clientes');
 *   }
 * };
 * ```
 */
import type { AxiosInstance } from 'axios';
import { apiCentral, createLocalApi } from './axios-instances';
import { shouldUseLocalApi } from './api-config';
import type { ClienteInfo } from '@/features/auth/types/auth.types';

/**
 * Obtiene la instancia de Axios correcta según el tipo de instalación
 * 
 * @param clienteInfo - Información del cliente (puede ser null)
 * @returns Instancia de Axios configurada correctamente
 */
export const getApiInstance = (clienteInfo: ClienteInfo | null): AxiosInstance => {
  // Si debe usar servidor local, crear/obtener instancia local
  if (shouldUseLocalApi(clienteInfo) && clienteInfo?.servidor_api_local) {
    return createLocalApi(clienteInfo.servidor_api_local);
  }

  // En caso contrario, usar servidor central
  return apiCentral;
};

