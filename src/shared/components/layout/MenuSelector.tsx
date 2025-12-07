import { SidebarMenuItem } from '@/features/admin/types/menu.types';
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
    // Solo log en desarrollo
    if (import.meta.env.DEV) {
      console.log('🔄 MenuSelector: Cargando SOLO menú de Super Admin (Administración Global)');
    }
    return [...superAdminNavItems];
  }

  // Tenant Admin ve SOLO Administración de Tenant
  if (isTenantAdmin) {
    // Solo log en desarrollo
    if (import.meta.env.DEV) {
      console.log('🔄 MenuSelector: Cargando menú de Tenant Admin (Administración del Tenant)');
    }
    return [...tenantAdminNavItems];
  }

  // Usuario normal - menú vacío (se llenará con módulos asignados)
  // Solo log en desarrollo
  if (import.meta.env.DEV) {
    console.log('🔄 MenuSelector: Cargando menú básico para usuario normal');
  }
  return [];
};

/**
 * NOTA: Este archivo se mantiene en shared porque es usado por NewSidebar
 * que también está en shared. Si en el futuro NewSidebar se mueve a una feature,
 * este archivo debería moverse con él.
 */

