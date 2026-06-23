import { AlertTriangle } from 'lucide-react';

import type { UserSessionStatus } from '@/features/admin/types/session.types';
import {
  getSessionStatusBadgeClass,
  getSessionStatusBadgeLabel,
} from '@/features/admin/utils/iam-session-display.utils';

export interface SessionStatusBadgeProps {
  status: UserSessionStatus | undefined;
}

/** Badge de estado — consume únicamente `status` del Backend RC1. */
export function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
  const label = getSessionStatusBadgeLabel(status);
  const className = getSessionStatusBadgeClass(status);

  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${className}`}
    >
      {status === 'expiring_soon' ? <AlertTriangle className="h-3 w-3" aria-hidden /> : null}
      {label}
    </span>
  );
}
