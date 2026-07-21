import type { CodigoRegistryEntry } from '@/core/codigo';

/** sequenceKey canónicos — Motor de Códigos INV Wave 1 */
export const INV_CODIGO_SEQUENCE_KEYS = {
  categoria: 'inv_categoria_producto',
  unidadMedida: 'inv_unidad_medida',
  tipoMovimiento: 'inv_tipo_movimiento',
  almacen: 'inv_almacen',
  producto: 'inv_producto',
  movimiento: 'inv_movimiento',
  inventarioFisico: 'inv_inventario_fisico',
} as const;

export type InvCodigoSequenceKey =
  (typeof INV_CODIGO_SEQUENCE_KEYS)[keyof typeof INV_CODIGO_SEQUENCE_KEYS];

/**
 * Manifest oficial INV — declaración estática por entidad.
 * Policies y payload los resuelve el Engine; aquí solo identidad + meta UX.
 */
export const INV_CODIGO_MANIFEST: readonly CodigoRegistryEntry[] = [
  {
    sequenceKey: INV_CODIGO_SEQUENCE_KEYS.categoria,
    moduleCode: 'inv',
    entityKey: 'categoria',
    fieldKey: 'codigo',
    policy: 'AUTO_DEFAULT',
    meta: {
      entityLabel: 'categoría',
      prefixHint: 'CAT',
      exampleFormat: '001',
      scopeLabel: 'empresa',
      maxLength: 20,
    },
  },
  {
    sequenceKey: INV_CODIGO_SEQUENCE_KEYS.unidadMedida,
    moduleCode: 'inv',
    entityKey: 'unidad_medida',
    fieldKey: 'codigo',
    policy: 'AUTO_DEFAULT',
    meta: {
      entityLabel: 'unidad de medida',
      prefixHint: 'UM',
      exampleFormat: '001',
      scopeLabel: 'empresa',
      maxLength: 10,
    },
  },
  {
    sequenceKey: INV_CODIGO_SEQUENCE_KEYS.tipoMovimiento,
    moduleCode: 'inv',
    entityKey: 'tipo_movimiento',
    fieldKey: 'codigo',
    policy: 'AUTO_DEFAULT',
    meta: {
      entityLabel: 'tipo de movimiento',
      prefixHint: 'TM',
      exampleFormat: '001',
      scopeLabel: 'empresa',
      maxLength: 20,
    },
  },
  {
    sequenceKey: INV_CODIGO_SEQUENCE_KEYS.almacen,
    moduleCode: 'inv',
    entityKey: 'almacen',
    fieldKey: 'codigo',
    policy: 'AUTO_DEFAULT',
    meta: {
      entityLabel: 'almacén',
      prefixHint: 'ALM',
      exampleFormat: '001',
      scopeLabel: 'empresa',
      maxLength: 20,
    },
  },
  {
    sequenceKey: INV_CODIGO_SEQUENCE_KEYS.producto,
    moduleCode: 'inv',
    entityKey: 'producto',
    fieldKey: 'codigo_sku',
    policy: 'AUTO_DEFAULT',
    meta: {
      entityLabel: 'producto',
      prefixHint: 'P',
      exampleFormat: '00001',
      scopeLabel: 'empresa',
      maxLength: 50,
    },
  },
  {
    sequenceKey: INV_CODIGO_SEQUENCE_KEYS.movimiento,
    moduleCode: 'inv',
    entityKey: 'movimiento',
    fieldKey: 'numero_movimiento',
    policy: 'AUTO_REQUIRED',
    meta: {
      entityLabel: 'movimiento',
      prefixHint: 'MOV',
      exampleFormat: '000001',
      scopeLabel: 'empresa',
    },
  },
  {
    sequenceKey: INV_CODIGO_SEQUENCE_KEYS.inventarioFisico,
    moduleCode: 'inv',
    entityKey: 'inventario_fisico',
    fieldKey: 'numero_inventario',
    policy: 'AUTO_REQUIRED',
    meta: {
      entityLabel: 'inventario físico',
      prefixHint: 'IF',
      exampleFormat: '00001',
      scopeLabel: 'empresa',
    },
  },
];
