/**
 * Tipos para plantillas de roles
 * Alineados con la refactorización del backend
 */

// ============================================
// TIPOS BASE - PLANTILLAS DE ROLES
// ============================================

export interface PlantillaRol {
  plantilla_rol_id: string; // UUID format
  modulo_id: string; // UUID format
  nombre: string;
  descripcion?: string | null;
  permisos_json: Record<string, any>; // Estructura de permisos por menú
  es_activa: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

export interface PlantillaRolCreate {
  modulo_id: string; // UUID format
  nombre: string;
  descripcion?: string | null;
  permisos_json: Record<string, any>;
  es_activa?: boolean;
}

export interface PlantillaRolUpdate {
  nombre?: string;
  descripcion?: string | null;
  permisos_json?: Record<string, any>;
  es_activa?: boolean;
}

// ============================================
// TIPOS PARA FILTROS Y PAGINACIÓN
// ============================================

export interface PlantillaRolFilters {
  modulo_id?: string;
  nombre?: string;
  es_activa?: boolean;
  skip?: number;
  limit?: number;
}

export interface PaginatedPlantillaRolResponse {
  items: PlantillaRol[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ============================================
// TIPOS PARA RESPUESTAS DE API
// ============================================

// ✅ Tipo para respuestas individuales del backend (POST, PUT, GET por ID)
export interface PlantillaRolResponse {
  success: boolean;
  message: string;
  data: {
    plantilla_rol_id: string;
    modulo_id: string;
    nombre: string;
    descripcion?: string | null;
    permisos_json: Record<string, any>;
    es_activa: boolean;
    fecha_creacion: string;
    fecha_actualizacion?: string | null;
  };
}

