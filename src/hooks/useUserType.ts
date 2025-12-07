// src/hooks/useUserType.ts
import { useAuth } from '../shared/context/AuthContext';
import { UserType, AccessLevel, UserCapabilities } from '../types/auth.types';

/**
 * Hook personalizado para manejar tipos de usuario y capacidades
 * 
 * @returns Objeto con información del tipo de usuario y capacidades
 */
export const useUserType = () => {
  const { 
    accessLevel, 
    isSuperAdmin, 
    userType, 
    clienteInfo,
    hasRole 
  } = useAuth();

  /**
   * Determina si el usuario puede acceder a funciones de super administrador
   */
  const canAccessSuperAdmin = isSuperAdmin;

  /**
   * Determina si el usuario puede acceder a funciones de administrador de tenant
   */
  const canAccessTenantAdmin = accessLevel >= AccessLevel.TENANT_ADMIN;

  /**
   * Determina si el usuario puede gestionar usuarios
   */
  const canManageUsers = canAccessTenantAdmin || hasRole('admin', 'supervisor');

  /**
   * Determina si el usuario puede gestionar roles
   */
  const canManageRoles = canAccessTenantAdmin;

  /**
   * Determina si el usuario puede gestionar configuración del cliente
   */
  const canManageClient = canAccessTenantAdmin;

  /**
   * Obtiene las capacidades completas del usuario
   */
  const capabilities: UserCapabilities = {
    canAccessSuperAdmin,
    canAccessTenantAdmin,
    canManageUsers,
    canManageRoles,
    canManageClient,
  };

  /**
   * Verifica si el usuario tiene un tipo específico
   */
  const checkUserType = (type: UserType): boolean => userType === type;

  /**
   * Verifica si el usuario tiene un nivel de acceso mínimo
   */
  const checkAccessLevel = (minLevel: AccessLevel): boolean => accessLevel >= minLevel;

  return {
    // Información básica
    accessLevel,
    isSuperAdmin,
    userType,
    clienteInfo,
    
    // Tipos específicos (nombres únicos)
    isSuperAdminUser: checkUserType('super_admin'),
    isTenantAdminUser: checkUserType('tenant_admin'),
    isRegularUser: checkUserType('user'),
    
    // Capacidades
    capabilities,
    
    // Helpers de verificación (nombres únicos)
    hasMinimumAccessLevel: checkAccessLevel,
    matchesUserType: checkUserType,
    
    // Métodos de conveniencia
    canAccess: (requiredLevel: AccessLevel | UserType): boolean => {
      if (typeof requiredLevel === 'number') {
        return checkAccessLevel(requiredLevel);
      }
      return checkUserType(requiredLevel);
    }
  };
};

export default useUserType;