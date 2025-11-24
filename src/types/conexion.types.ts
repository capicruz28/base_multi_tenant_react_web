/**
 * Tipos para la gestión de conexiones de base de datos (Super Admin)
 * Alineados 100% con los schemas del backend (app.schemas.conexion)
 */

export type TipoBD = 'sqlserver' | 'postgresql' | 'mysql' | 'oracle';

// ============================================
// TIPOS BASE - CONEXIONES
// ============================================

export interface Conexion {
  conexion_id: number;
  cliente_id: number;
  modulo_id: number;
  servidor: string;
  puerto: number;
  nombre_bd: string;
  usuario_encriptado: string;
  password_encriptado: string;
  connection_string_encriptado: string | null;
  tipo_bd: TipoBD;
  usa_ssl: boolean;
  timeout_segundos: number;
  max_pool_size: number;
  es_solo_lectura: boolean;
  es_conexion_principal: boolean;
  es_activo: boolean;
  ultima_conexion_exitosa: string | null;
  ultimo_error: string | null;
  fecha_ultimo_error: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string | null;
  creado_por_usuario_id: number | null;
}

export interface ConexionCreate {
  cliente_id: number;
  modulo_id: number;
  servidor: string;
  puerto: number;
  nombre_bd: string;
  usuario: string;
  password: string;
  tipo_bd: TipoBD;
  usa_ssl?: boolean;
  timeout_segundos?: number;
  max_pool_size?: number;
  es_solo_lectura?: boolean;
  es_conexion_principal?: boolean;
}

export interface ConexionUpdate {
  servidor?: string;
  puerto?: number;
  nombre_bd?: string;
  usuario?: string;
  password?: string;
  tipo_bd?: TipoBD;
  usa_ssl?: boolean;
  timeout_segundos?: number;
  max_pool_size?: number;
  es_solo_lectura?: boolean;
  es_conexion_principal?: boolean;
  es_activo?: boolean;
}

// ============================================
// TIPOS PARA TEST DE CONEXIÓN
// ============================================

export interface ConexionTest {
  servidor: string;
  puerto: number;
  nombre_bd: string;
  usuario: string;
  password: string;
  tipo_bd: TipoBD;
  usa_ssl?: boolean;
  timeout_segundos?: number;
}

export interface ConexionTestResult {
  success: boolean;
  message: string;
  response_time_ms?: number;
}

// ============================================
// TIPOS PARA ESTADÍSTICAS DE CONEXIONES
// ============================================

export interface ConexionConEstadisticas extends Conexion {
  total_conexiones: number;
  conexiones_activas: number;
  tiempo_promedio_respuesta: number | null;
  tasa_errores: number | null;
}
