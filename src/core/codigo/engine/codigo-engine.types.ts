/**
 * Tipos canónicos — Frontend Code Generation Engine (FCE)
 * Alineados con Backend SequenceCatalog.generation_policy
 */

/** Políticas soportadas por FCE — EXTERNAL queda fuera del motor */
export type CodigoGenerationPolicy =
  | 'AUTO_DEFAULT'
  | 'AUTO_REQUIRED'
  | 'MANUAL_ONLY';

export type CodigoFieldMode = 'create' | 'update' | 'read';

/** Solo aplica a AUTO_DEFAULT en CREATE */
export type CodigoAssignmentMode = 'auto' | 'manual';

/** Fases UI mínimas — FCE E-1 */
export type CodigoUiPhase =
  | 'idle'
  | 'auto'
  | 'manual'
  | 'saving'
  | 'success'
  | 'error'
  | 'readonly';

export interface CodigoRegistryMeta {
  prefixHint?: string;
  exampleFormat?: string;
  scopeLabel?: 'tenant' | 'empresa';
  entityLabel?: string;
  maxLength?: number;
}

export interface CodigoRegistryEntry {
  sequenceKey: string;
  moduleCode: string;
  entityKey: string;
  fieldKey: string;
  policy: CodigoGenerationPolicy;
  meta: CodigoRegistryMeta;
}

export type CodigoCreatePresentation = 'auto_panel' | 'manual_input' | 'locked_panel';

export type CodigoUpdatePresentation = 'editable' | 'readonly';

export interface PolicyBehaviorProfile {
  policy: CodigoGenerationPolicy;
  mode: CodigoFieldMode;
  allowsManualOnCreate: boolean;
  defaultAssignmentMode: CodigoAssignmentMode;
  createPresentation: CodigoCreatePresentation;
  updatePresentation: CodigoUpdatePresentation;
}

export interface CodigoPayloadSlice {
  fieldKey: string;
  value: string | undefined;
}

export interface CodigoFieldError {
  fieldKey: string;
  message: string;
  httpStatus?: number;
  kind: 'field' | 'technical';
}

export interface CodigoDirtySnapshot {
  assignmentMode: CodigoAssignmentMode;
  value: string;
}

export interface CodigoStateMachineState {
  uiPhase: CodigoUiPhase;
  assignmentMode: CodigoAssignmentMode;
  isManualSectionExpanded: boolean;
}

export type CodigoStateMachineEvent =
  | { type: 'INIT'; mode: CodigoFieldMode; profile: PolicyBehaviorProfile }
  | { type: 'EXPAND_MANUAL' }
  | { type: 'REVERT_AUTO' }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_SUCCESS' }
  | { type: 'SET_ERROR' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET'; mode: CodigoFieldMode; profile: PolicyBehaviorProfile };

export interface CodigoAutoPanelCopy {
  title: string;
  description: string;
  /** Texto auxiliar (formato / prefijo). */
  hint?: string;
  /** Ejemplo visual de código (p.ej. SUC-0001). */
  formatExample?: string;
}

export interface CodigoFieldViewModel {
  label: string;
  fieldKey: string;
  showAutoPanel: boolean;
  showManualSection: boolean;
  showManualToggleLink: boolean;
  showReadOnly: boolean;
  showEditableInput: boolean;
  showWarningBanner: boolean;
  autoPanelCopy: CodigoAutoPanelCopy;
  manualToggleLabel: string;
  revertToAutoLabel: string;
  /** Solo AUTO_DEFAULT en override manual */
  showRevertToAuto: boolean;
  /** AUTO_DEFAULT: confirmar antes de expandir modo manual */
  requiresManualOverrideConfirm: boolean;
  manualOverrideConfirmTitle: string;
  manualOverrideConfirmMessage: string;
  warningCopy?: string;
  value: string;
  error: string | null;
  disabled: boolean;
  required: boolean;
  inputId: string;
  maxLength: number;
}
