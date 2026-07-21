/**
 * Config listado Tier B — CFG secuencias.
 * sort_by whitelist: docs/frontend-contracts/cfg/01_API_CONTRACT.md
 */

import type { ErpListResourceConfig } from '@/core/list';

export const SECUENCIAS_SORTABLE_COLUMNS = [
  'sequence_key',
  'scope_type',
  'prefijo',
  'ultimo_numero',
  'es_activo',
  'fecha_creacion',
  'fecha_actualizacion',
] as const;

export const SECUENCIAS_LIST_CONFIG: ErpListResourceConfig = {
  tier: 'B',
  forcePagination: true,
  defaultLimit: 50,
  sortableColumns: SECUENCIAS_SORTABLE_COLUMNS,
  defaultSort: { sort_by: 'sequence_key', sort_dir: 'asc' },
};
