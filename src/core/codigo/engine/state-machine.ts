import type {
  CodigoFieldMode,
  CodigoStateMachineEvent,
  CodigoStateMachineState,
  CodigoUiPhase,
  PolicyBehaviorProfile,
} from './codigo-engine.types';

export const CODIGO_INITIAL_STATE: CodigoStateMachineState = {
  uiPhase: 'idle',
  assignmentMode: 'auto',
  isManualSectionExpanded: false,
};

function resolveInitialPhase(
  mode: CodigoFieldMode,
  profile: PolicyBehaviorProfile,
): CodigoUiPhase {
  if (mode === 'read') {
    return 'readonly';
  }

  if (mode === 'update') {
    return profile.updatePresentation === 'readonly' ? 'readonly' : 'manual';
  }

  switch (profile.createPresentation) {
    case 'auto_panel':
      return 'auto';
    case 'manual_input':
      return 'manual';
    case 'locked_panel':
      return 'auto';
    default: {
      const _exhaustive: never = profile.createPresentation;
      throw new Error(`Presentación CREATE desconocida: ${String(_exhaustive)}`);
    }
  }
}

export function createInitialCodigoState(
  mode: CodigoFieldMode,
  profile: PolicyBehaviorProfile,
): CodigoStateMachineState {
  return {
    uiPhase: resolveInitialPhase(mode, profile),
    assignmentMode: profile.defaultAssignmentMode,
    isManualSectionExpanded: profile.createPresentation === 'manual_input',
  };
}

export function transitionCodigoState(
  state: CodigoStateMachineState,
  event: CodigoStateMachineEvent,
): CodigoStateMachineState {
  switch (event.type) {
    case 'INIT':
      return createInitialCodigoState(event.mode, event.profile);

    case 'EXPAND_MANUAL':
      if (state.uiPhase !== 'auto') {
        return state;
      }
      return {
        ...state,
        uiPhase: 'manual',
        assignmentMode: 'manual',
        isManualSectionExpanded: true,
      };

    case 'REVERT_AUTO':
      if (state.uiPhase !== 'manual') {
        return state;
      }
      return {
        ...state,
        uiPhase: 'auto',
        assignmentMode: 'auto',
        isManualSectionExpanded: false,
      };

    case 'SET_SAVING':
      if (!event.saving) {
        return state.uiPhase === 'saving'
          ? { ...state, uiPhase: state.assignmentMode === 'manual' ? 'manual' : 'auto' }
          : state;
      }
      return { ...state, uiPhase: 'saving' };

    case 'SET_SUCCESS':
      return { ...state, uiPhase: 'success' };

    case 'SET_ERROR':
      return { ...state, uiPhase: 'error' };

    case 'CLEAR_ERROR':
      if (state.uiPhase !== 'error') {
        return state;
      }
      return {
        ...state,
        uiPhase: state.assignmentMode === 'manual' ? 'manual' : 'auto',
      };

    case 'RESET':
      return createInitialCodigoState(event.mode, event.profile);

    default: {
      const _exhaustive: never = event;
      throw new Error(`Evento de state machine desconocido: ${String(_exhaustive)}`);
    }
  }
}
