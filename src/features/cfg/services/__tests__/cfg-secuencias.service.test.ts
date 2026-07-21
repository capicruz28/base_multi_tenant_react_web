import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/core/api/api';
import { cfgSecuenciaService } from '../cfg-secuencias.service';
import {
  fixturePreviewOk,
  fixtureSecuenciaActiva,
} from '../../__tests__/fixtures/cfg-secuencia.fixtures';

vi.mock('@/core/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('cfgSecuenciaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list GET /cfg/secuencias con page y omite undefined', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [fixtureSecuenciaActiva] });

    await cfgSecuenciaService.list({
      page: 1,
      limit: 50,
      modulo_codigo: 'ORG',
      es_activo: true,
      buscar: ' emp ',
      scope_type: undefined,
      empresa_id: undefined,
    });

    expect(api.get).toHaveBeenCalledWith('/cfg/secuencias', {
      params: {
        page: 1,
        limit: 50,
        modulo_codigo: 'ORG',
        es_activo: true,
        buscar: 'emp',
      },
    });
    const params = vi.mocked(api.get).mock.calls[0][1]?.params as Record<
      string,
      unknown
    >;
    expect(params).not.toHaveProperty('scope_type');
    expect(params).not.toHaveProperty('empresa_id');
    expect(params).not.toHaveProperty('cliente_id');
  });

  it('getById GET /cfg/secuencias/{id}', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: fixtureSecuenciaActiva });

    const result = await cfgSecuenciaService.getById(
      fixtureSecuenciaActiva.secuencia_id,
    );

    expect(api.get).toHaveBeenCalledWith(
      `/cfg/secuencias/${fixtureSecuenciaActiva.secuencia_id}`,
    );
    expect(result).toEqual(fixtureSecuenciaActiva);
  });

  it('update PATCH solo body de formato (sin es_activo)', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: fixtureSecuenciaActiva });

    const body = { prefijo: 'DEP', longitud_numero: 5 };
    await cfgSecuenciaService.update(fixtureSecuenciaActiva.secuencia_id, body);

    expect(api.patch).toHaveBeenCalledWith(
      `/cfg/secuencias/${fixtureSecuenciaActiva.secuencia_id}`,
      body,
    );
    const sent = vi.mocked(api.patch).mock.calls[0][1] as Record<string, unknown>;
    expect(sent).not.toHaveProperty('es_activo');
    expect(sent).not.toHaveProperty('ultimo_numero');
  });

  it('desactivar DELETE /cfg/secuencias/{id}', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: fixtureSecuenciaActiva });

    await cfgSecuenciaService.desactivar(fixtureSecuenciaActiva.secuencia_id);

    expect(api.delete).toHaveBeenCalledWith(
      `/cfg/secuencias/${fixtureSecuenciaActiva.secuencia_id}`,
    );
  });

  it('reactivar POST /cfg/secuencias/{id}/reactivar', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: fixtureSecuenciaActiva });

    await cfgSecuenciaService.reactivar(fixtureSecuenciaActiva.secuencia_id);

    expect(api.post).toHaveBeenCalledWith(
      `/cfg/secuencias/${fixtureSecuenciaActiva.secuencia_id}/reactivar`,
    );
  });

  it('preview POST /cfg/secuencias/{id}/preview sin body', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: fixturePreviewOk });

    const result = await cfgSecuenciaService.preview(
      fixtureSecuenciaActiva.secuencia_id,
    );

    expect(api.post).toHaveBeenCalledWith(
      `/cfg/secuencias/${fixtureSecuenciaActiva.secuencia_id}/preview`,
    );
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(vi.mocked(api.post).mock.calls[0]).toHaveLength(1);
    expect(result.consume_contador).toBe(false);
  });
});
