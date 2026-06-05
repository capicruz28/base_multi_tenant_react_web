export type EventTypeChartSegment = {
  key: string;
  label: string;
  value: number;
};

const formatEventTypeLabel = (eventType: string): string =>
  eventType
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export function toEventTypeChartSegments(
  eventosPorTipo: Record<string, number> | undefined,
): EventTypeChartSegment[] {
  if (!eventosPorTipo) return [];

  return Object.entries(eventosPorTipo)
    .filter(([, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([key, value]) => ({
      key,
      label: formatEventTypeLabel(key),
      value,
    }));
}
