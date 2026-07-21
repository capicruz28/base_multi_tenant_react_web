import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import {
  invalidateCodigoRuntimeSnapshot,
  removeCodigoRuntimeSnapshot,
} from '../invalidate-runtime-snapshot';

function createMockQc(): QueryClient {
  return {
    invalidateQueries: vi.fn(),
    removeQueries: vi.fn(),
  } as unknown as QueryClient;
}

describe('invalidate-runtime-snapshot', () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = createMockQc();
  });

  it('invalidateCodigoRuntimeSnapshot usa key snapshot', () => {
    invalidateCodigoRuntimeSnapshot(qc);
    expect(qc.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['codigo', 'runtime', 'snapshot'],
    });
  });

  it('removeCodigoRuntimeSnapshot usa prefijo runtime', () => {
    removeCodigoRuntimeSnapshot(qc);
    expect(qc.removeQueries).toHaveBeenCalledWith({
      queryKey: ['codigo', 'runtime'],
    });
  });
});
