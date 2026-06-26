// src/features/auth/services/auth.service.ts
import api from '../../../core/api/api';
import { apiSelection } from '../../../core/api/axios-instances';
import {
  LoginCredentials,
  LoginResponse,
  LoginEmpresaSelectionResponse,
  PasswordChangeRequest,
  Token,
  UserData,
  isLoginEmpresaSelectionResponse,
} from '../types/auth.types';
import { AxiosError, AxiosRequestConfig } from 'axios';
import {
  logAuthContext,
  logAuthError,
  logAuthResponse,
  logRefreshResult,
} from '@/core/auth/utils/auth-debug';
import { logAuthSessionDiag, runLegacySessionDevLog } from '@/core/auth/utils/auth-session-log';
import { isSessionTelemetryEffective } from '@/core/auth/session/session-telemetry.flags';
import { normalizeEmpresasElegibles } from '@/core/auth/utils/empresa-eligibles';

interface RefreshRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const WEB_HEADERS = {
  'X-Client-Type': 'web',
} as const;

/** Solo headers que el backend ya expone en Access-Control-Allow-Headers (evita fallo preflight CORS). */
function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return { ...WEB_HEADERS, ...extra };
}

/** Coerce API boolean (true, 1, "true") — evita perder es_admin_cliente por tipos raros. */
function toApiBoolean(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    return s === 'true' || s === '1';
  }
  return false;
}

function normalizeEmpresaActiva(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

function normalizeSessionId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

function normalizeCurrentTokenId(value: unknown): string | null {
  return normalizeSessionId(value);
}

function normalizeUserData(raw: UserData & Record<string, unknown>): UserData {
  const usuario_id =
    raw.usuario_id ?? (raw as Record<string, unknown>).user_id ?? (raw as Record<string, unknown>).id;
  const cliente_id =
    raw.cliente_id ?? (raw as Record<string, unknown>).client_id ?? (raw as Record<string, unknown>).tenant_id;
  const record = raw as Record<string, unknown>;

  return {
    ...raw,
    usuario_id: String(usuario_id ?? ''),
    cliente_id: String(cliente_id ?? raw.cliente_id ?? ''),
    access_level: raw.access_level ?? 0,
    is_super_admin: raw.is_super_admin ?? false,
    user_type: raw.user_type ?? 'user',
    cliente: raw.cliente ?? null,
    empresa_activa: normalizeEmpresaActiva(raw.empresa_activa ?? record.empresa_activa),
    empresas_disponibles: normalizeEmpresasElegibles(
      raw.empresas_disponibles ?? record.empresas_disponibles,
    ),
    es_admin_cliente: toApiBoolean(raw.es_admin_cliente ?? record.es_admin_cliente),
    requires_password_change: toApiBoolean(
      raw.requires_password_change ?? record.requires_password_change,
    ),
    current_session_id: normalizeSessionId(
      raw.current_session_id ?? record.current_session_id,
    ),
    current_token_id: normalizeCurrentTokenId(
      raw.current_token_id ?? record.current_token_id,
    ),
  };
}

/** POST /auth/password/change/ — Bearer access_token o selection_token (Schema A). */
const changePassword = async (
  payload: PasswordChangeRequest,
  accessToken: string,
): Promise<Token> => {
  const { data } = await api.post<Token>('/auth/password/change/', payload, {
    headers: {
      ...WEB_HEADERS,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return {
    access_token: data.access_token,
    token_type: data.token_type ?? 'bearer',
    user_data: data.user_data
      ? normalizeUserData(data.user_data as UserData & Record<string, unknown>)
      : null,
  };
};

/**
 * Login — respuesta A (Token) o B (LoginEmpresaSelectionResponse).
 */
const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  logAuthContext('login BEFORE', { hasCredentials: true });

  const params = new URLSearchParams();
  params.append('username', credentials.username);
  params.append('password', credentials.password);

  try {
    const response = await api.post<LoginResponse>('/auth/login/', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...WEB_HEADERS,
      },
    });
    logAuthResponse('login', response);
    const { data } = response;

    if (isLoginEmpresaSelectionResponse(data)) {
      const selection = data as LoginEmpresaSelectionResponse;
      return {
        requiere_seleccion_empresa: selection.requiere_seleccion_empresa ?? true,
        empresas_disponibles: selection.empresas_disponibles ?? [],
        selection_token: selection.selection_token,
        token_type: selection.token_type ?? 'bearer',
        user_data: selection.user_data
          ? normalizeUserData(selection.user_data as UserData & Record<string, unknown>)
          : null,
      };
    }

    const token = data as Token;
    return {
      access_token: token.access_token,
      token_type: token.token_type ?? 'bearer',
      user_data: token.user_data
        ? normalizeUserData(token.user_data as UserData & Record<string, unknown>)
        : null,
    };
  } catch (error) {
    logAuthError('login', error);
    throw error;
  }
};

const getCurrentUserProfile = async (): Promise<UserData | null> => {
  try {
    const response = await api.get<UserData>('/auth/me/');
    if (!isSessionTelemetryEffective() && import.meta.env.DEV) {
      console.log('[/auth/me] response received');
    }
    return normalizeUserData(response.data as UserData & Record<string, unknown>);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error fetching user profile:', axiosError.response?.data || axiosError.message);
    throw error;
  }
};

const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout/', {}, { headers: authHeaders() });
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Logout error:', axiosError.response?.data || axiosError.message);
  }
};

