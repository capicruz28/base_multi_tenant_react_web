// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  requiredRole?: string;
  requiredLevel?: number;
  requireSuperAdmin?: boolean;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requiredRole, 
  requiredLevel, 
  requireSuperAdmin, 
  children 
}) => {
  const { auth, isAuthenticated, loading, accessLevel, isSuperAdmin } = useAuth();
  const location = useLocation();

  // Estado de carga
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Verificación de autenticación
  if (!isAuthenticated) {
    console.warn('🚫 [ProtectedRoute] Usuario no autenticado, redirigiendo a login');
    const redirectState = location.pathname !== '/unauthorized' ? { from: location } : undefined;
    return <Navigate to="/login" state={redirectState} replace />;
  }

  // ✅ CORRECCIÓN CRÍTICA: Usar los valores del contexto, no del auth.user
  if (requiredLevel !== undefined) {
    console.log(`🔒 [ProtectedRoute] Verificando nivel de acceso - Requerido: ${requiredLevel}, Usuario: ${accessLevel}`);
    
    if (accessLevel < requiredLevel) {
      console.warn(`🚫 [ProtectedRoute] Acceso denegado - Nivel insuficiente (${accessLevel} < ${requiredLevel})`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // ✅ CORRECCIÓN CRÍTICA: Usar el valor del contexto
  if (requireSuperAdmin) {
    console.log(`🔒 [ProtectedRoute] Verificando Super Admin - Usuario: ${isSuperAdmin}`);
    
    if (!isSuperAdmin) {
      console.warn('🚫 [ProtectedRoute] Acceso denegado - Se requiere Super Admin');
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // ✅ CORRECCIÓN: Validación de roles con tipo explícito
  if (requiredRole) {
    // Convertir roles a string array explícitamente
    const userRoles = (auth.user?.roles ?? []).map((r: any) => {
      const roleStr = typeof r === 'string' ? r : String(r);
      return roleStr.toLowerCase();
    });
    
    const required = requiredRole.toLowerCase();

    const synonyms: Record<string, string[]> = {
      admin: ['admin', 'super administrador'],
    };
    const accepted = new Set(synonyms[required] ?? [required]);

    const hasRequiredRole = userRoles.some(r => accepted.has(r));
    
    if (!hasRequiredRole) {
      console.warn(`🚫 [ProtectedRoute] Acceso denegado - Rol insuficiente (requiere: ${requiredRole})`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  console.log(`✅ [ProtectedRoute] Acceso permitido a ${location.pathname}`);
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;