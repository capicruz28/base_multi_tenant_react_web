/**
 * Tipos para la gestión de clientes (Super Admin)
 * Alineados con los schemas del backend (app.schemas.cliente)
 */

export interface Cliente {
  cliente_id: number;
  codigo_cliente: string;
  subdominio: string;
  razon_social: string;
  nombre_comercial: string | null;
  ruc: string | null;
  tipo_instalacion: 'cloud' | 'onpremise' | 'hybrid';
  servidor_api_local: string | null;
  modo_autenticacion: 'local' | 'sso' | 'hybrid';
  logo_url: string | null;
  favicon_url: string | null;
  color_primario: string;
  color_secundario: string;
  tema_personalizado: string | null;
  plan_suscripcion: 'trial' | 'basico' | 'profesional' | 'enterprise';
  estado_suscripcion: 'trial' | 'activo' | 'suspendido' | 'cancelado' | 'moroso';
  fecha_inicio_suscripcion: string | null;
  fecha_fin_trial: string | null;
  contacto_nombre: string | null;
  contacto_email: string;
  contacto_telefono: string | null;
  es_activo: boolean;
  es_demo: boolean;
  metadata_json: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string | null;
  fecha_ultimo_acceso: string | null;
}

export interface ClienteCreate {
  codigo_cliente: string;
  subdominio: string;
  razon_social: string;
  nombre_comercial?: string | null;
  ruc?: string | null;
  tipo_instalacion: 'cloud' | 'onpremise' | 'hybrid';
  servidor_api_local?: string | null;
  modo_autenticacion: 'local' | 'sso' | 'hybrid';
  logo_url?: string | null;
  favicon_url?: string | null;
  color_primario?: string;
  color_secundario?: string;
  tema_personalizado?: string | null;
  plan_suscripcion: 'trial' | 'basico' | 'profesional' | 'enterprise';
  estado_suscripcion: 'trial' | 'activo' | 'suspendido' | 'cancelado' | 'moroso';
  fecha_inicio_suscripcion?: string | null;
  fecha_fin_trial?: string | null;
  contacto_nombre?: string | null;
  contacto_email: string;
  contacto_telefono?: string | null;
  es_demo?: boolean;
  metadata_json?: string | null;
}

export interface ClienteUpdate {
  codigo_cliente?: string;
  subdominio?: string;
  razon_social?: string;
  nombre_comercial?: string | null;
  ruc?: string | null;
  tipo_instalacion?: 'cloud' | 'onpremise' | 'hybrid';
  servidor_api_local?: string | null;
  modo_autenticacion?: 'local' | 'sso' | 'hybrid';
  logo_url?: string | null;
  favicon_url?: string | null;
  color_primario?: string;
  color_secundario?: string;
  tema_personalizado?: string | null;
  plan_suscripcion?: 'trial' | 'basico' | 'profesional' | 'enterprise';
  estado_suscripcion?: 'trial' | 'activo' | 'suspendido' | 'cancelado' | 'moroso';
  fecha_inicio_suscripcion?: string | null;
  fecha_fin_trial?: string | null;
  contacto_nombre?: string | null;
  contacto_email?: string;
  contacto_telefono?: string | null;
  es_activo?: boolean;
  es_demo?: boolean;
  metadata_json?: string | null;
}

export interface ClienteStats {
  cliente_id: number;
  razon_social: string;
  total_usuarios: number;
  total_usuarios_inactivos: number;
  modulos_activos: number;
  modulos_contratados: number;
  ultimo_acceso: string | null;
  estado_suscripcion: string;
  plan_actual: string;
  fecha_creacion: string;
  dias_activo: number;
  conexiones_bd: number;
  tipo_instalacion: string;
}

export interface ClienteListResponse {
  clientes: Cliente[];
  total_clientes: number;
  pagina_actual: number;
  total_paginas: number;
  items_por_pagina: number;
}

export interface ClienteFilters {
  plan_suscripcion?: string;
  estado_suscripcion?: string;
  tipo_instalacion?: string;
  es_activo?: boolean;
  buscar?: string;
}

export interface ClienteResponse {
  success: boolean;
  message: string;
  data?: Cliente;
}

export interface SubdomainValidationResponse {
  disponible: boolean;
  mensaje?: string;
}