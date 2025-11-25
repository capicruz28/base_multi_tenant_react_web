/**
 * Store de Zustand para gestionar el estado del branding dinámico
 */
import { create } from 'zustand';
import { BrandingRead, BrandingState } from '../types/branding.types';
import { brandingService } from '../services/branding.service';

interface BrandingStore extends BrandingState {
  // Acciones
  loadBranding: () => Promise<void>;
  setBranding: (branding: BrandingRead) => void;
  resetBranding: () => void;
  clearError: () => void;
}

/**
 * Valores por defecto del branding
 */
const defaultBranding: BrandingRead = {
  logo_url: null,
  favicon_url: null,
  color_primario: '#1976D2',
  color_secundario: '#424242',
  tema_personalizado: null,
};

/**
 * Store de branding
 * Gestiona el estado global del branding del tenant actual
 */
export const useBrandingStore = create<BrandingStore>((set, get) => ({
  // Estado inicial
  branding: null,
  loading: false,
  error: null,
  lastUpdated: null,

  /**
   * Cargar branding desde el backend
   */
  loadBranding: async () => {
    // Evitar cargar múltiples veces simultáneamente
    if (get().loading) {
      console.log('⏸️ [BrandingStore] Ya hay una carga en progreso, omitiendo...');
      return;
    }

    console.log('🔄 [BrandingStore] Iniciando carga de branding...');
    set({ loading: true, error: null });

    try {
      const branding = await brandingService.getBranding();
      
      console.log('✅ [BrandingStore] Branding recibido del servicio:', branding);
      
      set({
        branding,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      });

      console.log('✅ [BrandingStore] Branding almacenado exitosamente en el store');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar branding';
      
      console.error('❌ [BrandingStore] Error capturado:', errorMessage);
      console.error('❌ [BrandingStore] Error completo:', error);
      
      // Determinar si es un error del servidor (500) o un error de cliente (404/400)
      const isServerError = errorMessage.includes('500') || errorMessage.includes('Error del servidor');
      
      if (isServerError) {
        // Para errores 500, NO usar valores por defecto - mantener branding null
        // Esto permite que el usuario vea que hay un problema
        console.error('❌ [BrandingStore] Error 500 del servidor - NO usar valores por defecto');
        console.error('❌ [BrandingStore] El branding NO se aplicará hasta que el backend se corrija');
        set({
          branding: null, // Mantener null para indicar que hay un error
          loading: false,
          error: errorMessage,
          lastUpdated: null,
        });
      } else {
        // Para errores 404/400, usar valores por defecto (branding no disponible)
        console.warn('⚠️ [BrandingStore] Error 404/400 - usando valores por defecto');
        set({
          branding: defaultBranding,
          loading: false,
          error: errorMessage,
          lastUpdated: Date.now(),
        });
      }
    }
  },

  /**
   * Establecer branding manualmente (útil para testing o actualizaciones)
   */
  setBranding: (branding: BrandingRead) => {
    set({
      branding,
      error: null,
      lastUpdated: Date.now(),
    });
  },

  /**
   * Resetear branding a valores por defecto
   */
  resetBranding: () => {
    set({
      branding: defaultBranding,
      error: null,
      lastUpdated: null,
    });
  },

  /**
   * Limpiar error
   */
  clearError: () => {
    set({ error: null });
  },
}));

