/**
 * Dialog edición / ver secuencia CFG — GET detail + PATCH formato + B11 dirty.
 * Wave 4/5: Edit + lifecycle; Preview vía onRequestPreview (Wave 5).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { FormSection } from '@/features/org/components/FormSection';
import { orgDialogGuardProps } from '@/features/org/utils/org-dialog-guard-props';
import { isDirtyAgainstBaseline } from '@/features/org/utils/org-form-dirty.helpers';
import { useCfgSecuencia } from '../hooks/useCfgSecuencia';
import { useUpdateCfgSecuencia } from '../hooks/useUpdateCfgSecuencia';
import type {
  CfgSecuenciaFieldErrors,
  CfgSecuenciaFormatoForm,
} from '../types/cfg-list.types';
import type { CfgSecuencia } from '../types/cfg.types';
import {
  formatCfgModulo,
  formatCfgScopeRef,
  formatCfgScopeType,
} from '../utils/cfg-display.utils';
import {
  isCfgLockedError,
  mapCfgErrorToFieldErrors,
  getCfgUserMessage,
} from '../utils/cfg-error.utils';
import { normalizeCfgFormatoForDirty } from '../utils/cfg-secuencia-dirty.utils';
import {
  buildCfgSecuenciaUpdatePayload,
  isCfgUpdatePayloadEmpty,
  normalizeCfgGenerationPolicy,
  validateCfgSecuenciaFormato,
} from '../utils/cfg-secuencia-form.utils';
import { CfgLockedBanner } from './CfgLockedBanner';
import { CfgSecuenciaFormatoFields } from './CfgSecuenciaFormatoFields';
import { CfgSecuenciaStatusBadges } from './CfgSecuenciaStatusBadges';

const EMPTY_FORMATO: CfgSecuenciaFormatoForm = {
  prefijo: '',
  separador: '',
  longitud_numero: 1,
  numero_inicial: 1,
  generation_policy: 'AUTO_DEFAULT',
};

function toFormatoForm(secuencia: CfgSecuencia): CfgSecuenciaFormatoForm {
  return {
    prefijo: secuencia.prefijo,
    separador: secuencia.separador,
    longitud_numero: secuencia.longitud_numero,
    numero_inicial: secuencia.numero_inicial,
    generation_policy: normalizeCfgGenerationPolicy(
      secuencia.generation_policy,
    ),
  };
}

function formatFecha(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function scopeRefLabel(secuencia: CfgSecuencia): string {
  switch (secuencia.scope_type) {
    case 'EMPRESA':
      return formatCfgScopeRef(
        secuencia.empresa_nombre,
        secuencia.empresa_id,
      );
    case 'ALMACEN':
      return formatCfgScopeRef(
        secuencia.almacen_nombre,
        secuencia.almacen_id,
      );
    case 'PUNTO_VENTA':
      return formatCfgScopeRef(
        secuencia.punto_venta_nombre,
        secuencia.punto_venta_id,
      );
    default:
      return '—';
  }
}

export interface CfgSecuenciaEditDialogProps {
  open: boolean;
  secuenciaId: string | null;
  onOpenChange: (open: boolean) => void;
  /**
   * Cierre programático post-PATCH exitoso (paridad ORG/INV `closeEdit`).
   * No debe pasar por `onOpenChange` / discard guard.
   */
  onSaveSuccess: () => void;
  canUpdate: boolean;
  onRequestDesactivar: (id: string) => void;
  onRequestReactivar: (id: string) => void;
  /** Reservado Wave 5 — no se renderiza Preview UI en Wave 4. */
  onRequestPreview: (id: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
  /** Wave 5: ocultar Preview tras NOT_ALLOWED en sesión. */
  previewDisabled?: boolean;
}

