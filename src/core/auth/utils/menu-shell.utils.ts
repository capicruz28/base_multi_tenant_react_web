/**
 * Partición del menú por shell de layout (presentación), sin catálogo ERP local.
 * Visibilidad: solo flags del payload (backend ya resolvió contrato + rol_menu_permiso).
 */
import { ERP_ROUTE_SEGMENTS } from '@/core/routing/post-login-path';
import type { AuthMenuItem, AuthMenuModulo } from '@/core/auth/types/auth-menu.types';
import type { LayoutShellVariant } from '@/shared/components/layout/layout-shell.types';
import type { MenuShellScope } from '@/core/auth/types/auth-menu.types';

/** Mapeo layout → scope semántico del menú. */
export function layoutShellToMenuScope(shell: LayoutShellVariant): MenuShellScope {
  return shell === 'super-admin' ? 'platform' : shell;
}

/** Normaliza valores de scope/tipo_modulo del backend. */
export function normalizeMenuScope(value?: string | null): MenuShellScope | null {
  if (!value || !String(value).trim()) return null;
  const v = String(value).trim().toLowerCase().replace(/-/g, '_');
  if (v === 'app' || v === 'erp' || v === 'operational' || v === 'operativo') return 'app';
  if (v === 'admin' || v === 'tenant' || v === 'tenant_admin') return 'admin';
  if (v === 'platform' || v === 'super_admin' || v === 'global' || v === 'superadmin') {
    return 'platform';
  }
  return null;
}

function normalizeModuloTipoScope(tipo?: string | null): MenuShellScope | null {
  if (!tipo) return null;
  const t = tipo.trim().toLowerCase();
  if (t === 'erp') return 'app';
  if (t === 'admin' || t === 'administracion') return 'admin';
  if (t === 'platform' || t === 'super_admin') return 'platform';
  return normalizeMenuScope(tipo);
}

/** Infiere shell por prefijo de ruta (fallback cuando no hay metadata). */
export function inferMenuScopeFromRoute(ruta: string | null | undefined): MenuShellScope | null {
  if (!ruta || ruta === '#') return null;
  const path = ruta.startsWith('/') ? ruta : `/${ruta}`;

  if (path.startsWith('/super-admin')) return 'platform';
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/app/')) return 'app';

  const firstSegment = path.split('/').filter(Boolean)[0];
  if (
    firstSegment &&
    (ERP_ROUTE_SEGMENTS as readonly string[]).includes(
      firstSegment as (typeof ERP_ROUTE_SEGMENTS)[number],
    )
  ) {
    return 'app';
  }

  return null;
}

/** Scope efectivo de un ítem (metadata BE → tipo módulo → ruta). */
export function resolveMenuItemScope(
  menu: AuthMenuItem,
  modulo: AuthMenuModulo,
): MenuShellScope | null {
  return (
    normalizeMenuScope(menu.menu_scope) ??
    normalizeMenuScope(modulo.menu_scope) ??
    normalizeModuloTipoScope(modulo.tipo_modulo) ??
    inferMenuScopeFromRoute(menu.ruta)
  );
}

/** Visibilidad UI: únicamente flags del payload. */
export function isMenuVisibleInPayload(menu: AuthMenuItem): boolean {
  return Boolean(menu.is_visible && menu.is_enabled);
}

/** Ítem pertenece al shell de layout actual (presentación, no RBAC). */
export function isMenuItemForLayoutShell(
  menu: AuthMenuItem,
  modulo: AuthMenuModulo,
  shell: LayoutShellVariant,
): boolean {
  if (!isMenuVisibleInPayload(menu)) return false;

  const target = layoutShellToMenuScope(shell);
  const itemScope = resolveMenuItemScope(menu, modulo);
  if (itemScope) return itemScope === target;

  return inferMenuScopeFromRoute(menu.ruta) === target;
}

/** Podar módulo dejando solo secciones/menús del shell (sin mutar el resto del árbol global). */
export function pruneModuloForLayoutShell(
  modulo: AuthMenuModulo,
  shell: LayoutShellVariant,
): AuthMenuModulo | null {
  const secciones = (modulo.secciones ?? [])
    .map((seccion) => {
      const menus = (seccion.menus ?? [])
        .filter((menu) => isMenuItemForLayoutShell(menu, modulo, shell))
        .map((menu) => ({
          ...menu,
          submenus: (menu.submenus ?? []).filter((sub) =>
            isMenuItemForLayoutShell(sub, modulo, shell),
          ),
        }));
      return menus.length > 0 ? { ...seccion, menus } : null;
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  if (secciones.length === 0) return null;
  return { ...modulo, secciones };
}

/** Módulos con al menos un ítem visible para el shell (fuente: payload /auth/menu). */
export function filterModulosForLayoutShell(
  modulos: AuthMenuModulo[],
  shell: LayoutShellVariant,
): AuthMenuModulo[] {
  return modulos
    .map((modulo) => pruneModuloForLayoutShell(modulo, shell))
    .filter((m): m is AuthMenuModulo => m !== null);
}
