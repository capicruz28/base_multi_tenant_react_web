import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/core/services/error.service';
import { resetUserPassword } from '@/features/admin/services/usuario.service';
import type { AdminPasswordResetResponse } from '@/features/admin/types/usuario.types';
import { invalidateUsersListQueries } from '@/features/admin/hooks/useUsersList';
import {
  isAdminPasswordSelfResetError,
  shouldInvalidateUsersListAfterResetError,
} from '@/features/admin/utils/iam-user-password-reset.utils';

export interface UseResetUserPasswordOptions {
  onSelfResetBlocked?: () => void;
}

export function useResetUserPassword(options: UseResetUserPasswordOptions = {}) {
  const queryClient = useQueryClient();
  const { onSelfResetBlocked } = options;

  const mutation = useMutation({
    mutationFn: (usuarioId: string) => resetUserPassword(usuarioId),
    gcTime: 0,
    onError: (err) => {
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al restablecer la contraseña.');

      if (shouldInvalidateUsersListAfterResetError(err)) {
        void invalidateUsersListQueries(queryClient);
      }

      if (isAdminPasswordSelfResetError(err)) {
        onSelfResetBlocked?.();
      }
    },
  });

  return {
    resetPassword: mutation.mutateAsync,
    isResetPending: mutation.isPending,
    resetPasswordResult: mutation.data as AdminPasswordResetResponse | undefined,
  };
}
