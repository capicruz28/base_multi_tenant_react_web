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
import { decodeAccessToken } from '@/core/auth/utils/decodeAccessToken';
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
  const { auth, authInitialized, clienteInfo, isAuthenticated } = useAuth();
  const user = auth.user;
  const queryClient = useQueryClient();
  
  // Estado del tenant actual
  const [tenantId, setTenantIdState] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  
  // Ref para trackear el tenant anterior y detectar cambios
  const previousTenantIdRef = useRef<string | null>(null);
  const previousSubdomainRef = useRef<string | null>(null);
  // Evitar cargar branding más de una vez por tenant (incluido StrictMode)
  const brandingLoadedRef = useRef<Set<string>>(new Set());

  const resetStores = useCallback((tenantIdParam: string | null) => {
    if (import.meta.env.DEV) {
      console.log('🔄 [TenantContext] Reseteando stores tenant-scoped:', tenantIdParam ?? 'null');
    }
    storeRegistry.resetAll(tenantIdParam);
  }, []);

  function ensureBrandingLoaded(tenantIdParam: string) {
    if (!tenantIdParam) return;
    if (brandingLoadedRef.current.has(tenantIdParam)) {
      return;
    }
    brandingLoadedRef.current.add(tenantIdParam);

    const existingBranding = useBrandingStore.getState().getBranding(tenantIdParam);
    if (!existingBranding) {
      useBrandingStore.getState().loadBranding(tenantIdParam);
    } else {
      const tenantState = useBrandingStore.getState().getTenantState(tenantIdParam);
      useBrandingStore.setState({
        branding: tenantState.branding,
        loading: tenantState.loading,
        error: tenantState.error,
        lastUpdated: tenantState.lastUpdated,
      });
    }
  }

  // Logs temporales: mount/unmount para diagnosticar reinicialización
  useEffect(() => {
    console.log('🟢 [TenantContext] MOUNT');
    return () => {
      console.log('🔴 [TenantContext] UNMOUNT');
    };
  }, []);
  
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
   * Obtiene el tenantId del usuario autenticado.
   * Usa user.cliente_id cuando authInitialized y user están disponibles.
   */
  const userClienteId =
    user?.cliente_id ?? user?.cliente?.cliente_id ?? clienteInfo?.cliente_id ?? null;

  /** Tenant = cliente_id (JWT / user). NO depende de empresa_activa. */
  const derivedTenantId = useMemo(() => {
    if (!authInitialized) return null;
    const token = auth.token;
    const claims = decodeAccessToken(token);

    if (claims?.is_impersonation && claims.cliente_id) {
      const impersonatedId = String(claims.cliente_id).trim();
      if (impersonatedId) {
        if (import.meta.env.DEV) {
          const fromUser =
            userClienteId !== null &&
            userClienteId !== undefined &&
            String(userClienteId).trim().length > 0
              ? String(userClienteId).trim()
              : null;
          console.log('[IMPERSONATION-TENANT-SYNC]', {
            source: 'jwt',
            impersonatedClienteId: impersonatedId,
            userClienteId: fromUser,
            ignoredUserCliente: fromUser !== null && fromUser !== impersonatedId,
          });
        }
        return impersonatedId;
      }
    }

    const fromUser =
      userClienteId !== null && userClienteId !== undefined && String(userClienteId).trim().length > 0
        ? String(userClienteId).trim()
        : null;
    if (fromUser) return fromUser;

    const fromClaims = claims?.cliente_id;
    if (
      fromClaims !== null &&
      fromClaims !== undefined &&
      String(fromClaims).trim().length > 0
    ) {
      return String(fromClaims).trim();
    }
    return null;
  }, [authInitialized, userClienteId, auth.token]);

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
    const nextTenantId = derivedTenantId;
    const previousTenantId = previousTenantIdRef.current;

    if (nextTenantId === previousTenantId) {
      if (nextTenantId && tenantId !== nextTenantId) {
        setTenantIdState(nextTenantId);
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.log('🔄 [TenantContext] Cambio de tenant detectado:', {
        anterior: previousTenantId,
        nuevo: nextTenantId,
      });
    }

    if (previousTenantId) {
      invalidatePreviousTenantCache(previousTenantId);
    }

    previousTenantIdRef.current = nextTenantId;
    setTenantIdState(nextTenantId);

    if (nextTenantId) {
      resetStores(nextTenantId);
      tenantStoreSync.notifyTenantChange(nextTenantId);
      ensureBrandingLoaded(nextTenantId);
      if (import.meta.env.DEV) {
        console.log('✅ [TenantContext] Tenant actualizado:', nextTenantId);
      }
      return;
    }

    if (auth.token) {
      return;
    }

    storeRegistry.clearAll();
    queryClient.clear();
    tenantStoreSync.notifyTenantChange(null);
    if (import.meta.env.DEV) {
      console.log('🔄 [TenantContext] Tenant limpiado (logout)');
    }
  }, [
    derivedTenantId,
    tenantId,
    auth.token,
    resetStores,
    invalidatePreviousTenantCache,
    queryClient,
  ]);
  
  // ============================================================================
  // FUNCIONES PÚBLICAS
  // ============================================================================
  
  /**
   * Establece manualmente el tenant (útil para testing o casos especiales)
   */
  const setTenant = useCallback(
    (newTenantId: string) => {
      const previous = previousTenantIdRef.current;
      if (previous === newTenantId) {
        setTenantIdState(newTenantId);
        return;
      }
      if (previous) {
        invalidatePreviousTenantCache(previous);
      }
      previousTenantIdRef.current = newTenantId;
      setTenantIdState(newTenantId);
      resetStores(newTenantId);
      tenantStoreSync.notifyTenantChange(newTenantId);
      ensureBrandingLoaded(newTenantId);
      if (import.meta.env.DEV) {
        console.log('✅ [TenantContext] Tenant establecido manualmente:', newTenantId);
      }
    },
    [invalidatePreviousTenantCache, resetStores],
  );
  
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
   * - El tenantId es un string válido
   */
  const isTenantValid = useMemo(() => {
    if (!isAuthenticated) return false;
    if (!tenantId || typeof tenantId !== 'string') return false;
    return true;
  }, [isAuthenticated, tenantId]);
  
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

