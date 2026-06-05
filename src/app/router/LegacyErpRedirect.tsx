import { Navigate, useLocation } from 'react-router-dom';
import { mapLegacyErpPath } from '@/core/routing/post-login-path';

/**
 * Redirect de compatibilidad: `/inv/*` → `/app/inv/*`, etc.
 */
export function LegacyErpRedirect() {
  const { pathname, search, hash } = useLocation();
  const target = mapLegacyErpPath(pathname);
  return <Navigate to={`${target}${search}${hash}`} replace />;
}
