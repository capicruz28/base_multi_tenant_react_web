import { ReactNode } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

/**
 * Evita que el router y rutas protegidas se rendericen hasta que /auth/me
 * haya terminado (éxito o error).
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { isBootstrapped } = useAuth();
  if (!isBootstrapped) {
    return <LoadingSpinner fullScreen message="Verificando sesión..." />;
  }
  return <>{children}</>;
}
