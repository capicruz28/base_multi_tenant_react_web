// src/types/rol.types.ts

/**
 * Representa la estructura de un Rol leída desde el backend.
 * Corresponde a RolRead en FastAPI.
 */
export interface Rol {
    rol_id: string; // UUID format
    cliente_id: string | null; // UUID format - NULL para roles de sistema globales
    codigo_rol: string | null; // Código único en MAYÚSCULAS para roles predefinidos (ej: 'SUPER_ADMIN', 'ADMIN')
    nombre: string;
    descripcion?: string | null; // Puede ser null o undefined si no se proporciona
    es_activo: boolean;
    fecha_creacion: string; // O Date si se transforma
    // fecha_actualizacion?: string | null; // Añadir si se incluye en el backend
  }
  
  /**
   * Datos necesarios para crear un nuevo Rol.
   * Corresponde a RolCreate en FastAPI.
   */
  export interface RolCreateData {
    cliente_id?: string | null; // UUID format - NULL para roles de sistema globales
    codigo_rol?: string | null; // Código único en MAYÚSCULAS para roles predefinidos
    nombre: string;
    descripcion?: string | null;
    es_activo?: boolean; // Opcional, el backend puede tener un default
  }
  
  /**
   * Datos permitidos para actualizar un Rol.
   * Corresponde a RolUpdate en FastAPI.
   * Todos los campos son opcionales en la actualización.
   */
  export interface RolUpdateData {
    nombre?: string;
    descripcion?: string | null;
    es_activo?: boolean;
    codigo_rol?: string | null; // Solo actualizable por SUPER_ADMIN en roles de sistema
  }
  
  /**
   * Representa la respuesta paginada de la API de roles.
   * Corresponde a PaginatedRolResponse en FastAPI.
   */
  export interface PaginatedRolResponse {
    roles: Rol[];
    total_roles: number;
    pagina_actual: number;
    total_paginas: number;
  }
  
  // Puedes añadir más tipos relacionados si son necesarios, por ejemplo, para permisos.