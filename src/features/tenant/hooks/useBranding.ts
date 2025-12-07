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

  // Cargar branding automáticamente cuando el usuario se autentica
  useEffect(() => {
    if (autoLoad && isAuthenticated && tenantId) {
      loadBranding();
    } else if (!isAuthenticated && autoLoad && !subdomain) {
      // ✅ CORRECCIÓN: Solo resetear branding cuando el usuario cierra sesión
      // PERO NO si hay un subdominio (modo pre-login), ya que el branding por subdominio
      // debe persistir después del refresh
      resetBrandingStore();
      resetBranding();
    }
  }, [isAuthenticated, tenantId, subdomain, autoLoad, loadBranding, resetBrandingStore]);

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
  }, [branding, loading, error]);

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

