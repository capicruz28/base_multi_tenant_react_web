import type { PrcDecimalRead } from '../types/prc.types';

/** Convierte valores decimales del API (string | number) a número seguro para UI. */
export function prcToNumber(value: PrcDecimalRead | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Formato fijo para precios en tabla (evita crash si el API envía string). */
export function prcFormatMoney(value: string | number): string {
  return prcToNumber(value).toFixed(2);
}
