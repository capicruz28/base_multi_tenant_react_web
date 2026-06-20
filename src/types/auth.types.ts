// src/types/auth.types.ts
import { AxiosError } from 'axios';

export interface LoginCredentials {
  username: string;
  password: string;
}

// ✅ NUEVO: Interfaz para información del cliente
// Alineado con ClienteInfo del backend
export interface ClienteInfo {
  cliente_id: string; // UUID format
  razon_social: string;
  subdominio: string;
  codigo_cliente?: string | null;
  nombre_comercial?: string | null;
  tipo_instalacion: string;
  servidor_api_local?: string | null; // URL del API local (solo para onpremise/hybrid)
  estado_suscripcion: string;
}

export interface UserData {
  usuario_id: string; // UUID format
  cliente_id: string; // UUID format - REQUERIDO
  nombre_usuario: string;
  correo: string;
  nombre: string;
  apellido: string;
  es_activo: boolean;
  roles: string[];
  // ✅ NUEVO: Campos para niveles de acceso
  access_level?: number;
  is_super_admin?: boolean;
  user_type?: string;
  cliente?: ClienteInfo | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_data: UserData;
}

export interface AuthState {
  user: UserData | null;
  token: string | null;
}

// ✅ Interfaz para errores de API
export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  status?: number;
}

// ⚠️ CAMBIO AQUÍ: ApiError ahora representa el error simplificado
export interface SimplifiedApiError {
  message: string;
  status: number;
}

// ✅ Tipo para errores de Axios con respuesta tipada
export type ApiError = AxiosError<ApiErrorResponse>;
export type ApiSimpleError = AxiosError<SimplifiedApiError>;

// ============================================================================
// Gestión de sesiones activas — tipo canónico en admin/types/session.types.ts
// ============================================================================

export type {
  AdminSessionRead as ActiveSession,
  RevokeSessionResponse,
  LogoutAllSessionsResponse,
} from '@/features/admin/types/session.types';

// ============================================================================
// ✅ NUEVO: TIPOS PARA NIVELES DE ACCESO Y AUTORIZACIÓN
// ============================================================================

/**
 * Tipos de usuario en el sistema multi-tenant
 */
export type UserType = 'super_admin' | 'tenant_admin' | 'user';

/**
 * Niveles de acceso disponibles en el sistema
 */
export enum AccessLevel {
  USER = 1,
  SUPERVISOR = 3,
  TENANT_ADMIN = 4,
  SUPER_ADMIN = 5
}

/**
 * Información de contexto de autenticación extendida
 */
export interface AuthContextType {
  auth: AuthState;
  setAuthFromLogin: (response: AuthResponse) => UserData | null;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  hasRole: (...roles: string[]) => boolean;
  // ✅ NUEVO: Campos para niveles de acceso
  accessLevel: number;
  isSuperAdmin: boolean;
  userType: UserType;
  clienteInfo: ClienteInfo | null; // Alineado con ClienteInfo del backend
}

/**
 * Respuesta extendida de login con información de niveles
 */
export interface ExtendedAuthResponse extends AuthResponse {
  user_data: UserData & {
    access_level: number;
    is_super_admin: boolean;
    user_type: UserType;
    cliente: ClienteInfo | null;
  };
}

/**
 * Helper para determinar capacidades de usuario
 */
export interface UserCapabilities {
  canAccessSuperAdmin: boolean;
  canAccessTenantAdmin: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageClient: boolean;
}

/**
 * Configuración de permisos por nivel de acceso
 */
export interface AccessLevelConfig {
  level: AccessLevel;
  name: string;
  description: string;
  permissions: string[];
}