import { useAuth } from '@/shared/context/AuthContext';

/**
 * Niveles de acceso para el menú de administración.
 * Derivados únicamente de userType (user_type de /auth/me).
 * - platform_admin → SuperAdmin (solo Administración Global)
 * - tenant_admin   → Admin del tenant (solo Administración del Tenant)
 */
export function useAccessLevel() {
  const { userType, isSuperAdmin } = useAuth();

  const isTenantAdmin = userType === 'tenant_admin';
  const isUser = userType !== 'platform_admin' && userType !== 'tenant_admin';

  return {
    userType: userType ?? 'user',
    isSuperAdmin: isSuperAdmin ?? false,
    isTenantAdmin,
    isUser,
  };
}
