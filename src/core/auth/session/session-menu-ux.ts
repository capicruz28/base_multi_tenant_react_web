import type { HydrationLevel } from './session-refresh-diff';
import type { HydrateSessionMode } from './session-refresh-hydrate';

/**
 * Opciones UX para carga de menú (IAM-FE-PHASE-01 Paso 7).
 */
export interface LoadMenuUxOptions {
  /**
   * Refresh background: mantener menú previo visible y no falsear menuPermissionsReady
   * hasta completar GET /auth/menu.
   */
  preserveVisibleMenuDuringReload?: boolean;
}

/**
 * UX de carga de menú según modo de hydrateSessionCore.
 * Interceptor: preservar menú durante FULL hydration background.
 */
export function getLoadMenuUxOptionsForMode(mode: HydrateSessionMode): LoadMenuUxOptions {
  if (mode === 'interceptor') {
    return { preserveVisibleMenuDuringReload: true };
  }
  return {};
}

/**
 * Indica si L2 FULL recargará menú (§8.1 shouldReloadMenuAfterHydrate).
 */
export function shouldReloadMenuAfterHydrate(
  hydrationLevel: HydrationLevel,
  empresaSelectionPending: boolean,
  skipMenu: boolean,
): boolean {
  if (hydrationLevel !== 'FULL') {
    return false;
  }
  if (skipMenu) {
    return false;
  }
  if (empresaSelectionPending) {
    return false;
  }
  return true;
}

/**
 * Paso 7: NONE no debe alterar gates de menú.
 */
export function shouldPreserveMenuUxOnPostRefresh(hydrationLevel: HydrationLevel): boolean {
  return hydrationLevel === 'FULL';
}
