/**
 * Hook personalizado para usar el store de branding
 * Proporciona acceso fácil al estado y acciones del branding
 */
import { useEffect } from 'react';
import { useBrandingStoreWithTenant } from '../stores/branding.store';
import { applyBranding, resetBranding } from '../../../utils/branding.utils';
import { useAuth } from '../../../shared/context/AuthContext';
import { useTenant } from '../components/TenantContext';

/**
 * Hook para acceder y gestionar el branding
 * ✅ MEJORADO: Usa store particionado por tenant
 * 
 * @param autoLoad - Si es true, carga el branding automáticamente cuando el usuario está autenticado
 * @returns Estado y acciones del branding
 */
export const useBranding = (autoLoad: boolean = true) => {
  const { isAuthenticated } = useAuth();
  const { tenantId, subdomain } = useTenant();
  const {
    branding,
    loading,
    error,
    loadBranding,
    resetBranding: resetBrandingStore,
  } = useBrandingStoreWithTenant();

  // Cargar branding automáticamente cuando el usuario se autentica.
  // Solo depender de primitivos (tenantId, subdomain) para evitar recargas infinitas.
  useEffect(() => {
    if (!autoLoad) return;
    if (isAuthenticated && tenantId) {
      loadBranding();
    } else if (!isAuthenticated && !subdomain) {
      resetBrandingStore();
      resetBranding();
    }
  }, [isAuthenticated, tenantId, subdomain, autoLoad]);

  // Aplicar branding cuando cambia
  useEffect(() => {
    if (branding) {
      // Solo log en desarrollo
      if (import.meta.env.DEV) {
        console.log('🎨 [useBranding] Aplicando branding');
      }
      applyBranding(branding);
    } else if (!loading && !error) {
      // Si no hay branding pero tampoco hay error ni carga, aplicar valores por defecto
      // No loguear, es normal
      resetBranding();
    }
  }, [branding, loading, error, isAuthenticated, tenantId]);

  return {
    branding,
    loading,
    error,
    loadBranding,
    resetBranding: () => {
      resetBrandingStore();
      resetBranding();
    },
  };
};

