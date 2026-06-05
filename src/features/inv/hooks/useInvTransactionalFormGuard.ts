import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import type { OrgDiscardPending } from '@/features/org/types/org-discard.types';
import { useInvSessionScope } from './useInvSessionScope';
import { createInvPageDiscardHandlers } from '../utils/createInvPageDiscardHandlers';

const EMPRESA_EDIT_TOAST = 'La empresa activa cambió. Se cerró el documento en edición.';

export interface UseInvTransactionalFormGuardOptions {
  isEdit: boolean;
  documentId: string | undefined;
  listPath: string;
  entityLabel: string;
  isDirty: boolean;
  isSubmitting: boolean;
  onResetForm: () => void;
}

export function useInvTransactionalFormGuard({
  isEdit,
  documentId,
  listPath,
  entityLabel,
  isDirty,
  isSubmitting,
  onResetForm,
}: UseInvTransactionalFormGuardOptions) {
  const navigate = useNavigate();
  const { scopeEmpresaId } = useInvSessionScope();
  const [discardPending, setDiscardPending] = useState<OrgDiscardPending>(null);
  const pendingExitPathRef = useRef<string | null>(null);
  const blockerRef = useRef<ReturnType<typeof useBlocker> | null>(null);
  const empresaRedirectInProgressRef = useRef(false);
  const prevScopeEmpresaRef = useRef<string | null>(null);

  const shouldBlockNavigation =
    isDirty && !isSubmitting && discardPending === null && !empresaRedirectInProgressRef.current;

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!shouldBlockNavigation) return false;
    return currentLocation.pathname !== nextLocation.pathname;
  });

  blockerRef.current = blocker;

  /** Create: reset completo. Edit: unmount al navegar — no vaciar form en pantalla. */
  const closeFormForDiscard = useCallback(() => {
    if (!isEdit) {
      onResetForm();
    }
  }, [isEdit, onResetForm]);

  useEffect(() => {
    if (blocker.state === 'blocked' && discardPending === null) {
      pendingExitPathRef.current = blocker.location?.pathname ?? listPath;
      setDiscardPending(isEdit ? 'edit' : 'create');
    }
  }, [blocker.state, blocker.location?.pathname, discardPending, isEdit, listPath]);

  const { handleRequestLeave, handleDiscardCancel, handleDiscardConfirm } = useMemo(
    () =>
      createInvPageDiscardHandlers({
        discardPending,
        setDiscardPending,
        isSubmitting,
        isDirty,
        isEdit,
        closeForm: closeFormForDiscard,
        navigate,
        pendingExitPathRef,
        blockerRef,
      }),
    [discardPending, isSubmitting, isDirty, isEdit, closeFormForDiscard, navigate],
  );

  useEffect(() => {
    const prev = prevScopeEmpresaRef.current;
    prevScopeEmpresaRef.current = scopeEmpresaId;

    if (prev === null) return;
    if (prev === scopeEmpresaId) return;

    if (isEdit && documentId) {
      empresaRedirectInProgressRef.current = true;
      setDiscardPending(null);
      pendingExitPathRef.current = null;
      if (blockerRef.current?.state === 'blocked') {
        blockerRef.current.reset();
      }
      toast(EMPRESA_EDIT_TOAST);
      navigate(listPath);
      return;
    }

    if (!isEdit) {
      onResetForm();
    }
  }, [scopeEmpresaId, isEdit, documentId, listPath, navigate, onResetForm]);

  return {
    discardPending,
    handleRequestLeave,
    handleDiscardCancel,
    handleDiscardConfirm,
    discardDialogEntityLabel: entityLabel,
  };
}
