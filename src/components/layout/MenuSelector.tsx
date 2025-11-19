import { SidebarMenuItem } from '../../types/menu.types';
import { superAdminNavItems } from '../../config/superAdminMenu';
import { tenantAdminNavItems } from '../../config/adminMenu';

/**
 * Función pura para obtener items del menú basado en el tipo de usuario
 * ✅ CORRECCIÓN: Super Admin SOLO ve Administración Global
 */
export const getMenuItemsByUserType = (
  isSuperAdmin: boolean, 
  isTenantAdmin: boolean
): SidebarMenuItem[] => {
  // 🚨 CORRECCIÓN CRÍTICA: Super Admin NO debe ver Administración del Tenant
  if (isSuperAdmin) {
    console.log('🔄 MenuSelector: Cargando SOLO menú de Super Admin (Administración Global)');
    return [...superAdminNavItems];
  }

  // Tenant Admin ve SOLO Administración de Tenant
  if (isTenantAdmin) {
    console.log('🔄 MenuSelector: Cargando menú de Tenant Admin (Administración del Tenant)');
    return [...tenantAdminNavItems];
  }

  // Usuario normal - menú vacío (se llenará con módulos asignados)
  console.log('🔄 MenuSelector: Cargando menú básico para usuario normal');
  return [];
};

/**
 * Componente selector dinámico de menú
 * Este componente se usa para mantener el estado reactivo si es necesario
 * pero la lógica principal está en la función pura getMenuItemsByUserType
 */
const MenuSelector: React.FC = () => {
  // Este componente puede usar hooks si es necesario para mantener estado reactivo
  // pero actualmente solo exporta la función pura
  return null;
};

export default MenuSelector;