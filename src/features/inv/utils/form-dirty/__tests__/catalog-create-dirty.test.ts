import { describe, expect, it } from 'vitest';
import { isCreateAlmacenDirty } from '../almacen-form-dirty';
import { isCreateCategoriaDirty } from '../categoria-form-dirty';
import { isCreateTipoMovimientoDirty } from '../tipo-movimiento-form-dirty';
import { isCreateUnidadMedidaDirty } from '../unidad-medida-form-dirty';

/** Formas equivalentes a openCreate() en cada página catálogo INV. */
const OPEN_CREATE_FORMS = {
  almacen: {
    empresa_id: 'empresa-test',
    codigo: '',
    nombre: '',
    tipo_almacen: 'general',
    permite_compras: true,
    es_activo: true,
  },
  categoria: {
    empresa_id: 'empresa-test',
    codigo: '',
    nombre: '',
    metodo_costeo_defecto: 'promedio',
    es_activo: true,
  },
  tipoMovimiento: {
    empresa_id: 'empresa-test',
    codigo: '',
    nombre: '',
    clase_movimiento: 'ENTRADA',
    afecta_costo: true,
    requiere_autorizacion: false,
    genera_asiento_contable: false,
    es_activo: true,
  },
  unidadMedida: {
    empresa_id: 'empresa-test',
    codigo: '',
    nombre: '',
    tipo_unidad: 'cantidad',
    es_unidad_base: false,
    decimales_permitidos: 2,
    es_activo: true,
  },
} as const;

describe('INV catalog create dirty baselines', () => {
  it('almacén: openCreate sin cambios no es dirty', () => {
    expect(isCreateAlmacenDirty(OPEN_CREATE_FORMS.almacen)).toBe(false);
  });

  it('categoría: openCreate sin cambios no es dirty', () => {
    expect(isCreateCategoriaDirty(OPEN_CREATE_FORMS.categoria)).toBe(false);
  });

  it('tipo movimiento: openCreate sin cambios no es dirty', () => {
    expect(isCreateTipoMovimientoDirty(OPEN_CREATE_FORMS.tipoMovimiento)).toBe(false);
  });

  it('unidad medida: openCreate sin cambios no es dirty', () => {
    expect(isCreateUnidadMedidaDirty(OPEN_CREATE_FORMS.unidadMedida)).toBe(false);
  });

  it('tipo movimiento: modificar nombre es dirty', () => {
    expect(
      isCreateTipoMovimientoDirty({ ...OPEN_CREATE_FORMS.tipoMovimiento, nombre: 'Ajuste' }),
    ).toBe(true);
  });
});
