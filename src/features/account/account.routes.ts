/**
 * Rutas canónicas y metadata de sección — Mi Cuenta (ACCOUNT_CENTER_V1).
 * SSOT para sidebar, layout section header y breadcrumbs Header (PR2).
 */

export const ACCOUNT_CENTER_BASE_PATH = '/app/cuenta' as const;

/** Label producto hub — SSOT breadcrumb y menú Header. */
export const ACCOUNT_CENTER_HUB_LABEL = 'Mi cuenta' as const;

export const ACCOUNT_CENTER_ROUTE_SEGMENTS = {
  informacion: 'informacion',
  seguridad: 'seguridad',
  sesiones: 'sesiones',
  preferencias: 'preferencias',
} as const;

export type AccountCenterSectionId = keyof typeof ACCOUNT_CENTER_ROUTE_SEGMENTS;

export type AccountCenterContentVariant = 'narrow' | 'full';

export interface AccountCenterSectionMeta {
  id: AccountCenterSectionId;
  segment: (typeof ACCOUNT_CENTER_ROUTE_SEGMENTS)[AccountCenterSectionId];
  navLabel: string;
  title: string;
  subtitle: string;
  contentVariant: AccountCenterContentVariant;
  path: string;
}

export const ACCOUNT_CENTER_DEFAULT_SEGMENT = ACCOUNT_CENTER_ROUTE_SEGMENTS.informacion;

export const ACCOUNT_CENTER_DEFAULT_PATH = `${ACCOUNT_CENTER_BASE_PATH}/${ACCOUNT_CENTER_DEFAULT_SEGMENT}`;

export const ACCOUNT_CENTER_SESSIONS_PATH = `${ACCOUNT_CENTER_BASE_PATH}/${ACCOUNT_CENTER_ROUTE_SEGMENTS.sesiones}` as const;

export const ACCOUNT_CENTER_SECTIONS: readonly AccountCenterSectionMeta[] = [
  {
    id: 'informacion',
    segment: ACCOUNT_CENTER_ROUTE_SEGMENTS.informacion,
    navLabel: 'Información personal',
    title: 'Información personal',
    subtitle: 'Consulta los datos de tu cuenta en este tenant.',
    contentVariant: 'narrow',
    path: `${ACCOUNT_CENTER_BASE_PATH}/${ACCOUNT_CENTER_ROUTE_SEGMENTS.informacion}`,
  },
  {
    id: 'seguridad',
    segment: ACCOUNT_CENTER_ROUTE_SEGMENTS.seguridad,
    navLabel: 'Seguridad',
    title: 'Seguridad',
    subtitle: 'Administra tu contraseña y el cierre de sesiones en todos tus dispositivos.',
    contentVariant: 'narrow',
    path: `${ACCOUNT_CENTER_BASE_PATH}/${ACCOUNT_CENTER_ROUTE_SEGMENTS.seguridad}`,
  },
  {
    id: 'sesiones',
    segment: ACCOUNT_CENTER_ROUTE_SEGMENTS.sesiones,
    navLabel: 'Sesiones',
    title: 'Sesiones',
    subtitle: 'Dispositivos donde has iniciado sesión con tu cuenta.',
    contentVariant: 'full',
    path: `${ACCOUNT_CENTER_BASE_PATH}/${ACCOUNT_CENTER_ROUTE_SEGMENTS.sesiones}`,
  },
  {
    id: 'preferencias',
    segment: ACCOUNT_CENTER_ROUTE_SEGMENTS.preferencias,
    navLabel: 'Preferencias',
    title: 'Preferencias',
    subtitle: 'Personaliza la apariencia de la interfaz en este navegador.',
    contentVariant: 'narrow',
    path: `${ACCOUNT_CENTER_BASE_PATH}/${ACCOUNT_CENTER_ROUTE_SEGMENTS.preferencias}`,
  },
] as const;

export function isAccountCenterPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, '');
  return (
    normalized === ACCOUNT_CENTER_BASE_PATH ||
    ACCOUNT_CENTER_SECTIONS.some((section) => normalized === section.path)
  );
}

export function resolveAccountCenterSection(pathname: string): AccountCenterSectionMeta | undefined {
  const normalized = pathname.replace(/\/$/, '');
  return ACCOUNT_CENTER_SECTIONS.find((section) => normalized === section.path);
}
