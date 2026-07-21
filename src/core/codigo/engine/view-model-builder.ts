import type {
  CodigoFieldMode,
  CodigoFieldViewModel,
  CodigoRegistryEntry,
  CodigoUiPhase,
  PolicyBehaviorProfile,
} from './codigo-engine.types';
import {
  resolveAutoPanelCopy,
  resolveCodigoFieldLabel,
  resolveCodigoMaxLength,
  resolveManualOverrideConfirmMessage,
  resolveManualOverrideConfirmTitle,
  resolveManualToggleLabel,
  resolveRevertToAutoLabel,
  resolveUpdateWarningCopy,
} from './copy-resolver';

export interface BuildCodigoFieldViewModelInput {
  entry: CodigoRegistryEntry;
  mode: CodigoFieldMode;
  profile: PolicyBehaviorProfile;
  uiPhase: CodigoUiPhase;
  assignmentMode: 'auto' | 'manual';
  isManualSectionExpanded: boolean;
  value: string;
  error: string | null;
  initialValue: string;
  disabled: boolean;
  /**
   * Si es `false`, oculta el override manual aunque la policy lo permita.
   * Default efectivo: permitido (AUTO_DEFAULT muestra «Modificar código»).
   */
  allowManualOverride?: boolean;
  labelOverride?: string;
  /** Ejemplo de formato desde Runtime Snapshot (prefijo+sep+padding). */
  formatExample?: string;
}

export function buildCodigoFieldViewModel(
  input: BuildCodigoFieldViewModelInput,
): CodigoFieldViewModel {
  const {
    entry,
    mode,
    profile,
    uiPhase,
    assignmentMode,
    isManualSectionExpanded,
    value,
    error,
    initialValue,
    disabled,
    allowManualOverride = true,
    labelOverride,
    formatExample,
  } = input;

  const isSaving = uiPhase === 'saving';
  const isReadMode = mode === 'read' || uiPhase === 'readonly';
  const isCreate = mode === 'create';
  const isUpdate = mode === 'update';

  const showReadOnly = isReadMode || (isUpdate && profile.updatePresentation === 'readonly');

  const showAutoPanel =
    isCreate &&
    (profile.createPresentation === 'auto_panel' ||
      profile.createPresentation === 'locked_panel') &&
    assignmentMode === 'auto' &&
    uiPhase === 'auto';

  // AUTO_DEFAULT: toggle visible sin exigir flag en páginas ORG/INV.
  // AUTO_REQUIRED: allowsManualOnCreate=false → sin toggle.
  const showManualToggleLink =
    isCreate &&
    profile.allowsManualOnCreate &&
    allowManualOverride &&
    assignmentMode === 'auto' &&
    uiPhase === 'auto';

  const showManualSection =
    isCreate &&
    ((profile.createPresentation === 'manual_input' && uiPhase === 'manual') ||
      (profile.createPresentation === 'auto_panel' &&
        assignmentMode === 'manual' &&
        isManualSectionExpanded &&
        (uiPhase === 'manual' || uiPhase === 'error')));

  /** Solo override AUTO_DEFAULT — MANUAL_ONLY no tiene modo automático. */
  const showRevertToAuto =
    isCreate &&
    profile.policy === 'AUTO_DEFAULT' &&
    assignmentMode === 'manual' &&
    showManualSection;

  const showEditableInput =
    !showReadOnly &&
    !showAutoPanel &&
    (showManualSection || (isUpdate && profile.updatePresentation === 'editable'));

  const showWarningBanner =
    isUpdate &&
    profile.updatePresentation === 'editable' &&
    value.trim() !== initialValue.trim() &&
    value.trim().length > 0;

  const autoPanelCopy = resolveAutoPanelCopy(entry, formatExample);

  return {
    label: resolveCodigoFieldLabel(entry, labelOverride),
    fieldKey: entry.fieldKey,
    showAutoPanel,
    showManualSection,
    showManualToggleLink,
    showReadOnly,
    showEditableInput,
    showWarningBanner,
    autoPanelCopy,
    manualToggleLabel: resolveManualToggleLabel(),
    revertToAutoLabel: resolveRevertToAutoLabel(),
    showRevertToAuto,
    requiresManualOverrideConfirm: showManualToggleLink,
    manualOverrideConfirmTitle: resolveManualOverrideConfirmTitle(),
    manualOverrideConfirmMessage: resolveManualOverrideConfirmMessage(),
    warningCopy: showWarningBanner ? resolveUpdateWarningCopy() : undefined,
    value,
    error,
    disabled: disabled || isSaving,
    required: isCreate && profile.policy === 'MANUAL_ONLY',
    inputId: `codigo-field-${entry.sequenceKey}`,
    maxLength: resolveCodigoMaxLength(entry),
  };
}
