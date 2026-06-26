import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Loader } from 'lucide-react';

import { useAuth } from '@/shared/context/AuthContext';
import { getErrorMessage } from '@/core/services/error.service';
import {
  isExternalPasswordAuth,
  validatePasswordChangeForm,
} from '@/features/auth/utils/password-validation.utils';
import { AccountProfileCard } from '@/features/account/components/profile/AccountProfileCard';

const inputClassName =
  'w-full rounded-md border border-border-base bg-surface px-3 py-2 text-text-base focus:ring-2 focus:ring-brand-primary dark:bg-subtle';

export const AccountChangePasswordForm: React.FC = () => {
  const { auth, completePasswordChange } = useAuth();
  const user = auth.user;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  if (isExternalPasswordAuth(user)) {
    return (
      <AccountProfileCard title="Seguridad">
        <p className="text-sm text-text-soft">
          Tu cuenta utiliza inicio de sesión corporativo (SSO). La contraseña se administra
          externamente.
        </p>
      </AccountProfileCard>
    );
  }

  const resetForm = (): void => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setFieldError(null);

    const validationError = validatePasswordChangeForm({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (validationError) {
      setFieldError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const session = await completePasswordChange({
        current_password: currentPassword.trim(),
        new_password: newPassword.trim(),
      });

      if (!session?.user) {
        toast.error('No se pudo completar el cambio de contraseña.');
        return;
      }

      toast.success('Contraseña actualizada correctamente.');
      resetForm();
    } catch (error: unknown) {
      const err = getErrorMessage(error);
      const message = err.message || 'Error al cambiar la contraseña.';
      setFieldError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AccountProfileCard title="Seguridad">
      <p className="text-sm text-text-soft">
        Después de cambiar la contraseña, todas las demás sesiones activas serán cerradas
        automáticamente.
      </p>

      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div>
          <label htmlFor="account-current_password" className="mb-1 block text-sm font-medium text-text-soft">
            Contraseña actual
          </label>
          <div className="relative">
            <input
              id="account-current_password"
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className={`${inputClassName} pr-10`}
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-text-soft hover:text-text-base"
              onClick={() => setShowCurrent((value) => !value)}
              aria-label={showCurrent ? 'Ocultar' : 'Mostrar'}
            >
              {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="account-new_password" className="mb-1 block text-sm font-medium text-text-soft">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              id="account-new_password"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={`${inputClassName} pr-10`}
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-text-soft hover:text-text-base"
              onClick={() => setShowNew((value) => !value)}
              aria-label={showNew ? 'Ocultar' : 'Mostrar'}
            >
              {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-text-soft">
            Mínimo 8 caracteres, mayúscula, minúscula y número.
          </p>
        </div>

        <div>
          <label htmlFor="account-confirm_password" className="mb-1 block text-sm font-medium text-text-soft">
            Confirmar nueva contraseña
          </label>
          <input
            id="account-confirm_password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={inputClassName}
          />
        </div>

        {fieldError ? (
          <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error" role="alert">
            {fieldError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader className="mr-2 h-5 w-5 animate-spin" aria-hidden />
              Actualizando...
            </>
          ) : (
            'Actualizar contraseña'
          )}
        </button>
      </form>
    </AccountProfileCard>
  );
};
