// src/shared/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '@/core/auth/PermissionContext';
import {
  shouldOnboardEmpresa,
  shouldSelectEmpresa,
  hasEmpresaActiva,
} from '@/core/auth/utils/empresa-access';
import { useEmpresaSelectionStore } from '@/features/auth/stores/empresa-selection.store';
import { useEmpresaSelectionHydrated } from '@/features/auth/stores/empresa-selection-hydration';
import { logPostLoginDiag, warnPostLoginDiag } from '@/core/auth/utils/post-login-diag-log';

interface ProtectedRouteProps {
  requiredRole?: string;
  requiredLevel?: number;
  requireSuperAdmin?: boolean;
  /** Panel ERP `/app/*`: bloquea platform_admin; tenant_admin y operativos entran (módulos vía menú + PermissionGuard). */
  requireOperationalUser?: boolean;
  /** Panel admin del tenant (`/admin/*`); usa user_type, no access_level. */
  requireTenantAdmin?: boolean;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRole,
  requiredLevel,
  requireSuperAdmin,
  requireOperationalUser,
  requireTenantAdmin,
  children,
}) => {
  const {
    auth,
    isAuthenticated,
    loading: authLoading,
    authInitialized,
    accessLevel,
    isSuperAdmin,
    userType,
    isImpersonation,
    canAccessErp,
    esAdminCliente,
    empresaActivaId,
    requiereSeleccionEmpresa,
    empresasDisponibles,
    menuPermissionsReady,
  } = useAuth();
  const { permissionsInitialized } = usePermission();
  const location = useLocation();
  const hasPendingSelection = useEmpresaSelectionStore((s) => s.hasPendingSelection());
  const selectionHydrated = useEmpresaSelectionHydrated();
  const isSeleccionEmpresaRoute = location.pathname.startsWith('/app/seleccionar-empresa');
  const isOnboardingRoute = location.pathname.startsWith('/app/onboarding');
  const isOrgEmpresaRoute = location.pathname.startsWith('/app/org/empresa');

  const pendingEmpresaCount = useEmpresaSelectionStore((s) => s.empresasDisponibles.length);

  const flowInput = {
    userType,
    empresaActivaId,
    esAdminCliente,
    requiereSeleccionEmpresa: requiereSeleccionEmpresa || hasPendingSelection,
    empresasDisponiblesCount: hasPendingSelection ? pendingEmpresaCount : empresasDisponibles.length,
  };

  if (isSeleccionEmpresaRoute) {
    if (!selectionHydrated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary" />
        </div>
      );
    }
    if (hasPendingSelection) {
      return children ? <>{children}</> : <Outlet />;
    }
    if (authInitialized && !authLoading) {
      return <Navigate to="/login" replace />;
    }
  }

  const sessionGatesPending =
    isAuthenticated && (!permissionsInitialized || !menuPermissionsReady);

  if (!authInitialized || authLoading || sessionGatesPending) {
    logPostLoginDiag('ProtectedRoute', 'spinner', {
      pathname: location.pathname,
      authInitialized,
      authLoading,
      permissionsInitialized,
      menuPermissionsReady,
      isAuthenticated,
      hasPendingSelection,
      sessionGatesPending,
    });
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto" />
          <p className="mt-4 text-brand-text-secondary">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (import.meta.env.DEV) {
      console.warn('🚫 [ProtectedRoute] Usuario no autenticado, redirigiendo a login');
    }
    const redirectState = location.pathname !== '/unauthorized' ? { from: location } : undefined;
    return <Navigate to="/login" state={redirectState} replace />;
  }

  if (requiredLevel !== undefined) {
    if (import.meta.env.DEV) {
      console.log(
        `🔒 [ProtectedRoute] Verificando nivel de acceso - Requerido: ${requiredLevel}, Usuario: ${accessLevel}`,
      );
    }

    if (accessLevel < requiredLevel) {
      warnPostLoginDiag('ProtectedRoute', 'redirect-unauthorized', {
        pathname: location.pathname,
        reason: 'accessLevel',
        requiredLevel,
        accessLevel,
        permissionsInitialized,
        menuPermissionsReady,
      });
      return <Navigate to="/unauthorized" replace />;
    }
  }

  if (requireOperationalUser) {
    if (hasPendingSelection && !isSeleccionEmpresaRoute && !isOrgEmpresaRoute) {
      return <Navigate to="/app/seleccionar-empresa" replace />;
    }

    if (!isImpersonation && (isSuperAdmin || userType === 'platform_admin')) {
      if (import.meta.env.DEV) {
        console.warn('🚫 [ProtectedRoute] platform_admin no puede acceder a /app/*');
      }
      return <Navigate to="/super-admin/dashboard" replace />;
    }

    const needsOnboarding = shouldOnboardEmpresa(flowInput);
    const mustSelect = shouldSelectEmpresa(flowInput);

    if (import.meta.env.DEV) {
      console.log('[ProtectedRoute] /app guard', {
        pathname: location.pathname,
        ...flowInput,
        needsOnboarding,
        mustSelect,
        canAccessErp,
      });
    }

    // 1) Onboarding tiene prioridad sobre selección de empresa
    if (needsOnboarding && !isOnboardingRoute && !isOrgEmpresaRoute) {
      return <Navigate to="/app/onboarding" replace />;
    }

    if (isSeleccionEmpresaRoute && needsOnboarding) {
      return <Navigate to="/app/onboarding" replace />;
    }

    if (isOnboardingRoute && mustSelect) {
      return <Navigate to="/app/seleccionar-empresa" replace />;
    }

    // 2) Selección solo si hay empresas y flag de selección (u operativo sin empresa)
    if (!isSeleccionEmpresaRoute && !isOnboardingRoute && mustSelect) {
      return <Navigate to="/app/seleccionar-empresa" replace />;
    }

    if (isOnboardingRoute && hasEmpresaActiva(empresaActivaId)) {
      return <Navigate to="/app/home" replace />;
    }

    if (isSeleccionEmpresaRoute && !mustSelect && canAccessErp && hasEmpresaActiva(empresaActivaId)) {
      return <Navigate to="/app/home" replace />;
    }
  }

  if (requireTenantAdmin) {
    if (userType !== 'tenant_admin') {
      warnPostLoginDiag('ProtectedRoute', 'redirect-unauthorized', {
        pathname: location.pathname,
        reason: 'requireTenantAdmin',
        userType,
        permissionsInitialized,
        menuPermissionsReady,
      });
      return <Navigate to="/unauthorized" replace />;
    }
  }

  if (requireSuperAdmin) {
    if (import.meta.env.DEV) {
      console.log(`🔒 [ProtectedRoute] Verificando Super Admin - Usuario: ${isSuperAdmin}`);
    }

    if (!isSuperAdmin) {
      warnPostLoginDiag('ProtectedRoute', 'redirect-unauthorized', {
        pathname: location.pathname,
        reason: 'requireSuperAdmin',
        isSuperAdmin,
        userType,
        permissionsInitialized,
        menuPermissionsReady,
      });
      return <Navigate to="/unauthorized" replace />;
    }
  }

  if (requiredRole) {
    const userRoles = (auth.user?.roles ?? []).map((r: unknown) => {
      const roleStr = typeof r === 'string' ? r : String(r);
      return roleStr.toLowerCase();
    });

    const required = requiredRole.toLowerCase();

    const synonyms: Record<string, string[]> = {
      admin: ['admin', 'super administrador'],
    };
    const accepted = new Set(synonyms[required] ?? [required]);

    const hasRequiredRole = userRoles.some((r) => accepted.has(r));

    if (!hasRequiredRole) {
      warnPostLoginDiag('ProtectedRoute', 'redirect-unauthorized', {
        pathname: location.pathname,
        reason: 'requiredRole',
        requiredRole,
        userRoles,
        permissionsInitialized,
        menuPermissionsReady,
      });
      return <Navigate to="/unauthorized" replace />;
    }
  }

  logPostLoginDiag('ProtectedRoute', 'access-allowed', {
    pathname: location.pathname,
    permissionsInitialized,
    menuPermissionsReady,
    userType,
  });
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
