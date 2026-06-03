import { describe, expect, it } from 'vitest';
import {
  CREATE_MODULO_DEFAULT,
  buildEditModuloFormSnapshot,
  isCreateModuloDirty,
  isEditModuloDirty,
} from '../modulo-form-dirty';
import type { ModuloV2 } from '@/features/modulos/types/modulo-v2.types';

describe('modulo-form-dirty', () => {
  it('create: baseline no es dirty', () => {
    expect(isCreateModuloDirty({ ...CREATE_MODULO_DEFAULT })).toBe(false);
  });

  it('create: nombre modificado es dirty', () => {
    expect(
      isCreateModuloDirty({ ...CREATE_MODULO_DEFAULT, nombre: 'Inventario' }),
    ).toBe(true);
  });

  it('edit: sin cambios no es dirty', () => {
    const modulo: ModuloV2 = {
      modulo_id: '1',
      codigo: 'INV',
      nombre: 'Inventario',
      descripcion: null,
      icono: 'Package',
      color: '#6366f1',
      categoria: 'Operaciones',
      orden: 1,
      es_activo: true,
      fecha_creacion: '',
      fecha_actualizacion: '',
    };
    const snapshot = buildEditModuloFormSnapshot(modulo);
    expect(isEditModuloDirty({ ...modulo }, snapshot)).toBe(false);
  });

  it('edit: categoría modificada es dirty', () => {
    const modulo: ModuloV2 = {
      modulo_id: '1',
      codigo: 'INV',
      nombre: 'Inventario',
      descripcion: null,
      icono: 'Package',
      color: '#6366f1',
      categoria: 'Operaciones',
      orden: 1,
      es_activo: true,
      fecha_creacion: '',
      fecha_actualizacion: '',
    };
    const snapshot = buildEditModuloFormSnapshot(modulo);
    expect(
      isEditModuloDirty({ ...modulo, categoria: 'Finanzas' }, snapshot),
    ).toBe(true);
  });
});
