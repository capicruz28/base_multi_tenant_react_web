/**
 * HTTP — Runtime Snapshot.
 * Contrato: GET /api/v1/cfg/runtime/snapshot (sin query params en v1.0).
 */

import api from '@/core/api/api';
import type { CodigoRuntimeSnapshot } from './runtime-snapshot.types';

const PATH = '/cfg/runtime/snapshot';

export const codigoRuntimeSnapshotService = {
  /**
   * Snapshot completo del tenant (módulos contratados/activos).
   * No requiere permisos cfg.secuencias.*.
   */
  getSnapshot: async (): Promise<CodigoRuntimeSnapshot> => {
    const { data } = await api.get<CodigoRuntimeSnapshot>(PATH);
    return data;
  },
};
