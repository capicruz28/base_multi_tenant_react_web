/**
 * Hook personalizado para usar el store de branding
 * Proporciona acceso fácil al estado y acciones del branding
 */
import { useEffect } from 'react';
import { useBrandingStore } from '../stores/branding.store';
import { applyBranding, resetBranding } from '../utils/branding.utils';
import { useAuth } from '../context/AuthContext';

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

  // Cargar branding automáticamente cuando el usuario se autentica
  useEffect(() => {
    if (autoLoad && isAuthenticated && clienteInfo?.id) {
      loadBranding();
    } else if (!isAuthenticated && autoLoad) {
      // Resetear branding cuando el usuario cierra sesión (solo si autoLoad está activo)
      resetBrandingStore();
      resetBranding();
    }
  }, [isAuthenticated, clienteInfo?.id, autoLoad, loadBranding, resetBrandingStore]);

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
      resetBrandingStore();
      resetBranding();
    },
  };
};

