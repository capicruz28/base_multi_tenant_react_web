import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import {
  invalidateCfgQueries,
  invalidateCfgSecuenciaDetail,
  invalidateCfgSecuenciasList,
  removeCfgQueries,
  removeCfgSecuenciaDetail,
} from '../invalidate-cfg-queries';

function createMockQc(): QueryClient {
  return {
    invalidateQueries: vi.fn(),
    removeQueries: vi.fn(),
  } as unknown as QueryClient;
}

describe('invalidate-cfg-queries', () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = createMockQc();
  });

  it('invalidateCfgQueries usa prefijo cfg y Runtime Snapshot', () => {
    invalidateCfgQueries(qc);
    expect(qc.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['cfg'],
    });
    expect(qc.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['codigo', 'runtime', 'snapshot'],
    });
  });

  it('invalidateCfgSecuenciasList usa list key', () => {
    invalidateCfgSecuenciasList(qc);
    expect(qc.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['cfg', 'secuencias', 'list'],
    });
  });

  it('invalidate/remove detail por id', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    invalidateCfgSecuenciaDetail(qc, id);
    expect(qc.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['cfg', 'secuencia', id],
    });
    removeCfgSecuenciaDetail(qc, id);
    expect(qc.removeQueries).toHaveBeenCalledWith({
      queryKey: ['cfg', 'secuencia', id],
    });
  });

  it('removeCfgQueries limpia cfg y Runtime Snapshot', () => {
    removeCfgQueries(qc);
    expect(qc.removeQueries).toHaveBeenCalledWith({
      queryKey: ['cfg'],
    });
    expect(qc.removeQueries).toHaveBeenCalledWith({
      queryKey: ['codigo', 'runtime'],
    });
  });
});
