/**
 * Store de Zustand para gestionar el estado del branding dinámico
 * ✅ MEJORADO: Particionado por tenant para aislamiento completo
 */
import { create } from 'zustand';
import { BrandingRead, BrandingState } from '../types/branding.types';
import { brandingService } from '../services/branding.service';

interface BrandingStoreState extends BrandingState {
  // Acciones
  loadBranding: (tenantId: string | null) => Promise<void>;
  loadBrandingBySubdomain: (subdomain: string) => Promise<void>;
  setBranding: (tenantId: string | null, branding: BrandingRead) => void;
  resetBranding: (tenantId: string | null) => void;
  clearError: (tenantId: string | null) => void;
  // Helper para obtener branding del tenant actual
  getBranding: (tenantId: string | null) => BrandingRead | null;
  // Helper para obtener branding por subdominio (cache temporal)
  getBrandingBySubdomain: (subdomain: string) => BrandingRead | null;
  // Helper interno para obtener estado completo del tenant
  getTenantState: (tenantId: string | null) => BrandingState;
  // Limpiar todos los tenants (útil para logout)
  clearAll: () => void;
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
 * Estado interno: Map de tenantId -> BrandingState
 * También cacheamos branding por subdominio (temporal, pre-login)
 */
interface BrandingStoreInternal {
  tenants: Map<string, BrandingState>;
  subdomainCache: Map<string, BrandingRead>; // Cache temporal por subdominio
}

/**
 * Store de branding particionado por tenant
 * Cada tenant tiene su propio estado de branding aislado
 */
export const useBrandingStore = create<BrandingStoreState & BrandingStoreInternal>((set, get) => ({
  // Estado interno
  tenants: new Map(),
  subdomainCache: new Map(), // Cache temporal por subdominio

  // Estado actual (para compatibilidad con código existente)
  branding: null,
  loading: false,
  error: null,
  lastUpdated: null,

  /**
   * Obtener estado de branding para un tenant específico
   */
  getBranding: (tenantId: string | null) => {
    if (!tenantId) return null;
    const tenantState = get().tenants.get(tenantId);
    return tenantState?.branding || null;
  },

  /**
   * Obtener estado completo para un tenant (método interno)
   */
  getTenantState: (tenantId: string | null): BrandingState => {
    if (!tenantId) {
      return {
        branding: null,
        loading: false,
        error: null,
        lastUpdated: null,
      };
    }
    
    const tenantState = get().tenants.get(tenantId);
    if (tenantState) {
      return tenantState;
    }
    
    // Retornar estado inicial si no existe
    return {
      branding: null,
      loading: false,
      error: null,
      lastUpdated: null,
    };
  },

  /**
   * Obtener branding por subdominio (cache temporal, pre-login)
   */
  getBrandingBySubdomain: (subdomain: string) => {
    return get().subdomainCache.get(subdomain) || null;
  },

  /**
   * Cargar branding desde el backend para un tenant específico
   */
  loadBranding: async (tenantId: string | null) => {
    if (!tenantId) {
      console.warn('⚠️ [BrandingStore] No hay tenantId, no se puede cargar branding');
      return;
    }

    const tenantState = get().getTenantState(tenantId);
    
    // Evitar cargar múltiples veces simultáneamente
    if (tenantState.loading) {
      // Solo log en desarrollo
      if (import.meta.env.DEV) {
        console.log(`⏸️ [BrandingStore] Ya hay una carga en progreso para tenant ${tenantId}, omitiendo...`);
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.log(`🔄 [BrandingStore] Iniciando carga de branding para tenant ${tenantId}...`);
    }
    
    // Actualizar estado de loading
    const updatedTenants = new Map(get().tenants);
    updatedTenants.set(tenantId, {
      ...tenantState,
      loading: true,
      error: null,
    });
    set({ tenants: updatedTenants });

    try {
      const branding = await brandingService.getBranding();
      
      // Solo log en desarrollo
      if (import.meta.env.DEV) {
        console.log(`✅ [BrandingStore] Branding recibido para tenant ${tenantId}`);
      }
      
      // Actualizar estado con branding
      const finalTenants = new Map(get().tenants);
      finalTenants.set(tenantId, {
        branding,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      });
      
      // Actualizar estado actual si es el tenant activo
      set({
        tenants: finalTenants,
        branding,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      });

      // Solo log en desarrollo
      if (import.meta.env.DEV) {
        console.log(`✅ [BrandingStore] Branding almacenado para tenant ${tenantId}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar branding';
      
      console.error(`❌ [BrandingStore] Error capturado para tenant ${tenantId}:`, errorMessage);
      
      // Determinar si es un error del servidor (500) o un error de cliente (404/400)
      const isServerError = errorMessage.includes('500') || errorMessage.includes('Error del servidor');
      
      const errorTenants = new Map(get().tenants);
      
      if (isServerError) {
        // Para errores 500, NO usar valores por defecto
        errorTenants.set(tenantId, {
          branding: null,
          loading: false,
          error: errorMessage,
          lastUpdated: null,
        });
        set({
          tenants: errorTenants,
          branding: null,
          loading: false,
          error: errorMessage,
          lastUpdated: null,
        });
      } else {
        // Para errores 404/400, usar valores por defecto
        errorTenants.set(tenantId, {
          branding: defaultBranding,
          loading: false,
          error: errorMessage,
          lastUpdated: Date.now(),
        });
        set({
          tenants: errorTenants,
          branding: defaultBranding,
          loading: false,
          error: errorMessage,
          lastUpdated: Date.now(),
        });
      }
    }
  },

  /**
   * Cargar branding por subdominio (público, pre-login)
   * Este método no requiere autenticación y usa el endpoint público
   */
  loadBrandingBySubdomain: async (subdomain: string) => {
    if (!subdomain || typeof subdomain !== 'string') {
      // Solo log en desarrollo
      if (import.meta.env.DEV) {
        console.warn('⚠️ [BrandingStore] Subdominio inválido, no se puede cargar branding');
      }
      return;
    }

    // Verificar cache
    const cached = get().subdomainCache.get(subdomain);
    if (cached) {
      console.log(`✅ [BrandingStore] Branding encontrado en cache para subdominio ${subdomain}`);
      // Aplicar branding desde cache
      set({
        branding: cached,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      });
      return;
    }

    if (import.meta.env.DEV) {
      console.log(`🔄 [BrandingStore] Iniciando carga de branding por subdominio ${subdomain}...`);
    }
    
    set({ loading: true, error: null });

    try {
      const branding = await brandingService.getBrandingBySubdomain(subdomain);
      
      // Solo log en desarrollo
      if (import.meta.env.DEV) {
        console.log(`✅ [BrandingStore] Branding recibido para subdominio ${subdomain}`);
      }
      
      // Guardar en cache
      const updatedCache = new Map(get().subdomainCache);
      updatedCache.set(subdomain, branding);
      
      // Actualizar estado actual
      set({
        subdomainCache: updatedCache,
        branding,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      });

      // Solo log en desarrollo
      if (import.meta.env.DEV) {
        console.log(`✅ [BrandingStore] Branding almacenado para subdominio ${subdomain}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar branding';
      
      console.error(`❌ [BrandingStore] Error capturado para subdominio ${subdomain}:`, errorMessage);
      
      // Determinar si es un error del servidor (500) o un error de cliente (404/400)
      const isServerError = errorMessage.includes('500') || errorMessage.includes('Error del servidor');
      
      if (isServerError) {
        // Para errores 500, NO usar valores por defecto
        set({
          branding: null,
          loading: false,
          error: errorMessage,
          lastUpdated: null,
        });
      } else {
        // Para errores 404/400, usar valores por defecto
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
   * Establecer branding manualmente para un tenant específico
   */
  setBranding: (tenantId: string | null, branding: BrandingRead) => {
    if (!tenantId) {
      console.warn('⚠️ [BrandingStore] No hay tenantId, no se puede establecer branding');
      return;
    }

    const updatedTenants = new Map(get().tenants);
    updatedTenants.set(tenantId, {
      branding,
      error: null,
      lastUpdated: Date.now(),
      loading: false,
    });
    
    set({
      tenants: updatedTenants,
      branding,
      error: null,
      lastUpdated: Date.now(),
    });
  },

  /**
   * Resetear branding a valores por defecto para un tenant específico
   */
  resetBranding: (tenantId: string | null) => {
    if (!tenantId) {
      // Si no hay tenantId, resetear estado actual
      set({
        branding: defaultBranding,
        error: null,
        lastUpdated: null,
      });
      return;
    }

    const updatedTenants = new Map(get().tenants);
    updatedTenants.set(tenantId, {
      branding: defaultBranding,
      error: null,
      lastUpdated: null,
      loading: false,
    });
    
    set({
      tenants: updatedTenants,
      branding: defaultBranding,
      error: null,
      lastUpdated: null,
    });
  },

  /**
   * Limpiar error para un tenant específico
   */
  clearError: (tenantId: string | null) => {
    if (!tenantId) {
      set({ error: null });
      return;
    }

    const tenantState = get().getTenantState(tenantId);
    const updatedTenants = new Map(get().tenants);
    updatedTenants.set(tenantId, {
      ...tenantState,
      error: null,
    });
    
    set({ tenants: updatedTenants, error: null });
  },

  /**
   * Limpiar todos los tenants (útil para logout global)
   * @param preserveSubdomainCache - Si es true, preserva el cache por subdominio (útil para pre-login)
   */
  clearAll: (preserveSubdomainCache = false) => {
    const currentState = get();
    set({
      tenants: new Map(),
      subdomainCache: preserveSubdomainCache ? currentState.subdomainCache : new Map(),
      branding: null,
      loading: false,
      error: null,
      lastUpdated: null,
    });
  },
}));

/**
 * Hook helper para usar el branding store con tenantId automático
 * Este hook obtiene el tenantId y subdomain del TenantContext automáticamente
 * 
 * ✅ MEJORADO: Si no hay tenantId pero hay subdomain, usa el cache de subdominio (pre-login)
 */
import { useTenant } from '../components/TenantContext';

export const useBrandingStoreWithTenant = () => {
  const { tenantId, subdomain } = useTenant();
  const store = useBrandingStore();
  
  // Si hay tenantId, usar branding del tenant (post-login)
  // Si no hay tenantId pero hay subdomain, usar branding del cache de subdominio (pre-login)
  // Si no hay ninguno, usar estado actual del store
  const branding = tenantId 
    ? store.getBranding(tenantId)
    : (subdomain ? store.getBrandingBySubdomain(subdomain) : store.branding);
  
  const tenantState = tenantId ? store.getTenantState(tenantId) : {
    branding: store.branding,
    loading: store.loading,
    error: store.error,
    lastUpdated: store.lastUpdated,
  };
  
  return {
    branding,
    loading: tenantState.loading,
    error: tenantState.error,
    loadBranding: () => {
      if (tenantId) {
        store.loadBranding(tenantId);
      } else if (subdomain) {
        store.loadBrandingBySubdomain(subdomain);
      }
    },
    setBranding: (branding: BrandingRead) => {
      if (tenantId) {
        store.setBranding(tenantId, branding);
      } else {
        // Si no hay tenantId, actualizar estado actual
        store.setBranding(null, branding);
      }
    },
    resetBranding: () => {
      if (tenantId) {
        store.resetBranding(tenantId);
      } else {
        store.resetBranding(null);
      }
    },
    clearError: () => {
      if (tenantId) {
        store.clearError(tenantId);
      } else {
        store.clearError(null);
      }
    },
  };
};
