/**
 * Tipos para la gestión de conexiones (Super Admin)
 */

export interface Conexion {
  conexion_id: number;
  cliente_id: number;
  modulo_id: number;
  servidor: string;
  puerto: number;
  nombre_bd: string;
  usuario_encriptado: string;
  tipo_bd: 'sqlserver' | 'postgresql' | 'mysql' | 'oracle';
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
  modulo?: {
    modulo_id: number;
    nombre: string;
    codigo_modulo: string;
  };
}

export interface ConexionCreate {
  cliente_id: number;
  modulo_id: number;
  servidor: string;
  puerto: number;
  nombre_bd: string;
  usuario: string;
  contrasena: string;
  tipo_bd: 'sqlserver' | 'postgresql' | 'mysql' | 'oracle';
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
  contrasena?: string;
  tipo_bd?: 'sqlserver' | 'postgresql' | 'mysql' | 'oracle';
  usa_ssl?: boolean;
  timeout_segundos?: number;
  max_pool_size?: number;
  es_solo_lectura?: boolean;
  es_conexion_principal?: boolean;
  es_activo?: boolean;
}

export interface ConexionTestResult {
  exito: boolean;
  mensaje: string;
  tiempo_respuesta?: number;
  error?: string;
}

// ✅ ELIMINAR ConexionListResponse - Backend retorna array directo