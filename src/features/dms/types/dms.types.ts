/**
 * Tipos del módulo DMS (Gestión Documental).
 * Base: /api/v1/dms
 * Nota: En API se usa "tamano_bytes" (sin ñ).
 */

export type NivelAccesoDms = 'publico' | 'general' | 'restringido' | 'confidencial';
export type EstadoDocumentoDms = 'activo' | 'archivado' | 'eliminado';

export interface DocumentoDms {
  documento_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_documento?: string | null;
  nombre_archivo?: string | null;
  descripcion?: string | null;
  tipo_documento?: string | null;
  categoria?: string | null;
  ruta_archivo?: string | null;
  tamano_bytes?: number | null;
  extension?: string | null;
  mime_type?: string | null;
  carpeta?: string | null;
  tags?: string | null;
  entidad_tipo?: string | null;
  entidad_id?: string | null;
  version?: string | null;
  documento_padre_id?: string | null;
  es_confidencial?: boolean | null;
  nivel_acceso?: string | null;
  estado?: string | null;
  fecha_creacion?: string | null;
  fecha_modificacion?: string | null;
  subido_por_usuario_id?: string | null;
}

export interface DocumentoDmsCreate {
  empresa_id: string;
  codigo_documento?: string;
  nombre_archivo: string;
  descripcion?: string;
  tipo_documento: string;
  categoria?: string;
  ruta_archivo: string;
  tamano_bytes?: number;
  extension?: string;
  mime_type?: string;
  carpeta?: string;
  tags?: string;
  entidad_tipo?: string;
  entidad_id?: string;
  version?: string;
  documento_padre_id?: string;
  es_confidencial?: boolean;
  nivel_acceso?: NivelAccesoDms;
  estado?: EstadoDocumentoDms;
  subido_por_usuario_id?: string;
}

export interface DocumentoDmsUpdate {
  codigo_documento?: string;
  nombre_archivo?: string;
  descripcion?: string;
  tipo_documento?: string;
  categoria?: string;
  ruta_archivo?: string;
  tamano_bytes?: number;
  extension?: string;
  mime_type?: string;
  carpeta?: string;
  tags?: string;
  entidad_tipo?: string;
  entidad_id?: string;
  version?: string;
  documento_padre_id?: string;
  es_confidencial?: boolean;
  nivel_acceso?: string;
  estado?: string;
  subido_por_usuario_id?: string;
}
