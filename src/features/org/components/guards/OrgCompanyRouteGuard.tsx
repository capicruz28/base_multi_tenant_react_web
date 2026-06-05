import React from 'react';
import { Navigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useOrgSessionScope } from '../../hooks/useOrgSessionScope';
import { APP_SELECCIONAR_EMPRESA } from '@/core/routing/post-login-path';

interface OrgCompanyRouteGuardProps {
  children: React.ReactNode;
  /** hybrid = mismas reglas que company para selection_pending en Etapa A */
  scope?: 'company' | 'hybrid';
}

/**
 * Rutas company-scoped y hybrid (sucursales, departamentos, cargos, centros-costo, parámetros).
 */
export function OrgCompanyRouteGuard({ children, scope = 'company' }: OrgCompanyRouteGuardProps) {
  const {
    empresaSelectionPending,
    canQueryCompanyScoped,
    canQueryHybridScoped,
    scopeEmpresaId,
    activeEmpresaLabel,
    showEmpresaSelector,
  } = useOrgSessionScope();

  const canQuery = scope === 'hybrid' ? canQueryHybridScoped : canQueryCompanyScoped;

  if (empresaSelectionPending) {
    return <Navigate to={APP_SELECCIONAR_EMPRESA} replace />;
  }

  if (!canQuery || !scopeEmpresaId) {
    return (
      <div className="rounded-lg border border-border-base bg-surface p-8 max-w-lg mx-auto mt-8 text-center">
        <Building2 className="mx-auto text-brand-primary mb-3" size={40} aria-hidden />
        <h2 className="text-lg font-semibold text-text-base">Empresa activa requerida</h2>
        <p className="text-sm text-text-soft mt-2">
          {scope === 'hybrid'
            ? 'Seleccione una empresa activa para administrar parámetros con ámbito de empresa.'
            : 'Seleccione una empresa activa en el encabezado para acceder a esta sección.'}
        </p>
        {showEmpresaSelector ? (
          <p className="text-xs text-text-soft mt-4">
            Use el selector de empresa en la barra superior
            {activeEmpresaLabel ? ` (actual: ${activeEmpresaLabel})` : ''}.
          </p>
        ) : (
          <p className="text-xs text-text-soft mt-4">
            Si tiene varias empresas asignadas, complete la selección de empresa al iniciar sesión.
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
