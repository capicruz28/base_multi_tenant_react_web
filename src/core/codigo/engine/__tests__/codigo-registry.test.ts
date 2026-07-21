import { describe, it, expect, beforeEach } from 'vitest';

import type { CodigoRegistryEntry } from '../codigo-engine.types';
import {
  clearCodigoRegistryForTests,
  getCodigoEntry,
  registerCodigoManifest,
} from '../codigo-registry';

const sampleEntry: CodigoRegistryEntry = {
  sequenceKey: 'org_sucursal',
  moduleCode: 'org',
  entityKey: 'sucursal',
  fieldKey: 'codigo',
  policy: 'AUTO_DEFAULT',
  meta: { entityLabel: 'sucursal', prefixHint: 'SUC-' },
};

describe('codigo-registry', () => {
  beforeEach(() => {
    clearCodigoRegistryForTests();
  });

  it('registra y resuelve entry por sequenceKey', () => {
    registerCodigoManifest('org', [sampleEntry]);
    expect(getCodigoEntry('org_sucursal')).toEqual(sampleEntry);
  });

  it('rechaza sequenceKey duplicado', () => {
    registerCodigoManifest('org', [sampleEntry]);
    expect(() => registerCodigoManifest('org', [sampleEntry])).toThrow(/duplicate/i);
  });

  it('rechaza moduleCode inconsistente en entry', () => {
    expect(() =>
      registerCodigoManifest('inv', [{ ...sampleEntry, moduleCode: 'org' }]),
    ).toThrow(/mismatch/i);
  });

  it('lanza si sequenceKey no existe', () => {
    expect(() => getCodigoEntry('missing')).toThrow(/no registrado/i);
  });
});
