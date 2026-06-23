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

/** RC1 — `issued_at` con fallback legacy `created_at`. */
export function formatIssuedAt(session: {
  issued_at?: string;
  created_at: string;
}): string {
  return formatSessionDateTime(session.issued_at ?? session.created_at);
}

/** RC1 — `last_refresh_at` con fallback legacy `last_used_at`. */
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

/** Etiqueta badge — consume únicamente `status` del Backend RC1. */
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
