/**
 * Tipos para la nueva estructura jerárquica de módulos, secciones y menús
 * Alineados con la refactorización del backend
 */

// ============================================
// TIPOS BASE - MÓDULOS V2
// ============================================

export interface ModuloV2 {
  modulo_id: string; // UUID format
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  icono: string;
  color: string;
  categoria: string;
  orden: number;
  es_activo: boolean;
  /** Módulo core del sistema (no desactivable por tenant) */
  es_core?: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

export interface ModuloV2Create {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  icono: string;
  color: string;
  categoria: string;
  orden?: number;
  es_activo?: boolean;
}

export interface ModuloV2Update {
  codigo?: string;
  nombre?: string;
  descripcion?: string | null;
  icono?: string;
  color?: string;
  categoria?: string;
  orden?: number;
  es_activo?: boolean;
}

// ============================================
// TIPOS PARA ESTRUCTURA JERÁRQUICA DEL MENÚ
// ============================================

/**
 * Permisos de un menú específico
 */
export interface MenuPermisos {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
  exportar: boolean;
  imprimir: boolean;
  aprobar: boolean;
}

/**
 * Menú con permisos y submenús
 */
export interface MenuConPermisos {
  menu_id: string; // UUID format
  codigo: string;
  nombre: string;
  icono: string;
  ruta: string;
  nivel: number;
  tipo_menu: string;
  orden: number;
  permisos: MenuPermisos;
  submenus: MenuConPermisos[];
}

/**
 * Sección con sus menús
 */
export interface SeccionConMenus {
  seccion_id: string; // UUID format
  codigo: string;
  nombre: string;
  icono: string;
  orden: number;
  menus: MenuConPermisos[];
}

/**
 * Módulo con sus secciones y menús
 */
export interface ModuloConSecciones {
  modulo_id: string; // UUID format
  codigo: string;
  nombre: string;
  icono: string;
  color: string;
  categoria: string;
  orden: number;
  secciones: SeccionConMenus[];
}

/**
 * Respuesta del endpoint GET /modulos-menus/usuario/{usuario_id}/
 */
export interface ModuloMenuResponse {
  modulos: ModuloConSecciones[];
}

// ============================================
// TIPOS PARA PAGINACIÓN Y FILTROS
// ============================================

export interface ModuloV2Filters {
  codigo?: string;
  nombre?: string;
  buscar?: string;
  categoria?: string;
  es_activo?: boolean;
  skip?: number;
  limit?: number;
}

export interface PaginatedModuloV2Response {
  items: ModuloV2[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ✅ Tipo para la respuesta real del backend GET /modulos-v2/
export interface ModuloV2ListResponse {
  success: boolean;
  message: string;
  data: ModuloV2[];
  pagination: {
    total: number;
    skip: number;
    limit: number;
    total_pages: number;
    current_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ============================================
// TIPOS PARA RESPUESTAS DE API
// ============================================

// ✅ Tipo para respuestas individuales del backend (POST, PUT, GET por ID)
export interface ModuloV2Response {
  success: boolean;
  message: string;
  data: ModuloV2;
}

// ✅ Tipo para la respuesta del endpoint GET /modulos-v2/disponibles/{cliente_id}/
export interface ModuloV2DisponiblesResponse {
  success: boolean;
  message: string;
  data: ModuloV2[];
}

