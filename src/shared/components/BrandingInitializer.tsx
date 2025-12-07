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

  useEffect(() => {
    // Caso 1: Pre-login con subdominio
    if (!isAuthenticated && subdomain) {
      if (import.meta.env.DEV) {
        console.log('🎨 [BrandingInitializer] Cargando branding por subdominio (pre-login):', subdomain);
      }
      loadBrandingBySubdomain(subdomain);
      return;
    }

    // Caso 2: Post-login con tenantId
    if (isAuthenticated && tenantId) {
      if (import.meta.env.DEV) {
        console.log('🎨 [BrandingInitializer] Cargando branding por tenantId (post-login):', tenantId);
      }
      loadBranding(tenantId);
      return;
    }

    // Caso 3: Sin subdominio ni tenantId (fallback)
    // No loguear este caso, es normal
  }, [isAuthenticated, subdomain, tenantId, loadBranding, loadBrandingBySubdomain]);

  return null; // Componente sin UI
};

