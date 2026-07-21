import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

import { useAuth } from '@/shared/context/AuthContext';

import type {
  CodigoDirtySnapshot,
  CodigoFieldError,
  CodigoFieldMode,
  CodigoFieldViewModel,
  CodigoPayloadSlice,
  CodigoRegistryEntry,
  CodigoStateMachineEvent,
  CodigoStateMachineState,
  PolicyBehaviorProfile,
} from '../engine/codigo-engine.types';
import { mapCodigoFieldError } from '../engine/error-mapper';
import { buildCodigoPayloadSlice } from '../engine/payload-builder';
import { resolvePolicyBehavior } from '../engine/policy-resolver';
import {
  CODIGO_INITIAL_STATE,
  createInitialCodigoState,
  transitionCodigoState,
} from '../engine/state-machine';
import { buildCodigoFieldViewModel } from '../engine/view-model-builder';
import { resolveCodigoFieldLabel } from '../engine/copy-resolver';
import { formatCodigoRuntimeExample } from '../runtime/format-codigo-runtime-example';
import {
  resolveEffectiveCodigoPolicy,
  type RuntimePolicyResolution,
} from '../runtime/resolve-effective-codigo-policy';
import { isCodigoFieldDirty } from '../integration/codigo-dirty.utils';
import { useCodigoRegistryEntry } from './useCodigoRegistryEntry';
import { useCodigoRuntimeSnapshot } from './useCodigoRuntimeSnapshot';

export interface UseCodigoFieldControllerOptions {
  sequenceKey: string;
  mode: CodigoFieldMode;
  initialValue?: string;
  disabled?: boolean;
  allowManualOverride?: boolean;
  label?: string;
}

export interface CodigoFieldControllerActions {
  setValue: (value: string) => void;
  expandManual: () => void;
  revertToAuto: () => void;
  setSaving: (saving: boolean) => void;
  setSuccess: () => void;
  setError: (message: string) => void;
  applyApiError: (error: unknown) => CodigoFieldError;
  clearError: () => void;
  reset: () => void;
}

export interface CodigoFieldControllerResult {
  entry: CodigoRegistryEntry;
  /** Estado Runtime explícito — SSOT de policy; sin fallback Manifest. */
  runtimeResolution: RuntimePolicyResolution;
  viewModel: CodigoFieldViewModel;
  payloadSlice: CodigoPayloadSlice;
  dirtySnapshot: CodigoDirtySnapshot;
  /**
   * Baseline pristine según policy Runtime efectiva (createInitialCodigoState).
   * Las páginas MUST comparar dirtySnapshot contra este valor — no hardcodear `auto`.
   */
  pristineSnapshot: CodigoDirtySnapshot;
  /** dirtySnapshot ≠ pristineSnapshot */
  isDirty: boolean;
  actions: CodigoFieldControllerActions;
}

interface CodigoControllerReducerState extends CodigoStateMachineState {
  value: string;
  error: string | null;
}

type CodigoControllerReducerAction =
  | { type: 'SET_VALUE'; value: string }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'CLEAR_ERROR' }
  | CodigoStateMachineEvent;

function reducer(
  state: CodigoControllerReducerState,
  action: CodigoControllerReducerAction,
): CodigoControllerReducerState {
  switch (action.type) {
    case 'SET_VALUE':
      return { ...state, value: action.value, error: null };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.message,
        ...transitionCodigoState(state, { type: 'SET_ERROR' }),
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
        ...transitionCodigoState(state, { type: 'CLEAR_ERROR' }),
      };
    default: {
      const machineNext = transitionCodigoState(state, action);
      return { ...state, ...machineNext };
    }
  }
}

/**
 * ViewModel neutro mientras Runtime no está `resolved`.
 * No invoca PolicyResolver ni Manifest.policy.
 * CodigoField sin cambios aún — no muestra paneles de policy.
 */
function buildUnresolvedCodigoViewModel(
  entry: CodigoRegistryEntry,
  options: {
    value: string;
    error: string | null;
    disabled: boolean;
    labelOverride?: string;
  },
): CodigoFieldViewModel {
  return {
    label: resolveCodigoFieldLabel(entry, options.labelOverride),
    fieldKey: entry.fieldKey,
    showAutoPanel: false,
    showManualSection: false,
    showManualToggleLink: false,
    showReadOnly: false,
    showEditableInput: false,
    showWarningBanner: false,
    autoPanelCopy: {
      title: '',
      description: '',
    },
    manualToggleLabel: '',
    revertToAutoLabel: '',
    showRevertToAuto: false,
    requiresManualOverrideConfirm: false,
    manualOverrideConfirmTitle: '',
    manualOverrideConfirmMessage: '',
    value: options.value,
    error: options.error,
    disabled: true,
    required: false,
    inputId: `codigo-field-${entry.sequenceKey}`,
    maxLength: entry.meta.maxLength ?? 20,
  };
}

