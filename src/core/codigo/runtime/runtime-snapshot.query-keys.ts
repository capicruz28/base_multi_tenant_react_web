/**
 * Query keys — Runtime Snapshot FCE.
 * useTenantQuery añade tenantId al final.
 */

export const CODIGO_RUNTIME_QUERY_KEY_PREFIX = ['codigo', 'runtime'] as const;

export const codigoRuntimeQueryKeys = {
  all: [...CODIGO_RUNTIME_QUERY_KEY_PREFIX] as const,
  snapshot: () => [...CODIGO_RUNTIME_QUERY_KEY_PREFIX, 'snapshot'] as const,
} as const;
