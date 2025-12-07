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
import { useAuth } from '../shared/context/AuthContext';
import { useBrandingStore } from '../features/tenant/stores/branding.store';
import { useQueryClient } from '@tanstack/react-query';

// ============================================================================
// TIPOS
// ============================================================================

interface TenantContextType {
  tenantId: string | null;
  isTenantValid: boolean;
  resetTenant: () => void;
  setTenant: (tenantId: string) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
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
  
  // Ref para trackear el tenant anterior y detectar cambios
  const previousTenantIdRef = useRef<string | null>(null);
  
  // ============================================================================
  // DERIVAR TENANT ID DESDE AUTH CONTEXT
  // ============================================================================
  
  /**
   * Obtiene el tenantId desde AuthContext
   * Para super_admin, tenantId puede ser null (no tiene tenant específico)
   * Para tenant_admin y user, tenantId viene de clienteInfo.cliente_id
   */
  const derivedTenantId = useMemo(() => {
    if (!isAuthenticated || !clienteInfo) {
      return null;
    }
    
    // tenantId es el cliente_id del usuario autenticado
    return clienteInfo.cliente_id || null;
  }, [isAuthenticated, clienteInfo]);
  
  // ============================================================================
  // RESET DE STORES AL CAMBIAR TENANT
  // ============================================================================
  
  /**
   * Resetea todos los stores al cambiar tenant
   * Esto previene fugas de datos entre tenants
   */
  const resetStores = useCallback((tenantId: string | null) => {
    console.log('🔄 [TenantContext] Reseteando stores al cambiar tenant...');
    
    // Reset branding store para el tenant específico
    useBrandingStore.getState().resetBranding(tenantId);
    
    // Aquí se pueden añadir más stores en el futuro
    // usePlanillasStore.getState().reset(tenantId);
    // useLogisticaStore.getState().reset(tenantId);
    
    console.log('✅ [TenantContext] Stores reseteados');
  }, []);
  
  // ============================================================================
  // INVALIDAR CACHÉ DE REACT QUERY AL CAMBIAR TENANT
  // ============================================================================
  
  /**
   * Invalida todo el caché de React Query relacionado con el tenant anterior
   * Esto previene mostrar datos del tenant incorrecto
   */
  const invalidatePreviousTenantCache = useCallback((previousTenant: string | null) => {
    if (!previousTenant) return;
    
    console.log(`🔄 [TenantContext] Invalidando caché del tenant anterior: ${previousTenant}`);
    
    // Invalidar todas las queries que incluyan el tenantId anterior
    // Esto es seguro porque las keys de React Query incluirán el tenantId
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        // Si la key incluye el tenantId anterior, invalidarla
        return key.some((k) => k === previousTenant);
      },
    });
    
    console.log('✅ [TenantContext] Caché invalidado');
  }, [queryClient]);
  
  // ============================================================================
  // DETECTAR CAMBIO DE TENANT Y REACCIONAR
  // ============================================================================
  
  useEffect(() => {
    const currentTenantId = derivedTenantId;
    const previousTenantId = previousTenantIdRef.current;
    
    // Si el tenant cambió
    if (currentTenantId !== previousTenantId) {
      console.log('🔄 [TenantContext] Cambio de tenant detectado:', {
        anterior: previousTenantId,
        nuevo: currentTenantId,
      });
      
      // Si había un tenant anterior, invalidar su caché
      if (previousTenantId) {
        invalidatePreviousTenantCache(previousTenantId);
      }
      
      // Resetear stores
      resetStores(currentTenantId);
      
      // Actualizar el ref
      previousTenantIdRef.current = currentTenantId;
      
      // Actualizar el estado
      setTenantIdState(currentTenantId);
      
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
      resetStores(null);
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
      resetStores(newTenantId);
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
    }
    
    resetStores(null);
    previousTenantIdRef.current = null;
    setTenantIdState(null);
    
    console.log('🔄 [TenantContext] Tenant reseteado');
  }, [tenantId, invalidatePreviousTenantCache, resetStores]);
  
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
      isTenantValid,
      resetTenant,
      setTenant,
    }),
    [tenantId, isTenantValid, resetTenant, setTenant]
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

