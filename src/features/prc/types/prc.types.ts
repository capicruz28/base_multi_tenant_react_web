/**
 * Tipos del módulo PRC (Precios y Promociones)
 * Alineados con la documentación del backend: /api/v1/prc/
 * Incluye TODOS los campos esenciales para funcionamiento completo del sistema
 */

/** Valores numéricos/decimales que el API puede serializar como string en lectura */
export type PrcDecimalRead = string | number | null;

// ─── Lista de Precio ────────────────────────────────────────────────────────────────

export interface ListaPrecio {
  lista_precio_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_lista: string;
  nombre: string;
  descripcion?: string | null;
  /** Contrato OpenAPI: string abierto (maxLength 30), no enum cerrado */
  tipo_lista: string | null;
  moneda_id: string;
  fecha_vigencia_desde: string;
  fecha_vigencia_hasta?: string | null;
  incluye_igv: boolean;
  permite_descuentos: boolean;
  /** OpenAPI ListaPrecioRead: string | null */
  descuento_maximo_porcentaje: PrcDecimalRead;
  es_lista_defecto: boolean;
  es_activo: boolean;
  observaciones?: string | null;
  fecha_creacion: string;
  fecha_actualizacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface ListaPrecioCreate {
  empresa_id: string;
  codigo_lista: string;
  nombre: string;
  descripcion?: string | null;
  tipo_lista?: string | null;
  moneda_id: string;
  fecha_vigencia_desde: string;
  fecha_vigencia_hasta?: string | null;
  incluye_igv: boolean;
  permite_descuentos: boolean;
  descuento_maximo_porcentaje: number;
  es_lista_defecto?: boolean;
  es_activo?: boolean;
  observaciones?: string | null;
}

export interface ListaPrecioUpdate {
  codigo_lista?: string;
  nombre?: string;
  descripcion?: string | null;
  tipo_lista?: string | null;
  moneda_id?: string;
  fecha_vigencia_desde?: string;
  fecha_vigencia_hasta?: string | null;
  incluye_igv?: boolean;
  permite_descuentos?: boolean;
  descuento_maximo_porcentaje?: number;
  es_lista_defecto?: boolean;
  es_activo?: boolean;
  observaciones?: string | null;
}

/** Query params GET /prc/listas-precio */
export interface ListaPrecioListParams {
  empresa_id?: string;
  tipo_lista?: string;
  solo_activos?: boolean;
  solo_vigentes?: boolean;
  buscar?: string;
}

// ─── Detalle de Lista de Precio ────────────────────────────────────────────────────────────────

export interface ListaPrecioDetalle {
  lista_precio_detalle_id: string;
  cliente_id: string;
  empresa_id: string;
  lista_precio_id: string;
  producto_id: string;
  /** OpenAPI Read: string; Create/Update: number | string */
  precio_unitario: string | number;
  unidad_medida_id: string;
  cantidad_minima: string | number | null;
  cantidad_maxima?: string | number | null;
  descuento_maximo_porcentaje?: string | number | null;
  fecha_vigencia_desde?: string | null;
  fecha_vigencia_hasta?: string | null;
  es_activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion?: string | null;
  // Campos relacionados (para mostrar en tabla)
  producto_nombre?: string | null;
  producto_codigo?: string | null;
  unidad_medida_nombre?: string | null;
  unidad_medida_codigo?: string | null;
}

export interface ListaPrecioDetalleCreate {
  lista_precio_id: string;
  empresa_id: string;
  producto_id: string;
  precio_unitario: number | string;
  unidad_medida_id: string;
  cantidad_minima?: number | string | null;
  cantidad_maxima?: number | string | null;
  descuento_maximo_porcentaje?: number | string | null;
  fecha_vigencia_desde?: string | null;
  fecha_vigencia_hasta?: string | null;
  es_activo?: boolean;
}

export interface ListaPrecioDetalleUpdate {
  producto_id?: string | null;
  precio_unitario?: number | string | null;
  unidad_medida_id?: string | null;
  cantidad_minima?: number | string | null;
  cantidad_maxima?: number | string | null;
  descuento_maximo_porcentaje?: number | string | null;
  fecha_vigencia_desde?: string | null;
  fecha_vigencia_hasta?: string | null;
  es_activo?: boolean;
}

// ─── Promoción ────────────────────────────────────────────────────────────────

export interface Promocion {
  promocion_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_promocion: string;
  nombre: string;
  descripcion?: string | null;
  tipo_promocion: string;
  aplica_a: string;
  producto_id?: string | null;
  categoria_id?: string | null;
  marca?: string | null;
  descuento_porcentaje?: PrcDecimalRead;
  descuento_monto?: PrcDecimalRead;
  reglas_aplicacion?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_maxima_usos?: number | null;
  cantidad_usos_actuales: number;
  monto_maximo_descuento?: PrcDecimalRead;
  es_combinable: boolean;
  aplica_canal_venta?: string | null;
  es_activo: boolean;
  requiere_codigo_cupon: boolean;
  codigo_cupon?: string | null;
  observaciones?: string | null;
  fecha_creacion: string;
  usuario_creacion_id?: string | null;
  producto_nombre?: string | null;
  categoria_nombre?: string | null;
}

export interface PromocionCreate {
  empresa_id: string;
  codigo_promocion: string;
  nombre: string;
  descripcion?: string | null;
  tipo_promocion: string;
  aplica_a: string;
  producto_id?: string | null;
  categoria_id?: string | null;
  marca?: string | null;
  descuento_porcentaje?: number | null;
  descuento_monto?: number | null;
  reglas_aplicacion?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_maxima_usos?: number | null;
  monto_maximo_descuento?: number | null;
  es_combinable?: boolean;
  aplica_canal_venta?: string | null;
  es_activo?: boolean;
  requiere_codigo_cupon?: boolean;
  codigo_cupon?: string | null;
  observaciones?: string | null;
}

export interface PromocionUpdate {
  codigo_promocion?: string;
  nombre?: string;
  descripcion?: string | null;
  tipo_promocion?: string;
  aplica_a?: string;
  producto_id?: string | null;
  categoria_id?: string | null;
  marca?: string | null;
  descuento_porcentaje?: number | null;
  descuento_monto?: number | null;
  reglas_aplicacion?: string | null;
  fecha_inicio?: string;
  fecha_fin?: string;
  cantidad_maxima_usos?: number | null;
  cantidad_usos_actuales?: number;
  monto_maximo_descuento?: number | null;
  es_combinable?: boolean;
  aplica_canal_venta?: string | null;
  es_activo?: boolean;
  requiere_codigo_cupon?: boolean;
  codigo_cupon?: string | null;
  observaciones?: string | null;
}

/** Query params GET /prc/promociones */
export interface PromocionListParams {
  empresa_id?: string;
  tipo_promocion?: string;
  aplica_a?: string;
  producto_id?: string;
  categoria_id?: string;
  solo_activos?: boolean;
  solo_vigentes?: boolean;
  buscar?: string;
}
