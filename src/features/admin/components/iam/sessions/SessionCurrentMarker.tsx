import { Check } from 'lucide-react';

/** Marcador accesible de sesión actual — icono + texto + estilo brand (no solo color). */
export function SessionCurrentMarker() {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide bg-brand-primary/10 text-brand-primary border border-brand-primary/40 rounded-full px-2 py-0.5 shrink-0"
      role="status"
      aria-label="Esta sesión"
      data-testid="session-current-marker"
    >
      <Check className="h-3 w-3 shrink-0" aria-hidden />
      <span>ESTA SESIÓN</span>
    </span>
  );
}

/** Fondo resaltado — aplicar en `<tr>` o contenedor card. */
export function getCurrentSessionRowClass(isCurrent: boolean): string {
  if (!isCurrent) {
    return 'hover:bg-overlay/50';
  }
  return 'bg-brand-primary/5 hover:bg-brand-primary/10';
}

/**
 * Borde izquierdo brand — aplicar en la primera `<td>` visible (border en `<tr>` no renderiza en tablas HTML).
 */
export function getCurrentSessionLeadingCellClass(isCurrent: boolean): string {
  return isCurrent ? 'border-l-4 border-l-brand-primary' : '';
}

export function getCurrentSessionCardClass(isCurrent: boolean): string {
  if (!isCurrent) {
    return 'border-border-base hover:shadow-md';
  }
  return 'border-brand-primary ring-2 ring-brand-primary/25 bg-brand-primary/5 hover:shadow-md';
}
