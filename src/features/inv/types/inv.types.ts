/**
 * Tipos del módulo INV (Inventarios)
 * Alineados con el contrato API: /api/v1/inv/ (`docs/api/INV_API.json`)
 * y Motor de Códigos Wave 1 (`inv-wave1-frontend-contract`).
 *
 * Bloque 1 (Fase 2): request/response separados, sin `any`; cabecera+detalle embebido
 * en `MovimientoConDetalleCreate` / `InventarioFisicoConDetalleCreate` como `detalles[]`.
 *
 * Wave 1 (tipos):
 * - AUTO_DEFAULT CREATE: `codigo` / `codigo_sku` opcionales.
 * - AUTO_REQUIRED CREATE: `numero_*` ausentes del contrato vigente (ver JSDoc legacy).
 * - BR-IMM UPDATE: no enviar campo Motor — usar `stripInvMotorFieldFromUpdate`.
 *
 * Última revisión contrato: 2026-07-17
 */

import type { ErpListQueryBase } from '@/core/list/erp-list.types';

/**
 * Decimal API (Pydantic): suele serializarse como `string`; el cliente puede normalizar a `number`.
 * Usar en lecturas donde el OpenAPI declare `string` para cantidades importes.
 */
export type InvApiDecimal = string | number;

// ─── Categoría de Producto ─────────────────────────────────────────────────

