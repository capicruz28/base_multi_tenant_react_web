/**
 * Tipos del módulo INV (Inventarios)
 * Alineados con la documentación del backend: /api/v1/inv/
 * Incluye TODOS los campos esenciales para funcionamiento completo del sistema
 */

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
  codigo: string;
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

export interface CategoriaUpdate extends Partial<CategoriaCreate> {}

// ─── Unidad de Medida ──────────────────────────────────────────────────────

export interface UnidadMedida {
  unidad_medida_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  simbolo?: string | null;
  tipo_unidad: string; // 'cantidad', 'peso', 'volumen', 'longitud', 'area', 'tiempo'
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
  codigo: string;
  nombre: string;
  simbolo?: string | null;
  tipo_unidad: string;
  es_unidad_base?: boolean;
  factor_conversion_base?: number | null;
  decimales_permitidos?: number | null;
  es_activo?: boolean;
}

export interface UnidadMedidaUpdate extends Partial<UnidadMedidaCreate> {}

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
  tipo_producto: string; // 'bien', 'servicio', 'materia_prima', 'producto_terminado', 'semi_elaborado', 'insumo'
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

export interface ProductoUpdate extends Partial<ProductoCreate> {}

// ─── Almacén ───────────────────────────────────────────────────────────────

export interface Almacen {
  almacen_id: string;
  cliente_id: string;
  empresa_id: string;
  sucursal_id?: string | null;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo_almacen: string; // 'general', 'materia_prima', 'producto_terminado', 'transito', 'consignacion', 'cuarentena'
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
  codigo: string;
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

export interface AlmacenUpdate extends Partial<AlmacenCreate> {}

// ─── Stock ──────────────────────────────────────────────────────────────────

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

export interface StockUpdate extends Partial<StockCreate> {}

// ─── Tipo de Movimiento ────────────────────────────────────────────────────

export interface TipoMovimiento {
  tipo_movimiento_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  clase_movimiento: string; // 'entrada', 'salida', 'transferencia', 'ajuste'
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
  codigo: string;
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

export interface TipoMovimientoUpdate extends Partial<TipoMovimientoCreate> {}

// ─── Movimiento ────────────────────────────────────────────────────────────

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
  total_cantidad?: number | null;
  total_costo?: number | null;
  moneda?: string | null;
  estado?: string | null; // 'borrador', 'autorizado', 'procesado', 'anulado'
  requiere_autorizacion?: boolean;
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
  numero_movimiento?: string | null;
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
  total_cantidad?: number | null;
  total_costo?: number | null;
  moneda?: string | null;
  estado?: string | null;
  requiere_autorizacion?: boolean;
  observaciones?: string | null;
  centro_costo_id?: string | null;
}

export interface MovimientoUpdate extends Partial<MovimientoCreate> {}

// ─── Inventario Físico ─────────────────────────────────────────────────────

export interface InventarioFisico {
  inventario_fisico_id: string;
  cliente_id: string;
  empresa_id: string;
  numero_inventario: string;
  fecha_inventario: string;
  almacen_id: string;
  tipo_inventario: string; // 'total', 'ciclico', 'selectivo'
  descripcion?: string | null;
  categoria_id?: string | null;
  ubicacion_almacen?: string | null;
  estado?: string | null; // 'en_proceso', 'finalizado', 'ajustado', 'anulado'
  supervisor_usuario_id?: string | null;
  supervisor_nombre?: string | null;
  total_productos_contados?: number | null;
  total_diferencias?: number | null;
  valor_diferencias?: number | null;
  movimiento_ajuste_id?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  fecha_finalizacion?: string | null;
  fecha_ajuste?: string | null;
  usuario_creacion_id?: string | null;
}

export interface InventarioFisicoCreate {
  empresa_id: string;
  numero_inventario?: string | null;
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

export interface InventarioFisicoUpdate extends Partial<InventarioFisicoCreate> {}

// ─── Movimiento (Detalle) ────────────────────────────────────────────────────

/**
 * OpenAPI: components.schemas.MovimientoDetalleRead
 * Campos numéricos vienen como string en responses (backend serializa Decimal).
 */
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
  moneda_id?: string | null;
  moneda?: string | null;
  lote?: string | null;
  fecha_vencimiento?: string | null; // date
  numero_serie?: string | null;
  ubicacion_almacen?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null; // date-time
}

/**
 * OpenAPI: components.schemas.MovimientoDetalleCreate
 * `cantidad` y `cantidad_base` aceptan number|string en request.
 */
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
  fecha_vencimiento?: string | null; // date
  numero_serie?: string | null;
  ubicacion_almacen?: string | null;
  observaciones?: string | null;
}

