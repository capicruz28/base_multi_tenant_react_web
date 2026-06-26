import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import type { AdminSessionRead } from '@/features/admin/types/session.types';
import { SessionCurrentMarker } from '@/features/admin/components/iam/sessions/SessionCurrentMarker';
import { SessionStatusBadge } from '@/features/admin/components/iam/sessions/SessionStatusBadge';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  formatEmpresaNombre,
  formatIssuedAt,
  formatLastRefreshAt,
  formatSessionDateTime,
  formatSessionDurationSeconds,
  formatUserDisplayName,
  getSessionCloseActionLabel,
} from '@/features/admin/utils/iam-session-display.utils';
import {
  formatLastSeenIp,
  formatLoginIp,
  resolveSessionIpMismatch,
} from '@/features/admin/utils/iam-session-ip.utils';

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-soft">{title}</h3>
      <div className="space-y-1 text-sm text-text-base">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <span className="shrink-0 text-text-soft sm:w-40">{label}</span>
      <span className="min-w-0 break-words">{value}</span>
    </div>
  );
}

function ClientTypeChip({ clientType }: { clientType: string }) {
  const label =
    clientType.toLowerCase() === 'mobile'
      ? 'Mobile'
      : clientType.toLowerCase() === 'web'
        ? 'Web'
        : clientType;
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium capitalize bg-subtle text-text-soft">
      {label}
    </span>
  );
}

function formatDeviceLine(session: AdminSessionRead): string {
  const browser = session.device?.browser?.trim() || '—';
  const os = session.device?.os?.trim() || '—';
  const platform = session.device?.platform?.trim() || '—';
  return `${browser} · ${os} · ${platform}`;
}

export interface SessionDetailDialogProps {
  session: AdminSessionRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCurrentSession: boolean;
  onRevokeRequest: (session: AdminSessionRead) => void;
  revokeDisabled?: boolean;
}

/** Dialog detalle sesión admin — spec v1.1 §5 (Fase 2). */
export function SessionDetailDialog({
  session,
  open,
  onOpenChange,
  isCurrentSession,
  onRevokeRequest,
  revokeDisabled = false,
}: SessionDetailDialogProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setAdvancedOpen(false);
    }
  }, [open]);

  if (!session) {
    return null;
  }

  const closeLabel = getSessionCloseActionLabel(isCurrentSession);
  const ipMismatch = resolveSessionIpMismatch(session);
  const lastBusinessActivity = session.last_business_activity_at
    ? formatSessionDateTime(session.last_business_activity_at)
    : '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Detalle de sesión</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-5">
          <DetailSection title="Identidad">
            <p className="text-base font-semibold text-text-base">{session.nombre_usuario ?? '—'}</p>
            <p className="text-text-soft">{formatUserDisplayName(session)}</p>
            <p className="text-text-soft">Empresa: {formatEmpresaNombre(session.empresa_nombre)}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <SessionStatusBadge status={session.status} />
              {isCurrentSession ? <SessionCurrentMarker /> : null}
            </div>
          </DetailSection>

          <DetailSection title="Dispositivo">
            <p>{session.device?.device_label?.trim() || '—'}</p>
            <div className="flex flex-wrap items-center gap-2 text-text-soft">
              <span>{formatDeviceLine(session)}</span>
              <ClientTypeChip clientType={session.client_type} />
            </div>
          </DetailSection>

          <DetailSection title="Red">
            <DetailRow label="IP última conexión" value={formatLastSeenIp(session)} />
            <DetailRow label="IP inicio sesión" value={formatLoginIp(session)} />
            {ipMismatch ? (
              <p className="text-sm text-warning bg-warning/10 rounded-md px-3 py-2">
                La IP de inicio de sesión difiere de la última IP conocida. Revise si la sesión es
                legítima.
              </p>
            ) : null}
          </DetailSection>

          <DetailSection title="Tiempos">
            <DetailRow label="Inicio sesión" value={formatIssuedAt(session)} />
            <DetailRow label="Último refresh" value={formatLastRefreshAt(session)} />
            <p className="text-xs text-text-faint">
              Último refresh de token, no actividad en pantallas ERP.
            </p>
            <DetailRow label="Última act. ERP" value={lastBusinessActivity} />
            <p className="text-xs text-text-faint">
              Actualización aproximada (throttle backend ~5 min). No cierra sesión.
            </p>
            <DetailRow label="Expira" value={formatSessionDateTime(session.expires_at)} />
            <DetailRow
              label="Duración sesión"
              value={formatSessionDurationSeconds(session.duration_seconds)}
            />
          </DetailSection>

          <section className="space-y-2">
            <button
              type="button"
              onClick={() => setAdvancedOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 text-sm font-medium text-text-soft hover:text-text-base"
              aria-expanded={advancedOpen}
            >
              {advancedOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
              )}
              Diagnóstico avanzado
            </button>
            {advancedOpen ? (
              <div className="rounded-md border border-border-base bg-subtle p-3">
                <p className="mb-1 text-xs font-medium text-text-soft">User-Agent</p>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-text-base">
                  {session.user_agent?.trim() || '—'}
                </pre>
              </div>
            ) : null}
          </section>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={revokeDisabled}
            onClick={() => onRevokeRequest(session)}
          >
            {closeLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
