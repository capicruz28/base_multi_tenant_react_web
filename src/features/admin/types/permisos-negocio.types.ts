/**
 * Tipos para permisos de negocio (RBAC) según DOC_FRONTEND_ADMIN_PERMISOS_RBAC.md.
 * Catálogo de permisos y asignación rol ↔ permisos (rol_permiso).
 */

/** Un ítem del catálogo de permisos (GET /api/v1/permisos-catalogo/) */
export interface PermisoCatalogoItem {
  permiso_id: string;
  codigo: string;
  nombre: string | null;
  descripcion: string | null;
  recurso: string | null;
  accion: string | null;
  modulo_id: string | null;
  es_activo: boolean;
}

/** Permiso asignado a un rol (dentro de la respuesta GET permisos-negocio) */
export interface PermisoAsignadoItem {
  permiso_id: string;
  codigo: string;
  nombre: string | null;
}

/** Respuesta de GET /api/v1/roles/{rol_id}/permisos-negocio/ (objeto con lista) */
export interface RolPermisosNegocioResponse {
  rol_id: string;
  permisos: PermisoAsignadoItem[];
}

/**
 * El backend puede devolver directamente un array de permisos asignados al rol
 * (cada ítem con permiso_id, codigo, nombre y opcionalmente más campos).
 */
export type RolPermisosNegocioResponseArray = (PermisoAsignadoItem | PermisoCatalogoItem)[];

/** Body de PUT /api/v1/roles/{rol_id}/permisos-negocio/ */
export interface PutPermisosNegocioPayload {
  permiso_ids: string[];
}
