/**
 * FA-001 — Service HTTP catálogos globales Super Admin (PA-005).
 * Retorna envelopes HTTP sin adapter. Validación query en buildQueryParams / toAxiosQueryParams.
 */
import api from '@/core/api/api';
import type {
  CatDepartamento,
  CatDepartamentoCreate,
  CatDepartamentoUpdate,
  CatDistrito,
  CatDistritoCreate,
  CatDistritoUpdate,
  CatMoneda,
  CatMonedaCreate,
  CatMonedaUpdate,
  CatPais,
  CatPaisCreate,
  CatPaisUpdate,
  CatProvincia,
  CatProvinciaCreate,
  CatProvinciaUpdate,
} from '@/types/catalogos.types';
import type {
  PaginatedCatDepartamentoResponse,
  PaginatedCatDistritoResponse,
  PaginatedCatMonedaResponse,
  PaginatedCatPaisResponse,
  PaginatedCatProvinciaResponse,
  PlatformCatalogListParams,
} from '../types/platform-catalog.types';

const GLOBAL_BASE = '/catalogos-globales';

const API_DEFAULT_LIMIT = 100;
const MIN_LIMIT = 1;
const MAX_LIMIT = 1000;
const BUSCAR_MAX_LENGTH = 100;

/** Input UI/service — page base 1; normalizado a skip en buildQueryParams. */
export interface PlatformCatalogBuildQueryParamsInput {
  page?: number;
  limit?: number;
  solo_activos?: boolean;
  buscar?: string;
  pais_id?: string;
  departamento_id?: string;
  provincia_id?: string;
  ubigeo?: string;
  cliente_id?: string;
}

type HttpQueryParams = Record<string, string | number | boolean>;

function clampLimit(limit?: number): number {
  const value = limit ?? API_DEFAULT_LIMIT;
  return Math.min(Math.max(MIN_LIMIT, value), MAX_LIMIT);
}

function normalizeBuscar(raw?: string): string | undefined {
  if (raw == null) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.length > BUSCAR_MAX_LENGTH
    ? trimmed.slice(0, BUSCAR_MAX_LENGTH)
    : trimmed;
}

