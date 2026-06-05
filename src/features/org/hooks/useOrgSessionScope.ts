import { useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/context/AuthContext';
import { useEmpresaActiva } from '@/features/auth/hooks/useEmpresaActiva';
import { hasEmpresaActiva } from '@/core/auth/utils/empresa-access';
import { canOperateOrgCompanyScope } from '../utils/org-company-scope-access';
import { invalidateOrgQueries } from '../utils/invalidate-org-queries';

export type OrgRouteScope = 'tenant' | 'company' | 'hybrid';

export interface OrgSessionScope {
  /** Empresa activa de sesión (JWT / AuthContext). Fuente única para scope company-scoped en Etapa A. */
  scopeEmpresaId: string | null;
  empresaSelectionPending: boolean;
  canAccessTenantOrg: boolean;
  canAccessCompanyOrg: boolean;
  canAccessHybridOrg: boolean;
  /** Queries/mutaciones company-scoped habilitadas. */
  canQueryCompanyScoped: boolean;
  /** Queries híbridas (parámetros) con sesión empresa completa. */
  canQueryHybridScoped: boolean;
  isImpersonation: boolean;
  userType: string;
  esAdminCliente: boolean;
  empresaActivaId: string | null;
  empresasElegibles: ReturnType<typeof useEmpresaActiva>['empresasElegibles'];
  empresasDisponibles: ReturnType<typeof useEmpresaActiva>['empresasDisponibles'];
  cambiarEmpresaActiva: ReturnType<typeof useEmpresaActiva>['cambiarEmpresaActiva'];
  showEmpresaSelector: boolean;
  isMultiEmpresa: boolean;
  showEmpresaActiva: boolean;
  canSwitchEmpresa: boolean;
  /** Etiqueta de empresa activa para UI (sin UUID). */
  activeEmpresaLabel: string | null;
}

/**
 * Scope de sesión ORG — JWT-driven (Etapa A).
 * Reemplaza `empresaFilter` local como fuente operativa de ámbito empresa.
 */
export function useOrgSessionScope(): OrgSessionScope {
  const queryClient = useQueryClient();
  const {
    userType = '',
    isImpersonation,
    requiereSeleccionEmpresa,
    esAdminCliente,
  } = useAuth();

  const empresaActiva = useEmpresaActiva();
  const {
    empresaActivaId,
    empresasElegibles,
    empresasDisponibles,
    cambiarEmpresaActiva,
    showEmpresaActiva,
    canSwitchEmpresa,
  } = empresaActiva;

  const scopeEmpresaId = useMemo(() => {
    if (!hasEmpresaActiva(empresaActivaId)) return null;
    return String(empresaActivaId).trim();
  }, [empresaActivaId]);

  const empresaSelectionPending = Boolean(requiereSeleccionEmpresa);

  const canAccessTenantOrg = !empresaSelectionPending || esAdminCliente;

  const canAccessCompanyOrg = canOperateOrgCompanyScope({
    userType,
    scopeEmpresaId,
    empresaSelectionPending,
  });

  const canAccessHybridOrg = canAccessCompanyOrg;

  const canQueryCompanyScoped = canAccessCompanyOrg;
  const canQueryHybridScoped = canAccessHybridOrg;

  const activeEmpresaLabel = useMemo(() => {
    if (!scopeEmpresaId) return null;
    const match = empresasElegibles.find((e) => e.empresa_id === scopeEmpresaId);
    if (!match) return null;
    return match.nombre_comercial?.trim() || match.razon_social;
  }, [scopeEmpresaId, empresasElegibles]);

  const prevScopeEmpresaRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevScopeEmpresaRef.current;
    if (prev !== null && prev !== scopeEmpresaId) {
      invalidateOrgQueries(queryClient);
    }
    prevScopeEmpresaRef.current = scopeEmpresaId;
  }, [scopeEmpresaId, queryClient]);

  return {
    scopeEmpresaId,
    empresaSelectionPending,
    canAccessTenantOrg,
    canAccessCompanyOrg,
    canAccessHybridOrg,
    canQueryCompanyScoped,
    canQueryHybridScoped,
    isImpersonation,
    userType,
    esAdminCliente,
    empresaActivaId,
    empresasElegibles,
    empresasDisponibles,
    cambiarEmpresaActiva,
    showEmpresaSelector: showEmpresaActiva,
    isMultiEmpresa: canSwitchEmpresa,
    showEmpresaActiva,
    canSwitchEmpresa,
    activeEmpresaLabel,
  };
}

/**
 * Reinicia estado local de página cuando cambia la empresa activa (JWT).
 */
export function useOrgScopeEmpresaReset(resetFn: () => void): void {
  const { scopeEmpresaId } = useOrgSessionScope();
  const prevRef = useRef(scopeEmpresaId);

  useEffect(() => {
    if (prevRef.current !== scopeEmpresaId) {
      prevRef.current = scopeEmpresaId;
      resetFn();
    }
  }, [scopeEmpresaId, resetFn]);
}
