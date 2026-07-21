/**
 * POST …/preview — estimación sin consumir contador.
 * MUST NOT invalidar listado ni detalle.
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/core/services/error.service';
import { cfgSecuenciaService } from '../services/cfg-secuencias.service';
import type { CfgSecuenciaPreview } from '../types/cfg.types';

export function usePreviewCfgSecuencia() {
  return useMutation<CfgSecuenciaPreview, Error, string>({
    mutationFn: (id) => cfgSecuenciaService.preview(id),
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}
