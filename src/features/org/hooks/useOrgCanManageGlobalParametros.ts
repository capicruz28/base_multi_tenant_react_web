import { useAuth } from '@/shared/context/AuthContext';

/** tenant_admin o platform_admin — escritura de parámetros globales. */
export function useOrgCanManageGlobalParametros(): boolean {
  const { userType, isSuperAdmin } = useAuth();
  return userType === 'tenant_admin' || isSuperAdmin;
}
