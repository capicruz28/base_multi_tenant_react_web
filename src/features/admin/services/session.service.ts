import api from '@/core/api/api';
import { AxiosError } from 'axios';
import type {
  AdminSessionRead,
  GetAdminSessionsParams,
  LogoutAllSessionsResponse,
  PaginatedAdminSessionsResponse,
} from '@/features/admin/types/session.types';

/**
 * Listado admin — siempre envía `page` (modo paginado opt-in).
 * El normalizador tolera respuesta legacy array.
 */
export const getAdminSessions = async (
  params: GetAdminSessionsParams,
): Promise<AdminSessionRead[] | PaginatedAdminSessionsResponse> => {
  try {
    const { page, limit, search, sort_by, sort_order, client_type, usuario_id } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    if (search) {
      queryParams.append('search', search);
    }
    if (sort_by) {
      queryParams.append('sort_by', sort_by);
    }
    if (sort_order) {
      queryParams.append('sort_order', sort_order);
    }
    if (client_type) {
      queryParams.append('client_type', client_type);
    }
    if (usuario_id) {
      queryParams.append('usuario_id', usuario_id);
    }
    const { data } = await api.get<AdminSessionRead[] | PaginatedAdminSessionsResponse>(
      '/auth/sessions/admin/',
      { params: queryParams },
    );
    return data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    console.error(
      'Error fetching admin sessions:',
      axiosError.response?.data || axiosError.message,
    );
    throw error;
  }
};

export const revokeSessionById = async (tokenId: string): Promise<void> => {
  try {
    await api.post(`/auth/sessions/${tokenId}/revoke_admin/`);
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    console.error(
      'Error revoking session:',
      axiosError.response?.data || axiosError.message,
    );
    throw error;
  }
};

/** Sesiones del usuario autenticado (self-service — fuera de pantalla admin). */
export const getCurrentUserSessions = async (): Promise<AdminSessionRead[]> => {
  try {
    const { data } = await api.get<AdminSessionRead[]>('/auth/sessions/');
    return data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    console.error(
      'Error fetching user sessions:',
      axiosError.response?.data || axiosError.message,
    );
    throw error;
  }
};

export const logoutAllSessions = async (): Promise<void> => {
  try {
    await api.post<LogoutAllSessionsResponse>('/auth/logout_all/');
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    console.error(
      'Error logging out all sessions:',
      axiosError.response?.data || axiosError.message,
    );
    throw error;
  }
};

