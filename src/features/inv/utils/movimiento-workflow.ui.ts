import type { Movimiento, TipoMovimiento } from '../types/inv.types';

export type MovimientoWorkflowInput = Pick<
  Movimiento,
  'estado' | 'requiere_autorizacion' | 'documento_referencia_tipo' | 'tipo_movimiento_id'
>;

const ESTADOS_TERMINALES = new Set(['procesado', 'anulado', 'estornado']);
const REFERENCIAS_NO_ESTORNABLES = new Set(['inventario_fisico', 'recepcion']);

function normalizeEstado(estado: string | null | undefined): string {
  return estado?.trim() || 'borrador';
}

/**
 * Flag efectivo para la matriz §5.5 — RC1 nota 1:
 * `requiere_autorizacion === true` del movimiento **o** del tipo seleccionado.
 *
 * Combinación OR: basta que cualquiera de las dos fuentes sea `true`.
 * Un `false` explícito en el movimiento (default OpenAPI) no anula un tipo que sí requiere autorización.
 */
export function resolveRequiereAutorizacion(
  mov: MovimientoWorkflowInput,
  tipoMovimiento?: Pick<TipoMovimiento, 'requiere_autorizacion'> | null,
): boolean {
  return mov.requiere_autorizacion === true || tipoMovimiento?.requiere_autorizacion === true;
}

/** RC1 §5.5 — Autorizar: borrador y requiere_autorizacion === true. */
export function puedeAutorizarMovimiento(
  mov: MovimientoWorkflowInput,
  requiereAutorizacion: boolean,
): boolean {
  const estado = normalizeEstado(mov.estado);
  return estado === 'borrador' && requiereAutorizacion;
}

/** RC1 §5.5 — Procesar: autorizado, o borrador sin autorización previa. */
export function puedeProcesarMovimiento(
  mov: MovimientoWorkflowInput,
  requiereAutorizacion: boolean,
): boolean {
  const estado = normalizeEstado(mov.estado);
  if (estado === 'autorizado') return true;
  if (estado === 'borrador') return !requiereAutorizacion;
  return false;
}

/** RC1 §5.5 — Anular: borrador o autorizado. */
export function puedeAnularMovimiento(mov: MovimientoWorkflowInput): boolean {
  const estado = normalizeEstado(mov.estado);
  return estado === 'borrador' || estado === 'autorizado';
}

/** RC1 §5.6 — Estornar: procesado, sin referencia bloqueada. */
export function puedeEstornarMovimiento(mov: MovimientoWorkflowInput): boolean {
  const estado = normalizeEstado(mov.estado);
  if (estado !== 'procesado') return false;
  const refTipo = mov.documento_referencia_tipo?.trim().toLowerCase();
  if (refTipo && REFERENCIAS_NO_ESTORNABLES.has(refTipo)) return false;
  return true;
}

/** RC1 §5.5 — Editar documento: solo borrador. */
export function puedeEditarMovimientoDocumento(mov: MovimientoWorkflowInput): boolean {
  const estado = normalizeEstado(mov.estado);
  return estado === 'borrador';
}

export function esEstadoMovimientoTerminal(estado: string | null | undefined): boolean {
  return ESTADOS_TERMINALES.has(normalizeEstado(estado));
}
