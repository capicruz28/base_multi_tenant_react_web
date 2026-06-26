import type { ShellBreadcrumbItem } from '@/shared/components/layout/useShellBreadcrumbs';
import {
  ACCOUNT_CENTER_DEFAULT_PATH,
  ACCOUNT_CENTER_HUB_LABEL,
  ACCOUNT_CENTER_SECTIONS,
  isAccountCenterPath,
  resolveAccountCenterSection,
} from '@/features/account/account.routes';

/**
 * Breadcrumbs Mi Cuenta para Header — derivados de `account.routes.ts` (SSOT).
 * Trail: Mi cuenta → [Sección activa]
 */
export function resolveAccountCenterBreadcrumbs(pathname: string): ShellBreadcrumbItem[] | null {
  if (!isAccountCenterPath(pathname)) {
    return null;
  }

  const section =
    resolveAccountCenterSection(pathname) ??
    ACCOUNT_CENTER_SECTIONS.find((item) => item.id === 'informacion');

  if (!section) {
    return null;
  }

  return [
    { nombre: ACCOUNT_CENTER_HUB_LABEL, ruta: ACCOUNT_CENTER_DEFAULT_PATH },
    { nombre: section.navLabel, ruta: section.path },
  ];
}
