/**
 * Tipos para activación de módulos por cliente
 * Alineados con la refactorización del backend
 */

// ============================================
// TIPOS BASE - CLIENTE MÓDULO
// ============================================

export interface ClienteModulo {
  cliente_modulo_id: string; // UUID format
  cliente_id: string; // UUID format
  modulo_id: string; // UUID format
  esta_activo: boolean;
  fecha_activacion: string;
  fecha_vencimiento?: string | null;
  configuracion_json?: Record<string, any> | null;
  limite_usuarios?: number | null;
  limite_registros?: number | null;
  limite_transacciones_mes?: number | null; // Campo adicional del backend
  modo_prueba?: boolean; // Campo adicional del backend
  fecha_fin_prueba?: string | null; // Campo adicional del backend
  activado_por_usuario_id?: string | null; // Campo adicional del backend
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
  // Campos adicionales que vienen del join con módulo
  modulo_nombre?: string;
  modulo_codigo?: string;
}

export interface ClienteModuloCreate {
  cliente_id: string; // UUID format
  modulo_id: string; // UUID format
  configuracion_json?: Record<string, any> | null;
  limite_usuarios?: number | null;
  limite_registros?: number | null;
  fecha_vencimiento?: string | null;
}

export interface ClienteModuloUpdate {
  esta_activo?: boolean;
  configuracion_json?: Record<string, any> | null;
  limite_usuarios?: number | null;
  limite_registros?: number | null;
  fecha_vencimiento?: string | null;
}

// ============================================
// TIPOS PARA MÓDULOS CON INFORMACIÓN DE ACTIVACIÓN
// ============================================

export interface ModuloConActivacion extends ClienteModulo {
  // Información del módulo (join)
  modulo_codigo?: string;
  modulo_nombre?: string;
  modulo_icono?: string;
  modulo_color?: string;
  modulo_categoria?: string;
}

// ============================================
// TIPOS PARA FILTROS Y PAGINACIÓN
// ============================================

export interface ClienteModuloFilters {
  cliente_id?: string;
  modulo_id?: string;
  esta_activo?: boolean;
  skip?: number;
  limit?: number;
}

export interface PaginatedClienteModuloResponse {
  items: ClienteModulo[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ============================================
// TIPOS PARA RESPUESTAS DE API
// ============================================

export interface ClienteModuloResponse {
  cliente_modulo_id: string;
  cliente_id: string;
  modulo_id: string;
  esta_activo: boolean;
  fecha_activacion: string;
  fecha_vencimiento?: string | null;
  configuracion_json?: Record<string, any> | null;
  limite_usuarios?: number | null;
  limite_registros?: number | null;
  limite_transacciones_mes?: number | null;
  modo_prueba?: boolean;
  fecha_fin_prueba?: string | null;
  activado_por_usuario_id?: string | null;
  fecha_creacion: string;
  fecha_actualizacion?: string | null;
  modulo_nombre?: string;
  modulo_codigo?: string;
}

// ✅ Tipo para la respuesta del endpoint GET /cliente-modulo/cliente/{cliente_id}/
export interface ClienteModuloListResponse {
  success: boolean;
  message: string;
  data: ClienteModulo[];
}

