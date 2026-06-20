import { parseUserAgentSummary } from '@/features/admin/utils/iam-session-user-agent.utils';

const DATE_PLACEHOLDER = '—';

export type SessionExpirationStatus = 'active' | 'expiring_soon' | 'expired';

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

export function formatLastUsedAt(value: string | null | undefined): string {
  if (value == null || value.trim() === '') {
    return 'Nunca utilizada';
  }
  const formatted = formatSessionDateTime(value);
  return formatted === DATE_PLACEHOLDER ? 'Nunca utilizada' : formatted;
}

export function formatDeviceName(value: string | null | undefined): string {
  if (value == null || value.trim() === '') {
    return DATE_PLACEHOLDER;
  }
  return value;
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

export function getSessionExpirationStatus(expiresAt: string | null | undefined): SessionExpirationStatus | null {
  if (expiresAt == null || expiresAt.trim() === '') {
    return null;
  }
  const expiration = new Date(expiresAt);
  if (Number.isNaN(expiration.getTime())) {
    return null;
  }
  const diffHours = (expiration.getTime() - Date.now()) / (1000 * 60 * 60);
  if (diffHours < 0) {
    return 'expired';
  }
  if (diffHours < 24) {
    return 'expiring_soon';
  }
  return 'active';
}

export function getSessionExpirationBadgeLabel(status: SessionExpirationStatus | null): string {
  switch (status) {
    case 'expired':
      return 'Expirada';
    case 'expiring_soon':
      return 'Expira pronto';
    case 'active':
      return 'Activa';
    default:
      return DATE_PLACEHOLDER;
  }
}

export function getSessionExpirationBadgeClass(status: SessionExpirationStatus | null): string {
  switch (status) {
    case 'expired':
      return 'bg-error/10 text-error';
    case 'expiring_soon':
      return 'bg-warning/10 text-warning';
    case 'active':
      return 'bg-success/10 text-success';
    default:
      return 'bg-subtle text-text-soft';
  }
}

export function formatBrowserLabel(userAgent: string | null | undefined): string {
  return parseUserAgentSummary(userAgent).browser;
}

export function formatOsLabel(userAgent: string | null | undefined): string {
  return parseUserAgentSummary(userAgent).os;
}
