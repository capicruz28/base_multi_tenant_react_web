/**
 * Montaje global Session UX — IAM-FE-PHASE-07 IMPL-08 (L7-F).
 */

import { ReactNode, useCallback, useEffect, useState } from 'react';

import { SessionExpiredDialog } from '@/core/auth/session/components/SessionExpiredDialog';
import { acknowledgeSessionUxModal } from '@/core/auth/session/session-ux-presenter';
import {
  closeSessionUxModal,
  registerSessionUxModalListener,
  resetSessionUxPresenterRuntime,
} from '@/core/auth/session/session-ux-presenter.runtime';
import type { SessionExpiredDialogModel } from '@/core/auth/session/session-ux.types';
import { createAuthTerminateRedirectToLogin } from '@/shared/context/AuthContext';

export interface SessionUxBinderProps {
  readonly children: ReactNode;
}

export function SessionUxBinder({ children }: SessionUxBinderProps) {
  const [modalModel, setModalModel] = useState<SessionExpiredDialogModel | null>(null);

  useEffect(() => {
    const unregister = registerSessionUxModalListener(setModalModel);
    return () => {
      unregister();
      resetSessionUxPresenterRuntime();
    };
  }, []);

  const handleModalClose = useCallback(() => {
    setModalModel(null);
  }, []);

  const handleModalAck = useCallback(() => {
    const legacyRedirect = createAuthTerminateRedirectToLogin();
    acknowledgeSessionUxModal(legacyRedirect);
    closeSessionUxModal();
    setModalModel(null);
  }, []);

  return (
    <>
      {children}
      <SessionExpiredDialog
        model={modalModel}
        onAck={handleModalAck}
        onClose={handleModalClose}
      />
    </>
  );
}
