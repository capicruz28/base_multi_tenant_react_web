import { useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/context/AuthContext';
import { useEmpresaActiva } from '@/features/auth/hooks/useEmpresaActiva';
import { hasEmpresaActiva } from '@/core/auth/utils/empresa-access';
import { canOperateOrgCompanyScope } from '@/features/org/utils/org-company-scope-access';
import { invalidateInvQueries } from '../utils/invalidate-inv-queries';

export interface InvSessionScope {
  /** Empresa activa de sesión (JWT). Fuente única para scope company-scoped en INV. */
  scopeEmpresaId: string | null;
  empresaSelectionPending: boolean;
  canAccessCompanyInv: boolean;
  /** Queries/mutaciones company-scoped habilitadas. */
  canQueryCompanyScoped: boolean;
  isImpersonation: boolean;
  userType: string;
  esAdminCliente: boolean;
  empresaActivaId: string | null;
  empresasElegibles: ReturnType<typeof useEmpresaActiva>['empresasElegibles'];
  cambiarEmpresaActiva: ReturnType<typeof useEmpresaActiva>['cambiarEmpresaActiva'];
  showEmpresaSelector: boolean;
  canSwitchEmpresa: boolean;
  /** Etiqueta de empresa activa para UI (sin UUID). */
  activeEmpresaLabel: string | null;
}

/**
 * Scope de sesión INV — JWT-driven (INV-M0).
 * Reemplaza `empresaFilter` local como fuente operativa de ámbito empresa.
 */
export function useInvSessionScope(): InvSessionScope {
  const queryClient = useQueryClient();
  const {
    userType = '',
    isImpersonation,
    requiereSeleccionEmpresa,
    esAdminCliente,
  } = useAuth();

  const {
    empresaActivaId,
    empresasElegibles,
    cambiarEmpresaActiva,
    showEmpresaActiva,
    canSwitchEmpresa,
  } = useEmpresaActiva();

  const scopeEmpresaId = useMemo(() => {
    if (!hasEmpresaActiva(empresaActivaId)) return null;
    return String(empresaActivaId).trim();
  }, [empresaActivaId]);

  const empresaSelectionPending = Boolean(requiereSeleccionEmpresa);

  const canAccessCompanyInv = canOperateOrgCompanyScope({
    userType,
    scopeEmpresaId,
    empresaSelectionPending,
  });

  const canQueryCompanyScoped = canAccessCompanyInv;

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
      invalidateInvQueries(queryClient);
    }
    prevScopeEmpresaRef.current = scopeEmpresaId;
  }, [scopeEmpresaId, queryClient]);

  return {
    scopeEmpresaId,
    empresaSelectionPending,
    canAccessCompanyInv,
    canQueryCompanyScoped,
    isImpersonation,
    userType,
    esAdminCliente,
    empresaActivaId,
    empresasElegibles,
    cambiarEmpresaActiva,
    showEmpresaSelector: showEmpresaActiva,
    canSwitchEmpresa,
    activeEmpresaLabel,
  };
}

/**
 * Reinicia estado local de página cuando cambia la empresa activa (JWT).
 */
export function useInvScopeEmpresaReset(resetFn: () => void): void {
  const { scopeEmpresaId } = useInvSessionScope();
  const prevRef = useRef(scopeEmpresaId);

  useEffect(() => {
    if (prevRef.current !== scopeEmpresaId) {
      prevRef.current = scopeEmpresaId;
      resetFn();
    }
  }, [scopeEmpresaId, resetFn]);
}
