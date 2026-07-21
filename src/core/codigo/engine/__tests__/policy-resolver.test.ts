import { describe, it, expect } from 'vitest';

import type { CodigoRegistryEntry } from '../codigo-engine.types';
import { resolvePolicyBehavior } from '../policy-resolver';

const entry = (policy: CodigoRegistryEntry['policy']): CodigoRegistryEntry => ({
  sequenceKey: 'test',
  moduleCode: 'org',
  entityKey: 'test',
  fieldKey: 'codigo',
  policy,
  meta: {},
});

describe('policy-resolver', () => {
  it('AUTO_DEFAULT CREATE permite manual y panel auto', () => {
    const profile = resolvePolicyBehavior(entry('AUTO_DEFAULT'), 'create');
    expect(profile.allowsManualOnCreate).toBe(true);
    expect(profile.createPresentation).toBe('auto_panel');
    expect(profile.defaultAssignmentMode).toBe('auto');
  });

  it('AUTO_REQUIRED CREATE bloquea manual y usa locked panel', () => {
    const profile = resolvePolicyBehavior(entry('AUTO_REQUIRED'), 'create');
    expect(profile.allowsManualOnCreate).toBe(false);
    expect(profile.createPresentation).toBe('locked_panel');
  });

  it('MANUAL_ONLY CREATE exige input manual', () => {
    const profile = resolvePolicyBehavior(entry('MANUAL_ONLY'), 'create');
    expect(profile.createPresentation).toBe('manual_input');
    expect(profile.defaultAssignmentMode).toBe('manual');
  });

  it('AUTO_REQUIRED UPDATE es readonly', () => {
    const profile = resolvePolicyBehavior(entry('AUTO_REQUIRED'), 'update');
    expect(profile.updatePresentation).toBe('readonly');
  });

  it('MANUAL_ONLY UPDATE es editable', () => {
    const profile = resolvePolicyBehavior(entry('MANUAL_ONLY'), 'update');
    expect(profile.updatePresentation).toBe('editable');
  });

  it('READ fuerza readonly', () => {
    const profile = resolvePolicyBehavior(entry('MANUAL_ONLY'), 'read');
    expect(profile.updatePresentation).toBe('readonly');
  });
});
