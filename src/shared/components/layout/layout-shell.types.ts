/** Contexto de shell de aplicación (Punto 3 — separación de layouts). */
export type LayoutShellVariant = 'app' | 'admin' | 'super-admin';

export const SHELL_HOME_PATH: Record<LayoutShellVariant, string> = {
  app: '/app/home',
  admin: '/admin/usuarios',
  'super-admin': '/super-admin/dashboard',
};

export const SHELL_MODULE_SECTION_TITLE: Record<LayoutShellVariant, string | null> = {
  app: 'Módulos',
  admin: null,
  'super-admin': null,
};

export const SHELL_ADMIN_SECTION_TITLE: Record<LayoutShellVariant, string | null> = {
  app: null,
  admin: 'Administración General',
  'super-admin': 'Administración Global',
};
