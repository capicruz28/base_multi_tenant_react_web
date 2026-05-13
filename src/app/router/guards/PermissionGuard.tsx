/**
 * PermissionGuard - Guard para proteger rutas con permisos granulares (LBAC)
 * 
 * Verifica que el usuario tenga el permiso específico antes de renderizar la ruta.
 * Usa permissions del AuthContext (derivados desde GET /auth/menu).
 * 
 * @example
 * ```tsx
 * <Route
 *   path="planillas/*"
 *   element={
 *     <PermissionGuard module="planillas" action="ver">
 *       <PlanillasRoutes />
 *     </PermissionGuard>
 *   }
 * />
 * ```
 */
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/context/AuthContext';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { PermissionAction } from '@/core/auth/types/permission.types';

interface PermissionGuardProps {
  /**
   * Nombre del módulo (debe coincidir con el nombre en la BD)
   * Ejemplos: 'planillas', 'logistica', 'contabilidad'
   */
  module: string;
  
  /**
   * Acción requerida para acceder a la ruta
   */
  action: PermissionAction;
  
  /**
   * Contenido a renderizar si el usuario tiene el permiso
   * Si no se proporciona, se usa <Outlet /> para rutas anidadas
   */
  children?: React.ReactNode;
  
  /**
   * Ruta de redirección si el usuario no tiene el permiso
   * Por defecto: '/unauthorized'
   */
  redirectTo?: string;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  module,
  action,
  children,
  redirectTo = '/unauthorized',
}) => {
  const { accessLevel } = useAuth();
  const { can, loading, isSuperAdmin } = usePermissions();
  const location = useLocation();

  // Mostrar loading mientras se cargan los permisos
  if (loading) {
    return <LoadingSpinner fullScreen message="Verificando permisos..." />;
  }

  // Super admin y admin tenant tienen acceso completo (el menú /me/ ya filtra por módulos contratados)
  if (isSuperAdmin || accessLevel >= 4) {
    return <>{children || <Outlet />}</>;
  }

  // Verificar permiso específico
  const hasPermission = can(module, action);

  if (!hasPermission) {
    console.warn(
      `🚫 [PermissionGuard] Acceso denegado a ${module}.${action} - ` +
      `Usuario no tiene el permiso requerido`
    );
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location, requiredPermission: `${module}.${action}` }} 
        replace 
      />
    );
  }

  console.log(`✅ [PermissionGuard] Acceso permitido a ${module}.${action}`);
  return <>{children || <Outlet />}</>;
};

