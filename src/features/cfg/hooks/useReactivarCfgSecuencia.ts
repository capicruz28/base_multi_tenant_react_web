/**
 * POST …/reactivar — reactivar secuencia CFG.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/core/services/error.service';
import { cfgSecuenciaService } from '../services/cfg-secuencias.service';
import type { CfgSecuencia } from '../types/cfg.types';
import { invalidateCodigoRuntimeSnapshot } from '@/core/codigo';
import {
  invalidateCfgSecuenciaDetail,
  invalidateCfgSecuenciasList,
} from '../utils/invalidate-cfg-queries';

export function useReactivarCfgSecuencia() {
  const queryClient = useQueryClient();

  return useMutation<CfgSecuencia, Error, string>({
    mutationFn: (id) => cfgSecuenciaService.reactivar(id),
    onSuccess: (_data, id) => {
      toast.success('Secuencia reactivada.');
      invalidateCfgSecuenciasList(queryClient);
      invalidateCfgSecuenciaDetail(queryClient, id);
      invalidateCodigoRuntimeSnapshot(queryClient);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}