export function CfgSecuenciaEditDialog({
  open,
  secuenciaId,
  onOpenChange,
  onSaveSuccess,
  canUpdate,
  onRequestDesactivar,
  onRequestReactivar,
  onRequestPreview,
  onDirtyChange,
  previewDisabled = false,
}: CfgSecuenciaEditDialogProps) {
  const detail = useCfgSecuencia(secuenciaId, {
    enabled: open && !!secuenciaId,
  });
  const updateMutation = useUpdateCfgSecuencia();

  const [form, setForm] = useState<CfgSecuenciaFormatoForm>(EMPTY_FORMATO);
  const [baseline, setBaseline] = useState<CfgSecuenciaFormatoForm | null>(
    null,
  );
  const [fieldErrors, setFieldErrors] = useState<CfgSecuenciaFieldErrors>({});
  const [forceReadonlyLocked, setForceReadonlyLocked] = useState(false);
  const [detailSnapshot, setDetailSnapshot] = useState<CfgSecuencia | null>(
    null,
  );
  const syncedIdRef = useRef<string | null>(null);

  const locked =
    forceReadonlyLocked || Boolean(detailSnapshot?.config_locked);
  const readonly = !canUpdate || locked;

  const isDirty = useMemo(() => {
    if (readonly || !baseline) return false;
    return isDirtyAgainstBaseline(
      normalizeCfgFormatoForDirty(form),
      normalizeCfgFormatoForDirty(baseline),
    );
  }, [readonly, baseline, form]);

  const dirtyNotifiedRef = useRef(false);

  useEffect(() => {
    if (dirtyNotifiedRef.current === isDirty) return;
    dirtyNotifiedRef.current = isDirty;
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORMATO);
      setBaseline(null);
      setFieldErrors({});
      setForceReadonlyLocked(false);
      setDetailSnapshot(null);
      syncedIdRef.current = null;
      dirtyNotifiedRef.current = false;
      onDirtyChange?.(false);
    }
  }, [open, onDirtyChange]);

  useEffect(() => {
    if (!open || !detail.data) return;

    if (syncedIdRef.current === detail.data.secuencia_id) {
      if (detail.data.config_locked) {
        setForceReadonlyLocked(true);
      }
      setDetailSnapshot((prev) =>
        prev?.fecha_actualizacion === detail.data.fecha_actualizacion &&
        prev.es_activo === detail.data.es_activo &&
        prev.config_locked === detail.data.config_locked &&
        prev.prefijo === detail.data.prefijo
          ? prev
          : detail.data,
      );
      return;
    }

    const formato = toFormatoForm(detail.data);
    setDetailSnapshot(detail.data);
    setForm(formato);
    setBaseline(formato);
    setFieldErrors({});
    setForceReadonlyLocked(detail.data.config_locked);
    syncedIdRef.current = detail.data.secuencia_id;
  }, [open, detail.data]);

  useEffect(() => {
    if (!open || !detail.isError) return;
    toast.error(getCfgUserMessage(detail.error));
    onOpenChange(false);
  }, [open, detail.isError, detail.error, onOpenChange]);

  const title = readonly ? 'Ver secuencia' : 'Editar secuencia';
  const sequenceKey = detailSnapshot?.sequence_key ?? '';

  const handleSave = async () => {
    if (!secuenciaId || !baseline || readonly) return;

    const localErrors = validateCfgSecuenciaFormato(form);
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    const payload = buildCfgSecuenciaUpdatePayload(baseline, form);
    if (isCfgUpdatePayloadEmpty(payload)) {
      toast.error('Indique al menos un campo a modificar.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: secuenciaId,
        body: payload,
      });
      // Paridad ORG/INV: toast + invalidate en hook; closeEdit (no onOpenChange).
      onSaveSuccess();
    } catch (err) {
      const mapped = mapCfgErrorToFieldErrors(err);
      if (Object.keys(mapped).length > 0) {
        setFieldErrors(mapped);
      }
      if (isCfgLockedError(err)) {
        setForceReadonlyLocked(true);
        void detail.refetch();
      }
    }
  };

  const submitting = updateMutation.isPending;
  const showLifecycle = canUpdate && !locked && !!detailSnapshot;
  const showPreview =
    !!detailSnapshot &&
    detailSnapshot.supports_preview !== false &&
    !previewDisabled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0"
        {...orgDialogGuardProps}
      >
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {sequenceKey || 'Cargando secuencia…'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="px-6 pb-2 space-y-5">
          {detail.isLoading || (!detailSnapshot && !detail.isError) ? (
            <p className="text-sm text-text-soft py-8 text-center">
              Cargando detalle…
            </p>
          ) : detailSnapshot ? (
            <>
              {locked ? <CfgLockedBanner /> : null}

              <CfgSecuenciaStatusBadges
                es_activo={detailSnapshot.es_activo}
                config_locked={detailSnapshot.config_locked || locked}
                policy_drift={detailSnapshot.policy_drift}
              />

              <FormSection title="Identidad">
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-text-soft">Clave</dt>
                    <dd className="font-mono text-text-base">
                      {detailSnapshot.sequence_key}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-soft">Módulo</dt>
                    <dd className="text-text-base">
                      {formatCfgModulo(detailSnapshot.modulo_codigo)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-soft">Ámbito</dt>
                    <dd className="text-text-base">
                      {formatCfgScopeType(detailSnapshot.scope_type)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-soft">Referencia de ámbito</dt>
                    <dd className="text-text-base">
                      {scopeRefLabel(detailSnapshot)}
                    </dd>
                  </div>
                </dl>
              </FormSection>

              <FormSection title="Contador">
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-text-soft">Último número</dt>
                    <dd className="tabular-nums text-text-base">
                      {detailSnapshot.ultimo_numero}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-soft">Creación</dt>
                    <dd className="text-text-base">
                      {formatFecha(detailSnapshot.fecha_creacion)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-soft">Actualización</dt>
                    <dd className="text-text-base">
                      {formatFecha(detailSnapshot.fecha_actualizacion)}
                    </dd>
                  </div>
                </dl>
              </FormSection>

              <FormSection title="Formato">
                <CfgSecuenciaFormatoFields
                  idPrefix="cfg-secuencia-edit"
                  value={form}
                  onChange={(next) => {
                    setForm(next);
                    setFieldErrors({});
                  }}
                  errors={fieldErrors}
                  disabled={readonly || submitting}
                />
              </FormSection>
            </>
          ) : null}
        </DialogBody>

        <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {showPreview && detailSnapshot ? (
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => onRequestPreview(detailSnapshot.secuencia_id)}
              >
                Preview
              </Button>
            ) : null}
            {showLifecycle && detailSnapshot.es_activo ? (
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                className="text-error border-error/40 hover:bg-error/10"
                onClick={() => onRequestDesactivar(detailSnapshot.secuencia_id)}
              >
                Desactivar
              </Button>
            ) : null}
            {showLifecycle && !detailSnapshot.es_activo ? (
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => onRequestReactivar(detailSnapshot.secuencia_id)}
              >
                Reactivar
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            {canUpdate && !locked ? (
              <Button
                type="button"
                disabled={submitting || !isDirty}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white"
                onClick={() => void handleSave()}
              >
                Guardar
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
