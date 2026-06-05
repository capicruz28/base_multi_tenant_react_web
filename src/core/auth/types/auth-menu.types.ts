/**
 * Tipos para la respuesta de GET /auth/menu (autorización enterprise).
 * Fuente única de menú y permisos efectivos del usuario.
 */

/** Shell de presentación del menú (metadata opcional del backend). */
export type MenuShellScope = 'app' | 'admin' | 'platform';

/** Permisos efectivos por ítem de menú (ya resueltos en backend; el FE solo los indexa para guards). */
export interface MenuPermisos {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
  exportar: boolean;
  imprimir: boolean;
  aprobar: boolean;
}

/** Ítem de menú con visibilidad y permisos. */
export interface AuthMenuItem {
  menu_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  icono: string;
  ruta: string;
  tipo_menu: string;
  orden: number;
  is_visible: boolean;
  is_enabled: boolean;
  required_permission?: string;
  /** Shell de UI: app | admin | platform (opcional; fallback por prefijo de ruta). */
  menu_scope?: MenuShellScope | string | null;
  permisos: MenuPermisos;
  submenus: AuthMenuItem[];
}

/** Sección dentro de un módulo. */
export interface AuthMenuSeccion {
  seccion_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  icono: string;
  orden: number;
  menus: AuthMenuItem[];
}

/** Módulo con secciones y menús. */
export interface AuthMenuModulo {
  modulo_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  icono: string;
  color: string;
  categoria: string;
  orden: number;
  /** Shell de UI a nivel módulo (opcional). */
  menu_scope?: MenuShellScope | string | null;
  /** Tipo semántico: erp | admin | platform (opcional; alias de menu_scope). */
  tipo_modulo?: string | null;
  secciones: AuthMenuSeccion[];
}

/** Respuesta de GET /auth/menu. */
export interface AuthMenuResponse {
  modulos: AuthMenuModulo[];
}
