import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  revokeSessionById,
  revokeSessionSelf,
} from '@/features/admin/services/session.service';
import type { AdminSessionRead, UserSessionRead } from '@/features/admin/types/session.types';
import { isCurrentSession } from '@/features/admin/utils/iam-current-session';
import {
  executeActiveSessionRevoke,
  executeSelfSessionRevoke,
  type ActiveSessionRevokeDeps,
  type SelfSessionRevokeDeps,
} from '@/features/admin/utils/iam-session-revoke.utils';
import { invalidateActiveSessionsAdminQueries } from '@/features/admin/hooks/useActiveSessionsKpiSummary';
import { invalidateMySessionsListQueries } from '@/features/admin/hooks/useMySessionsList';
import { useAuth } from '@/shared/context/AuthContext';

export type RevokeSessionMode = 'admin' | 'self';

export interface UseRevokeSessionOptions {
  mode: RevokeSessionMode;
}

export function useRevokeSession({ mode }: UseRevokeSessionOptions) {
  const queryClient = useQueryClient();
  const { auth, runSessionValidityProbe } = useAuth();
  const currentSessionId = auth.user?.current_session_id ?? null;
  const currentTokenId = auth.user?.current_token_id ?? null;

  const matchCurrentAdmin = useCallback(
    (session: AdminSessionRead) =>
      isCurrentSession(session, { currentSessionId, currentTokenId }),
    [currentSessionId, currentTokenId],
  );

  const matchCurrentSelf = useCallback(
    (session: UserSessionRead) =>
      isCurrentSession(session, { currentSessionId, currentTokenId }),
    [currentSessionId, currentTokenId],
  );

  const mutation = useMutation({
    mutationFn: async (session: AdminSessionRead | UserSessionRead) => {
      if (mode === 'admin') {
        const deps: ActiveSessionRevokeDeps = {
          revokeSessionById,
          invalidateActiveSessionsListQueries: invalidateActiveSessionsAdminQueries,
          runSessionValidityProbe,
          isCurrentSession: matchCurrentAdmin,
          showSuccessToast: (message) => toast.success(message),
          showErrorToast: (message) => toast.error(message),
        };
        await executeActiveSessionRevoke(session as AdminSessionRead, queryClient, deps);
        return;
      }

      const deps: SelfSessionRevokeDeps = {
        revokeSessionSelf,
        invalidateMySessionsListQueries,
        runSessionValidityProbe,
        isCurrentSession: matchCurrentSelf,
        showSuccessToast: (message) => toast.success(message),
        showErrorToast: (message) => toast.error(message),
      };
      await executeSelfSessionRevoke(session as UserSessionRead, queryClient, deps);
    },
  });

  return {
    revokeSession: mutation.mutateAsync,
    isRevoking: mutation.isPending,
    isCurrentSession: mode === 'admin' ? matchCurrentAdmin : matchCurrentSelf,
  };
}
