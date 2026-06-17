import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '@/core/auth/PermissionContext';

/**
 * Guard de acceso RBAC negocio para formularios transaccionales INV (A2).
 * Redirige al listado si el usuario no tiene el permiso requerido tras inicializar permisos.
 */
export function useInvRbacFormAccess(permission: string, redirectPath: string) {
  const { hasPermission, permissionsInitialized, loading } = usePermission();
  const navigate = useNavigate();

  const waiting = !permissionsInitialized || loading;
  const allowed = permissionsInitialized && !loading && hasPermission(permission);

  useEffect(() => {
    if (waiting) return;
    if (!hasPermission(permission)) {
      navigate(redirectPath, { replace: true });
    }
  }, [waiting, hasPermission, permission, navigate, redirectPath]);

  return { waiting, allowed };
}
