/**
 * Servicio para obtener la configuración de branding del tenant actual
 * Endpoints:
 * - GET /api/v1/clientes/tenant/branding (requiere autenticación, usa contexto de tenant)
 * - GET /api/v1/clientes/branding?subdominio=xxx (público, por subdominio - pre-login)
 */
import api from '../../../core/api/api';
import { BrandingRead } from '../types/branding.types';
import { getErrorMessage } from '../../../core/services/error.service';

const BASE_URL = '/clientes/tenant/branding';
const PUBLIC_BRANDING_URL = '/clientes/branding';

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
    // Solo log en desarrollo
    if (import.meta.env.DEV) {
      const fullUrl = `${api.defaults.baseURL}${BASE_URL}`;
      console.log('🔍 [BrandingService] Llamando endpoint:', fullUrl);
    }
    
    try {
      const { data } = await api.get<BrandingRead>(BASE_URL);
      
      // Solo log en desarrollo
      if (import.meta.env.DEV) {
        console.log('✅ [BrandingService] Respuesta del backend:', data);
      }
      
      // Validar que los colores sean HEX válidos
      if (data.color_primario && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(data.color_primario)) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ [BrandingService] Color primario inválido, usando valor por defecto');
        }
        data.color_primario = '#1976D2';
      }
      
      if (data.color_secundario && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(data.color_secundario)) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ [BrandingService] Color secundario inválido, usando valor por defecto');
        }
        data.color_secundario = '#424242';
      }
      
      return data;
    } catch (error: any) {
      const errorData = getErrorMessage(error);
      const status = errorData.status;
      
      // Si es 404 o 400, el branding no está disponible o no se puede determinar el tenant
      // En estos casos, usar valores por defecto (solo log en desarrollo)
      if (status === 404 || status === 400) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ [BrandingService] Branding no disponible (404/400), usando valores por defecto');
        }
        return {
          logo_url: null,
          favicon_url: null,
          color_primario: '#1976D2',
          color_secundario: '#424242',
          tema_personalizado: null,
        };
      }
      
      // Si es 500, es un error del servidor - NO usar valores por defecto
      if (status === 500) {
        if (import.meta.env.DEV) {
          console.error('❌ [BrandingService] Error 500 del servidor al obtener branding');
        }
        throw new Error(`Error del servidor al obtener branding: ${errorData.message || 'Error interno del servidor'}`);
      }
      
      // Para otros errores, log solo en desarrollo y lanzar excepción
      if (import.meta.env.DEV) {
        console.error('❌ [BrandingService] Error obteniendo branding:', error?.message || error);
      }
      throw new Error(errorData.message || 'Error al obtener la configuración de branding');
    }
  },

  /**
   * Obtener branding por subdominio (público, sin autenticación)
   * Endpoint: GET /clientes/branding?subdominio=xxx
   * 
   * Este método es útil para cargar branding antes del login
   * basándose en el subdominio de la URL.
   * 
   * @param subdomain - Subdominio del tenant (ej: 'acme', 'banco')
   * @returns Promise con la configuración de branding
   * @throws Error si falla la petición
   */
  async getBrandingBySubdomain(subdomain: string): Promise<BrandingRead> {
    if (!subdomain || typeof subdomain !== 'string') {
      throw new Error('Subdominio inválido');
    }

    // Solo log en desarrollo
    if (import.meta.env.DEV) {
      const fullUrl = `${api.defaults.baseURL}${PUBLIC_BRANDING_URL}?subdominio=${encodeURIComponent(subdomain)}`;
      console.log('🔍 [BrandingService] Llamando endpoint público:', fullUrl);
    }
    
    try {
      // Crear una instancia de axios sin autenticación para este endpoint público
      // O usar el mismo api pero sin cookies/headers de auth
      const { data } = await api.get<BrandingRead>(PUBLIC_BRANDING_URL, {
        params: { subdominio: subdomain },
        // No incluir credenciales para endpoint público
        withCredentials: false,
      });
      
      // Solo log en desarrollo
      if (import.meta.env.DEV) {
        console.log('✅ [BrandingService] Respuesta del backend (por subdominio):', data);
      }
      
      // Validar que los colores sean HEX válidos
      if (data.color_primario && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(data.color_primario)) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ [BrandingService] Color primario inválido, usando valor por defecto');
        }
        data.color_primario = '#1976D2';
      }
      
      if (data.color_secundario && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(data.color_secundario)) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ [BrandingService] Color secundario inválido, usando valor por defecto');
        }
        data.color_secundario = '#424242';
      }
      return data;
    } catch (error: any) {
      const errorData = getErrorMessage(error);
      const status = errorData.status;
      
      // Si es 404 o 400, el branding no está disponible o el subdominio no existe
      // En estos casos, usar valores por defecto (solo log en desarrollo)
      if (status === 404 || status === 400) {
        if (import.meta.env.DEV) {
          console.warn(`⚠️ [BrandingService] Branding no disponible para subdominio "${subdomain}" (${status}), usando valores por defecto`);
        }
        return {
          logo_url: null,
          favicon_url: null,
          color_primario: '#1976D2',
          color_secundario: '#424242',
          tema_personalizado: null,
        };
      }
      
      // Si es 500, es un error del servidor - NO usar valores por defecto
      if (status === 500) {
        if (import.meta.env.DEV) {
          console.error('❌ [BrandingService] Error 500 del servidor al obtener branding por subdominio. Revisar logs del servidor.');
        }
        throw new Error(`Error del servidor al obtener branding: ${errorData.message || 'Error interno del servidor'}`);
      }
      
      // Para otros errores, log solo en desarrollo y lanzar excepción
      if (import.meta.env.DEV) {
        console.error('❌ [BrandingService] Error no manejado al obtener branding por subdominio, lanzando excepción');
      }
      throw new Error(errorData.message || 'Error al obtener la configuración de branding por subdominio');
    }
  },
};

