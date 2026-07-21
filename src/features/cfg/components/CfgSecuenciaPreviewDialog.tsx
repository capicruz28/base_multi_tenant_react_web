/**
 * Dialog Preview — estimación de código sin consumir correlativo.
 * Wave 5: auto-fetch al abrir; MUST NOT invalidar list/detail (hook).
 */

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { usePreviewCfgSecuencia } from '../hooks/usePreviewCfgSecuencia';
import type { CfgSecuenciaPreview } from '../types/cfg.types';
import {
  getCfgUserMessage,
  isCfgPreviewNotAllowed,
} from '../utils/cfg-error.utils';

export interface CfgSecuenciaPreviewDialogProps {
  open: boolean;
  secuenciaId: string | null;
  onOpenChange: (open: boolean) => void;
  /** Hint desde fila inactiva (además de response.es_activo). */
  secuenciaInactivaHint?: boolean;
  onPreviewNotAllowed?: (id: string) => void;
}

export function CfgSecuenciaPreviewDialog({
  open,
  secuenciaId,
  onOpenChange,
  secuenciaInactivaHint = false,
  onPreviewNotAllowed,
}: CfgSecuenciaPreviewDialogProps) {
  const previewMutation = usePreviewCfgSecuencia();
  const [result, setResult] = useState<CfgSecuenciaPreview | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const requestGenRef = useRef(0);

  useEffect(() => {
    if (!open || !secuenciaId) {
      setResult(null);
      setLocalError(null);
      return;
    }

    const gen = ++requestGenRef.current;
    setResult(null);
    setLocalError(null);

    void previewMutation
      .mutateAsync(secuenciaId)
      .then((data) => {
        if (requestGenRef.current !== gen) return;
        setResult(data);
        setLocalError(null);
      })
      .catch((err: unknown) => {
        if (requestGenRef.current !== gen) return;

        if (isCfgPreviewNotAllowed(err)) {
          setLocalError(getCfgUserMessage(err));
          onPreviewNotAllowed?.(secuenciaId);
          return;
        }

        if (axios.isAxiosError(err) && err.response?.status === 404) {
          onOpenChange(false);
        }
      });
    // Solo re-disparar al abrir / cambiar id (Spec: auto-fetch al abrir).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutateAsync estable en práctica; evitar loop
  }, [open, secuenciaId]);

  const handleClose = () => {
    requestGenRef.current += 1;
    setResult(null);
    setLocalError(null);
    onOpenChange(false);
  };

  const isPreviewing =
    open &&
    !!secuenciaId &&
    !result &&
    !localError &&
    previewMutation.isPending;

  const showInactiveBanner =
    secuenciaInactivaHint || result?.es_activo === false;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle>Código estimado</DialogTitle>
        </DialogHeader>

        <DialogBody className="px-6 pb-4 space-y-4">
          {isPreviewing ? (
            <div
              className="flex flex-col items-center justify-center gap-3 py-10"
              role="status"
              aria-live="polite"
            >
              <Loader2
                className="h-8 w-8 animate-spin text-brand-primary"
                aria-hidden
              />
              <p className="text-sm text-text-soft">Calculando estimación…</p>
            </div>
          ) : null}

          {localError ? (
            <p className="text-sm text-error py-4" role="alert">
              {localError}
            </p>
          ) : null}

          {result ? (
            <div className="space-y-4">
              {showInactiveBanner ? (
                <div
                  role="status"
                  className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
                >
                  La secuencia está inactiva.
                </div>
              ) : null}

              <p
                className="text-center font-mono text-xl font-semibold text-text-base tracking-wide"
                aria-live="polite"
              >
                {result.codigo_estimado}
              </p>

              <p className="text-sm text-text-soft text-center">
                {result.disclaimer}
              </p>

              {result.consume_contador === false ? (
                <p className="text-sm text-text-soft text-center">
                  Esta estimación no consume el correlativo.
                </p>
              ) : null}

              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-text-soft">Último número actual</dt>
                  <dd className="tabular-nums text-text-base">
                    {result.ultimo_numero_actual}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-soft">Número inicial</dt>
                  <dd className="tabular-nums text-text-base">
                    {result.numero_inicial}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
