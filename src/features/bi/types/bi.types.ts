/**
 * Tipos del módulo BI (Reportes y Analytics).
 * Base: /api/v1/bi
 */

export type TipoReporte = 'sql' | 'olap' | 'dashboard';

export interface ReporteCreate {
  empresa_id: string;
  codigo_reporte: string;
  nombre: string;
  descripcion?: string;
  modulo_origen?: string;
  categoria?: string;
  tipo_reporte?: TipoReporte;
  query_sql?: string;
  configuracion_json?: string;
  es_publico?: boolean;
  creado_por_usuario_id?: string;
  es_activo?: boolean;
}

export interface ReporteUpdate {
  codigo_reporte?: string;
  nombre?: string;
  descripcion?: string;
  modulo_origen?: string;
  categoria?: string;
  tipo_reporte?: TipoReporte | string;
  query_sql?: string;
  configuracion_json?: string;
  es_publico?: boolean;
  es_activo?: boolean;
}

export interface ReporteRead {
  reporte_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_reporte: string;
  nombre: string;
  descripcion?: string | null;
  modulo_origen?: string | null;
  categoria?: string | null;
  tipo_reporte?: string | null;
  query_sql?: string | null;
  configuracion_json?: string | null;
  es_publico?: boolean;
  creado_por_usuario_id?: string | null;
  es_activo?: boolean;
  fecha_creacion: string;
}
