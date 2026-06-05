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
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { PermissionAction } from '@/core/auth/types/permission.types';
import { logPostLoginDiag, warnPostLoginDiag } from '@/core/auth/utils/post-login-diag-log';

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
  const { can, menuPermissionsReady, permissions } = usePermissions();
  const location = useLocation();

  if (!menuPermissionsReady) {
    logPostLoginDiag('PermissionGuard', 'spinner', {
      pathname: location.pathname,
      module,
      action,
      menuPermissionsReady,
    });
    return <LoadingSpinner fullScreen message="Verificando permisos..." />;
  }

  const hasPermission = can(module, action);
  const modulePermissions = permissions?.[module] ?? null;

  logPostLoginDiag('PermissionGuard', 'can-evaluated', {
    pathname: location.pathname,
    module,
    action,
    canResult: hasPermission,
    menuPermissionsReady,
    permissionsIsNull: permissions === null,
    permissionsKeys: permissions ? Object.keys(permissions) : null,
    modulePermissions,
  });

  if (!hasPermission) {
    warnPostLoginDiag('PermissionGuard', 'redirect-unauthorized', {
      pathname: location.pathname,
      module,
      action,
      canResult: hasPermission,
      requiredPermission: `${module}.${action}`,
      permissionsIsNull: permissions === null,
      permissionsKeys: permissions ? Object.keys(permissions) : null,
      modulePermissions,
    });
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location, requiredPermission: `${module}.${action}` }} 
        replace 
      />
    );
  }

  logPostLoginDiag('PermissionGuard', 'access-allowed', {
    pathname: location.pathname,
    module,
    action,
    canResult: hasPermission,
  });
  return <>{children || <Outlet />}</>;
};

