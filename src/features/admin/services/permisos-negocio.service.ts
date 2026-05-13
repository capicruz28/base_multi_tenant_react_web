/**
 * Servicio de permisos de negocio (RBAC).
 * Endpoints según DOC_FRONTEND_ADMIN_PERMISOS_RBAC.md sección 5.2.
 */
import api from '@/core/api/api';
import type {
  PermisoCatalogoItem,
  RolPermisosNegocioResponse,
  RolPermisosNegocioResponseArray,
  PutPermisosNegocioPayload,
} from '../types/permisos-negocio.types';

const CATALOGO_URL = '/permisos-catalogo/';
const ROL_PERMISOS_NEGOCIO = (rolId: string) => `/roles/${rolId}/permisos-negocio/`;

/** Extrae array de una respuesta que puede ser array o objeto con data/results. */
function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as T[];
    if (Array.isArray(o.results)) return o.results as T[];
    if (Array.isArray(o.permisos)) return o.permisos as T[];
  }
  return [];
}

/**
 * Lista todos los permisos activos del catálogo (GET /api/v1/permisos-catalogo/).
 * Requiere admin.rol.leer. Soporta respuesta directa o envuelta en { data } / { results }.
 */
export const getPermisosCatalogo = async (): Promise<PermisoCatalogoItem[]> => {
  const response = await api.get<PermisoCatalogoItem[] | { data?: PermisoCatalogoItem[]; results?: PermisoCatalogoItem[] }>(CATALOGO_URL);
  return toArray<PermisoCatalogoItem>(response.data ?? []);
};

/**
 * Devuelve los permisos de negocio asignados al rol (GET /api/v1/roles/{rol_id}/permisos-negocio/).
 * Requiere admin.rol.leer. Soporta array directo o envuelto en { data } / { results } / { permisos }.
 */
export const getPermisosNegocioByRol = async (
  rolId: string
): Promise<RolPermisosNegocioResponseArray> => {
  const response = await api.get<
    RolPermisosNegocioResponseArray | RolPermisosNegocioResponse | { data?: unknown[]; results?: unknown[] }
  >(ROL_PERMISOS_NEGOCIO(rolId));
  return toArray<PermisoCatalogoItem>(response.data ?? []) as RolPermisosNegocioResponseArray;
};

/**
 * Reemplaza la asignación de permisos de negocio del rol (PUT /api/v1/roles/{rol_id}/permisos-negocio/).
 * Body: { permiso_ids: string[] }. Respuesta 204 No Content.
 * Requiere admin.rol.actualizar.
 */
export const updatePermisosNegocioByRol = async (
  rolId: string,
  payload: PutPermisosNegocioPayload
): Promise<void> => {
  await api.put<void>(ROL_PERMISOS_NEGOCIO(rolId), payload);
};

export const permisosNegocioService = {
  getPermisosCatalogo,
  getPermisosNegocioByRol,
  updatePermisosNegocioByRol,
};
