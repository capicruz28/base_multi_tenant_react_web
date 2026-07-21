import { describe, it, expect } from 'vitest';

import type { CodigoRegistryEntry } from '../codigo-engine.types';
import { buildCodigoPayloadSlice, mergeCodigoIntoPayload } from '../payload-builder';
import { resolvePolicyBehavior } from '../policy-resolver';

const baseEntry: CodigoRegistryEntry = {
  sequenceKey: 'org_test',
  moduleCode: 'org',
  entityKey: 'test',
  fieldKey: 'codigo',
  policy: 'AUTO_DEFAULT',
  meta: {},
};

describe('payload-builder', () => {
  it('AUTO_DEFAULT + auto omite propiedad', () => {
    const profile = resolvePolicyBehavior({ ...baseEntry, policy: 'AUTO_DEFAULT' }, 'create');
    const slice = buildCodigoPayloadSlice({
      entry: baseEntry,
      mode: 'create',
      profile,
      assignmentMode: 'auto',
      value: '',
    });
    expect(slice.value).toBeUndefined();
    const merged = mergeCodigoIntoPayload({ nombre: 'X', codigo: 'OLD' }, slice);
    expect(merged).toEqual({ nombre: 'X' });
    expect('codigo' in merged).toBe(false);
  });

  it('AUTO_DEFAULT + manual envía código trim', () => {
    const profile = resolvePolicyBehavior({ ...baseEntry, policy: 'AUTO_DEFAULT' }, 'create');
    const slice = buildCodigoPayloadSlice({
      entry: baseEntry,
      mode: 'create',
      profile,
      assignmentMode: 'manual',
      value: '  ABC  ',
    });
    expect(slice.value).toBe('ABC');
  });

  it('AUTO_REQUIRED CREATE omite propiedad', () => {
    const profile = resolvePolicyBehavior({ ...baseEntry, policy: 'AUTO_REQUIRED' }, 'create');
    const slice = buildCodigoPayloadSlice({
      entry: baseEntry,
      mode: 'create',
      profile,
      assignmentMode: 'auto',
      value: 'SHOULD-NOT-SEND',
    });
    expect(slice.value).toBeUndefined();
  });

  it('MANUAL_ONLY CREATE envía código', () => {
    const profile = resolvePolicyBehavior({ ...baseEntry, policy: 'MANUAL_ONLY' }, 'create');
    const slice = buildCodigoPayloadSlice({
      entry: baseEntry,
      mode: 'create',
      profile,
      assignmentMode: 'manual',
      value: 'MAN-01',
    });
    expect(slice.value).toBe('MAN-01');
  });

  it('mergeCodigoIntoPayload asigna valor cuando está definido', () => {
    const merged = mergeCodigoIntoPayload({ nombre: 'X' }, { fieldKey: 'codigo', value: 'C1' });
    expect(merged).toEqual({ nombre: 'X', codigo: 'C1' });
  });
});
