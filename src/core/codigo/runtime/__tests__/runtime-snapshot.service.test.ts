import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/core/api/api';
import { codigoRuntimeSnapshotService } from '../runtime-snapshot.service';
import type { CodigoRuntimeSnapshot } from '../runtime-snapshot.types';

vi.mock('@/core/api/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const fixtureSnapshot: CodigoRuntimeSnapshot = {
  schema_version: '1.0',
  generated_at: '2026-07-20T23:15:00.000000',
  content_revision: '9ce3ac6c',
  items: [],
};

describe('codigoRuntimeSnapshotService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /cfg/runtime/snapshot sin query params', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: fixtureSnapshot });

    const result = await codigoRuntimeSnapshotService.getSnapshot();

    expect(api.get).toHaveBeenCalledWith('/cfg/runtime/snapshot');
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fixtureSnapshot);
  });
});
