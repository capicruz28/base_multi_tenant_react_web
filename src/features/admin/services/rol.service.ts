import apiClient from '@/core/api/api';
import { getErrorMessage } from '@/core/services/error.service';
import {
  PaginatedRolResponse,
  Rol,
  RolCreateData,
  RolUpdateData
} from '../types/rol.types';

const API_URL = '/roles'; // Ruta base para los endpoints de roles en la API

/**
 * Obtiene TODOS los roles activos (sin paginación).
 * Ideal para listas desplegables.
 * @returns Promise<Rol[]> Lista de roles activos.
 */
export const getAllActiveRoles = async (): Promise<Rol[]> => {
  try {
    // ✅ CAMBIO: Agregar / al final
    const response = await apiClient.get<Rol[]>(`${API_URL}/all-active/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching all active roles:", error);
    throw getErrorMessage(error);
  }
};

export interface GetRolesParams {
  page?: number;
  limit?: number;
  search?: string;
  solo_activos?: boolean;
  solo_inactivos?: boolean;
}

/**
 * Obtiene una lista paginada de roles desde el backend.
 */
export const getRoles = async (params: GetRolesParams = {}): Promise<PaginatedRolResponse> => {
  try {
    const { page = 1, limit = 10, search, solo_activos, solo_inactivos } = params;
    const queryParams: Record<string, string | number | boolean> = { page, limit };
    if (search) {
      queryParams.search = search;
    }
    if (solo_activos === true) {
      queryParams.solo_activos = true;
    } else if (solo_activos === false) {
      queryParams.solo_activos = false;
    }
    if (solo_inactivos === true) {
      queryParams.solo_inactivos = true;
    }
    const response = await apiClient.get<PaginatedRolResponse>(`${API_URL}/`, {
      params: queryParams,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw getErrorMessage(error);
  }
};

/**
 * Crea un nuevo rol.
 * @param rolData Datos del rol a crear.
 * @returns Promise<Rol> El rol creado.
 */
export const createRol = async (rolData: RolCreateData): Promise<Rol> => {
  try {
    // ✅ CAMBIO: Agregar / al final
    const response = await apiClient.post<Rol>(`${API_URL}/`, rolData);
    return response.data;
  } catch (error) {
    console.error("Error creating rol:", error);
    throw getErrorMessage(error);
  }
};

/**
 * Actualiza un rol existente.
 * @param rolId ID del rol a actualizar.
 * @param rolData Datos del rol a actualizar.
 * @returns Promise<Rol> El rol actualizado.
 */
export const updateRol = async (rolId: string, rolData: RolUpdateData): Promise<Rol> => {
  try {
    // ✅ CAMBIO: Agregar / al final
    const response = await apiClient.put<Rol>(`${API_URL}/${rolId}/`, rolData);
    return response.data;
  } catch (error) {
    console.error(`Error updating rol ${rolId}:`, error);
    throw getErrorMessage(error);
  }
};

/**
 * Desactiva un rol (borrado lógico).
 * @param rolId ID del rol a desactivar.
 * @returns Promise<Rol> El rol desactivado.
 */
export const deactivateRol = async (rolId: string): Promise<Rol> => {
  try {
    // ✅ CAMBIO: Agregar / al final
    const response = await apiClient.delete<Rol>(`${API_URL}/${rolId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error deactivating rol ${rolId}:`, error);
    throw getErrorMessage(error);
  }
};

/**
 * Reactiva un rol inactivo.
 * @param rolId ID del rol a reactivar.
 * @returns Promise<Rol> El rol reactivado.
 */
export const reactivateRol = async (rolId: string): Promise<Rol> => {
  try {
    // ✅ CAMBIO: Agregar / al final
    const response = await apiClient.post<Rol>(`${API_URL}/${rolId}/reactivate/`);
    return response.data;
  } catch (error) {
    console.error(`Error reactivating rol ${rolId}:`, error);
    throw getErrorMessage(error);
  }
};