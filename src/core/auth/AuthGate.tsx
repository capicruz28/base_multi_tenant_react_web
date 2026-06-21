import { ReactNode } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import {
  getSessionUxFlagsSnapshot,
  isSessionBootstrapGateActive,
} from '@/core/auth/session/session-ux.flags';

/**
 * Evita que el router y rutas protegidas se rendericen hasta que /auth/me
 * haya terminado (éxito o error).
 * F7: G1 bootstrap cuando gate unificado activo (V7.3).
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { isBootstrapped } = useAuth();
  const flags = getSessionUxFlagsSnapshot();

  if (isSessionBootstrapGateActive(flags)) {
    if (!isBootstrapped) {
      return <LoadingSpinner fullScreen message="Verificando sesión..." />;
    }
    return <>{children}</>;
  }

  if (!isBootstrapped) {
    return <LoadingSpinner fullScreen message="Verificando sesión..." />;
  }
  return <>{children}</>;
}
