import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';

export interface LogoutAllConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
}

const LOGOUT_ALL_DIALOG_TITLE = 'Cerrar sesión en todos los dispositivos';

const LOGOUT_ALL_DIALOG_MESSAGE =
  'Se cerrará tu sesión en este navegador y en todos los demás dispositivos donde hayas iniciado sesión. Deberás volver a identificarte.';

/**
 * Confirmación destructiva logout all (IAM-FE-PHASE-03 IMPL-07, diseño §19.2).
 * Delega orquestación en AuthContext vía `logoutAllSessions`.
 */
export function LogoutAllConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isPending = false,
}: LogoutAllConfirmDialogProps): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => {
        void onConfirm();
      }}
      title={LOGOUT_ALL_DIALOG_TITLE}
      message={LOGOUT_ALL_DIALOG_MESSAGE}
      confirmText="Cerrar todas las sesiones"
      cancelText="Cancelar"
      variant="danger"
      loading={isPending}
    />
  );
}

export { LOGOUT_ALL_DIALOG_TITLE, LOGOUT_ALL_DIALOG_MESSAGE };
