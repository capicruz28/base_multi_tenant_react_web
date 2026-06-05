// src/core/hooks/useUserType.ts
import { useAuth } from '../../shared/context/AuthContext';
import { UserType, AccessLevel, UserCapabilities } from '../../features/auth/types/auth.types';

/**
 * Hook personalizado para manejar tipos de usuario y capacidades
 */
export const useUserType = () => {
  const {
    accessLevel,
    isSuperAdmin,
    userType,
    clienteInfo,
    hasRole,
  } = useAuth();

  const canAccessSuperAdmin = isSuperAdmin || userType === 'platform_admin';
  const canAccessTenantAdmin =
    userType === 'tenant_admin' || accessLevel >= AccessLevel.TENANT_ADMIN;
  const canManageUsers = canAccessTenantAdmin || hasRole('admin', 'supervisor');
  const canManageRoles = canAccessTenantAdmin;
  const canManageClient = canAccessTenantAdmin;

  const capabilities: UserCapabilities = {
    canAccessSuperAdmin,
    canAccessTenantAdmin,
    canManageUsers,
    canManageRoles,
    canManageClient,
  };

  const checkUserType = (type: UserType): boolean => userType === type;

  const checkAccessLevel = (minLevel: AccessLevel): boolean => accessLevel >= minLevel;

  const isPlatformAdminUser = canAccessSuperAdmin;
  const isTenantAdminUser = userType === 'tenant_admin';
  const isOperationalUser =
    userType !== 'platform_admin' && userType !== 'tenant_admin';

  return {
    accessLevel,
    isSuperAdmin,
    userType,
    clienteInfo,
    isPlatformAdminUser,
    /** Alias de isPlatformAdminUser (compatibilidad) */
    isSuperAdminUser: isPlatformAdminUser,
    isTenantAdminUser,
    isOperationalUser,
    /** @deprecated Usar isOperationalUser */
    isRegularUser: isOperationalUser,
    capabilities,
    hasMinimumAccessLevel: checkAccessLevel,
    matchesUserType: checkUserType,
    canAccess: (requiredLevel: AccessLevel | UserType): boolean => {
      if (typeof requiredLevel === 'number') {
        return checkAccessLevel(requiredLevel);
      }
      return checkUserType(requiredLevel);
    },
  };
};

export default useUserType;
