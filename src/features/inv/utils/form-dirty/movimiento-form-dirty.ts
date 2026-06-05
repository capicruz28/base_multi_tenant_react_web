import { formsDirtyEqual, lineasDirtyEqual, optId, str } from './inv-form-dirty.helpers';

export interface MovimientoLineaDirtyInput {
  producto_id: string;
  unidad_medida_id: string;
  cantidad: string;
  cantidad_base: string;
  costo_unitario: string;
}

export interface MovimientoFormDirtyInput {
  numeroMovimiento: string;
  tipoMovimientoId: string;
  fechaMovimiento: string;
  fechaContable: string;
  almacenOrigenId: string;
  almacenDestinoId: string;
  monedaId: string;
  observaciones: string;
  lineas: MovimientoLineaDirtyInput[];
}

export type MovimientoFormSnapshot = ReturnType<typeof normalizeMovimientoForm>;

function normalizeLinea(line: MovimientoLineaDirtyInput) {
  return {
    producto_id: optId(line.producto_id),
    unidad_medida_id: optId(line.unidad_medida_id),
    cantidad: str(line.cantidad),
    cantidad_base: str(line.cantidad_base),
    costo_unitario: str(line.costo_unitario) === '' ? null : str(line.costo_unitario),
  };
}

export function isEmptyMovimientoLinea(line: MovimientoLineaDirtyInput): boolean {
  return (
    !optId(line.producto_id) &&
    !optId(line.unidad_medida_id) &&
    str(line.cantidad) === '' &&
    str(line.cantidad_base) === '' &&
    str(line.costo_unitario) === ''
  );
}

function normalizeMovimientoForm(state: MovimientoFormDirtyInput) {
  return {
    numeroMovimiento: str(state.numeroMovimiento),
    tipoMovimientoId: optId(state.tipoMovimientoId),
    fechaMovimiento: str(state.fechaMovimiento),
    fechaContable: str(state.fechaContable),
    almacenOrigenId: optId(state.almacenOrigenId),
    almacenDestinoId: optId(state.almacenDestinoId),
    monedaId: optId(state.monedaId),
    observaciones: str(state.observaciones),
    lineas: state.lineas
      .map(normalizeLinea)
      .filter((_, i) => !isEmptyMovimientoLinea(state.lineas[i])),
  };
}

export function buildMovimientoFormSnapshot(state: MovimientoFormDirtyInput): MovimientoFormSnapshot {
  return normalizeMovimientoForm(state);
}

export function buildMovimientoCreateBaseline(
  partial?: Partial<Pick<MovimientoFormDirtyInput, 'fechaMovimiento' | 'fechaContable' | 'monedaId'>>,
): MovimientoFormDirtyInput {
  const today = new Date().toISOString().slice(0, 10);
  return {
    numeroMovimiento: '',
    tipoMovimientoId: '',
    fechaMovimiento: partial?.fechaMovimiento ?? today,
    fechaContable: partial?.fechaContable ?? today,
    almacenOrigenId: '',
    almacenDestinoId: '',
    monedaId: partial?.monedaId ?? '',
    observaciones: '',
    lineas: [
      {
        producto_id: '',
        unidad_medida_id: '',
        cantidad: '',
        cantidad_base: '',
        costo_unitario: '',
      },
    ],
  };
}

export function isCreateMovimientoDirty(
  state: MovimientoFormDirtyInput,
  baseline: MovimientoFormDirtyInput,
): boolean {
  return formsDirtyEqual(normalizeMovimientoForm(state), normalizeMovimientoForm(baseline));
}

export function isEditMovimientoDirty(
  state: MovimientoFormDirtyInput,
  snapshot: MovimientoFormSnapshot | null,
): boolean {
  if (!snapshot) return false;
  return formsDirtyEqual(normalizeMovimientoForm(state), snapshot);
}

/** Compara solo líneas — útil en tests; cabecera+líneas van en normalizeMovimientoForm. */
export function movimientoLineasDirtyEqual(
  a: MovimientoLineaDirtyInput[],
  b: MovimientoLineaDirtyInput[],
): boolean {
  return lineasDirtyEqual(a, b, normalizeLinea, isEmptyMovimientoLinea);
}
