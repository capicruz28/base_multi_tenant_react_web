/**
 * TenantContext - Gestión profesional del tenant actual
 * 
 * Este contexto maneja:
 * - tenantId explícito del tenant actual
 * - Reset de stores al cambiar tenant
 * - Invalidación de caché de React Query
 * - Validación de tenant
 * 
 * Integrado con AuthContext para obtener tenantId automáticamente.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useBrandingStore } from '../stores/branding.store';
import { useQueryClient } from '@tanstack/react-query';
import { tenantResolver } from '../../../core/services/tenant-resolver.service';
import { storeRegistry } from '../../../core/stores/store-registry';
import { tenantStoreSync } from '../../../core/stores/tenant-store-sync';

// ============================================================================
// TIPOS
// ============================================================================

interface TenantContextType {
  tenantId: string | null;
  subdomain: string | null;
  isTenantValid: boolean;
  resetTenant: () => void;
  setTenant: (tenantId: string) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  subdomain: null,
  isTenantValid: false,
  resetTenant: () => {},
  setTenant: () => {},
});

// ============================================================================
// PROVIDER
// ============================================================================

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const { clienteInfo, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // Estado del tenant actual
  const [tenantId, setTenantIdState] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  
  // Ref para trackear el tenant anterior y detectar cambios
  const previousTenantIdRef = useRef<string | null>(null);
  const previousSubdomainRef = useRef<string | null>(null);
  
  // ============================================================================
  // RESOLVER SUBDOMINIO DESDE URL
  // ============================================================================
  
  /**
   * Resuelve el subdominio desde la URL (hostname o query param)
   * Esto funciona ANTES del login
   */
  const resolvedSubdomain = useMemo(() => {
    const result = tenantResolver.resolve();
    return result.subdomain;
  }, []); // Solo se resuelve una vez al montar
  
  // ============================================================================
  // DERIVAR TENANT ID (PRIORIDAD: AuthContext > Subdomain)
  // ============================================================================
  
  /**
   * Obtiene el tenantId con prioridad:
   * 1. Si hay autenticación: usar clienteInfo.cliente_id (prioridad)
   * 2. Si no hay autenticación: usar subdominio detectado (para branding pre-login)
   * 
   * Para super_admin, tenantId puede ser null (no tiene tenant específico)
   * Para tenant_admin y user, tenantId viene de clienteInfo.cliente_id
   */
  const derivedTenantId = useMemo(() => {
    // Prioridad 1: Si hay autenticación, usar clienteInfo.cliente_id
    if (isAuthenticated && clienteInfo?.cliente_id) {
      return clienteInfo.cliente_id;
    }
    
    // Prioridad 2: Si no hay autenticación, usar subdominio (solo para branding)
    // Nota: El subdominio no es un tenantId real, pero lo usamos para cargar branding
    // El tenantId real se establecerá después del login
    return null; // No podemos usar subdominio como tenantId, solo para branding
  }, [isAuthenticated, clienteInfo]);
  
  // ============================================================================
  // REGISTRO DE STORES
  // ============================================================================
  
  /**
   * Registra todos los stores en el registry
   * Esto se hace una vez al montar el componente
   */
  useEffect(() => {
    // Registrar branding store
    storeRegistry.register(
      'branding',
      (tenantId) => {
        useBrandingStore.getState().resetBranding(tenantId);
      },
      'Store de branding dinámico por tenant'
    );
    
    // Aquí se pueden registrar más stores en el futuro:
    // storeRegistry.register('planillas', (tenantId) => { ... });
    // storeRegistry.register('logistica', (tenantId) => { ... });
    
    // Solo log en desarrollo
    if (import.meta.env.DEV) {
      console.log(`✅ [TenantContext] Stores registrados: ${storeRegistry.getRegisteredStores().join(', ')}`);
    }
    
    // Cleanup: desregistrar stores al desmontar (aunque normalmente no se desmonta)
    return () => {
      storeRegistry.unregister('branding');
    };
  }, []);
  
  // ============================================================================
  // RESET DE STORES AL CAMBIAR TENANT
  // ============================================================================
  
  /**
   * Resetea todos los stores al cambiar tenant usando el registry
   * Esto previene fugas de datos entre tenants
   */
  const resetStores = useCallback((tenantId: string | null) => {
    console.log('🔄 [TenantContext] Reseteando stores al cambiar tenant...');
    
    // Usar el registry para resetear todos los stores registrados
    storeRegistry.resetAll(tenantId);
    
    // Solo log en desarrollo
    if (import.meta.env.DEV) {
      console.log('✅ [TenantContext] Stores reseteados');
    }
  }, []);
  
  // ============================================================================
  // INVALIDAR CACHÉ DE REACT QUERY AL CAMBIAR TENANT
  // ============================================================================
  
  /**
   * Invalida y limpia el caché de React Query relacionado con el tenant anterior
   * Esto previene mostrar datos del tenant incorrecto
   * 
   * ✅ FASE 4: Mejorado para limpiar completamente el caché del tenant anterior
   */
  const invalidatePreviousTenantCache = useCallback((previousTenant: string | null) => {
    if (!previousTenant) return;
    
    // Solo log en desarrollo
    if (import.meta.env.DEV) {
      console.log(`🔄 [TenantContext] Limpiando caché del tenant anterior: ${previousTenant}`);
    }
    
    // Primero, invalidar todas las queries que incluyan el tenantId anterior
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        // Si la key incluye el tenantId anterior, invalidarla
        return key.some((k) => k === previousTenant);
      },
    });
    
    // Luego, remover todas las queries del tenant anterior del caché
    queryClient.removeQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return key.some((k) => k === previousTenant);
      },
    });
    
    // Solo log en desarrollo
    if (import.meta.env.DEV) {
      console.log('✅ [TenantContext] Caché del tenant anterior limpiado');
    }
  }, [queryClient]);
  
  // ============================================================================
  // DETECTAR CAMBIO DE TENANT Y REACCIONAR
  // ============================================================================
  
  // ============================================================================
  // SINCRONIZACIÓN ENTRE PESTAÑAS
  // ============================================================================
  
  /**
   * ✅ FASE 4: Escucha cambios de tenant desde otras pestañas
   */
  useEffect(() => {
    if (!tenantStoreSync.isAvailable()) {
      console.log('ℹ️ [TenantContext] Sincronización entre pestañas no disponible');
      return;
    }
    
    const unsubscribe = tenantStoreSync.onTenantChange((newTenantId) => {
      // Solo log en desarrollo
      if (import.meta.env.DEV) {
        console.log('🔄 [TenantContext] Cambio de tenant recibido desde otra pestaña:', newTenantId);
      }
      
      // Si el tenant cambió en otra pestaña, resetear stores y caché
      const currentTenant = tenantId;
      if (newTenantId !== currentTenant) {
        // Invalidar caché del tenant anterior si existe
        if (currentTenant) {
          invalidatePreviousTenantCache(currentTenant);
        }
        
        // Resetear stores para el nuevo tenant
        resetStores(newTenantId);
        
        // Actualizar estado local
        previousTenantIdRef.current = newTenantId;
        setTenantIdState(newTenantId);
        
        // Solo log en desarrollo
        if (import.meta.env.DEV) {
          console.log('✅ [TenantContext] Tenant sincronizado desde otra pestaña:', newTenantId);
        }
      }
    });
    
    return unsubscribe;
  }, [tenantId, resetStores, invalidatePreviousTenantCache]);
  
  // ============================================================================
  // ACTUALIZAR SUBDOMINIO
  // ============================================================================
  
  useEffect(() => {
    if (resolvedSubdomain !== previousSubdomainRef.current) {
      // Solo log en desarrollo
      if (import.meta.env.DEV) {
        console.log('🔄 [TenantContext] Subdominio detectado:', resolvedSubdomain);
      }
      setSubdomain(resolvedSubdomain);
      previousSubdomainRef.current = resolvedSubdomain;
    }
  }, [resolvedSubdomain]);
  
  // ============================================================================
  // DETECTAR CAMBIO DE TENANT Y REACCIONAR
  // ============================================================================
  
  useEffect(() => {
    const currentTenantId = derivedTenantId;
    const previousTenantId = previousTenantIdRef.current;
    
    // Si el tenant cambió
    if (currentTenantId !== previousTenantId) {
      // Solo log en desarrollo
      if (import.meta.env.DEV) {
        console.log('🔄 [TenantContext] Cambio de tenant detectado:', {
          anterior: previousTenantId,
          nuevo: currentTenantId,
        });
      }
      
      // Si había un tenant anterior, invalidar su caché
      if (previousTenantId) {
        invalidatePreviousTenantCache(previousTenantId);
      }
      
      // Resetear stores usando el registry
      resetStores(currentTenantId);
      
      // ✅ FASE 4: Notificar cambio de tenant a otras pestañas
      tenantStoreSync.notifyTenantChange(currentTenantId);
      
      // Actualizar el ref
      previousTenantIdRef.current = currentTenantId;
      
      // Actualizar el estado
      setTenantIdState(currentTenantId);
      
      // Cargar branding para el nuevo tenant (si no está ya cargado)
      if (currentTenantId) {
        const existingBranding = useBrandingStore.getState().getBranding(currentTenantId);
        if (!existingBranding) {
          useBrandingStore.getState().loadBranding(currentTenantId);
        } else {
          // Si ya existe, actualizar estado actual para compatibilidad
          const tenantState = useBrandingStore.getState().getTenantState(currentTenantId);
          useBrandingStore.setState({
            branding: tenantState.branding,
            loading: tenantState.loading,
            error: tenantState.error,
            lastUpdated: tenantState.lastUpdated,
          });
        }
      }
      
      console.log('✅ [TenantContext] Tenant actualizado:', currentTenantId);
    } else if (currentTenantId && !tenantId) {
      // Primera carga: establecer tenant sin reset (no hay tenant anterior)
      previousTenantIdRef.current = currentTenantId;
      setTenantIdState(currentTenantId);
      console.log('✅ [TenantContext] Tenant inicial establecido:', currentTenantId);
    } else if (!currentTenantId && tenantId) {
      // Logout: limpiar tenant
      previousTenantIdRef.current = null;
      setTenantIdState(null);
      
      // ✅ FASE 4: Limpiar todos los stores usando el registry
      storeRegistry.clearAll();
      
      // ✅ FASE 4: Limpiar todo el caché de React Query
      queryClient.clear();
      
      // ✅ FASE 4: Notificar logout a otras pestañas
      tenantStoreSync.notifyTenantChange(null);
      
      console.log('🔄 [TenantContext] Tenant limpiado (logout)');
    }
  }, [derivedTenantId, tenantId, resetStores, invalidatePreviousTenantCache]);
  
  // ============================================================================
  // FUNCIONES PÚBLICAS
  // ============================================================================
  
  /**
   * Establece manualmente el tenant (útil para testing o casos especiales)
   */
  const setTenant = useCallback((newTenantId: string) => {
    const previous = tenantId;
    
    if (previous && previous !== newTenantId) {
      invalidatePreviousTenantCache(previous);
      resetStores(previous);
    }
    
    previousTenantIdRef.current = newTenantId;
    setTenantIdState(newTenantId);
    
    console.log('✅ [TenantContext] Tenant establecido manualmente:', newTenantId);
  }, [tenantId, invalidatePreviousTenantCache, resetStores]);
  
  /**
   * Resetea el tenant actual (útil para logout o limpieza)
   */
  const resetTenant = useCallback(() => {
    if (tenantId) {
      invalidatePreviousTenantCache(tenantId);
      resetStores(tenantId);
    }
    
    previousTenantIdRef.current = null;
    setTenantIdState(null);
    
    // ✅ FASE 4: Usar registry para limpiar todos los stores
    storeRegistry.clearAll();
    
    // ✅ FASE 4: Limpiar caché de React Query
    queryClient.clear();
    
    // ✅ FASE 4: Notificar a otras pestañas
    tenantStoreSync.notifyTenantChange(null);
    
    console.log('🔄 [TenantContext] Tenant reseteado');
  }, [tenantId, invalidatePreviousTenantCache, resetStores, queryClient]);
  
  // ============================================================================
  // VALIDACIÓN
  // ============================================================================
  
  /**
   * Valida si el tenant actual es válido
   * Un tenant es válido si:
   * - El usuario está autenticado
   * - Tiene un clienteInfo (no es super_admin sin contexto)
   * - El tenantId es un string válido
   */
  const isTenantValid = useMemo(() => {
    if (!isAuthenticated) return false;
    if (!clienteInfo) return false; // Super admin puede no tener tenant
    if (!tenantId || typeof tenantId !== 'string') return false;
    return true;
  }, [isAuthenticated, clienteInfo, tenantId]);
  
  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================
  
  const value = useMemo<TenantContextType>(
    () => ({
      tenantId,
      subdomain,
      isTenantValid,
      resetTenant,
      setTenant,
    }),
    [tenantId, subdomain, isTenantValid, resetTenant, setTenant]
  );
  
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para acceder al TenantContext
 * 
 * @example
 * const { tenantId, isTenantValid } = useTenant();
 */
export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  
  return context;
};

