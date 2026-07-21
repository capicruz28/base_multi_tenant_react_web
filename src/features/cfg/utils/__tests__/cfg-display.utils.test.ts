import { describe, it, expect } from 'vitest';
import {
  formatCfgCodigoEjemplo,
  formatCfgGenerationPolicyLabel,
  formatCfgModulo,
  formatCfgScopeRef,
  formatCfgScopeType,
  formatCfgSeparadorLabel,
} from '../cfg-display.utils';

describe('cfg-display.utils', () => {
  it('formatCfgScopeType usa labels conocidos', () => {
    expect(formatCfgScopeType('EMPRESA')).toBe('Empresa');
    expect(formatCfgScopeType('UNKNOWN')).toBe('—');
    expect(formatCfgScopeType(null)).toBe('—');
  });

  it('formatCfgScopeRef nunca muestra UUID', () => {
    const uuid = '11111111-1111-4111-8111-111111111111';
    expect(formatCfgScopeRef(null, uuid)).toBe('—');
    expect(formatCfgScopeRef(uuid)).toBe('—');
    expect(formatCfgScopeRef('Sucursal Centro')).toBe('Sucursal Centro');
  });

  it('formatCfgModulo', () => {
    expect(formatCfgModulo('ORG')).toBe('ORG');
    expect(formatCfgModulo('')).toBe('—');
    expect(formatCfgModulo(null)).toBe('—');
  });

  it('formatCfgGenerationPolicyLabel usa labels de negocio', () => {
    expect(formatCfgGenerationPolicyLabel('AUTO_REQUIRED')).toBe(
      'Automático obligatorio',
    );
    expect(formatCfgGenerationPolicyLabel('AUTO_DEFAULT')).toBe(
      'Automático sugerido',
    );
    expect(formatCfgGenerationPolicyLabel('MANUAL_ONLY')).toBe('Solo manual');
  });

  it('formatCfgSeparadorLabel', () => {
    expect(formatCfgSeparadorLabel('')).toBe('Sin separador');
    expect(formatCfgSeparadorLabel('-')).toBe('Guion (-)');
  });

  it('formatCfgCodigoEjemplo arma ejemplo local sin API', () => {
    expect(
      formatCfgCodigoEjemplo({
        prefijo: 'ALM',
        separador: '-',
        longitud_numero: 4,
        numero_inicial: 1,
      }),
    ).toBe('ALM-0001');
    expect(
      formatCfgCodigoEjemplo({
        prefijo: 'EMP',
        separador: '',
        longitud_numero: 3,
        numero_inicial: 12,
      }),
    ).toBe('EMP012');
  });
});
