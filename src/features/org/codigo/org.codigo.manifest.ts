import type { CodigoRegistryEntry } from '@/core/codigo';

/** sequenceKey canónicos — Motor de Códigos ORG Ola 1 */
export const ORG_CODIGO_SEQUENCE_KEYS = {
  empresa: 'org_empresa',
  sucursal: 'org_sucursal',
  departamento: 'org_departamento',
  centroCosto: 'org_centro_costo',
  cargo: 'org_cargo',
} as const;

export type OrgCodigoSequenceKey =
  (typeof ORG_CODIGO_SEQUENCE_KEYS)[keyof typeof ORG_CODIGO_SEQUENCE_KEYS];

/**
 * Manifest oficial ORG — declaración estática por entidad.
 * Policies y payload los resuelve el Engine; aquí solo identidad + meta UX.
 */
export const ORG_CODIGO_MANIFEST: readonly CodigoRegistryEntry[] = [
  {
    sequenceKey: ORG_CODIGO_SEQUENCE_KEYS.empresa,
    moduleCode: 'org',
    entityKey: 'empresa',
    fieldKey: 'codigo_empresa',
    policy: 'AUTO_DEFAULT',
    meta: {
      entityLabel: 'empresa',
      prefixHint: 'EMP',
      exampleFormat: '002',
      scopeLabel: 'tenant',
      maxLength: 20,
    },
  },
  {
    sequenceKey: ORG_CODIGO_SEQUENCE_KEYS.sucursal,
    moduleCode: 'org',
    entityKey: 'sucursal',
    fieldKey: 'codigo',
    policy: 'AUTO_DEFAULT',
    meta: {
      entityLabel: 'sucursal',
      prefixHint: 'SUC',
      exampleFormat: '001',
      scopeLabel: 'empresa',
      maxLength: 20,
    },
  },
  {
    sequenceKey: ORG_CODIGO_SEQUENCE_KEYS.departamento,
    moduleCode: 'org',
    entityKey: 'departamento',
    fieldKey: 'codigo',
    policy: 'AUTO_DEFAULT',
    meta: {
      entityLabel: 'departamento',
      prefixHint: 'DEP',
      exampleFormat: '001',
      scopeLabel: 'empresa',
      maxLength: 20,
    },
  },
  {
    sequenceKey: ORG_CODIGO_SEQUENCE_KEYS.centroCosto,
    moduleCode: 'org',
    entityKey: 'centro_costo',
    fieldKey: 'codigo',
    policy: 'AUTO_DEFAULT',
    meta: {
      entityLabel: 'centro de costo',
      prefixHint: 'CC',
      exampleFormat: '001',
      scopeLabel: 'empresa',
      maxLength: 20,
    },
  },
  {
    sequenceKey: ORG_CODIGO_SEQUENCE_KEYS.cargo,
    moduleCode: 'org',
    entityKey: 'cargo',
    fieldKey: 'codigo',
    policy: 'AUTO_DEFAULT',
    meta: {
      entityLabel: 'cargo',
      prefixHint: 'CAR',
      exampleFormat: '001',
      scopeLabel: 'empresa',
      maxLength: 20,
    },
  },
];