function normalizeOptionalString(raw?: string): string | undefined {
  if (raw == null) {
    return undefined;
  }
  const trimmed = raw.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Normalización congelada Scope Freeze §8.3 — única fuente de validación query.
 * page → skip; limit clamp 1–1000; buscar trim / omit vacío / truncar 100.
 */
export function buildQueryParams(
  input?: PlatformCatalogBuildQueryParamsInput,
): PlatformCatalogListParams {
  const page = Math.max(1, input?.page ?? 1);
  const limit = clampLimit(input?.limit);

  const params: PlatformCatalogListParams = {
    skip: (page - 1) * limit,
    limit,
    solo_activos: input?.solo_activos ?? true,
  };

  const buscar = normalizeBuscar(input?.buscar);
  if (buscar) {
    params.buscar = buscar;
  }

  const paisId = normalizeOptionalString(input?.pais_id);
  if (paisId) {
    params.pais_id = paisId;
  }

  const departamentoId = normalizeOptionalString(input?.departamento_id);
  if (departamentoId) {
    params.departamento_id = departamentoId;
  }

  const provinciaId = normalizeOptionalString(input?.provincia_id);
  if (provinciaId) {
    params.provincia_id = provinciaId;
  }

  const ubigeo = normalizeOptionalString(input?.ubigeo);
  if (ubigeo) {
    params.ubigeo = ubigeo;
  }

  const clienteId = normalizeOptionalString(input?.cliente_id);
  if (clienteId) {
    params.cliente_id = clienteId;
  }

  return params;
}

function toAxiosQueryParams(params?: PlatformCatalogListParams): HttpQueryParams {
  const skip = Math.max(0, params?.skip ?? 0);
  const limit = clampLimit(params?.limit);

  const query: HttpQueryParams = {
    skip,
    limit,
    solo_activos: params?.solo_activos ?? true,
  };

  const buscar = normalizeBuscar(params?.buscar);
  if (buscar) {
    query.buscar = buscar;
  }

  const paisId = normalizeOptionalString(params?.pais_id);
  if (paisId) {
    query.pais_id = paisId;
  }

  const departamentoId = normalizeOptionalString(params?.departamento_id);
  if (departamentoId) {
    query.departamento_id = departamentoId;
  }

  const provinciaId = normalizeOptionalString(params?.provincia_id);
  if (provinciaId) {
    query.provincia_id = provinciaId;
  }

  const ubigeo = normalizeOptionalString(params?.ubigeo);
  if (ubigeo) {
    query.ubigeo = ubigeo;
  }

  const clienteId = normalizeOptionalString(params?.cliente_id);
  if (clienteId) {
    query.cliente_id = clienteId;
  }

  return query;
}

async function fetchList<TResponse>(
  segment: string,
  params?: PlatformCatalogListParams,
): Promise<TResponse> {
  const { data } = await api.get<TResponse>(`${GLOBAL_BASE}/${segment}`, {
    params: toAxiosQueryParams(params),
  });
  return data;
}

export const platformCatalogGlobalService = {
  async listMonedas(
    params?: PlatformCatalogListParams,
  ): Promise<PaginatedCatMonedaResponse> {
    return fetchList<PaginatedCatMonedaResponse>('monedas', params);
  },

  async listPaises(
    params?: PlatformCatalogListParams,
  ): Promise<PaginatedCatPaisResponse> {
    return fetchList<PaginatedCatPaisResponse>('paises', params);
  },

  async listDepartamentos(
    params?: PlatformCatalogListParams,
  ): Promise<PaginatedCatDepartamentoResponse> {
    return fetchList<PaginatedCatDepartamentoResponse>('departamentos', params);
  },

  async listProvincias(
    params?: PlatformCatalogListParams,
  ): Promise<PaginatedCatProvinciaResponse> {
    return fetchList<PaginatedCatProvinciaResponse>('provincias', params);
  },

  async listDistritos(
    params?: PlatformCatalogListParams,
  ): Promise<PaginatedCatDistritoResponse> {
    return fetchList<PaginatedCatDistritoResponse>('distritos', params);
  },

  async createMoneda(payload: CatMonedaCreate): Promise<CatMoneda> {
    const { data } = await api.post<CatMoneda>(`${GLOBAL_BASE}/monedas`, payload);
    return data;
  },

  async updateMoneda(monedaId: string, payload: CatMonedaUpdate): Promise<CatMoneda> {
    const { data } = await api.put<CatMoneda>(
      `${GLOBAL_BASE}/monedas/${monedaId}`,
      payload,
    );
    return data;
  },

  async deleteMoneda(monedaId: string): Promise<void> {
    await api.delete(`${GLOBAL_BASE}/monedas/${monedaId}`);
  },

  async createPais(payload: CatPaisCreate): Promise<CatPais> {
    const { data } = await api.post<CatPais>(`${GLOBAL_BASE}/paises`, payload);
    return data;
  },

  async updatePais(paisId: string, payload: CatPaisUpdate): Promise<CatPais> {
    const { data } = await api.put<CatPais>(`${GLOBAL_BASE}/paises/${paisId}`, payload);
    return data;
  },

  async deletePais(paisId: string): Promise<void> {
    await api.delete(`${GLOBAL_BASE}/paises/${paisId}`);
  },

  async createDepartamento(payload: CatDepartamentoCreate): Promise<CatDepartamento> {
    const { data } = await api.post<CatDepartamento>(
      `${GLOBAL_BASE}/departamentos`,
      payload,
    );
    return data;
  },

  async updateDepartamento(
    departamentoId: string,
    payload: CatDepartamentoUpdate,
  ): Promise<CatDepartamento> {
    const { data } = await api.put<CatDepartamento>(
      `${GLOBAL_BASE}/departamentos/${departamentoId}`,
      payload,
    );
    return data;
  },

  async deleteDepartamento(departamentoId: string): Promise<void> {
    await api.delete(`${GLOBAL_BASE}/departamentos/${departamentoId}`);
  },

  async createProvincia(payload: CatProvinciaCreate): Promise<CatProvincia> {
    const { data } = await api.post<CatProvincia>(`${GLOBAL_BASE}/provincias`, payload);
    return data;
  },

  async updateProvincia(
    provinciaId: string,
    payload: CatProvinciaUpdate,
  ): Promise<CatProvincia> {
    const { data } = await api.put<CatProvincia>(
      `${GLOBAL_BASE}/provincias/${provinciaId}`,
      payload,
    );
    return data;
  },

  async deleteProvincia(provinciaId: string): Promise<void> {
    await api.delete(`${GLOBAL_BASE}/provincias/${provinciaId}`);
  },

  async createDistrito(payload: CatDistritoCreate): Promise<CatDistrito> {
    const { data } = await api.post<CatDistrito>(`${GLOBAL_BASE}/distritos`, payload);
    return data;
  },

  async updateDistrito(
    distritoId: string,
    payload: CatDistritoUpdate,
  ): Promise<CatDistrito> {
    const { data } = await api.put<CatDistrito>(
      `${GLOBAL_BASE}/distritos/${distritoId}`,
      payload,
    );
    return data;
  },

  async deleteDistrito(distritoId: string): Promise<void> {
    await api.delete(`${GLOBAL_BASE}/distritos/${distritoId}`);
  },
};
