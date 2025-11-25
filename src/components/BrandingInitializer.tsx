/**
 * Componente que inicializa el branding dinámicamente
 * Se monta una vez y carga el branding cuando el usuario está autenticado
 */
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../hooks/useBranding';

export const BrandingInitializer: React.FC = () => {
  const { isAuthenticated, clienteInfo } = useAuth();
  const { loadBranding } = useBranding(false); // No auto-load, lo hacemos manualmente

  useEffect(() => {
    // ✅ IMPORTANTE: Cargar branding siempre que el usuario esté autenticado
    // El endpoint /tenant/branding usa el contexto del tenant (subdominio) del request,
    // no necesita cliente_id explícito
    if (isAuthenticated) {
      console.log('🎨 [BrandingInitializer] Usuario autenticado, cargando branding...');
      if (clienteInfo?.id) {
        console.log('🎨 [BrandingInitializer] Cliente ID disponible:', clienteInfo.id);
      } else {
        console.log('🎨 [BrandingInitializer] Cliente ID no disponible, pero el endpoint usa contexto de tenant');
      }
      loadBranding();
    }
  }, [isAuthenticated, loadBranding]);

  // Este componente no renderiza nada
  return null;
};

