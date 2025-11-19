/**
 * Tipos para la gestión de clientes (Super Admin)
 */

export interface Cliente {
  cliente_id: number;
  codigo_cliente: string;
  subdominio: string;
  razon_social: string;
  nombre_comercial: string | null;
  ruc: string | null;
  tipo_instalacion: 'cloud' | 'onpremise' | 'hybrid';
  modo_autenticacion: 'local' | 'sso' | 'hybrid';
  plan_suscripcion: 'trial' | 'basico' | 'profesional' | 'enterprise';
  estado_suscripcion: 'trial' | 'activo' | 'suspendido' | 'cancelado' | 'moroso';
  contacto_nombre: string | null;
  contacto_email: string;
  contacto_telefono: string | null;
  es_activo: boolean;
  es_demo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string | null;
  fecha_ultimo_acceso: string | null;
  metadata_json?: Record<string, any>;
}

export interface ClienteCreate {
  codigo_cliente: string;
  subdominio: string;
  razon_social: string;
  nombre_comercial?: string | null;
  ruc?: string | null;
  tipo_instalacion: 'cloud' | 'onpremise' | 'hybrid';
  modo_autenticacion: 'local' | 'sso' | 'hybrid';
  plan_suscripcion: 'trial' | 'basico' | 'profesional' | 'enterprise';
  estado_suscripcion: 'trial' | 'activo' | 'suspendido' | 'cancelado' | 'moroso';
  contacto_nombre?: string | null;
  contacto_email: string;
  contacto_telefono?: string | null;
  es_demo?: boolean;
}

export interface ClienteUpdate {
  codigo_cliente?: string;
  subdominio?: string;
  razon_social?: string;
  nombre_comercial?: string | null;
  ruc?: string | null;
  tipo_instalacion?: 'cloud' | 'onpremise' | 'hybrid';
  modo_autenticacion?: 'local' | 'sso' | 'hybrid';
  plan_suscripcion?: 'trial' | 'basico' | 'profesional' | 'enterprise';
  estado_suscripcion?: 'trial' | 'activo' | 'suspendido' | 'cancelado' | 'moroso';
  contacto_nombre?: string | null;
  contacto_email?: string;
  contacto_telefono?: string | null;
  es_activo?: boolean;
  es_demo?: boolean;
}

export interface ClienteStats {
  total_usuarios: number;
  usuarios_activos: number;
  total_modulos: number;
  modulos_activos: number;
  conexiones_activas: number;
  ultimo_acceso: string | null;
  fecha_creacion: string;
}

export interface ClienteListResponse {
  clientes: Cliente[];
  pagina_actual: number;
  total_paginas: number;
  total_clientes: number;
  limite: number;
}

export interface ClienteFilters {
  plan_suscripcion?: string;
  estado_suscripcion?: string;
  tipo_instalacion?: string;
  es_activo?: boolean;
  search?: string;
}