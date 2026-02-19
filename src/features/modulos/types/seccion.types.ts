/**
 * Tipos para gestión de secciones de módulos
 * Alineados con la refactorización del backend
 */

// ============================================
// TIPOS BASE - SECCIONES
// ============================================

export interface Seccion {
  seccion_id: string; // UUID format
  modulo_id: string; // UUID format
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  icono: string;
  orden: number;
  es_activa: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

export interface SeccionCreate {
  modulo_id: string; // UUID format
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  icono: string;
  orden?: number;
  es_activa?: boolean;
}

export interface SeccionUpdate {
  codigo?: string;
  nombre?: string;
  descripcion?: string | null;
  icono?: string;
  orden?: number;
  es_activa?: boolean;
}

// ============================================
// TIPOS PARA FILTROS Y PAGINACIÓN
// ============================================

export interface SeccionFilters {
  modulo_id?: string;
  codigo?: string;
  nombre?: string;
  es_activa?: boolean;
  skip?: number;
  limit?: number;
}

export interface PaginatedSeccionResponse {
  items: Seccion[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ✅ Tipo para la respuesta real del backend GET /secciones/
export interface SeccionListResponse {
  success: boolean;
  message: string;
  data: Seccion[];
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
export interface SeccionResponse {
  success: boolean;
  message: string;
  data: {
    seccion_id: string;
    modulo_id: string;
    codigo: string;
    nombre: string;
    descripcion?: string | null;
    icono: string;
    orden: number;
    es_activa: boolean;
    fecha_creacion: string;
    fecha_actualizacion?: string | null;
  };
}

