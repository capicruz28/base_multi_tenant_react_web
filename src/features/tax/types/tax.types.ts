/**
 * Tipos del módulo TAX (Libros Electrónicos / PLE SUNAT).
 * Base: /api/v1/tax
 * Nota: En API se usa "anio" (sin ñ) en JSON.
 */

export type TipoLibroTax = 'ventas' | 'compras' | 'diario' | 'mayor' | 'inventarios';
export type EstadoLibroTax = 'borrador' | 'generado' | 'enviado' | 'anulado';

/** Mapeado desde LibroElectronicoRead del contrato API */
export interface LibroElectronico {
  libro_id: string;
  cliente_id: string;
  empresa_id: string;
  tipo_libro: string;
  periodo_id: string;
  anio: number;
  mes: number;
  fecha_generacion: string;
  nombre_archivo: string | null;
  ruta_archivo: string | null;
  estado: string | null;
  fecha_envio_sunat: string | null;
  codigo_respuesta_sunat: string | null;
  total_registros: number | null;
  observaciones: string | null;
  fecha_creacion: string;
  generado_por_usuario_id: string | null;
}

export interface LibroElectronicoCreate {
  empresa_id: string;
  tipo_libro: TipoLibroTax;
  periodo_id: string;
  anio: number;
  mes: number;
  nombre_archivo?: string;
  ruta_archivo?: string;
  fecha_envio_sunat?: string;
  codigo_respuesta_sunat?: string;
  total_registros?: number;
  observaciones?: string;
  generado_por_usuario_id?: string;
}

/** Campos editables vía PUT /libros-electronicos/{id}. No incluye `estado`. */
export interface LibroElectronicoUpdate {
  nombre_archivo?: string;
  ruta_archivo?: string;
  fecha_envio_sunat?: string;
  codigo_respuesta_sunat?: string;
  total_registros?: number;
  observaciones?: string;
  generado_por_usuario_id?: string;
}

/** Body opcional para POST /libros-electronicos/{id}/registrar-envio */
export interface LibroElectronicoRegistrarEnvio {
  fecha_envio_sunat?: string;
  codigo_respuesta_sunat?: string;
}
