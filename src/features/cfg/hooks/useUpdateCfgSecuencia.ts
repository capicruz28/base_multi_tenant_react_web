/**
 * PATCH configuración formato — CFG secuencias.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/core/services/error.service';
import { cfgSecuenciaService } from '../services/cfg-secuencias.service';
import type { CfgSecuencia, CfgSecuenciaUpdate } from '../types/cfg.types';
import { invalidateCodigoRuntimeSnapshot } from '@/core/codigo';
import {
  invalidateCfgSecuenciaDetail,
  invalidateCfgSecuenciasList,
} from '../utils/invalidate-cfg-queries';

export interface UpdateCfgSecuenciaVariables {
  id: string;
  body: CfgSecuenciaUpdate;
}

export function useUpdateCfgSecuencia() {
  const queryClient = useQueryClient();

  return useMutation<CfgSecuencia, Error, UpdateCfgSecuenciaVariables>({
    mutationFn: ({ id, body }) => cfgSecuenciaService.update(id, body),
    onSuccess: (_data, variables) => {
      toast.success('Configuración actualizada.');
      invalidateCfgSecuenciasList(queryClient);
      invalidateCfgSecuenciaDetail(queryClient, variables.id);
      invalidateCodigoRuntimeSnapshot(queryClient);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}
