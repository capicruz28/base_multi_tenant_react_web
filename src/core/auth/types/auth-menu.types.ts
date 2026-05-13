/**
 * Tipos para la respuesta de GET /auth/menu (autorización enterprise).
 * Fuente única de menú y permisos efectivos del usuario.
 */

/** Permisos efectivos por ítem de menú (derivados desde RBAC / overrides en backend). */
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
  secciones: AuthMenuSeccion[];
}

/** Respuesta de GET /auth/menu. */
export interface AuthMenuResponse {
  modulos: AuthMenuModulo[];
}
