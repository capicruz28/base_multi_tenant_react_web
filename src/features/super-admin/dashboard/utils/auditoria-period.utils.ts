const MS_24H = 24 * 60 * 60 * 1000;

export type AuditoriaPeriodRange = {
  fecha_desde: string;
  fecha_hasta: string;
};

/** Ventana móvil de 24 horas para KPIs de seguridad (contrato §1.4). */
export function getLast24HoursRange(now: Date = new Date()): AuditoriaPeriodRange {
  const fecha_hasta = now.toISOString();
  const fecha_desde = new Date(now.getTime() - MS_24H).toISOString();
  return { fecha_desde, fecha_hasta };
}
