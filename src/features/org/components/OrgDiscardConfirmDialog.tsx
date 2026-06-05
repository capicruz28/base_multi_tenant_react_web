import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import type { OrgDiscardPending } from '../types/org-discard.types';

interface OrgDiscardConfirmDialogProps {
  discardPending: OrgDiscardPending;
  entityLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function OrgDiscardConfirmDialog({
  discardPending,
  entityLabel,
  onClose,
  onConfirm,
}: OrgDiscardConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={discardPending !== null}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Descartar cambios"
      message={
        discardPending === 'create'
          ? `Hay cambios sin guardar. ¿Desea cerrar sin crear ${entityLabel}?`
          : discardPending === 'edit'
            ? 'Hay cambios sin guardar. ¿Desea cerrar sin guardar?'
            : ''
      }
      confirmText="Sí, descartar"
      cancelText="Seguir editando"
      variant="warning"
    />
  );
}
