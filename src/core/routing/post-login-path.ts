import { isImpersonationToken } from '@/core/auth/utils/impersonation-session';
import { decodeAccessToken } from '@/core/auth/utils/decodeAccessToken';
import type { AuthMenuModulo } from '@/core/auth/types/auth-menu.types';
import {
  findFirstNavigableRouteFromMenu,
  findFirstRouteWithPrefix,
} from '@/core/routing/resolve-post-login-from-menu';
import { logPostLoginDiag } from '@/core/auth/utils/post-login-diag-log';

/** Ruta home del panel ERP operativo */
export const APP_HOME = '/app/home';

export const APP_SELECCIONAR_EMPRESA = '/app/seleccionar-empresa';
export const APP_ONBOARDING = '/app/onboarding';

/** Segmentos de primer nivel que viven bajo `/app/*` (sin prefijo /app). */
export const ERP_ROUTE_SEGMENTS = [
  'autorizacion',
  'reportes',
  'org',
  'inv',
  'pur',
  'sls',
  'facturacion',
  'prc',
  'log',
  'fin',
  'wms',
  'qms',
  'crm',
  'pos',
  'hcm',
  'mfg',
  'mrp',
  'mps',
  'mnt',
  'cst',
  'tax',
  'bdg',
  'pm',
  'svc',
  'tkt',
  'dms',
  'wfl',
  'bi',
  'aud',
] as const;

const LEGACY_PATH_ALIASES: Record<string, string> = {
  '/finalizartareo': '/app/autorizacion/finalizartareo',
  '/reportedestajo': '/app/reportes/reportedestajo',
};

/**
 * Convierte rutas ERP legacy (sin `/app`) a la ruta bajo `/app/*`.
 * Si ya tiene `/app`, devuelve la misma ruta.
 */
export function mapLegacyErpPath(pathname: string): string {
  if (!pathname || pathname.startsWith('/app')) {
    return pathname || APP_HOME;
  }

  if (pathname === '/home' || pathname.startsWith('/home/')) {
    return `/app${pathname}`;
  }

  const alias = LEGACY_PATH_ALIASES[pathname];
  if (alias) {
    return alias;
  }

  const firstSegment = pathname.split('/').filter(Boolean)[0];
  if (firstSegment && (ERP_ROUTE_SEGMENTS as readonly string[]).includes(firstSegment)) {
    return `/app${pathname}`;
  }

  return pathname;
}

/** Alias explícito para navegación interna ERP → rutas bajo `/app/*`. */
export function toAppPath(pathname: string): string {
  return mapLegacyErpPath(pathname);
}

export interface PostLoginPathInput {
  isSuperAdmin: boolean;
  userType: string;
  /** @deprecated No usar para redirect; se mantiene por compatibilidad de firma. */
  accessLevel?: number;
  fromPathname?: string | null;
  /** Menú efectivo GET /auth/menu (fuente de verdad del destino). */
  menuModulos?: AuthMenuModulo[] | null;
}

/**
 * Destino post-login alineado con SmartRedirect.
 * Prioridad: primer ítem visible de /auth/menu; fallbacks mínimos por tipo de usuario.
 */
export function resolvePostLoginPath({
  isSuperAdmin,
  userType,
  fromPathname,
  menuModulos,
}: PostLoginPathInput): string {
  const fromMenu = findFirstNavigableRouteFromMenu(menuModulos, userType);
  if (fromMenu) {
    logPostLoginDiag('resolvePostLoginPath', 'return', {
      route: fromMenu,
      branch: 'fromMenu',
      userType,
      menuModulosCount: menuModulos?.length ?? 0,
    });
    return fromMenu;
  }

  if (isSuperAdmin || userType === 'platform_admin') {
    const route = '/super-admin/dashboard';
    logPostLoginDiag('resolvePostLoginPath', 'return', {
      route,
      branch: 'platform_admin',
      userType,
    });
    return route;
  }

  if (userType === 'tenant_admin') {
    const route =
      findFirstRouteWithPrefix(menuModulos, '/admin') ??
      findFirstRouteWithPrefix(menuModulos, '/app') ??
      '/admin/usuarios';
    logPostLoginDiag('resolvePostLoginPath', 'return', {
      route,
      branch: 'tenant_admin',
      userType,
      menuModulosCount: menuModulos?.length ?? 0,
    });
    return route;
  }

  const from = fromPathname?.trim();
  if (
    from &&
    from !== '/login' &&
    from !== '/unauthorized' &&
    !from.startsWith('/super-admin') &&
    !from.startsWith('/admin')
  ) {
    const route = mapLegacyErpPath(from);
    logPostLoginDiag('resolvePostLoginPath', 'return', {
      route,
      branch: 'fromPathname',
      userType,
      fromPathname: from,
    });
    return route;
  }

  logPostLoginDiag('resolvePostLoginPath', 'return', {
    route: APP_HOME,
    branch: 'APP_HOME',
    userType,
    fromPathname: fromPathname ?? null,
    menuModulosCount: menuModulos?.length ?? 0,
  });
  return APP_HOME;
}

/**
 * Destino tras completar selección de empresa (Schema A → B).
 * En modo soporte (impersonación) el JWT es tenant_admin pero debe entrar al ERP `/app/home`.
 */
export function resolvePostEmpresaSelectionPath(
  token: string | null | undefined,
  options?: { isImpersonation?: boolean },
): string {
  const impersonating =
    options?.isImpersonation === true || isImpersonationToken(token);
  if (impersonating) {
    if (import.meta.env.DEV) {
      const claims = decodeAccessToken(token);
      console.log('[IMPERSONATION-ROUTE]', {
        path: APP_HOME,
        userType: claims?.user_type,
        cliente_id: claims?.cliente_id,
      });
    }
    return APP_HOME;
  }
  return APP_HOME;
}
