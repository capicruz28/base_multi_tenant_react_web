import { describe, it, expect } from 'vitest';

import { getPolicyBehaviorProfile } from '../policy-profiles';
import {
  createInitialCodigoState,
  transitionCodigoState,
} from '../state-machine';

describe('state-machine', () => {
  it('CREATE AUTO_DEFAULT inicia en auto', () => {
    const profile = getPolicyBehaviorProfile('AUTO_DEFAULT', 'create');
    expect(createInitialCodigoState('create', profile)).toEqual({
      uiPhase: 'auto',
      assignmentMode: 'auto',
      isManualSectionExpanded: false,
    });
  });

  it('CREATE MANUAL_ONLY inicia en manual expandido', () => {
    const profile = getPolicyBehaviorProfile('MANUAL_ONLY', 'create');
    expect(createInitialCodigoState('create', profile)).toEqual({
      uiPhase: 'manual',
      assignmentMode: 'manual',
      isManualSectionExpanded: true,
    });
  });

  it('UPDATE AUTO_REQUIRED inicia readonly', () => {
    const profile = getPolicyBehaviorProfile('AUTO_REQUIRED', 'update');
    expect(createInitialCodigoState('update', profile).uiPhase).toBe('readonly');
  });

  it('EXPAND_MANUAL transiciona auto → manual', () => {
    const profile = getPolicyBehaviorProfile('AUTO_DEFAULT', 'create');
    const initial = createInitialCodigoState('create', profile);
    const next = transitionCodigoState(initial, { type: 'EXPAND_MANUAL' });
    expect(next.uiPhase).toBe('manual');
    expect(next.assignmentMode).toBe('manual');
    expect(next.isManualSectionExpanded).toBe(true);
  });

  it('REVERT_AUTO transiciona manual → auto', () => {
    const profile = getPolicyBehaviorProfile('AUTO_DEFAULT', 'create');
    const manual = transitionCodigoState(createInitialCodigoState('create', profile), {
      type: 'EXPAND_MANUAL',
    });
    const next = transitionCodigoState(manual, { type: 'REVERT_AUTO' });
    expect(next.uiPhase).toBe('auto');
    expect(next.assignmentMode).toBe('auto');
  });

  it('SET_SAVING y CLEAR_ERROR restauran fase operativa', () => {
    const profile = getPolicyBehaviorProfile('AUTO_DEFAULT', 'create');
    const base = createInitialCodigoState('create', profile);
    const saving = transitionCodigoState(base, { type: 'SET_SAVING', saving: true });
    expect(saving.uiPhase).toBe('saving');

    const restored = transitionCodigoState(saving, { type: 'SET_SAVING', saving: false });
    expect(restored.uiPhase).toBe('auto');

    const errored = transitionCodigoState(base, { type: 'SET_ERROR' });
    const cleared = transitionCodigoState(errored, { type: 'CLEAR_ERROR' });
    expect(cleared.uiPhase).toBe('auto');
  });
});
