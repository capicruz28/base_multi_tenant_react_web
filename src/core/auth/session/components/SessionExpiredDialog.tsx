/**
 * Modal global sesión expirada — IAM-FE-PHASE-07 IMPL-07 (L7-E).
 */

import { useCallback } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import type { SessionTerminationSeverity } from '@/core/auth/session/session-termination-reason';
import type { SessionExpiredDialogModel } from '@/core/auth/session/session-ux.types';

const SEVERITY_TITLE: Readonly<Record<SessionTerminationSeverity, string>> = {
  error: 'Sesión finalizada',
  warning: 'Sesión cerrada',
  info: 'Sesión finalizada',
};

export interface SessionExpiredDialogProps {
  readonly model: SessionExpiredDialogModel | null;
  readonly onAck: () => void;
  readonly onClose?: () => void;
}

export function SessionExpiredDialog({
  model,
  onAck,
  onClose,
}: SessionExpiredDialogProps) {
  const isOpen = model !== null;

  const handleAck = useCallback(() => {
    onAck();
    onClose?.();
  }, [onAck, onClose]);

  const severity = model?.severity ?? 'error';
  const title = SEVERITY_TITLE[severity];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && isOpen) {
          handleAck();
        }
      }}
    >
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{model?.message ?? ''}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            onClick={handleAck}
            className="inline-flex items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
          >
            Ir a iniciar sesión
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