const refreshToken = async (): Promise<string> => {
  logAuthContext('refresh BEFORE');

  try {
    const response = await api.post<{ access_token: string }>(
      '/auth/refresh/',
      {},
      {
        headers: authHeaders(),
        _retry: true,
      } as RefreshRequestConfig,
    );
    logAuthResponse('refresh', response);
    const token = response.data.access_token;
    logRefreshResult('ok', { refreshOk: true });
    return token;
  } catch (error) {
    const axiosError = error as AxiosError;
    logAuthError('refresh', error);
    logRefreshResult('fail', {
      status: axiosError.response?.status,
      message: axiosError.message,
    });
    throw error;
  }
};

/** POST /auth/empresa/seleccionar/ — Bearer selection_token (sin interceptores ERP). */
const seleccionarEmpresa = async (
  empresaId: string,
  selectionToken: string,
): Promise<Token> => {
  const { data } = await apiSelection.post<Token>(
    '/auth/empresa/seleccionar/',
    { empresa_id: empresaId },
    {
      headers: {
        ...WEB_HEADERS,
        Authorization: `Bearer ${selectionToken}`,
      },
    },
  );
  return {
    access_token: data.access_token,
    token_type: data.token_type ?? 'bearer',
    user_data: data.user_data
      ? normalizeUserData(data.user_data as UserData & Record<string, unknown>)
      : null,
  };
};

/** POST /auth/impersonate/{cliente_id}/ — misma forma que login (Schema A o B). Sin refresh. */
const startImpersonation = async (
  clienteId: string,
  accessToken: string,
): Promise<LoginResponse> => {
  const url = `/auth/impersonate/${encodeURIComponent(clienteId)}/`;
  const bearer = `Bearer ${accessToken}`;

  logAuthSessionDiag('IMPERSONATE-FE request', {
    hasAccessToken: Boolean(accessToken?.trim()),
    url,
  });

  runLegacySessionDevLog(() => {
    console.log('[IMPERSONATE-FE] Authorization header configured');
  });

  const requestConfig = {
    headers: {
      ...WEB_HEADERS,
      Authorization: bearer,
    },
  };

  const { data } = await api.post<LoginResponse>(url, {}, requestConfig);

  if (isLoginEmpresaSelectionResponse(data)) {
    const selection = data as LoginEmpresaSelectionResponse;
    return {
      requiere_seleccion_empresa: selection.requiere_seleccion_empresa ?? true,
      empresas_disponibles: selection.empresas_disponibles ?? [],
      selection_token: selection.selection_token,
      token_type: selection.token_type ?? 'bearer',
      user_data: selection.user_data
        ? normalizeUserData(selection.user_data as UserData & Record<string, unknown>)
        : null,
    };
  }

  const token = data as Token;
  return {
    access_token: token.access_token,
    token_type: token.token_type ?? 'bearer',
    user_data: token.user_data
      ? normalizeUserData(token.user_data as UserData & Record<string, unknown>)
      : null,
  };
};

/** POST /auth/impersonate/end/ — Bearer token impersonado. */
const endImpersonation = async (accessToken: string): Promise<void> => {
  const url = '/auth/impersonate/end/';
  const bearer = `Bearer ${accessToken}`;

  logAuthSessionDiag('IMPERSONATE-FE end', {
    hasAccessToken: Boolean(accessToken?.trim()),
    url,
  });

  runLegacySessionDevLog(() => {
    console.log('[IMPERSONATE-FE] end request prepared');
  });

  try {
    await api.post(url, {}, { headers: { ...WEB_HEADERS, Authorization: bearer } });
  } catch (error) {
    const axiosError = error as AxiosError;
    if (import.meta.env.DEV) {
      console.warn('[endImpersonation]', axiosError.response?.status, axiosError.message);
    }
    throw error;
  }
};

/** POST /auth/empresa/cambiar/ — sesión completa. */
const cambiarEmpresa = async (empresaId: string, refreshTokenBody?: string): Promise<Token> => {
  const body: { empresa_id: string; refresh_token?: string } = { empresa_id: empresaId };
  if (refreshTokenBody) {
    body.refresh_token = refreshTokenBody;
  }
  const { data } = await api.post<Token>('/auth/empresa/cambiar/', body, {
    headers: WEB_HEADERS,
  });
  return {
    access_token: data.access_token,
    token_type: data.token_type ?? 'bearer',
    user_data: data.user_data
      ? normalizeUserData(data.user_data as UserData & Record<string, unknown>)
      : null,
  };
};

export const authService = {
  login,
  me: getCurrentUserProfile,
  getCurrentUserProfile,
  logout,
  refreshToken,
  seleccionarEmpresa,
  cambiarEmpresa,
  startImpersonation,
  endImpersonation,
  changePassword,
};
