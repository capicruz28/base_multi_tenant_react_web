import React from 'react';
import { Navigate } from 'react-router-dom';
import { useOrgSessionScope } from '../../hooks/useOrgSessionScope';
import { APP_SELECCIONAR_EMPRESA, APP_ONBOARDING } from '@/core/routing/post-login-path';

interface OrgTenantRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Rutas tenant-scoped (/org/empresa).
 * Permite onboarding admin sin empresa; bloquea selection_pending salvo flujo selección global.
 */
export function OrgTenantRouteGuard({ children }: OrgTenantRouteGuardProps) {
  const { empresaSelectionPending, esAdminCliente, canAccessTenantOrg } = useOrgSessionScope();

  if (empresaSelectionPending && !esAdminCliente) {
    return <Navigate to={APP_SELECCIONAR_EMPRESA} replace />;
  }

  if (!canAccessTenantOrg && !esAdminCliente) {
    return <Navigate to={APP_ONBOARDING} replace />;
  }

  return <>{children}</>;
}
