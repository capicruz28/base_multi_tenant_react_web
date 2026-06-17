import type { ProductoCreate, ProductoUpdate } from '../../types/inv.types';
import { isDirtyAgainstBaseline } from '@/features/org/utils/org-form-dirty.helpers';
import { bool, numOrUndef, optId, str } from './inv-form-dirty.helpers';

export type ProductoCreateFormSnapshot = ReturnType<typeof normalizeCreateFields>;
export type EditProductoFormSnapshot = ReturnType<typeof normalizeEditFields>;

function normalizeCreateFields(form: ProductoCreate) {
  return {
    codigo_sku: str(form.codigo_sku),
    nombre: str(form.nombre),
    codigo_barra: str(form.codigo_barra),
    codigo_interno: str(form.codigo_interno),
    codigo_fabricante: str(form.codigo_fabricante),
    categoria_id: optId(form.categoria_id ?? undefined),
    tipo_producto: str(form.tipo_producto) || 'bien',
    unidad_medida_base_id: optId(form.unidad_medida_base_id),
    maneja_inventario: bool(form.maneja_inventario, true),
    maneja_lotes: bool(form.maneja_lotes, false),
    maneja_series: bool(form.maneja_series, false),
    stock_minimo: numOrUndef(form.stock_minimo),
    stock_maximo: numOrUndef(form.stock_maximo),
    punto_reorden: numOrUndef(form.punto_reorden),
    maneja_vencimiento: bool(form.maneja_vencimiento, false),
    dias_vida_util: numOrUndef(form.dias_vida_util),
    es_comprable: bool(form.es_comprable, true),
    es_vendible: bool(form.es_vendible, true),
    unidad_medida_compra_id: optId(form.unidad_medida_compra_id ?? undefined),
    unidad_medida_venta_id: optId(form.unidad_medida_venta_id ?? undefined),
    tiempo_entrega_dias: numOrUndef(form.tiempo_entrega_dias),
    cantidad_minima_compra: numOrUndef(form.cantidad_minima_compra),
    multiplo_compra: numOrUndef(form.multiplo_compra),
    metodo_costeo: str(form.metodo_costeo) || 'promedio',
    moneda_costo: optId(form.moneda_costo),
    moneda_venta: optId(form.moneda_venta),
    precio_base_venta: numOrUndef(form.precio_base_venta),
    afecto_igv: bool(form.afecto_igv, true),
    porcentaje_igv: numOrUndef(form.porcentaje_igv ?? 18.0),
    codigo_sunat: str(form.codigo_sunat),
    tipo_afectacion_igv: str(form.tipo_afectacion_igv),
    marca: str(form.marca),
    modelo: str(form.modelo),
    color: str(form.color),
    talla: str(form.talla),
    es_fabricable: bool(form.es_fabricable, false),
    tiene_lista_materiales: bool(form.tiene_lista_materiales, false),
    atributos_personalizados: str(form.atributos_personalizados),
    especificaciones_tecnicas: str(form.especificaciones_tecnicas),
  };
}

function normalizeEditFields(form: ProductoUpdate) {
  return {
    codigo_sku: str(form.codigo_sku),
    codigo_barra: str(form.codigo_barra),
    nombre: str(form.nombre),
    categoria_id: optId(form.categoria_id ?? undefined),
    tipo_producto: str(form.tipo_producto) || 'bien',
    maneja_inventario: bool(form.maneja_inventario, true),
    maneja_lotes: bool(form.maneja_lotes, false),
    maneja_series: bool(form.maneja_series, false),
    stock_minimo: numOrUndef(form.stock_minimo),
    stock_maximo: numOrUndef(form.stock_maximo),
    punto_reorden: numOrUndef(form.punto_reorden),
    metodo_costeo: str(form.metodo_costeo) || 'promedio',
    moneda_costo: optId(form.moneda_costo),
    moneda_venta: optId(form.moneda_venta),
    precio_base_venta: numOrUndef(form.precio_base_venta),
    afecto_igv: bool(form.afecto_igv, true),
    porcentaje_igv: numOrUndef(form.porcentaje_igv ?? 18.0),
  };
}

export function buildCreateProductoFormSnapshot(form: ProductoCreate): ProductoCreateFormSnapshot {
  return normalizeCreateFields(form);
}

export function isCreateProductoDirty(
  form: ProductoCreate,
  baseline: ProductoCreateFormSnapshot,
): boolean {
  return isDirtyAgainstBaseline(normalizeCreateFields(form), baseline);
}

export function buildEditProductoFormSnapshot(form: ProductoUpdate): EditProductoFormSnapshot {
  return normalizeEditFields(form);
}

export function isEditProductoDirty(
  form: ProductoUpdate,
  snapshot: EditProductoFormSnapshot | null,
): boolean {
  if (!snapshot) return false;
  return JSON.stringify(buildEditProductoFormSnapshot(form)) !== JSON.stringify(snapshot);
}
