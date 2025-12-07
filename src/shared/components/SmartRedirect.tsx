// src/shared/components/SmartRedirect.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Componente que redirige inteligentemente según el tipo de usuario
 * 
 * - Super Admin → /super-admin/dashboard
 * - Tenant Admin → /admin/usuarios
 * - Usuario Regular → /home
 */
const SmartRedirect: React.FC = () => {
  const { isSuperAdmin, accessLevel, loading } = useAuth();

  // Mostrar loader mientras se determina el tipo de usuario
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  // ✅ PRIORIDAD: Super Admin primero
  if (isSuperAdmin) {
    console.log('🔄 [SmartRedirect] Redirigiendo Super Admin a /super-admin/dashboard');
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  // ✅ Tenant Admin segundo
  if (accessLevel >= 4) {
    console.log('🔄 [SmartRedirect] Redirigiendo Tenant Admin a /admin/usuarios');
    return <Navigate to="/admin/usuarios" replace />;
  }

  // ✅ Usuario regular por defecto
  console.log('🔄 [SmartRedirect] Redirigiendo Usuario Regular a /home');
  return <Navigate to="/home" replace />;
};

export default SmartRedirect;

