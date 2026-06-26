import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Shield } from 'lucide-react';

import { useAuth } from '@/shared/context/AuthContext';
import { getErrorMessage } from '@/core/services/error.service';
import { SESSION_LOGOUT_V3_ENABLED } from '@/core/auth/session/session-logout-v3.flags';
import { LogoutAllConfirmDialog } from '@/features/auth/components/LogoutAllConfirmDialog';
import { AccountProfileCard } from '@/features/account/components/profile/AccountProfileCard';

export const AccountSecuritySessionGlobalCard: React.FC = () => {
  const {
    logoutAllSessions,
    isAuthenticated,
    isImpersonation,
    requiereSeleccionEmpresa,
    requiresPasswordChange,
  } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const canLogoutAll =
    SESSION_LOGOUT_V3_ENABLED &&
    isAuthenticated &&
    !isImpersonation &&
    !requiereSeleccionEmpresa &&
    !requiresPasswordChange;

  const handleCloseDialog = (): void => {
    if (isPending) return;
    setIsDialogOpen(false);
  };

  const handleConfirmLogoutAll = async (): Promise<void> => {
    if (isPending) return;

    setIsPending(true);
    try {
      await logoutAllSessions();
      setIsDialogOpen(false);
    } catch (error: unknown) {
      const message = getErrorMessage(error).message || 'No se pudo cerrar todas las sesiones.';
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  if (!SESSION_LOGOUT_V3_ENABLED) {
    return null;
  }

  return (
    <>
      <AccountProfileCard title="Sesión global">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-text-soft" aria-hidden />
          <div className="space-y-4">
            <p className="text-sm text-text-soft">
              Cierra tu sesión en este navegador y en todos los demás dispositivos conectados.
            </p>

            {canLogoutAll ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsDialogOpen(true)}
                className="inline-flex items-center rounded-md border border-error/30 bg-surface px-4 py-2 text-sm font-medium text-error hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cerrar todas las sesiones
              </button>
            ) : isImpersonation ? (
              <p className="text-sm text-text-faint">
                Esta acción no está disponible durante el modo soporte.
              </p>
            ) : null}

            <p className="text-xs text-text-faint">
              Para cerrar solo este dispositivo, use Cerrar sesión en el menú superior.
            </p>
          </div>
        </div>
      </AccountProfileCard>

      <LogoutAllConfirmDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmLogoutAll}
        isPending={isPending}
      />
    </>
  );
};
