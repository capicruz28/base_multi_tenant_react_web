/**
 * Tipos para la gestión de módulos (Super Admin)
 */

export interface Modulo {
  modulo_id: number;
  codigo_modulo: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  es_modulo_core: boolean;
  requiere_licencia: boolean;
  orden: number;
  es_activo: boolean;
  fecha_creacion: string;
}

export interface ModuloCreate {
  codigo_modulo: string;
  nombre: string;
  descripcion?: string | null;
  icono?: string | null;
  es_modulo_core: boolean;
  requiere_licencia: boolean;
  orden?: number;
}

export interface ModuloUpdate {
  codigo_modulo?: string;
  nombre?: string;
  descripcion?: string | null;
  icono?: string | null;
  es_modulo_core?: boolean;
  requiere_licencia?: boolean;
  orden?: number;
  es_activo?: boolean;
}

export interface ModuloAsignado {
  cliente_modulo_activo_id: number;
  cliente_id: number;
  modulo_id: number;
  esta_activo: boolean;
  fecha_activacion: string;
  fecha_vencimiento: string | null;
  configuracion_json: Record<string, any> | null;
  limite_usuarios: number | null;
  limite_registros: number | null;
  modulo: Modulo;
}

export interface ModuloConfig {
  [key: string]: any;
}

export interface ModuloListResponse {
  modulos: Modulo[];
  pagina_actual: number;
  total_paginas: number;
  total_modulos: number;
  limite: number;
}