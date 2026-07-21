import { describe, it, expect, beforeEach } from 'vitest';

import {
  clearCodigoRegistryForTests,
  getCodigoEntry,
  listCodigoEntriesByModule,
  registerCodigoManifest,
} from '@/core/codigo';

import { ORG_CODIGO_MANIFEST, ORG_CODIGO_SEQUENCE_KEYS } from '../org.codigo.manifest';

describe('org.codigo.manifest', () => {
  beforeEach(() => {
    clearCodigoRegistryForTests();
    registerCodigoManifest('org', ORG_CODIGO_MANIFEST);
  });

  it('registra las cinco entidades ORG Ola 1', () => {
    const entries = listCodigoEntriesByModule('org');
    expect(entries).toHaveLength(5);
    expect(entries.map((e) => e.sequenceKey).sort()).toEqual(
      Object.values(ORG_CODIGO_SEQUENCE_KEYS).sort(),
    );
  });

  it('org_empresa usa fieldKey codigo_empresa y AUTO_DEFAULT', () => {
    const entry = getCodigoEntry(ORG_CODIGO_SEQUENCE_KEYS.empresa);
    expect(entry.fieldKey).toBe('codigo_empresa');
    expect(entry.policy).toBe('AUTO_DEFAULT');
    expect(entry.meta.prefixHint).toBe('EMP');
  });

  it('entidades company-scoped usan fieldKey codigo', () => {
    for (const key of [
      ORG_CODIGO_SEQUENCE_KEYS.sucursal,
      ORG_CODIGO_SEQUENCE_KEYS.departamento,
      ORG_CODIGO_SEQUENCE_KEYS.centroCosto,
      ORG_CODIGO_SEQUENCE_KEYS.cargo,
    ]) {
      expect(getCodigoEntry(key).fieldKey).toBe('codigo');
      expect(getCodigoEntry(key).policy).toBe('AUTO_DEFAULT');
    }
  });
});
