/**
 * Utilidad para lazy loading de módulos ERP
 * 
 * Esta función facilita la carga dinámica de módulos ERP (planillas, logística, etc.)
 * con code splitting automático.
 * 
 * @example
 * const PlanillasModule = createModuleLoader(() => import('@/features/planillas'));
 */
import { lazy, ComponentType } from 'react';

/**
 * Crea un loader lazy para un módulo ERP
 * 
 * @param importFn - Función que retorna el import del módulo
 * @returns Componente lazy del módulo
 */
export function createModuleLoader<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(importFn);
}

/**
 * Preload un módulo (útil para precargar módulos que probablemente se usarán)
 * 
 * @param importFn - Función que retorna el import del módulo
 */
export function preloadModule(
  importFn: () => Promise<any>
): void {
  // Preload cuando el navegador esté inactivo
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFn();
    });
  } else {
    // Fallback para navegadores sin requestIdleCallback
    setTimeout(() => {
      importFn();
    }, 2000);
  }
}

/**
 * Ejemplo de uso para módulos futuros:
 * 
 * // En App.tsx o router:
 * const PlanillasModule = createModuleLoader(() => import('@/features/planillas'));
 * 
 * // Preload cuando el usuario está en el dashboard (opcional):
 * useEffect(() => {
 *   if (userType === 'tenant_admin') {
 *     preloadModule(() => import('@/features/planillas'));
 *   }
 * }, [userType]);
 */

