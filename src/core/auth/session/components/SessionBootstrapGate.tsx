/**
 * Gate bootstrap unificado V7.3 — IAM-FE-PHASE-07 IMPL-08 (L7-E).
 */

import { ReactNode, useMemo } from 'react';

import { resolveSessionBootstrapGate } from '@/core/auth/session/session-bootstrap-gate.policy';
import {
  getSessionUxFlagsSnapshot,
  isSessionBootstrapGateActive,
} from '@/core/auth/session/session-ux.flags';
import type { SessionBootstrapGateInput } from '@/core/auth/session/session-ux.types';
import { useAuth } from '@/shared/context/AuthContext';
import { usePermission } from '@/core/auth/PermissionContext';
import { useEmpresaSelectionHydrated } from '@/features/auth/stores/empresa-selection-hydration';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const PUBLIC_ROUTE_PREFIXES = ['/login', '/unauthorized', '/forgot-password'] as const;

function getCurrentPathname(): string {
  if (typeof window === 'undefined') {
    return '/';
  }
  return window.location.pathname;
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export interface SessionBootstrapGateProps {
  readonly children: ReactNode;
}

export function SessionBootstrapGate({ children }: SessionBootstrapGateProps) {
  const flags = getSessionUxFlagsSnapshot();
  const {
    isBootstrapped,
    authInitialized,
    loading: authLoading,
    isAuthenticated,
    menuPermissionsReady,
  } = useAuth();
  const { permissionsInitialized } = usePermission();
  const selectionHydrated = useEmpresaSelectionHydrated();

  const gateInput: SessionBootstrapGateInput = useMemo(() => {
    const pathname = getCurrentPathname();
    return {
      isBootstrapped,
      authInitialized,
      authLoading,
      isAuthenticated,
      permissionsInitialized,
      menuPermissionsReady,
      isPublicRoute: isPublicRoute(pathname),
      isSelectionRoute: pathname.startsWith('/app/seleccionar-empresa'),
      selectionHydrated,
    };
  }, [
    isBootstrapped,
    authInitialized,
    authLoading,
    isAuthenticated,
    permissionsInitialized,
    menuPermissionsReady,
    selectionHydrated,
  ]);

  if (!isSessionBootstrapGateActive(flags)) {
    return <>{children}</>;
  }

  const decision = resolveSessionBootstrapGate(gateInput, flags);

  if (decision.shouldBlock) {
    return <LoadingSpinner fullScreen message={decision.message} />;
  }

  return <>{children}</>;
}
