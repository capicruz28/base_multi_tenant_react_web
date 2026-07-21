/**
 * Query keys oficiales CFG — sin tenantId (lo añade useTenantQuery).
 */

export const CFG_QUERY_KEY_PREFIX = ['cfg'] as const;

export const cfgQueryKeys = {
  all: ['cfg'] as const,
  secuencias: () => ['cfg', 'secuencias'] as const,
  secuenciasList: () => ['cfg', 'secuencias', 'list'] as const,
  secuencia: (id: string) => ['cfg', 'secuencia', id] as const,
} as const;
