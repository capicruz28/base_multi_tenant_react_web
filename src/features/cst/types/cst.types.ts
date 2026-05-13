/**
 * Tipos del módulo CST (Costeo de Productos).
 * Base: /api/v1/cst
 * Nota: En API se usa "anio" (sin ñ) en JSON para producto costo.
 */

// ─── Tipo de Centro de Costo ────────────────────────────────────────────────

export interface CentroCostoTipo {
  cc_tipo_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo: string;
  nombre: string;
  tipo_clasificacion: string;
  base_distribucion?: string | null;
  es_activo: boolean;
  fecha_creacion?: string | null;
}

export interface CentroCostoTipoCreate {
  empresa_id: string;
  codigo: string;
  nombre: string;
  tipo_clasificacion: 'productivo' | 'servicio' | 'administrativo';
  base_distribucion?: 'horas_hombre' | 'unidades_producidas' | 'ventas' | 'area_m2';
  es_activo?: boolean;
}

export interface CentroCostoTipoUpdate {
  codigo?: string;
  nombre?: string;
  tipo_clasificacion?: string;
  base_distribucion?: string;
  es_activo?: boolean;
}

// ─── Producto Costo ────────────────────────────────────────────────────────

export interface ProductoCosto {
  producto_costo_id: string;
  cliente_id: string;
  empresa_id: string;
  producto_id: string;
  anio: number;
  mes: number;
  costo_material_directo?: number | null;
  costo_mano_obra_directa?: number | null;
  costo_indirecto_fabricacion?: number | null;
  costo_total?: number | null;
  cantidad_producida?: number | null;
  costo_unitario?: number | null;
  orden_produccion_id?: string | null;
  metodo_costeo?: string | null;
  observaciones?: string | null;
  fecha_creacion?: string | null;
  fecha_calculo?: string | null;
}

export interface ProductoCostoCreate {
  empresa_id: string;
  producto_id: string;
  anio: number;
  mes: number;
  costo_material_directo?: number;
  costo_mano_obra_directa?: number;
  costo_indirecto_fabricacion?: number;
  cantidad_producida?: number;
  orden_produccion_id?: string;
  metodo_costeo?: 'real' | 'estandar' | 'promedio';
  observaciones?: string;
}

export interface ProductoCostoUpdate {
  costo_material_directo?: number;
  costo_mano_obra_directa?: number;
  costo_indirecto_fabricacion?: number;
  cantidad_producida?: number;
  orden_produccion_id?: string;
  metodo_costeo?: string;
  observaciones?: string;
}
