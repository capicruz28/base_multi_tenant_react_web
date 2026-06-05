import { formsDirtyEqual, lineasDirtyEqual, optId, str } from './inv-form-dirty.helpers';

export interface InventarioFisicoLineaDirtyInput {
  producto_id: string;
  cantidad_sistema: string;
  cantidad_contada: string;
}

export interface InventarioFisicoFormDirtyInput {
  numeroInventario: string;
  fechaInventario: string;
  almacenId: string;
  tipoInventario: string;
  descripcion: string;
  lineas: InventarioFisicoLineaDirtyInput[];
}

export type InventarioFisicoFormSnapshot = ReturnType<typeof normalizeInventarioFisicoForm>;

function normalizeLinea(line: InventarioFisicoLineaDirtyInput) {
  return {
    producto_id: optId(line.producto_id),
    cantidad_sistema: str(line.cantidad_sistema),
    cantidad_contada: str(line.cantidad_contada) === '' ? null : str(line.cantidad_contada),
  };
}

export function isEmptyInventarioFisicoLinea(line: InventarioFisicoLineaDirtyInput): boolean {
  return !optId(line.producto_id) && str(line.cantidad_sistema) === '' && str(line.cantidad_contada) === '';
}

function normalizeInventarioFisicoForm(state: InventarioFisicoFormDirtyInput) {
  return {
    numeroInventario: str(state.numeroInventario),
    fechaInventario: str(state.fechaInventario),
    almacenId: optId(state.almacenId),
    tipoInventario: str(state.tipoInventario) || 'total',
    descripcion: str(state.descripcion),
    lineas: state.lineas
      .map(normalizeLinea)
      .filter((_, i) => !isEmptyInventarioFisicoLinea(state.lineas[i])),
  };
}

export function buildInventarioFisicoFormSnapshot(
  state: InventarioFisicoFormDirtyInput,
): InventarioFisicoFormSnapshot {
  return normalizeInventarioFisicoForm(state);
}

export function buildInventarioFisicoCreateBaseline(
  partial?: Partial<Pick<InventarioFisicoFormDirtyInput, 'fechaInventario'>>,
): InventarioFisicoFormDirtyInput {
  const today = new Date().toISOString().slice(0, 10);
  return {
    numeroInventario: '',
    fechaInventario: partial?.fechaInventario ?? today,
    almacenId: '',
    tipoInventario: 'total',
    descripcion: '',
    lineas: [{ producto_id: '', cantidad_sistema: '', cantidad_contada: '' }],
  };
}

export function isCreateInventarioFisicoDirty(
  state: InventarioFisicoFormDirtyInput,
  baseline: InventarioFisicoFormDirtyInput,
): boolean {
  return formsDirtyEqual(normalizeInventarioFisicoForm(state), normalizeInventarioFisicoForm(baseline));
}

export function isEditInventarioFisicoDirty(
  state: InventarioFisicoFormDirtyInput,
  snapshot: InventarioFisicoFormSnapshot | null,
): boolean {
  if (!snapshot) return false;
  return formsDirtyEqual(normalizeInventarioFisicoForm(state), snapshot);
}

export function inventarioFisicoLineasDirtyEqual(
  a: InventarioFisicoLineaDirtyInput[],
  b: InventarioFisicoLineaDirtyInput[],
): boolean {
  return lineasDirtyEqual(a, b, normalizeLinea, isEmptyInventarioFisicoLinea);
}
