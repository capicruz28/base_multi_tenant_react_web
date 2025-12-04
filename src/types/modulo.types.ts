/**
 * Tipos para la gestión de módulos (Super Admin)
 * Alineados 100% con los schemas del backend (app.schemas.modulo)
 */

// ============================================
// TIPOS BASE - CATÁLOGO DE MÓDULOS
// ============================================

export interface Modulo {
  modulo_id: string; // UUID format
  codigo_modulo: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  es_modulo_core: boolean;
  requiere_licencia: boolean;
  orden: number;
  es_activo: boolean;
  fecha_creacion: string | null;
}

export interface ModuloCreate {
  codigo_modulo: string;
  nombre: string;
  descripcion?: string | null;
  icono?: string | null;
  es_modulo_core?: boolean;
  requiere_licencia?: boolean;
  orden?: number;
  es_activo?: boolean;
}

export interface ModuloUpdate {
  codigo_modulo?: string;
  nombre?: string;
  descripcion?: string | null;
  icono?: string | null;
  es_modulo_core?: boolean;
  requiere_licencia?: boolean;
  orden?: number;
  es_activo?: boolean;
}

// ============================================
// TIPOS PARA MÓDULOS ACTIVOS POR CLIENTE
// ============================================

export interface ModuloActivo {
  cliente_modulo_activo_id: string; // UUID format
  cliente_id: string; // UUID format
  modulo_id: string; // UUID format
  esta_activo: boolean;
  fecha_activacion: string;
  fecha_vencimiento: string | null;
  configuracion_json: Record<string, any> | null;
  limite_usuarios: number | null;
  limite_registros: number | null;
  // Información del módulo (join)
  modulo_nombre?: string | null;
  codigo_modulo?: string | null;
  modulo_descripcion?: string | null;
}

export interface ModuloActivoCreate {
  cliente_id: string; // UUID format
  modulo_id: string; // UUID format
  configuracion_json?: Record<string, any> | null;
  limite_usuarios?: number | null;
  limite_registros?: number | null;
  fecha_vencimiento?: string | null;
}

export interface ModuloActivoUpdate {
  configuracion_json?: Record<string, any> | null;
  limite_usuarios?: number | null;
  limite_registros?: number | null;
  fecha_vencimiento?: string | null;
  esta_activo?: boolean;
}

// ============================================
// TIPOS PARA MÓDULOS CON INFORMACIÓN DE ACTIVACIÓN
// ============================================

export interface ModuloConInfoActivacion extends Modulo {
  activo_en_cliente: boolean;
  cliente_modulo_activo_id: string | null; // UUID format
  fecha_activacion: string | null;
  fecha_vencimiento: string | null;
  configuracion_json: Record<string, any> | null;
  limite_usuarios: number | null;
  limite_registros: number | null;
}

// ============================================
// TIPOS PARA ESTADÍSTICAS DE MÓDULOS ACTIVOS
// ============================================

export interface ModuloActivoConEstadisticas extends ModuloActivo {
  usuarios_activos: number;
  registros_totales: number;
  porcentaje_uso_usuarios: number | null;
  porcentaje_uso_registros: number | null;
  dias_restantes_licencia: number | null;
  esta_proximo_vencimiento: boolean;
  esta_sobre_limite: boolean;
}

// ============================================
// TIPOS DE RESPUESTA DEL BACKEND
// ============================================

export interface PaginationMetadata {
  total: number;
  skip: number;
  limit: number;
  total_pages: number;
  current_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ModuloResponse {
  success: boolean;
  message: string;
  data: Modulo | null;
}

export interface ModuloListResponse {
  success: boolean;
  message: string;
  data: Modulo[];
}

export interface ModuloConInfoActivacionListResponse {
  success: boolean;
  message: string;
  data: ModuloConInfoActivacion[];
}

export interface PaginatedModuloResponse {
  success: boolean;
  message: string;
  data: Modulo[];
  pagination: PaginationMetadata;
}

export interface ModuloDeleteResponse {
  success: boolean;
  message: string;
  modulo_id: string; // UUID format
}

// ============================================
// TIPOS PARA WORKFLOWS INTEGRADOS
// ============================================

export interface WorkflowActivacionCompletaRequest {
  activacion: ModuloActivoCreate;
  conexion?: {
    servidor: string;
    puerto: number;
    nombre_bd: string;
    usuario: string;
    password: string;
    tipo_bd: 'sqlserver' | 'postgresql' | 'mysql' | 'oracle';
    usa_ssl?: boolean;
    timeout_segundos?: number;
    max_pool_size?: number;
    es_solo_lectura?: boolean;
    es_conexion_principal?: boolean;
  };
}

export interface WorkflowActivacionCompletaResponse {
  success: boolean;
  message: string;
  workflow: 'activar-completo';
  data: {
    modulo: Modulo;
    activacion: ModuloActivo;
    conexion: any | null;
    test_conexion: {
      success: boolean;
      mensaje: string;
      tiempo_respuesta_ms?: number;
    } | null;
  };
}

export interface WorkflowDesactivacionCompletaResponse {
  success: boolean;
  message: string;
  workflow: 'desactivar-completo';
  data: {
    cliente_id: string; // UUID format
    modulo_id: string; // UUID format
    conexiones_desactivadas: number;
    conexion_ids: string[]; // UUID format
  };
}

export interface WorkflowEstadoCompletoResponse {
  success: boolean;
  message: string;
  workflow: 'estado-completo';
  data: {
    modulo: Modulo;
    activacion: ModuloActivo;
    estadisticas: ModuloActivoConEstadisticas;
    conexiones: {
      total: number;
      principal: any | null;
      todas: any[];
    };
  };
}

// ============================================
// TIPOS PARA FILTROS Y BÚSQUEDA
// ============================================

export interface ModuloFilters {
  buscar?: string;
  es_modulo_core?: boolean;
  requiere_licencia?: boolean;
  solo_activos?: boolean;
}