export function useCodigoFieldController(
  options: UseCodigoFieldControllerOptions,
): CodigoFieldControllerResult {
  const {
    sequenceKey,
    mode,
    initialValue = '',
    disabled = false,
    allowManualOverride = true,
    label,
  } = options;

  const manifestEntry = useCodigoRegistryEntry(sequenceKey);
  const runtimeSnapshotQuery = useCodigoRuntimeSnapshot();
  const { empresaActivaId } = useAuth();

  const runtimeResolution = useMemo(
    () =>
      resolveEffectiveCodigoPolicy({
        sequenceKey,
        snapshot: runtimeSnapshotQuery.data,
        isSnapshotLoading:
          runtimeSnapshotQuery.isLoading || runtimeSnapshotQuery.isPending,
        isSnapshotError: runtimeSnapshotQuery.isError,
        scopeContext: { empresaId: empresaActivaId },
      }),
    [
      sequenceKey,
      runtimeSnapshotQuery.data,
      runtimeSnapshotQuery.isLoading,
      runtimeSnapshotQuery.isPending,
      runtimeSnapshotQuery.isError,
      empresaActivaId,
    ],
  );

  const isRuntimeResolved = runtimeResolution.status === 'resolved';

  /**
   * Entry para PolicyResolver solo cuando Runtime resolvió.
   * Identidad siempre del Manifest; policy solo del Runtime.
   * Si no hay resolución, se conserva entry de Manifest solo por tipado/identidad
   * — su `.policy` NO alimenta PolicyResolver.
   */
  const entry = useMemo((): CodigoRegistryEntry => {
    if (runtimeResolution.status === 'resolved') {
      const { item, policy } = runtimeResolution;
      return {
        ...manifestEntry,
        policy,
        meta: {
          ...manifestEntry.meta,
          prefixHint: item.prefijo,
          exampleFormat: String(1).padStart(
            Math.max(1, item.longitud_numero || 1),
            '0',
          ),
          maxLength: item.max_output_length,
        },
      };
    }
    return manifestEntry;
  }, [manifestEntry, runtimeResolution]);

  const formatExample = useMemo(() => {
    if (runtimeResolution.status !== 'resolved') return undefined;
    return formatCodigoRuntimeExample(runtimeResolution.item);
  }, [runtimeResolution]);

  const profile = useMemo((): PolicyBehaviorProfile | null => {
    if (!isRuntimeResolved) return null;
    return resolvePolicyBehavior(entry, mode);
  }, [isRuntimeResolved, entry, mode]);

  const [state, dispatch] = useReducer(reducer, {
    ...CODIGO_INITIAL_STATE,
    value: initialValue,
    error: null,
  });

  const baselineRef = useRef<CodigoDirtySnapshot>({
    assignmentMode: CODIGO_INITIAL_STATE.assignmentMode,
    value: initialValue,
  });

  const syncedPolicyRef = useRef<string | null>(null);

  // Al resolver Runtime (o cambiar policy), INIT/RESET de la state machine.
  useEffect(() => {
    if (!profile) {
      syncedPolicyRef.current = null;
      return;
    }
    if (syncedPolicyRef.current === profile.policy) return;
    syncedPolicyRef.current = profile.policy;
    const nextMachine = createInitialCodigoState(mode, profile);
    baselineRef.current = {
      assignmentMode: nextMachine.assignmentMode,
      value: initialValue,
    };
    dispatch({ type: 'RESET', mode, profile });
    dispatch({ type: 'SET_VALUE', value: initialValue });
    dispatch({ type: 'CLEAR_ERROR' });
  }, [profile, mode, initialValue]);

  const viewModel = useMemo(() => {
    if (!profile) {
      return buildUnresolvedCodigoViewModel(manifestEntry, {
        value: state.value,
        error: state.error,
        disabled,
        labelOverride: label,
      });
    }
    return buildCodigoFieldViewModel({
      entry,
      mode,
      profile,
      uiPhase: state.uiPhase,
      assignmentMode: state.assignmentMode,
      isManualSectionExpanded: state.isManualSectionExpanded,
      value: state.value,
      error: state.error,
      initialValue,
      disabled,
      allowManualOverride,
      labelOverride: label,
      formatExample,
    });
  }, [
    profile,
    manifestEntry,
    entry,
    mode,
    state.uiPhase,
    state.assignmentMode,
    state.isManualSectionExpanded,
    state.value,
    state.error,
    initialValue,
    disabled,
    allowManualOverride,
    label,
    formatExample,
  ]);

  const payloadSlice = useMemo((): CodigoPayloadSlice => {
    if (!profile) {
      return { fieldKey: manifestEntry.fieldKey, value: undefined };
    }
    return buildCodigoPayloadSlice({
      entry,
      mode,
      profile,
      assignmentMode: state.assignmentMode,
      value: state.value,
    });
  }, [
    profile,
    manifestEntry.fieldKey,
    entry,
    mode,
    state.assignmentMode,
    state.value,
  ]);

  const dirtySnapshot = useMemo(
    (): CodigoDirtySnapshot => ({
      assignmentMode: state.assignmentMode,
      value: state.value,
    }),
    [state.assignmentMode, state.value],
  );

  /**
   * Baseline FCE: deriva de la policy Runtime (defaultAssignmentMode).
   * Mientras Runtime no resuelve, espeja el estado actual → no dirty falso.
   */
  const pristineSnapshot = useMemo((): CodigoDirtySnapshot => {
    if (!profile) {
      return {
        assignmentMode: state.assignmentMode,
        value: state.value,
      };
    }
    const initial = createInitialCodigoState(mode, profile);
    return {
      assignmentMode: initial.assignmentMode,
      value: initialValue,
    };
  }, [profile, mode, initialValue, state.assignmentMode, state.value]);

  const isDirty = useMemo(
    () => isCodigoFieldDirty(dirtySnapshot, pristineSnapshot),
    [dirtySnapshot, pristineSnapshot],
  );

  const setValue = useCallback((value: string) => {
    dispatch({ type: 'SET_VALUE', value });
  }, []);

  const expandManual = useCallback(() => {
    dispatch({ type: 'EXPAND_MANUAL' });
  }, []);

  const revertToAuto = useCallback(() => {
    dispatch({ type: 'REVERT_AUTO' });
    dispatch({ type: 'SET_VALUE', value: '' });
  }, []);

  const setSaving = useCallback((saving: boolean) => {
    dispatch({ type: 'SET_SAVING', saving });
  }, []);

  const setSuccess = useCallback(() => {
    dispatch({ type: 'SET_SUCCESS' });
  }, []);

  const setError = useCallback((message: string) => {
    dispatch({ type: 'SET_ERROR', message });
  }, []);

  const applyApiError = useCallback(
    (error: unknown): CodigoFieldError => {
      const mapped = mapCodigoFieldError(error, entry.fieldKey);
      dispatch({ type: 'SET_ERROR', message: mapped.message });
      return mapped;
    },
    [entry.fieldKey],
  );

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const reset = useCallback(() => {
    if (!profile) {
      dispatch({ type: 'SET_VALUE', value: initialValue });
      dispatch({ type: 'CLEAR_ERROR' });
      return;
    }
    const nextMachine = createInitialCodigoState(mode, profile);
    baselineRef.current = {
      assignmentMode: nextMachine.assignmentMode,
      value: initialValue,
    };
    dispatch({ type: 'RESET', mode, profile });
    dispatch({ type: 'SET_VALUE', value: initialValue });
    dispatch({ type: 'CLEAR_ERROR' });
  }, [mode, profile, initialValue]);

  const actions = useMemo(
    (): CodigoFieldControllerActions => ({
      setValue,
      expandManual,
      revertToAuto,
      setSaving,
      setSuccess,
      setError,
      applyApiError,
      clearError,
      reset,
    }),
    [
      setValue,
      expandManual,
      revertToAuto,
      setSaving,
      setSuccess,
      setError,
      applyApiError,
      clearError,
      reset,
    ],
  );

  return {
    entry,
    runtimeResolution,
    viewModel,
    payloadSlice,
    dirtySnapshot,
    pristineSnapshot,
    isDirty,
    actions,
  };
}

export { CODIGO_INITIAL_STATE };
