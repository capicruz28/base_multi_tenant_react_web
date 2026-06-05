/**
 * Componente que inicializa el branding dinámicamente
 * 
 * ✅ MEJORADO: Carga branding ANTES del login (por subdominio) y DESPUÉS del login (por tenantId)
 * 
 * Flujo:
 * 1. Si hay subdominio y NO hay autenticación → cargar branding por subdominio (pre-login)
 * 2. Si hay autenticación → cargar branding por tenantId (post-login)
 */
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '@/features/tenant/components/TenantContext';
import { useBrandingStore } from '@/features/tenant/stores/branding.store';

export const BrandingInitializer: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { subdomain, tenantId } = useTenant();
  const { loadBranding, loadBrandingBySubdomain } = useBrandingStore();

  // Solo depender de primitivos (tenantId, subdomain) para evitar recargas infinitas
  useEffect(() => {
    if (!isAuthenticated && subdomain) {
      if (import.meta.env.DEV) {
        console.log('🎨 [BrandingInitializer] Cargando branding por subdominio (pre-login):', subdomain);
      }
      loadBrandingBySubdomain(subdomain);
      return;
    }
    if (isAuthenticated && tenantId) {
      const cached = useBrandingStore.getState().getBranding(tenantId);
      if (cached) {
        const tenantState = useBrandingStore.getState().getTenantState(tenantId);
        useBrandingStore.setState({
          branding: tenantState.branding,
          loading: false,
          error: tenantState.error,
          lastUpdated: tenantState.lastUpdated,
        });
        return;
      }
      if (import.meta.env.DEV) {
        console.log('🎨 [BrandingInitializer] Cargando branding por tenantId (post-login):', tenantId);
      }
      loadBranding(tenantId);
    }
  }, [isAuthenticated, subdomain, tenantId, loadBranding, loadBrandingBySubdomain]);

  return null; // Componente sin UI
};