/**
 * OpenAPI: components.schemas.MovimientoDetalleUpdate
 */
export interface MovimientoDetalleUpdate {
  cantidad?: number | string | null;
  unidad_medida_id?: string | null;
  cantidad_base?: number | string | null;
  costo_unitario?: number | string | null;
  moneda_id?: string | null;
  moneda?: string | null;
  lote?: string | null;
  fecha_vencimiento?: string | null; // date
  numero_serie?: string | null;
  ubicacion_almacen?: string | null;
  observaciones?: string | null;
}

// ─── Inventario Físico (Detalle) ────────────────────────────────────────────

/**
 * OpenAPI: components.schemas.InventarioFisicoDetalleRead
 * Campos numéricos vienen como string en responses (backend serializa Decimal).
 */
export interface InventarioFisicoDetalleRead {
  inventario_fisico_detalle_id: string;
  cliente_id: string;
  empresa_id: string;
  inventario_fisico_id: string;
  producto_id: string;
  cantidad_sistema: string;
  cantidad_contada?: string | null;
  lote?: string | null;
  fecha_vencimiento?: string | null; // date
  ubicacion_almacen?: string | null;
  costo_unitario?: string | null;
  estado_conteo?: string | null;
  contador_usuario_id?: string | null;
  contador_nombre?: string | null;
  fecha_conteo?: string | null; // date-time
  observaciones?: string | null;
  motivo_diferencia?: string | null;
  fecha_creacion?: string | null; // date-time
}

/**
 * OpenAPI: components.schemas.InventarioFisicoDetalleCreate
 */
export interface InventarioFisicoDetalleCreate {
  empresa_id: string;
  inventario_fisico_id: string;
  producto_id: string;
  cantidad_sistema: number | string;
  cantidad_contada?: number | string | null;
  lote?: string | null;
  fecha_vencimiento?: string | null; // date
  ubicacion_almacen?: string | null;
  costo_unitario?: number | string | null;
  estado_conteo?: string | null;
  contador_usuario_id?: string | null;
  contador_nombre?: string | null;
  fecha_conteo?: string | null; // date-time
  observaciones?: string | null;
  motivo_diferencia?: string | null;
}

/**
 * OpenAPI: components.schemas.InventarioFisicoDetalleUpdate
 */
export interface InventarioFisicoDetalleUpdate {
  cantidad_sistema?: number | string | null;
  cantidad_contada?: number | string | null;
  lote?: string | null;
  fecha_vencimiento?: string | null; // date
  ubicacion_almacen?: string | null;
  costo_unitario?: number | string | null;
  estado_conteo?: string | null;
  contador_usuario_id?: string | null;
  contador_nombre?: string | null;
  fecha_conteo?: string | null; // date-time
  observaciones?: string | null;
  motivo_diferencia?: string | null;
}

// ─── Requests de acciones / flujos ──────────────────────────────────────────

/**
 * OpenAPI: components.schemas.AprobarInventarioFisicoRequest
 */
export interface AprobarInventarioFisicoRequest {
  tipo_movimiento_id: string;
  observaciones?: string | null;
}

/**
 * OpenAPI: /api/v1/inv/{movimiento_id}/autorizar
 * No define requestBody en el contrato (solo path param).
 */
export type AutorizarMovimientoRequest = Record<string, never>;

/**
 * OpenAPI: /api/v1/inv/{movimiento_id}/anular
 * requestBody usa components.schemas.MotivoAnulacion.
 */
export interface AnularMovimientoRequest {
  motivo?: string | null;
}

// ─── Kardex ────────────────────────────────────────────────────────────────

export interface KardexLineaRead {
  kardex_linea_id: string;
  empresa_id: string;
  producto_id: string;
  almacen_id?: string | null;
  fecha_movimiento: string;
  numero_movimiento?: string | null;
  tipo_movimiento_codigo?: string | null;
  tipo_movimiento_nombre?: string | null;
  documento_referencia_tipo?: string | null;
  documento_referencia_numero?: string | null;
  tercero_nombre?: string | null;
  cantidad_entrada?: number | null;
  cantidad_salida?: number | null;
  saldo_cantidad?: number | null;
  costo_unitario?: number | null;
  costo_total?: number | null;
  saldo_valorizado?: number | null;
  moneda?: string | null;
}

// ─── Filtros de listado ────────────────────────────────────────────────────

export interface InvListParams {
  empresa_id?: string;
  categoria_id?: string;
  tipo_producto?: string;
  sucursal_id?: string;
  almacen_id?: string;
  producto_id?: string;
  tipo_movimiento_id?: string;
  estado?: string;
  solo_activos?: boolean;
  buscar?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}
