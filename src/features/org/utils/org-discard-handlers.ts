import type { Dispatch, SetStateAction } from 'react';
import { scheduleModalStackValidation } from '@/features/admin/utils/iam-modal-stack-validation';
import type { OrgDiscardPending } from '../types/org-discard.types';

export interface OrgDiscardHandlerConfig {
  discardPending: OrgDiscardPending;
  setDiscardPending: Dispatch<SetStateAction<OrgDiscardPending>>;
  isSubmitting: boolean;
  isCreateDirty: boolean;
  isEditDirty: boolean;
  setCreateOpen: (open: boolean) => void;
  setEditOpen: (open: boolean) => void;
  closeCreate: () => void;
  closeEdit: () => void;
  /** Prefijo para logs DEV de stack modal (ej. org-centro-costo). */
  contextPrefix: string;
}

export function createOrgDiscardHandlers({
  discardPending,
  setDiscardPending,
  isSubmitting,
  isCreateDirty,
  isEditDirty,
  setCreateOpen,
  setEditOpen,
  closeCreate,
  closeEdit,
  contextPrefix,
}: OrgDiscardHandlerConfig) {
  const handleRequestCloseCreate = () => {
    if (isSubmitting) return;
    if (isCreateDirty) {
      setCreateOpen(false);
      setDiscardPending('create');
      scheduleModalStackValidation(`${contextPrefix}-create-request-close-dirty`);
      return;
    }
    closeCreate();
  };

  const handleRequestCloseEdit = () => {
    if (isSubmitting) return;
    if (isEditDirty) {
      setEditOpen(false);
      setDiscardPending('edit');
      scheduleModalStackValidation(`${contextPrefix}-edit-request-close-dirty`);
      return;
    }
    closeEdit();
  };

  const handleDiscardCancel = () => {
    const pending = discardPending;
    setDiscardPending(null);
    if (pending === 'create') {
      setCreateOpen(true);
    } else if (pending === 'edit') {
      setEditOpen(true);
    }
    scheduleModalStackValidation(`${contextPrefix}-discard-cancel-resume`);
  };

  const handleDiscardConfirm = () => {
    const pending = discardPending;
    setDiscardPending(null);
    if (pending === 'create') {
      closeCreate();
    } else if (pending === 'edit') {
      closeEdit();
    }
    scheduleModalStackValidation(`${contextPrefix}-discard-confirmed`);
  };

  const handleCreateDialogOpenChange = (next: boolean) => {
    if (isSubmitting) return;
    if (next) {
      setCreateOpen(true);
      return;
    }
    handleRequestCloseCreate();
  };

  const handleEditDialogOpenChange = (next: boolean) => {
    if (isSubmitting) return;
    if (next) {
      setEditOpen(true);
      return;
    }
    handleRequestCloseEdit();
  };

  return {
    handleRequestCloseCreate,
    handleRequestCloseEdit,
    handleDiscardCancel,
    handleDiscardConfirm,
    handleCreateDialogOpenChange,
    handleEditDialogOpenChange,
  };
}
