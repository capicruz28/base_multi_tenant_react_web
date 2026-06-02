import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import type { OrgDiscardPending } from '@/features/org/types/org-discard.types';

interface UseClienteModalDiscardOptions {
  isOpen: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onDiscardPendingChange?: (pending: OrgDiscardPending) => void;
}

export function useClienteModalDiscard({
  isOpen,
  isDirty,
  isSubmitting,
  mode,
  onClose,
  onDiscardPendingChange,
}: UseClienteModalDiscardOptions) {
  const [discardPending, setDiscardPending] = useState<OrgDiscardPending>(null);
  const [shellVisible, setShellVisible] = useState(true);

  useEffect(() => {
    onDiscardPendingChange?.(discardPending);
  }, [discardPending, onDiscardPendingChange]);

  useEffect(() => {
    if (isOpen) {
      setShellVisible(true);
      setDiscardPending(null);
    }
  }, [isOpen]);

  const handleRequestClose = useCallback(() => {
    if (isSubmitting) return;
    if (isDirty) {
      setShellVisible(false);
      setDiscardPending(mode);
      return;
    }
    onClose();
  }, [isDirty, isSubmitting, mode, onClose]);

  const handleDiscardCancel = useCallback(() => {
    setDiscardPending(null);
    setShellVisible(true);
  }, []);

  const handleDiscardConfirm = useCallback(() => {
    setDiscardPending(null);
    setShellVisible(true);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !shellVisible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      handleRequestClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, shellVisible, handleRequestClose]);

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        handleRequestClose();
      }
    },
    [handleRequestClose],
  );

  return {
    discardPending,
    shellVisible,
    handleRequestClose,
    handleDiscardCancel,
    handleDiscardConfirm,
    handleBackdropClick,
  };
}
