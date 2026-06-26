import { Globe, Monitor, Smartphone } from 'lucide-react';

export type SessionClientTypeIconSize = 'sm' | 'md';

const SIZE_CLASS: Record<SessionClientTypeIconSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
};

export interface SessionClientTypeIconProps {
  clientType: string;
  size?: SessionClientTypeIconSize;
}

/** Icono tipo cliente web/mobile — Fase 4 shared. */
export function SessionClientTypeIcon({ clientType, size = 'sm' }: SessionClientTypeIconProps) {
  const sizeClass = `${SIZE_CLASS[size]} shrink-0`;

  switch (clientType.toLowerCase()) {
    case 'web':
      return <Monitor className={`${sizeClass} text-info`} aria-hidden />;
    case 'mobile':
      return <Smartphone className={`${sizeClass} text-success`} aria-hidden />;
    default:
      return <Globe className={`${sizeClass} text-text-soft`} aria-hidden />;
  }
}
