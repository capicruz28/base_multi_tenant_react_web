import api from '@/core/api/api';
import {
    PaginatedUsersResponse,
    UserFormData,
    UserWithRoles,
    UserUpdateData
} from '../types/usuario.types';

const BASE_URL = '/usuarios';

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  solo_activos?: boolean;
  solo_inactivos?: boolean;
}

export const getUsers = async (params: GetUsersParams = {}): Promise<PaginatedUsersResponse> => {
  try {
    const { page = 1, limit = 10, search, solo_activos, solo_inactivos } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    if (search) {
      queryParams.append('search', search);
    }
    if (solo_activos === true) {
      queryParams.append('solo_activos', 'true');
    } else if (solo_activos === false) {
      queryParams.append('solo_activos', 'false');
    }
    if (solo_inactivos === true) {
      queryParams.append('solo_inactivos', 'true');
    } else if (solo_inactivos === false) {
      queryParams.append('solo_inactivos', 'false');
    }
    const response = await api.get<PaginatedUsersResponse>(`${BASE_URL}/`, {
      params: queryParams,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<UserWithRoles> => {
    try {
        // ✅ CAMBIO: Agregar / al final
        const response = await api.get<UserWithRoles>(`${BASE_URL}/${userId}/`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        throw error;
    }
};

export const createUser = async (userData: UserFormData): Promise<UserWithRoles> => {
    try {
        // ✅ Ya tiene / al final - OK
        const response = await api.post<UserWithRoles>(`${BASE_URL}/`, userData);
        return response.data;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

export const updateUser = async (userId: string, userData: UserUpdateData): Promise<UserWithRoles> => {
    try {
        // ✅ CAMBIO: Agregar / al final
        const response = await api.put<UserWithRoles>(`${BASE_URL}/${userId}/`, userData);
        return response.data;
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        throw error;
    }
};

export const deleteUser = async (userId: string): Promise<{ message: string; usuario_id: string }> => {
    try {
        const response = await api.delete<{ message: string; usuario_id: string }>(`${BASE_URL}/${userId}/`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        throw error;
    }
};

/** Desactivar (IAM-BE-02): PUT con es_activo=false — no modifica es_eliminado. */
export const deactivateUser = async (userId: string): Promise<UserWithRoles> => {
    try {
        const response = await api.put<UserWithRoles>(`${BASE_URL}/${userId}/`, { es_activo: false });
        return response.data;
    } catch (error) {
        console.error(`Error deactivating user ${userId}:`, error);
        throw error;
    }
};

export const reactivateUser = async (userId: string): Promise<UserWithRoles> => {
    try {
        const response = await api.post<UserWithRoles>(`${BASE_URL}/${userId}/reactivate/`);
        return response.data;
    } catch (error) {
        console.error(`Error reactivating user ${userId}:`, error);
        throw error;
    }
};

export const assignRoleToUser = async (userId: string, roleId: string): Promise<any> => {
    try {
        // ✅ CAMBIO: Agregar / al final
        const response = await api.post(`${BASE_URL}/${userId}/roles/${roleId}/`);
        return response.data;
    } catch (error) {
        console.error(`Error assigning role ${roleId} to user ${userId}:`, error);
        throw error;
    }
};

export const revokeRoleFromUser = async (userId: string, roleId: string): Promise<any> => {
    try {
        // ✅ CAMBIO: Agregar / al final
        const response = await api.delete(`${BASE_URL}/${userId}/roles/${roleId}/`);
        return response.data;
    } catch (error) {
        console.error(`Error revoking role ${roleId} from user ${userId}:`, error);
        throw error;
    }
};