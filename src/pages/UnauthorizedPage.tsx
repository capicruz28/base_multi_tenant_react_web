// src/pages/UnauthorizedPage.tsx
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import { resolvePostLoginPath } from '@/core/routing/post-login-path';
import { ShieldAlert } from 'lucide-react';
import { logPostLoginDiag } from '@/core/auth/utils/post-login-diag-log';

const UnauthorizedPage: React.FC = () => {
  const { isSuperAdmin, userType, menuModulos, loading, permissions, menuPermissionsReady } = useAuth();
  const location = useLocation();

  const routeState = location.state as {
    from?: { pathname?: string };
    requiredPermission?: string;
  } | null;

  useEffect(() => {
    logPostLoginDiag('UnauthorizedPage', 'mounted', {
      pathname: location.pathname,
      locationState: routeState,
      fromPathname: routeState?.from?.pathname ?? null,
      requiredPermission: routeState?.requiredPermission ?? null,
      userType,
      menuModulosCount: menuModulos?.length ?? 0,
      menuPermissionsReady,
      permissionsIsNull: permissions === null,
      permissionsKeys: permissions ? Object.keys(permissions) : null,
      returnPath: resolvePostLoginPath({ isSuperAdmin, userType, menuModulos }),
    });
  }, [
    location.pathname,
    routeState,
    userType,
    menuModulos,
    menuPermissionsReady,
    permissions,
    isSuperAdmin,
  ]);

  const getReturnPath = (): string =>
    resolvePostLoginPath({ isSuperAdmin, userType, menuModulos });

  const getReturnLabel = (): string => {
    if (isSuperAdmin) {
      return 'Volver a Administración Global';
    }
    if (userType === 'tenant_admin') {
      return 'Volver a mi panel';
    }
    return 'Volver a mi página principal';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-center px-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <ShieldAlert className="w-20 h-20 text-red-600 dark:text-red-500" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-red-600 dark:text-red-500 mb-4">
          Acceso Denegado
        </h1>
        
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
          Lo sentimos, no tienes los permisos necesarios para acceder a esta página.
        </p>
        
        <Link
          to={getReturnPath()}
          className="inline-block w-full px-6 py-3 bg-brand-primary text-white rounded-lg shadow hover:bg-brand-primary-hover transition-colors duration-200 text-lg font-medium"
        >
          {getReturnLabel()}
        </Link>
        
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Si crees que esto es un error, contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
};

export default UnauthorizedPage;