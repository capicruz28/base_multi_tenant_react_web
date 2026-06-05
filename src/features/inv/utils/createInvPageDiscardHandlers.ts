import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Blocker, NavigateFunction } from 'react-router-dom';
import type { OrgDiscardPending } from '@/features/org/types/org-discard.types';

export interface InvPageDiscardHandlerConfig {
  discardPending: OrgDiscardPending;
  setDiscardPending: Dispatch<SetStateAction<OrgDiscardPending>>;
  isSubmitting: boolean;
  isDirty: boolean;
  isEdit: boolean;
  closeForm: () => void;
  navigate: NavigateFunction;
  pendingExitPathRef: MutableRefObject<string | null>;
  blockerRef: MutableRefObject<Blocker | null>;
}

export function createInvPageDiscardHandlers({
  discardPending,
  setDiscardPending,
  isSubmitting,
  isDirty,
  isEdit,
  closeForm,
  navigate,
  pendingExitPathRef,
  blockerRef,
}: InvPageDiscardHandlerConfig) {
  const handleRequestLeave = (exitPath: string) => {
    if (isSubmitting) return;
    if (!isDirty) {
      navigate(exitPath);
      return;
    }
    pendingExitPathRef.current = exitPath;
    setDiscardPending(isEdit ? 'edit' : 'create');
  };

  const handleDiscardCancel = () => {
    setDiscardPending(null);
    pendingExitPathRef.current = null;
    const blocker = blockerRef.current;
    if (blocker?.state === 'blocked') {
      blocker.reset();
    }
  };

  const handleDiscardConfirm = () => {
    setDiscardPending(null);
    closeForm();
    const blocker = blockerRef.current;
    if (blocker?.state === 'blocked') {
      pendingExitPathRef.current = null;
      blocker.proceed();
      return;
    }
    const path = pendingExitPathRef.current;
    pendingExitPathRef.current = null;
    if (path) {
      navigate(path);
    }
  };

  return {
    handleRequestLeave,
    handleDiscardCancel,
    handleDiscardConfirm,
    /** Expuesto para tests / integración con blocker effect. */
    discardPending,
  };
}
