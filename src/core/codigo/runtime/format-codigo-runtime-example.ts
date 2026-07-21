/**
 * Ejemplo visual de formato desde ítem Runtime Snapshot.
 * No calcula correlativo real — solo padding de muestra.
 */

export function formatCodigoRuntimeExample(item: {
  prefijo: string;
  separador: string;
  longitud_numero: number;
}): string {
  const prefijo = (item.prefijo ?? '').trim();
  const sep = item.separador === '-' ? '-' : item.separador === '' ? '' : String(item.separador ?? '');
  const len =
    Number.isInteger(item.longitud_numero) && item.longitud_numero >= 1
      ? item.longitud_numero
      : 1;
  return `${prefijo}${sep}${String(1).padStart(len, '0')}`;
}