export interface Categoria {
  categoria_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  categoria_padre_id?: string | null;
  nivel?: number | null;
  ruta_jerarquica?: string | null;
  cuenta_contable_inventario?: string | null;
  cuenta_contable_costo_venta?: string | null;
  metodo_costeo_defecto?: string | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface CategoriaCreate {
  empresa_id: string;
  /** AUTO_DEFAULT — omitir vacío/`null`; Backend genera `CATnnn`. */
  codigo?: string | null;
  nombre: string;
  descripcion?: string | null;
  categoria_padre_id?: string | null;
  nivel?: number | null;
  ruta_jerarquica?: string | null;
  cuenta_contable_inventario?: string | null;
  cuenta_contable_costo_venta?: string | null;
  metodo_costeo_defecto?: string | null;
  es_activo?: boolean;
}

/** BR-IMM: `codigo` ausente — no enviar en PUT. */
export interface CategoriaUpdate extends Omit<Partial<CategoriaCreate>, 'codigo'> {}


// ─── Unidad de Medida ──────────────────────────────────────────────────────

export interface UnidadMedida {
  unidad_medida_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  simbolo?: string | null;
  tipo_unidad: string; // 'cantidad' | 'peso' | 'volumen' | 'longitud' | 'area' | 'tiempo'
  es_unidad_base?: boolean;
  factor_conversion_base?: number | null;
  decimales_permitidos?: number | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface UnidadMedidaCreate {
  empresa_id: string;
  /** AUTO_DEFAULT — omitir vacío/`null`; Backend genera `UMnnn`. */
  codigo?: string | null;
  nombre: string;
  simbolo?: string | null;
  tipo_unidad: string;
  es_unidad_base?: boolean;
  factor_conversion_base?: number | null;
  decimales_permitidos?: number | null;
  es_activo?: boolean;
}

/** BR-IMM: `codigo` ausente — no enviar en PUT. */
export interface UnidadMedidaUpdate extends Omit<Partial<UnidadMedidaCreate>, 'codigo'> {}


// ─── Producto ───────────────────────────────────────────────────────────────

export interface Producto {
  producto_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_sku: string;
  codigo_barra?: string | null;
  codigo_interno?: string | null;
  codigo_fabricante?: string | null;
  nombre: string;
  nombre_corto?: string | null;
  descripcion?: string | null;
  descripcion_corta?: string | null;
  categoria_id?: string | null;
  subcategoria_id?: string | null;
  marca?: string | null;
  modelo?: string | null;
  linea_producto?: string | null;
  tipo_producto: string; // 'bien' | 'servicio' | 'materia_prima' | 'producto_terminado' | 'semi_elaborado' | 'insumo'
  subtipo_producto?: string | null;
  unidad_medida_base_id: string;
  unidad_medida_compra_id?: string | null;
  unidad_medida_venta_id?: string | null;
  factor_conversion_compra?: number | null;
  factor_conversion_venta?: number | null;
  peso_kg?: number | null;
  volumen_m3?: number | null;
  largo_cm?: number | null;
  ancho_cm?: number | null;
  alto_cm?: number | null;
  color?: string | null;
  talla?: string | null;
  atributos_personalizados?: string | null;
  especificaciones_tecnicas?: string | null;
  maneja_inventario?: boolean;
  maneja_lotes?: boolean;
  maneja_series?: boolean;
  maneja_vencimiento?: boolean;
  dias_vida_util?: number | null;
  requiere_refrigeracion?: boolean;
  es_perecible?: boolean;
  stock_minimo?: number | null;
  stock_maximo?: number | null;
  punto_reorden?: number | null;
  es_comprable?: boolean;
  tiempo_entrega_dias?: number | null;
  cantidad_minima_compra?: number | null;
  multiplo_compra?: number | null;
  es_vendible?: boolean;
  requiere_autorizacion_venta?: boolean;
  es_fabricable?: boolean;
  tiene_lista_materiales?: boolean;
  metodo_costeo?: string | null;
  costo_estandar?: number | null;
  costo_ultima_compra?: number | null;
  costo_promedio?: number | null;
  moneda_costo: string;
  precio_base_venta?: number | null;
  moneda_venta: string;
  afecto_igv?: boolean;
  porcentaje_igv?: number | null;
  codigo_sunat?: string | null;
  tipo_afectacion_igv?: string | null;
  imagen_principal_url?: string | null;
  imagenes_adicionales?: string | null;
  ficha_tecnica_url?: string | null;
  proveedor_habitual_id?: string | null;
  estado?: string | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
  usuario_creacion_id?: string | null;
  usuario_actualizacion_id?: string | null;
  observaciones?: string | null;
}

export interface ProductoCreate {
  empresa_id: string;
  /** AUTO_DEFAULT — omitir vacío/`null`; Backend genera `P` + 5 dígitos. */
  codigo_sku?: string | null;
  codigo_barra?: string | null;
  codigo_interno?: string | null;
  codigo_fabricante?: string | null;
  nombre: string;
  nombre_corto?: string | null;
  descripcion?: string | null;
  descripcion_corta?: string | null;
  categoria_id?: string | null;
  subcategoria_id?: string | null;
  marca?: string | null;
  modelo?: string | null;
  linea_producto?: string | null;
  tipo_producto: string;
  subtipo_producto?: string | null;
  unidad_medida_base_id: string;
  unidad_medida_compra_id?: string | null;
  unidad_medida_venta_id?: string | null;
  factor_conversion_compra?: number | null;
  factor_conversion_venta?: number | null;
  peso_kg?: number | null;
  volumen_m3?: number | null;
  largo_cm?: number | null;
  ancho_cm?: number | null;
  alto_cm?: number | null;
  color?: string | null;
  talla?: string | null;
  atributos_personalizados?: string | null;
  especificaciones_tecnicas?: string | null;
  maneja_inventario?: boolean;
  maneja_lotes?: boolean;
  maneja_series?: boolean;
  maneja_vencimiento?: boolean;
  dias_vida_util?: number | null;
  requiere_refrigeracion?: boolean;
  es_perecible?: boolean;
  stock_minimo?: number | null;
  stock_maximo?: number | null;
  punto_reorden?: number | null;
  es_comprable?: boolean;
  tiempo_entrega_dias?: number | null;
  cantidad_minima_compra?: number | null;
  multiplo_compra?: number | null;
  es_vendible?: boolean;
  requiere_autorizacion_venta?: boolean;
  es_fabricable?: boolean;
  tiene_lista_materiales?: boolean;
  metodo_costeo?: string | null;
  costo_estandar?: number | null;
  costo_ultima_compra?: number | null;
  costo_promedio?: number | null;
  moneda_costo: string;
  precio_base_venta?: number | null;
  moneda_venta: string;
  afecto_igv?: boolean;
  porcentaje_igv?: number | null;
  codigo_sunat?: string | null;
  tipo_afectacion_igv?: string | null;
  imagen_principal_url?: string | null;
  imagenes_adicionales?: string | null;
  ficha_tecnica_url?: string | null;
  proveedor_habitual_id?: string | null;
  estado?: string | null;
  es_activo?: boolean;
  observaciones?: string | null;
}

/** BR-IMM solo `codigo_sku` — barra/interno/fabricante/sunat siguen en Create/Update. */
export interface ProductoUpdate extends Omit<Partial<ProductoCreate>, 'codigo_sku'> {}


// ─── Almacén ───────────────────────────────────────────────────────────────

export interface Almacen {
  almacen_id: string;
  cliente_id: string;
  empresa_id: string;
  sucursal_id?: string | null;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo_almacen: string; // 'general' | 'materia_prima' | 'producto_terminado' | 'transito' | 'consignacion' | 'cuarentena'
  direccion?: string | null;
  responsable_usuario_id?: string | null;
  responsable_nombre?: string | null;
  es_almacen_principal?: boolean;
  permite_ventas?: boolean;
  permite_compras?: boolean;
  permite_produccion?: boolean;
  capacidad_m3?: number | null;
  capacidad_kg?: number | null;
  capacidad_unidades?: number | null;
  centro_costo_id?: string | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface AlmacenCreate {
  empresa_id: string;
  sucursal_id?: string | null;
  /** AUTO_DEFAULT — omitir vacío/`null`; Backend genera `ALMnnn`. */
  codigo?: string | null;
  nombre: string;
  descripcion?: string | null;
  tipo_almacen: string;
  direccion?: string | null;
  responsable_usuario_id?: string | null;
  responsable_nombre?: string | null;
  es_almacen_principal?: boolean;
  permite_ventas?: boolean;
  permite_compras?: boolean;
  permite_produccion?: boolean;
  capacidad_m3?: number | null;
  capacidad_kg?: number | null;
  capacidad_unidades?: number | null;
  centro_costo_id?: string | null;
  es_activo?: boolean;
}

/** BR-IMM: `codigo` ausente — no enviar en PUT. */
export interface AlmacenUpdate extends Omit<Partial<AlmacenCreate>, 'codigo'> {}


// ─── Stock ──────────────────────────────────────────────────────────────────
// Stock es solo lectura desde el frontend (create/update son deprecated).
// Se actualiza exclusivamente mediante movimientos de inventario.
// OpenAPI `StockRead` usa strings para decimales; `stockService` (Bloque 2) normaliza a `number` al recibir.

export interface Stock {
  stock_id: string;
  cliente_id: string;
  empresa_id: string;
  producto_id: string;
  almacen_id: string;
  cantidad_actual: number;
  cantidad_reservada?: number | null;
  cantidad_disponible?: number | null;
  cantidad_transito?: number | null;
  costo_promedio?: number | null;
  valor_total?: number | null;
  moneda_id?: string;
  moneda?: string | null;
  stock_minimo?: number | null;
  stock_maximo?: number | null;
  punto_reorden?: number | null;
  ubicacion_almacen?: string | null;
  fecha_ultimo_movimiento?: string | null;
  fecha_ultima_compra?: string | null;
  fecha_ultima_venta?: string | null;
  fecha_actualizacion?: string | null;
}

// ─── Tipo de Movimiento ────────────────────────────────────────────────────

export interface TipoMovimiento {
  tipo_movimiento_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  clase_movimiento: string; // 'entrada' | 'salida' | 'transferencia' | 'ajuste'
  afecta_costo?: boolean;
  requiere_autorizacion?: boolean;
  genera_asiento_contable?: boolean;
  cuenta_contable_debito?: string | null;
  cuenta_contable_credito?: string | null;
  requiere_documento_referencia?: boolean;
  tipo_documento_referencia?: string | null;
  es_activo: boolean;
  es_tipo_sistema?: boolean;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
  usuario_creacion_id?: string | null;
}

export interface TipoMovimientoCreate {
  empresa_id: string;
  /** AUTO_DEFAULT — omitir vacío/`null`; Backend genera `TMnnn`. */
  codigo?: string | null;
  nombre: string;
  descripcion?: string | null;
  clase_movimiento: string;
  afecta_costo?: boolean;
  requiere_autorizacion?: boolean;
  genera_asiento_contable?: boolean;
  cuenta_contable_debito?: string | null;
  cuenta_contable_credito?: string | null;
  requiere_documento_referencia?: boolean;
  tipo_documento_referencia?: string | null;
  es_activo?: boolean;
  es_tipo_sistema?: boolean;
}

/** BR-IMM: `codigo` ausente — no enviar en PUT. */
export interface TipoMovimientoUpdate extends Omit<Partial<TipoMovimientoCreate>, 'codigo'> {}


// ─── Movimiento ────────────────────────────────────────────────────────────
// Campos numéricos (total_cantidad, total_costo) vienen como string|null
// desde el backend (serialización Decimal).

export interface Movimiento {
  movimiento_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_movimiento: string;
  tipo_movimiento_id: string;
  fecha_movimiento: string;
  fecha_contable: string;
  almacen_origen_id?: string | null;
  almacen_destino_id?: string | null;
  modulo_origen?: string | null;
  documento_referencia_tipo?: string | null;
  documento_referencia_id?: string | null;
  documento_referencia_numero?: string | null;
  tercero_tipo?: string | null;
  tercero_id?: string | null;
  tercero_nombre?: string | null;
  total_items?: number | null;
  total_cantidad?: string | null;
  total_costo?: string | null;
  moneda_id?: string | null;
  moneda?: string | null;
  estado: string; // 'borrador' | 'autorizado' | 'procesado' | 'anulado' | 'estornado'
  requiere_autorizacion?: boolean | null;
  autorizado_por_usuario_id?: string | null;
  fecha_autorizacion?: string | null;
  observaciones?: string | null;
  motivo_anulacion?: string | null;
  centro_costo_id?: string | null;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
  fecha_procesado?: string | null;
  usuario_creacion_id?: string | null;
  usuario_procesado_id?: string | null;
}

export interface MovimientoCreate {
  empresa_id: string;
  tipo_movimiento_id: string;
  fecha_movimiento?: string | null;
  fecha_contable: string;
  almacen_origen_id?: string | null;
  almacen_destino_id?: string | null;
  modulo_origen?: string | null;
  documento_referencia_tipo?: string | null;
  documento_referencia_id?: string | null;
  documento_referencia_numero?: string | null;
  tercero_tipo?: string | null;
  tercero_id?: string | null;
  tercero_nombre?: string | null;
  total_items?: number | null;
  total_cantidad?: number | string | null;
  total_costo?: number | string | null;
  moneda_id?: string | null;
  moneda?: string | null;
  estado?: string | null;
  requiere_autorizacion?: boolean | null;
  observaciones?: string | null;
  centro_costo_id?: string | null;
}

/** BR-IMM: `numero_movimiento` está ausente del contrato PUT. */
export interface MovimientoUpdate extends Partial<MovimientoCreate> {}

// ─── Movimiento Detalle (línea) ────────────────────────────────────────────
// Campos numéricos vienen como string en responses (backend serializa Decimal).

export interface MovimientoDetalleRead {
  movimiento_detalle_id: string;
  cliente_id: string;
  empresa_id: string;
  movimiento_id: string;
  producto_id: string;
  cantidad: string;
  unidad_medida_id: string;
  cantidad_base: string;
  costo_unitario?: string | null;
  costo_total?: string | null;
  moneda_id?: string | null;
  moneda?: string | null;
  lote?: string | null;
  fecha_vencimiento?: string | null;
  numero_serie?: string | null;
  ubicacion_almacen?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
}

/**
 * Línea embebida para POST/PUT /movimientos/con-detalle.
 * No incluye empresa_id ni movimiento_id — van en la cabecera.
 */
export interface MovimientoDetalleCreateEmbebido {
  producto_id: string;
  cantidad: number | string;
  unidad_medida_id: string;
  cantidad_base: number | string;
  costo_unitario?: number | string | null;
  moneda_id?: string | null;
  moneda?: string | null;
  lote?: string | null;
  fecha_vencimiento?: string | null;
  numero_serie?: string | null;
  ubicacion_almacen?: string | null;
  observaciones?: string | null;
}

// ─── Movimiento con Detalle (cabecera + líneas en una sola operación) ──────

export interface MovimientoConDetalle extends Movimiento {
  detalles?: MovimientoDetalleRead[];
}

/** POST /api/v1/inv/movimientos/con-detalle */
export interface MovimientoConDetalleCreate {
  empresa_id: string;
  tipo_movimiento_id: string;
  fecha_movimiento?: string | null;
  fecha_contable: string;
  almacen_origen_id?: string | null;
  almacen_destino_id?: string | null;
  modulo_origen?: string | null;
  documento_referencia_tipo?: string | null;
  documento_referencia_id?: string | null;
  documento_referencia_numero?: string | null;
  tercero_tipo?: string | null;
  tercero_id?: string | null;
  tercero_nombre?: string | null;
  total_items?: number | null;
  total_cantidad?: number | string | null;
  total_costo?: number | string | null;
  moneda_id?: string | null;
  moneda?: string | null;
  /** Ignorado por API en CREATE (RC1 §5.4). */
  estado?: string | null;
  /** Ignorado por API en CREATE (RC1 §5.4). */
  requiere_autorizacion?: boolean | null;
  /** Ignorado por API en CREATE (RC1 §5.4). */
  autorizado_por_usuario_id?: string | null;
  /** Ignorado por API en CREATE (RC1 §5.4). */
  fecha_autorizacion?: string | null;
  observaciones?: string | null;
  /** Ignorado por API en CREATE (RC1 §5.4). */
  motivo_anulacion?: string | null;
  centro_costo_id?: string | null;
  detalles: MovimientoDetalleCreateEmbebido[];
}

/** PUT /api/v1/inv/movimientos/{id}/con-detalle */
export interface MovimientoConDetalleUpdate {
  tipo_movimiento_id?: string | null;
  fecha_movimiento?: string | null;
  fecha_contable?: string | null;
  almacen_origen_id?: string | null;
  almacen_destino_id?: string | null;
  modulo_origen?: string | null;
  documento_referencia_tipo?: string | null;
  documento_referencia_id?: string | null;
  documento_referencia_numero?: string | null;
  tercero_tipo?: string | null;
  tercero_id?: string | null;
  tercero_nombre?: string | null;
  total_items?: number | null;
  total_cantidad?: number | string | null;
  total_costo?: number | string | null;
  moneda_id?: string | null;
  moneda?: string | null;
  /** Presente en OpenAPI; RC1 §5.4 prohíbe enviar en PUT — no incluir en payloads de formulario. */
  estado?: string | null;
  /** Presente en OpenAPI; RC1 §5.4 prohíbe enviar en PUT — no incluir en payloads de formulario. */
  requiere_autorizacion?: boolean | null;
  /** Presente en OpenAPI; RC1 §5.4 prohíbe enviar en PUT — no incluir en payloads de formulario. */
  autorizado_por_usuario_id?: string | null;
  /** Presente en OpenAPI; RC1 §5.4 prohíbe enviar en PUT — no incluir en payloads de formulario. */
  fecha_autorizacion?: string | null;
  observaciones?: string | null;
  /** Presente en OpenAPI; RC1 §5.4 prohíbe enviar en PUT — no incluir en payloads de formulario. */
  motivo_anulacion?: string | null;
  centro_costo_id?: string | null;
  detalles?: MovimientoDetalleCreateEmbebido[] | null;
}

// ─── Inventario Físico ─────────────────────────────────────────────────────
// valor_diferencias viene como string|null desde el backend (serialización Decimal).

export interface InventarioFisico {
  inventario_fisico_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_inventario: string;
  fecha_inventario: string;
  almacen_id: string;
  tipo_inventario: string; // 'total' | 'ciclico' | 'selectivo'
  descripcion?: string | null;
  categoria_id?: string | null;
  ubicacion_almacen?: string | null;
  estado: string; // 'en_proceso' | 'finalizado' | 'ajustado' | 'anulado'
  supervisor_usuario_id?: string | null;
  supervisor_nombre?: string | null;
  total_productos_contados?: number | null;
  total_diferencias?: number | null;
  valor_diferencias?: string | null;
  movimiento_ajuste_id?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  fecha_finalizacion?: string | null;
  fecha_ajuste?: string | null;
  usuario_creacion_id?: string | null;
}

export interface InventarioFisicoCreate {
  empresa_id: string;
  fecha_inventario: string;
  almacen_id: string;
  tipo_inventario: string;
  descripcion?: string | null;
  categoria_id?: string | null;
  ubicacion_almacen?: string | null;
  estado?: string | null;
  supervisor_usuario_id?: string | null;
  supervisor_nombre?: string | null;
  observaciones?: string | null;
}

/** BR-IMM: `numero_inventario` está ausente del contrato PUT. */
export interface InventarioFisicoUpdate extends Partial<InventarioFisicoCreate> {}

// ─── Inventario Físico Detalle (línea) ─────────────────────────────────────
// Campos numéricos vienen como string en responses.

export interface InventarioFisicoDetalleRead {
  inventario_fisico_detalle_id: string;
  cliente_id: string;
  empresa_id: string;
  inventario_fisico_id: string;
  producto_id: string;
  cantidad_sistema: string;
  cantidad_contada?: string | null;
  diferencia?: string | null;
  lote?: string | null;
  fecha_vencimiento?: string | null;
  ubicacion_almacen?: string | null;
  costo_unitario?: string | null;
  valor_diferencia?: string | null;
  estado_conteo?: string | null;
  contador_usuario_id?: string | null;
  contador_nombre?: string | null;
  fecha_conteo?: string | null;
  observaciones?: string | null;
  motivo_diferencia?: string | null;
  fecha_creacion?: string | null;
}

/**
 * Línea embebida para POST/PUT /inventario-fisico/con-detalle.
 * No incluye empresa_id ni inventario_fisico_id — van en la cabecera.
 */
export interface InventarioFisicoDetalleCreateEmbebido {
  producto_id: string;
  cantidad_sistema: number | string;
  cantidad_contada?: number | string | null;
  lote?: string | null;
  fecha_vencimiento?: string | null;
  ubicacion_almacen?: string | null;
  costo_unitario?: number | string | null;
  estado_conteo?: string | null;
  contador_usuario_id?: string | null;
  contador_nombre?: string | null;
  fecha_conteo?: string | null;
  observaciones?: string | null;
  motivo_diferencia?: string | null;
}

// ─── Inventario Físico con Detalle (cabecera + líneas en una sola op.) ─────

export interface InventarioFisicoConDetalle extends InventarioFisico {
  detalles?: InventarioFisicoDetalleRead[];
}

/** POST /api/v1/inv/inventario-fisico/con-detalle */
export interface InventarioFisicoConDetalleCreate {
  empresa_id: string;
  fecha_inventario: string;
  almacen_id: string;
  tipo_inventario: string;
  descripcion?: string | null;
  categoria_id?: string | null;
  ubicacion_almacen?: string | null;
  estado?: string | null;
  supervisor_usuario_id?: string | null;
  supervisor_nombre?: string | null;
  total_productos_contados?: number | null;
  total_diferencias?: number | null;
  valor_diferencias?: number | string | null;
  movimiento_ajuste_id?: string | null;
  observaciones?: string | null;
  detalles?: InventarioFisicoDetalleCreateEmbebido[];
}

/** PUT /api/v1/inv/inventario-fisico/{id}/con-detalle */
export interface InventarioFisicoConDetalleUpdate {
  fecha_inventario?: string | null;
  almacen_id?: string | null;
  tipo_inventario?: string | null;
  descripcion?: string | null;
  categoria_id?: string | null;
  ubicacion_almacen?: string | null;
  estado?: string | null;
  supervisor_usuario_id?: string | null;
  supervisor_nombre?: string | null;
  total_productos_contados?: number | null;
  total_diferencias?: number | null;
  valor_diferencias?: number | string | null;
  movimiento_ajuste_id?: string | null;
  observaciones?: string | null;
  fecha_finalizacion?: string | null;
  fecha_ajuste?: string | null;
  detalles?: InventarioFisicoDetalleCreateEmbebido[] | null;
}

// ─── Requests de acciones / flujos ──────────────────────────────────────────

/** POST `/api/v1/inv/inventario-fisico/{id}/aprobar` — body con tipo de movimiento de ajuste. */
export interface AprobarInventarioFisicoRequest {
  tipo_movimiento_id: string;
  observaciones?: string | null;
}

/** POST `/api/v1/inv/movimientos/{movimiento_id}/anular` — body opcional (`MotivoAnulacion` en OpenAPI). */
export interface AnularMovimientoRequest {
  motivo?: string | null;
}

/** POST `/api/v1/inv/movimientos/{movimiento_id}/estornar` — body opcional (`MotivoEstorno` en OpenAPI). */
export interface EstornarMovimientoRequest {
  motivo?: string | null;
}

/** POST `/api/v1/inv/movimientos/{movimiento_id}/autorizar` — sin cuerpo en el contrato OpenAPI. */
export type AutorizarMovimientoRequest = Record<string, never>;

/** POST `/api/v1/inv/movimientos/{movimiento_id}/procesar` — sin cuerpo en el contrato OpenAPI. */
export type ProcesarMovimientoRequest = Record<string, never>;

// ─── Kardex ────────────────────────────────────────────────────────────────
// Campos del response real de GET /api/v1/inv/kardex.
// tipo_movimiento_id se resuelve a nombre en la vista cargando useTiposMovimiento
// y haciendo join en memoria — decisión de diseño, no deuda técnica.

export interface KardexLineaRead {
  movimiento_id: string;
  movimiento_detalle_id: string;
  empresa_id: string;
  fecha_movimiento: string;
  tipo_movimiento_id: string;
  producto_id: string;
  almacen_origen_id?: string | null;
  almacen_destino_id?: string | null;
  cantidad_base: string;
  costo_unitario?: string | null;
  moneda?: string | null;
  lote?: string | null;
  numero_serie?: string | null;
  observaciones?: string | null;
}

// ─── Filtros de listado ────────────────────────────────────────────────────

export interface InvListParams extends ErpListQueryBase {
  empresa_id?: string;
  categoria_id?: string;
  tipo_producto?: string;
  sucursal_id?: string;
  almacen_id?: string;
  producto_id?: string;
  tipo_movimiento_id?: string;
  movimiento_id?: string;
  inventario_fisico_id?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

// ─── Tipos legacy mantenidos por compatibilidad interna ───────────────────
// Usados por hooks existentes que no han sido migrados aún.
// Serán eliminados en la siguiente iteración de limpieza.

/** @deprecated Usar MovimientoDetalleCreateEmbebido en contexto con-detalle */
export interface MovimientoDetalleCreate {
  empresa_id: string;
  movimiento_id: string;
  producto_id: string;
  cantidad: number | string;
  unidad_medida_id: string;
  cantidad_base: number | string;
  costo_unitario?: number | string | null;
  moneda_id?: string | null;
  moneda?: string | null;
  lote?: string | null;
  fecha_vencimiento?: string | null;
  numero_serie?: string | null;
  ubicacion_almacen?: string | null;
  observaciones?: string | null;
}

/** @deprecated Usar MovimientoConDetalleUpdate en contexto con-detalle */
export interface MovimientoDetalleUpdate {
  cantidad?: number | string | null;
  unidad_medida_id?: string | null;
  cantidad_base?: number | string | null;
  costo_unitario?: number | string | null;
  moneda_id?: string | null;
  moneda?: string | null;
  lote?: string | null;
  fecha_vencimiento?: string | null;
  numero_serie?: string | null;
  ubicacion_almacen?: string | null;
  observaciones?: string | null;
}

/** @deprecated Usar InventarioFisicoDetalleCreateEmbebido en contexto con-detalle */
export interface InventarioFisicoDetalleCreate {
  empresa_id: string;
  inventario_fisico_id: string;
  producto_id: string;
  cantidad_sistema: number | string;
  cantidad_contada?: number | string | null;
  lote?: string | null;
  fecha_vencimiento?: string | null;
  ubicacion_almacen?: string | null;
  costo_unitario?: number | string | null;
  estado_conteo?: string | null;
  contador_usuario_id?: string | null;
  contador_nombre?: string | null;
  fecha_conteo?: string | null;
  observaciones?: string | null;
  motivo_diferencia?: string | null;
}

/** @deprecated Usar InventarioFisicoConDetalleUpdate en contexto con-detalle */
export interface InventarioFisicoDetalleUpdate {
  cantidad_sistema?: number | string | null;
  cantidad_contada?: number | string | null;
  lote?: string | null;
  fecha_vencimiento?: string | null;
  ubicacion_almacen?: string | null;
  costo_unitario?: number | string | null;
  estado_conteo?: string | null;
  contador_usuario_id?: string | null;
  contador_nombre?: string | null;
  fecha_conteo?: string | null;
  observaciones?: string | null;
  motivo_diferencia?: string | null;
}

/** @deprecated Sin uso activo; stock se gestiona mediante movimientos */
export interface StockCreate {
  empresa_id: string;
  producto_id: string;
  almacen_id: string;
  cantidad_actual: number;
  cantidad_reservada?: number | null;
  cantidad_transito?: number | null;
  costo_promedio?: number | null;
  moneda?: string | null;
  stock_minimo?: number | null;
  stock_maximo?: number | null;
  punto_reorden?: number | null;
  ubicacion_almacen?: string | null;
}

/** @deprecated Sin uso activo; stock se gestiona mediante movimientos */
export interface StockUpdate extends Partial<StockCreate> {}
