import { describe, it, expect } from 'vitest';
import { isDirtyAgainstBaseline } from '@/features/org/utils/org-form-dirty.helpers';
import { fixtureFormatoBaseline } from '../../__tests__/fixtures/cfg-secuencia.fixtures';
import {
  buildCfgSecuenciaUpdatePayload,
  isCfgUpdatePayloadEmpty,
  normalizeCfgPrefijoInput,
  validateCfgSecuenciaFormato,
} from '../cfg-secuencia-form.utils';
import { normalizeCfgFormatoForDirty } from '../cfg-secuencia-dirty.utils';

describe('cfg-secuencia-form.utils', () => {
  it('normalizeCfgPrefijoInput trim + uppercase', () => {
    expect(normalizeCfgPrefijoInput('  emp ')).toBe('EMP');
  });

  it('validateCfgSecuenciaFormato rechaza separador inválido y prefijo vacío', () => {
    const errors = validateCfgSecuenciaFormato({
      ...fixtureFormatoBaseline,
      prefijo: '',
      separador: '_' as '',
    });
    expect(errors.prefijo).toBeTruthy();
    expect(errors.separador).toBeTruthy();
  });

  it('validateCfgSecuenciaFormato acepta numero_inicial <= ultimo_numero (no valida ultimo)', () => {
    const errors = validateCfgSecuenciaFormato({
      ...fixtureFormatoBaseline,
      numero_inicial: 1,
    });
    expect(errors).toEqual({});
  });

  it('buildCfgSecuenciaUpdatePayload solo dirty fields', () => {
    const payload = buildCfgSecuenciaUpdatePayload(fixtureFormatoBaseline, {
      ...fixtureFormatoBaseline,
      prefijo: 'dep',
      longitud_numero: 6,
      generation_policy: 'MANUAL_ONLY',
    });
    expect(payload).toEqual({
      prefijo: 'DEP',
      longitud_numero: 6,
      generation_policy: 'MANUAL_ONLY',
    });
    expect(payload).not.toHaveProperty('separador');
    expect(payload).not.toHaveProperty('es_activo');
  });

  it('buildCfgSecuenciaUpdatePayload vacío si no hay cambios', () => {
    const payload = buildCfgSecuenciaUpdatePayload(
      fixtureFormatoBaseline,
      { ...fixtureFormatoBaseline, prefijo: ' emp ' },
    );
    expect(isCfgUpdatePayloadEmpty(payload)).toBe(true);
  });
});

describe('cfg-secuencia-dirty.utils', () => {
  it('igual baseline → not dirty', () => {
    const a = normalizeCfgFormatoForDirty(fixtureFormatoBaseline);
    const b = normalizeCfgFormatoForDirty({
      ...fixtureFormatoBaseline,
      prefijo: ' emp ',
    });
    expect(isDirtyAgainstBaseline(a, b)).toBe(false);
  });

  it('cambio prefijo → dirty', () => {
    const a = normalizeCfgFormatoForDirty(fixtureFormatoBaseline);
    const b = normalizeCfgFormatoForDirty({
      ...fixtureFormatoBaseline,
      prefijo: 'DEP',
    });
    expect(isDirtyAgainstBaseline(a, b)).toBe(true);
  });
});
