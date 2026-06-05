/**
 * Factories de línea vacía y helpers de fecha para reset create (INV-M2-SEC O5).
 */

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function newMovimientoLineaKey(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createEmptyMovimientoLinea() {
  return {
    key: newMovimientoLineaKey(),
    producto_id: '',
    unidad_medida_id: '',
    cantidad: '',
    cantidad_base: '',
    costo_unitario: '',
  };
}

export function newInventarioFisicoLineaKey(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createEmptyInventarioFisicoLinea() {
  return {
    key: newInventarioFisicoLineaKey(),
    producto_id: '',
    cantidad_sistema: '',
    cantidad_contada: '',
  };
}
