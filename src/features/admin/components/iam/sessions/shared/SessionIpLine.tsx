import { AlertTriangle } from 'lucide-react';

import type { AdminSessionRead } from '@/features/admin/types/session.types';
import type { SessionSharedLayout } from '@/features/admin/components/iam/sessions/shared/session-view.types';
import { formatLastSeenIp, resolveSessionIpMismatch } from '@/features/admin/utils/iam-session-ip.utils';

export interface SessionIpLineProps {
  session: AdminSessionRead;
  layout?: SessionSharedLayout;
}

/** IP last seen + alerta mismatch — Fase 4 shared. */
export function SessionIpLine({ session, layout = 'table' }: SessionIpLineProps) {
  const ipMismatch = resolveSessionIpMismatch(session);
  const ipText = formatLastSeenIp(session);

  if (layout === 'card') {
    return (
      <div
        className="flex h-5 min-h-5 min-w-0 items-center gap-1 font-mono text-sm leading-5 text-text-soft"
        title={ipText}
      >
        <span className="min-w-0 flex-1 truncate">{ipText}</span>
        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
          {ipMismatch ? (
            <AlertTriangle
              className="h-4 w-4 text-warning"
              aria-label="IP de inicio difiere de la última IP conocida"
              title="IP de inicio difiere de la última IP conocida"
            />
          ) : null}
        </span>
      </div>
    );
  }

  return (
    <span
      className="inline-flex min-w-0 max-w-full items-center gap-1 font-mono text-sm text-text-soft"
      title={ipText}
    >
      <span className="truncate">{ipText}</span>
      {ipMismatch ? (
        <AlertTriangle
          className="h-4 w-4 shrink-0 text-warning"
          aria-label="IP de inicio difiere de la última IP conocida"
          title="IP de inicio difiere de la última IP conocida"
        />
      ) : null}
    </span>
  );
}
