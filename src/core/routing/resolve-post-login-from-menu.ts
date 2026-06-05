import type { AuthMenuModulo, AuthMenuItem } from '@/core/auth/types/auth-menu.types';
import { isMenuVisibleInPayload } from '@/core/auth/utils/menu-shell.utils';
import { mapLegacyErpPath, APP_HOME } from '@/core/routing/post-login-path';

function normalizeMenuPath(ruta: string): string {
  return ruta.startsWith('/') ? ruta : `/${ruta}`;
}

function collectVisibleRoutes(modulos: AuthMenuModulo[]): string[] {
  const routes: string[] = [];
  const sortedModulos = [...modulos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  const walkMenus = (menus: AuthMenuItem[]) => {
    const sortedMenus = [...menus].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    for (const menu of sortedMenus) {
      if (!isMenuVisibleInPayload(menu) || !menu.ruta || menu.ruta === '#') continue;
      routes.push(normalizeMenuPath(menu.ruta));
      for (const sub of menu.submenus ?? []) {
        if (!isMenuVisibleInPayload(sub) || !sub.ruta || sub.ruta === '#') continue;
        routes.push(normalizeMenuPath(sub.ruta));
      }
    }
  };

  for (const modulo of sortedModulos) {
    for (const seccion of modulo.secciones ?? []) {
      walkMenus(seccion.menus ?? []);
    }
  }

  return routes;
}

/** Primera ruta visible del menú cuyo path coincide con el prefijo (ej. /admin, /app/org). */
export function findFirstRouteWithPrefix(
  modulos: AuthMenuModulo[] | null | undefined,
  prefix: string,
): string | null {
  if (!modulos?.length) return null;
  const normalizedPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`;
  const routes = collectVisibleRoutes(modulos);
  return (
    routes.find(
      (r) => r === normalizedPrefix || r.startsWith(`${normalizedPrefix}/`),
    ) ?? null
  );
}

/**
 * Primera ruta navegable del payload GET /auth/menu (orden backend).
 */
export function findFirstNavigableRouteFromMenu(
  modulos: AuthMenuModulo[] | null | undefined,
  userType: string,
): string | null {
  if (!modulos?.length) return null;

  const routes = collectVisibleRoutes(modulos);
  if (routes.length === 0) return null;

  if (userType === 'platform_admin') {
    return routes.find((r) => r.startsWith('/super-admin')) ?? '/super-admin/dashboard';
  }

  if (userType === 'tenant_admin') {
    return routes[0];
  }

  const appRoute = routes.find((r) => r.startsWith('/app/') || r.startsWith('/app'));
  if (appRoute) return mapLegacyErpPath(appRoute);

  const legacyErp = routes.find((r) => {
    const seg = r.split('/').filter(Boolean)[0];
    return seg && !['admin', 'super-admin', 'login'].includes(seg);
  });
  if (legacyErp) return mapLegacyErpPath(legacyErp);

  return APP_HOME;
}
