import { useState } from 'react';

import type { CodigoFieldMode } from '@/core/codigo/engine/codigo-engine.types';
import type { CodigoFieldControllerResult } from '@/core/codigo/hooks/useCodigoFieldController';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { cn } from '@/shared/lib/utils';

import { CodigoFieldAutoPanel } from './CodigoFieldAutoPanel';
import {
  CodigoFieldEditableInput,
  CodigoFieldManualSection,
} from './CodigoFieldManualSection';
import { CodigoFieldReadOnly } from './CodigoFieldReadOnly';
import { CodigoFieldWarningBanner } from './CodigoFieldWarningBanner';

export interface CodigoFieldProps {
  sequenceKey: string;
  mode: CodigoFieldMode;
  controller: CodigoFieldControllerResult;
  className?: string;
}

/**
 * Presenter delgado — policy/UX desde viewModel (Runtime SSOT vía controller).
 */
export function CodigoField({ sequenceKey, mode, controller, className }: CodigoFieldProps) {
  const { viewModel, actions } = controller;
  const [manualConfirmOpen, setManualConfirmOpen] = useState(false);

  const requestExpandManual = () => {
    if (viewModel.requiresManualOverrideConfirm) {
      setManualConfirmOpen(true);
      return;
    }
    actions.expandManual();
  };

  const confirmExpandManual = () => {
    setManualConfirmOpen(false);
    actions.expandManual();
  };

  return (
    <div
      className={cn('space-y-2', className)}
      data-testid="codigo-field"
      data-sequence-key={sequenceKey}
      data-mode={mode}
    >
      {viewModel.showReadOnly ? (
        <CodigoFieldReadOnly
          label={viewModel.label}
          value={viewModel.value}
          inputId={viewModel.inputId}
        />
      ) : null}

      {viewModel.showAutoPanel ? (
        <CodigoFieldAutoPanel copy={viewModel.autoPanelCopy} />
      ) : null}

      {viewModel.showManualToggleLink ? (
        <button
          type="button"
          className="text-sm text-brand-primary hover:underline disabled:opacity-50"
          onClick={requestExpandManual}
          disabled={viewModel.disabled}
          data-testid="codigo-manual-toggle"
        >
          {viewModel.manualToggleLabel}
        </button>
      ) : null}

      {viewModel.showManualSection ? (
        <CodigoFieldManualSection
          label={viewModel.label}
          inputId={viewModel.inputId}
          value={viewModel.value}
          error={viewModel.error}
          disabled={viewModel.disabled}
          required={viewModel.required}
          maxLength={viewModel.maxLength}
          revertToAutoLabel={
            viewModel.showRevertToAuto ? viewModel.revertToAutoLabel : undefined
          }
          onChange={actions.setValue}
          onRevertToAuto={
            viewModel.showRevertToAuto ? actions.revertToAuto : undefined
          }
        />
      ) : null}

      {viewModel.showEditableInput && !viewModel.showManualSection ? (
        <CodigoFieldEditableInput
          label={viewModel.label}
          inputId={viewModel.inputId}
          value={viewModel.value}
          error={viewModel.error}
          disabled={viewModel.disabled}
          required={viewModel.required}
          maxLength={viewModel.maxLength}
          onChange={actions.setValue}
        />
      ) : null}

      {viewModel.showWarningBanner && viewModel.warningCopy ? (
        <CodigoFieldWarningBanner message={viewModel.warningCopy} />
      ) : null}

      <ConfirmDialog
        isOpen={manualConfirmOpen}
        onClose={() => setManualConfirmOpen(false)}
        onConfirm={confirmExpandManual}
        title={viewModel.manualOverrideConfirmTitle}
        message={viewModel.manualOverrideConfirmMessage}
        confirmText="Continuar"
        cancelText="Cancelar"
        variant="warning"
      />
    </div>
  );
}
