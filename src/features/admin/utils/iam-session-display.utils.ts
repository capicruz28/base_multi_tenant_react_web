import type { UserSessionStatus } from '@/features/admin/types/session.types';

const DATE_PLACEHOLDER = '—';

export function formatSessionDateTime(value: string | null | undefined): string {
  if (value == null || value.trim() === '') {
    return DATE_PLACEHOLDER;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return DATE_PLACEHOLDER;
  }
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

/** V2 — `issued_at` = inicio de sesión; fallback alias legacy `created_at`. */
export function formatIssuedAt(session: {
  issued_at?: string;
  created_at: string;
}): string {
  return formatSessionDateTime(session.issued_at ?? session.created_at);
}

/** V2 — `last_refresh_at` = último refresh; fallback alias legacy `last_used_at`. */
export function formatLastRefreshAt(session: {
  last_refresh_at?: string | null;
  last_used_at?: string | null;
}): string {
  const value = session.last_refresh_at ?? session.last_used_at;
  if (value == null || value.trim() === '') {
    return 'Sin refresh';
  }
  const formatted = formatSessionDateTime(value);
  return formatted === DATE_PLACEHOLDER ? 'Sin refresh' : formatted;
}

export function formatUserDisplayName(session: {
  nombre_usuario: string | null;
  nombre: string | null;
  apellido: string | null;
}): string {
  const full = `${session.nombre ?? ''} ${session.apellido ?? ''}`.trim();
  if (full) return full;
  return session.nombre_usuario ?? DATE_PLACEHOLDER;
}

export function formatEmpresaNombre(value: string | null | undefined): string {
  if (value == null || value.trim() === '') {
    return DATE_PLACEHOLDER;
  }
  return value;
}

/** Etiqueta badge — consume únicamente `status` del Backend (V2). */
export function getSessionStatusBadgeLabel(status: UserSessionStatus | undefined): string {
  switch (status) {
    case 'expiring_soon':
      return 'Expira pronto';
    case 'active':
      return 'Activa';
    default:
      return DATE_PLACEHOLDER;
  }
}

export function getSessionStatusBadgeClass(status: UserSessionStatus | undefined): string {
  switch (status) {
    case 'expiring_soon':
      return 'bg-warning/10 text-warning';
    case 'active':
      return 'bg-success/10 text-success';
    default:
      return 'bg-subtle text-text-soft';
  }
}

/** Copy acción cierre sesión — FE-IMPL-03-V2. */
export function getSessionCloseActionLabel(isCurrent: boolean): string {
  return isCurrent ? 'Cerrar esta sesión' : 'Cerrar sesión';
}

export type SessionRelativeTimeMode = 'past' | 'future';

const MS_MINUTE = 60_000;
const MS_HOUR = 3_600_000;
const MS_DAY = 86_400_000;

/**
 * Tiempo relativo IAM — spec v1.1 §10.
 * `past`: último refresh · `future`: expiración.
 */
export function formatSessionRelativeTime(
  value: string | null | undefined,
  mode: SessionRelativeTimeMode,
  now: Date = new Date(),
): string {
  if (value == null || value.trim() === '') {
    return mode === 'past' ? 'Sin refresh' : DATE_PLACEHOLDER;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return mode === 'past' ? 'Sin refresh' : DATE_PLACEHOLDER;
  }

  if (mode === 'future') {
    const diffMs = date.getTime() - now.getTime();
    if (diffMs <= 0) {
      return 'Expirada';
    }
    if (diffMs < MS_MINUTE) {
      return 'Expira en 1 min';
    }
    if (diffMs < MS_HOUR) {
      const minutes = Math.floor(diffMs / MS_MINUTE);
      return `Expira en ${minutes} min`;
    }
    if (diffMs < MS_DAY) {
      const hours = Math.floor(diffMs / MS_HOUR);
      return `Expira en ${hours} h`;
    }
    const days = Math.floor(diffMs / MS_DAY);
    return `Expira en ${days} días`;
  }

  const diffMs = now.getTime() - date.getTime();
  if (diffMs < MS_MINUTE) {
    return 'Ahora';
  }
  if (diffMs < MS_HOUR) {
    const minutes = Math.floor(diffMs / MS_MINUTE);
    return `Hace ${minutes} min`;
  }
  if (diffMs < MS_DAY) {
    const hours = Math.floor(diffMs / MS_HOUR);
    return `Hace ${hours} h`;
  }
  if (diffMs < 7 * MS_DAY) {
    const days = Math.floor(diffMs / MS_DAY);
    return `Hace ${days} días`;
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/** Tooltip absoluto para celdas con tiempo relativo. */
export function formatSessionAbsoluteTooltip(value: string | null | undefined): string | undefined {
  const formatted = formatSessionDateTime(value);
  return formatted === DATE_PLACEHOLDER ? undefined : formatted;
}

export function formatSessionLastRefreshRelative(
  session: {
    last_refresh_at?: string | null;
    last_used_at?: string | null;
  },
  now?: Date,
): string {
  const value = session.last_refresh_at ?? session.last_used_at;
  return formatSessionRelativeTime(value, 'past', now);
}

export function formatSessionExpiresRelative(
  session: { expires_at: string },
  now?: Date,
): string {
  return formatSessionRelativeTime(session.expires_at, 'future', now);
}

/** Duración legible desde `duration_seconds` — pie sección Tiempos (Dialog). */
export function formatSessionDurationSeconds(totalSeconds: number | undefined): string {
  if (totalSeconds == null || totalSeconds < 0 || Number.isNaN(totalSeconds)) {
    return DATE_PLACEHOLDER;
  }

  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);

  if (days > 0) {
    return hours > 0 ? `${days} días ${hours} h` : `${days} días`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  }
  if (minutes > 0) {
    return `${minutes} min`;
  }
  return 'Menos de 1 min';
}
