/**
 * Servicio para obtener la configuración de branding del tenant actual
 * Endpoint: GET /api/v1/clientes/tenant/branding
 */
import api from './api';
import { BrandingRead } from '../types/branding.types';
import { getErrorMessage } from './error.service';

const BASE_URL = '/clientes/tenant/branding';

/**
 * Obtiene la configuración de branding del tenant actual
 * Usa el cliente_id del contexto de tenant (middleware)
 * 
 * @returns Promise con la configuración de branding
 * @throws Error si falla la petición
 */
export const brandingService = {
  /**
   * Obtener branding del tenant actual
   * Endpoint: GET /clientes/tenant/branding
   */
  async getBranding(): Promise<BrandingRead> {
    const fullUrl = `${api.defaults.baseURL}${BASE_URL}`;
    console.log('🔍 [BrandingService] Llamando endpoint:', fullUrl);
    
    try {
      const { data } = await api.get<BrandingRead>(BASE_URL);
      
      console.log('✅ [BrandingService] Respuesta del backend:', data);
      
      // Validar que los colores sean HEX válidos
      if (data.color_primario && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(data.color_primario)) {
        console.warn('⚠️ [BrandingService] Color primario inválido, usando valor por defecto');
        data.color_primario = '#1976D2';
      }
      
      if (data.color_secundario && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(data.color_secundario)) {
        console.warn('⚠️ [BrandingService] Color secundario inválido, usando valor por defecto');
        data.color_secundario = '#424242';
      }
      
      console.log('✅ [BrandingService] Branding validado y retornado:', data);
      return data;
    } catch (error: any) {
      console.error('❌ [BrandingService] Error completo:', error);
      console.error('❌ [BrandingService] Error response:', error?.response);
      console.error('❌ [BrandingService] Error status:', error?.response?.status);
      console.error('❌ [BrandingService] Error data:', error?.response?.data);
      
      const errorData = getErrorMessage(error);
      console.error('❌ [BrandingService] Error procesado:', errorData);
      
      // Si es 404 o 400, el branding no está disponible o no se puede determinar el tenant
      // En estos casos, usar valores por defecto
      if (errorData.status === 404 || errorData.status === 400) {
        console.warn('⚠️ [BrandingService] Branding no disponible (404/400), usando valores por defecto');
        console.warn('⚠️ [BrandingService] Detalle del error:', errorData.message);
        return {
          logo_url: null,
          favicon_url: null,
          color_primario: '#1976D2',
          color_secundario: '#424242',
          tema_personalizado: null,
        };
      }
      
      // Si es 500, es un error del servidor - NO usar valores por defecto
      // Lanzar excepción para que el store maneje el error apropiadamente
      if (errorData.status === 500) {
        console.error('❌ [BrandingService] Error 500 del servidor - NO usar valores por defecto');
        console.error('❌ [BrandingService] El backend tiene un problema. Revisar logs del servidor.');
        throw new Error(`Error del servidor al obtener branding: ${errorData.message || 'Error interno del servidor'}`);
      }
      
      // Para otros errores, lanzar excepción
      console.error('❌ [BrandingService] Error no manejado, lanzando excepción');
      throw new Error(errorData.message || 'Error al obtener la configuración de branding');
    }
  },
};

