/**
 * Hook personalizado para usar el store de branding
 * Proporciona acceso fácil al estado y acciones del branding
 */
import { useEffect } from 'react';
import { useBrandingStore } from '../features/tenant/stores/branding.store';
import { applyBranding, resetBranding } from '../utils/branding.utils';
import { useAuth } from '../shared/context/AuthContext';

/**
 * Hook para acceder y gestionar el branding
 * 
 * @param autoLoad - Si es true, carga el branding automáticamente cuando el usuario está autenticado
 * @returns Estado y acciones del branding
 */
export const useBranding = (autoLoad: boolean = true) => {
  const { isAuthenticated, clienteInfo } = useAuth();
  const branding = useBrandingStore((state) => state.branding);
  const loading = useBrandingStore((state) => state.loading);
  const error = useBrandingStore((state) => state.error);
  const loadBranding = useBrandingStore((state) => state.loadBranding);
  const resetBrandingStore = useBrandingStore((state) => state.resetBranding);

  // Cargar branding automáticamente cuando el usuario se autentica.
  // Solo depender de cliente_id (primitivo) para evitar recargas infinitas.
  useEffect(() => {
    if (!autoLoad) return;
    const tenantId = clienteInfo?.cliente_id;
    if (isAuthenticated && tenantId) {
      loadBranding(tenantId);
    } else if (!isAuthenticated) {
      resetBrandingStore(null);
      resetBranding();
    }
  }, [isAuthenticated, clienteInfo?.cliente_id, autoLoad]);

  // Aplicar branding cuando cambia
  useEffect(() => {
    if (branding) {
      console.log('🎨 [useBranding] Aplicando branding:', branding);
      applyBranding(branding);
    } else if (!loading && !error) {
      // Si no hay branding pero tampoco hay error ni carga, aplicar valores por defecto
      console.log('🎨 [useBranding] No hay branding, aplicando valores por defecto');
      resetBranding();
    }
  }, [branding, loading, error]);

  return {
    branding,
    loading,
    error,
    loadBranding,
    resetBranding: () => {
      resetBrandingStore(clienteInfo?.cliente_id || null);
      resetBranding();
    },
  };
};

