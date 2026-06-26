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

/** Resultado de login/bootstrap con menú ya cargado (GET /auth/menu). */
export interface AuthLoginSession {
  user: UserData;
  menuModulos: import('@/core/auth/types/auth-menu.types').AuthMenuModulo[] | null;
}

export interface UserData {
  /** Perfil IAM — el normalizador tolera superset JSON V2 (campos adicionales vía spread). */
  usuario_id: string; // UUID format
  cliente_id: string; // UUID format - REQUERIDO
  nombre_usuario: string;
  correo: string;
  nombre: string;
  apellido: string;
  es_activo: boolean;
  roles: string[];
  access_level?: number;
  is_super_admin?: boolean;
  user_type?: string;
  cliente?: ClienteInfo | null;
  /** UUID empresa activa en sesión (GET /auth/me, login Schema B). */
  empresa_activa?: string | null;
  /** Empresas elegibles (usuario_rol) desde GET /auth/me o login Schema A. */
  empresas_disponibles?: EmpresaOption[] | null;
  es_admin_cliente?: boolean;
  /** Obligatorio cambiar contraseña antes de ERP (usuario local). */
  requires_password_change?: boolean;
  /** UUID canónico user_session de la sesión autenticada actual (GET /auth/me, IAM V2). */
  current_session_id?: string | null;
  /** UUID refresh_tokens vigente — fallback compat RC1 (GET /auth/me). */
  current_token_id?: string | null;
}

/** Body POST /auth/password/change/ (web: sin refresh_token en body). */
export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  refresh_token?: string | null;
}

/** Ruta pantalla cambio obligatorio (hermana de /login). */
export const APP_CHANGE_PASSWORD = '/change-password';

/** error_code HTTP 403 cuando el usuario debe cambiar contraseña antes de ERP. */
export const ERROR_CODE_PASSWORD_CHANGE_REQUIRED = 'PASSWORD_CHANGE_REQUIRED';

/** Sesión completa tras login o selección/cambio de empresa. */
export interface Token {
  access_token: string;
  token_type: string;
  user_data?: UserData | null;
}

/** Empresa en respuesta de login con selección pendiente (Schema A). */
export interface EmpresaDisponible {
  empresa_id: string;
  razon_social: string;
  nombre_comercial: string | null;
}

/** Respuesta cuando el usuario debe elegir empresa (POST login). */
export interface LoginEmpresaSelectionResponse {
  requiere_seleccion_empresa: boolean;
  empresas_disponibles: EmpresaDisponible[];
  selection_token: string;
  token_type?: string;
  user_data?: UserData | null;
}

export type LoginResponse = Token | LoginEmpresaSelectionResponse;

/** Schema A: selección pendiente (sin access_token). */
export function isLoginEmpresaSelectionResponse(
  data: LoginResponse,
): data is LoginEmpresaSelectionResponse {
  if (typeof data !== 'object' || data === null) return false;
  const record = data as unknown as Record<string, unknown>;
  if (
    typeof record.access_token === 'string' &&
    record.access_token.trim().length > 0
  ) {
    return false;
  }
  if (record.requiere_seleccion_empresa === true) return true;
  return (
    typeof record.selection_token === 'string' &&
    record.selection_token.trim().length > 0
  );
}

/** @deprecated Use Token — alias para compatibilidad. */
export interface AuthResponse extends Token {}

export interface EmpresaOption {
  empresa_id: string;
  razon_social: string;
  nombre_comercial?: string | null;
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
/** Valores de `user_type` desde GET /auth/me */
export type UserType = 'platform_admin' | 'tenant_admin' | 'user';

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
  setAuthFromLogin: (response: Token) => Promise<UserData | null>;
  completeEmpresaSelection: (empresaId: string) => Promise<UserData | null>;
  cambiarEmpresaActiva: (empresaId: string) => Promise<UserData | null>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  authInitialized: boolean;
  isBootstrapped: boolean;
  hasRole: (...roles: string[]) => boolean;
  accessLevel: number;
  isSuperAdmin: boolean;
  userType: UserType;
  clienteInfo: ClienteInfo | null;
  permissions: import('@/core/auth/types/permission.types').UserPermissions | null;
  menuModulos: import('@/core/auth/types/auth-menu.types').AuthMenuModulo[] | null;
  empresaActivaId: string | null;
  empresasElegibles: EmpresaOption[];
  /** @deprecated Alias de empresasElegibles */
  empresasDisponibles: EmpresaOption[];
  requiereSeleccionEmpresa: boolean;
  hasEmpresaActiva: boolean;
  canAccessErp: boolean;
  mustSelectEmpresa: boolean;
  reloadMenuAndPermissions: () => Promise<void>;
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
