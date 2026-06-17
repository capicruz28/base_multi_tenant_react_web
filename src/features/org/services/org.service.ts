/**
 * Servicio del módulo ORG (Organización)
 * Base URL: /api/v1/org/
 * Contrato Etapa B: company-scoped sin ?empresa_id (ámbito solo JWT).
 */
import api from '@/core/api/api';
import {
  buildErpListQueryParams,
  unwrapListItems,
  type ErpPaginatedResponse,
} from '@/core/list';
import type {
  Empresa,
  EmpresaCreate,
  EmpresaUpdate,
  Sucursal,
  SucursalCreate,
  SucursalUpdate,
  CentroCosto,
  CentroCostoCreate,
  CentroCostoUpdate,
  Departamento,
  DepartamentoCreate,
  DepartamentoUpdate,
  Cargo,
  CargoCreate,
  CargoUpdate,
  Parametro,
  ParametroCreate,
  ParametroUpdate,
  OrgCompanyListParams,
  OrgParametroListParams,
} from '../types/org.types';

const BASE = '/org';

function buildListQuery(
  params?: OrgCompanyListParams & { modulo_codigo?: string },
): Record<string, string | number | boolean> {
  return buildErpListQueryParams(
    {
      solo_activos: params?.solo_activos ?? true,
      modulo_codigo: params?.modulo_codigo,
    },
    params,
  );
}

function buildParametroListQuery(
  params?: OrgParametroListParams,
): Record<string, string | number | boolean> {
  const q = buildListQuery(params);
  if (params?.vista) q.vista = params.vista;
  return q;
}

/** Query HTTP parámetros (incl. `vista`) — usar con `orgFetchList` en ErpList. */
export function buildOrgParametroListQuery(
  params?: OrgParametroListParams,
): Record<string, string | number | boolean> {
  return buildParametroListQuery(params);
}

/** Fetch listado ORG — retorna `list[]` o envelope según `page` (PERF-01). */
export async function orgFetchList<T>(
  path: string,
  params?: Record<string, string | number | boolean>,
): Promise<T[] | ErpPaginatedResponse<T>> {
  const { data } = await api.get<T[] | ErpPaginatedResponse<T>>(`${BASE}${path}`, { params });
  return data;
}

function orgListItems<T>(data: T[] | ErpPaginatedResponse<T>): T[] {
  return unwrapListItems(data);
}

// ─── Empresa (tenant-scoped) ─────────────────────────────────────────────

export const empresaService = {
  list: async (params?: OrgCompanyListParams): Promise<Empresa[]> => {
    const data = await orgFetchList<Empresa>(
      '/empresa',
      buildErpListQueryParams({ solo_activos: params?.solo_activos ?? true }, params),
    );
    return orgListItems(data);
  },

  getById: async (empresaId: string): Promise<Empresa> => {
    const { data } = await api.get<Empresa>(`${BASE}/empresa/${empresaId}`);
    return data;
  },

  create: async (payload: EmpresaCreate): Promise<Empresa> => {
    const { data } = await api.post<Empresa>(`${BASE}/empresa`, payload);
    return data;
  },

  update: async (empresaId: string, payload: EmpresaUpdate): Promise<Empresa> => {
    const { data } = await api.put<Empresa>(`${BASE}/empresa/${empresaId}`, payload);
    return data;
  },

  delete: async (empresaId: string): Promise<void> => {
    await api.delete(`${BASE}/empresa/${empresaId}`);
  },

  reactivar: async (empresaId: string): Promise<Empresa> => {
    const { data } = await api.post<Empresa>(`${BASE}/empresa/${empresaId}/reactivar`);
    return data;
  },
};

// ─── Sucursales (company-scoped, JWT) ─────────────────────────────────────

export const sucursalService = {
  list: async (params?: OrgCompanyListParams): Promise<Sucursal[]> => {
    return orgListItems(await orgFetchList<Sucursal>('/sucursales', buildListQuery(params)));
  },

  getById: async (sucursalId: string): Promise<Sucursal> => {
    const { data } = await api.get<Sucursal>(`${BASE}/sucursales/${sucursalId}`);
    return data;
  },

  create: async (payload: SucursalCreate): Promise<Sucursal> => {
    const { data } = await api.post<Sucursal>(`${BASE}/sucursales`, payload);
    return data;
  },

  update: async (sucursalId: string, payload: SucursalUpdate): Promise<Sucursal> => {
    const { data } = await api.put<Sucursal>(`${BASE}/sucursales/${sucursalId}`, payload);
    return data;
  },

  delete: async (sucursalId: string): Promise<void> => {
    await api.delete(`${BASE}/sucursales/${sucursalId}`);
  },

  reactivar: async (sucursalId: string): Promise<Sucursal> => {
    const { data } = await api.post<Sucursal>(`${BASE}/sucursales/${sucursalId}/reactivar`);
    return data;
  },
};

// ─── Centros de costo (company-scoped, JWT) ───────────────────────────────

export const centroCostoService = {
  list: async (params?: OrgCompanyListParams): Promise<CentroCosto[]> => {
    return orgListItems(
      await orgFetchList<CentroCosto>('/centros-costo', buildListQuery(params)),
    );
  },

  getById: async (centroCostoId: string): Promise<CentroCosto> => {
    const { data } = await api.get<CentroCosto>(`${BASE}/centros-costo/${centroCostoId}`);
    return data;
  },

  create: async (payload: CentroCostoCreate): Promise<CentroCosto> => {
    const { data } = await api.post<CentroCosto>(`${BASE}/centros-costo`, payload);
    return data;
  },

  update: async (centroCostoId: string, payload: CentroCostoUpdate): Promise<CentroCosto> => {
    const { data } = await api.put<CentroCosto>(`${BASE}/centros-costo/${centroCostoId}`, payload);
    return data;
  },

  delete: async (centroCostoId: string): Promise<void> => {
    await api.delete(`${BASE}/centros-costo/${centroCostoId}`);
  },

  reactivar: async (centroCostoId: string): Promise<CentroCosto> => {
    const { data } = await api.post<CentroCosto>(
      `${BASE}/centros-costo/${centroCostoId}/reactivar`,
    );
    return data;
  },
};

// ─── Departamentos (company-scoped, JWT) ──────────────────────────────────

export const departamentoService = {
  list: async (params?: OrgCompanyListParams): Promise<Departamento[]> => {
    return orgListItems(
      await orgFetchList<Departamento>('/departamentos', buildListQuery(params)),
    );
  },

  getById: async (departamentoId: string): Promise<Departamento> => {
    const { data } = await api.get<Departamento>(`${BASE}/departamentos/${departamentoId}`);
    return data;
  },

  create: async (payload: DepartamentoCreate): Promise<Departamento> => {
    const { data } = await api.post<Departamento>(`${BASE}/departamentos`, payload);
    return data;
  },

  update: async (departamentoId: string, payload: DepartamentoUpdate): Promise<Departamento> => {
    const { data } = await api.put<Departamento>(
      `${BASE}/departamentos/${departamentoId}`,
      payload,
    );
    return data;
  },

  delete: async (departamentoId: string): Promise<void> => {
    await api.delete(`${BASE}/departamentos/${departamentoId}`);
  },

  reactivar: async (departamentoId: string): Promise<Departamento> => {
    const { data } = await api.post<Departamento>(
      `${BASE}/departamentos/${departamentoId}/reactivar`,
    );
    return data;
  },
};

// ─── Cargos (company-scoped, JWT) ─────────────────────────────────────────

export const cargoService = {
  list: async (params?: OrgCompanyListParams): Promise<Cargo[]> => {
    return orgListItems(await orgFetchList<Cargo>('/cargos', buildListQuery(params)));
  },

  getById: async (cargoId: string): Promise<Cargo> => {
    const { data } = await api.get<Cargo>(`${BASE}/cargos/${cargoId}`);
    return data;
  },

  create: async (payload: CargoCreate): Promise<Cargo> => {
    const { data } = await api.post<Cargo>(`${BASE}/cargos`, payload);
    return data;
  },

  update: async (cargoId: string, payload: CargoUpdate): Promise<Cargo> => {
    const { data } = await api.put<Cargo>(`${BASE}/cargos/${cargoId}`, payload);
    return data;
  },

  delete: async (cargoId: string): Promise<void> => {
    await api.delete(`${BASE}/cargos/${cargoId}`);
  },

  reactivar: async (cargoId: string): Promise<Cargo> => {
    const { data } = await api.post<Cargo>(`${BASE}/cargos/${cargoId}/reactivar`);
    return data;
  },
};

// ─── Parámetros (hybrid, JWT — sin ?empresa_id en query) ───────────────────

export const parametroService = {
  list: async (params?: OrgParametroListParams): Promise<Parametro[]> => {
    return orgListItems(
      await orgFetchList<Parametro>('/parametros', buildParametroListQuery(params)),
    );
  },

  getById: async (parametroId: string): Promise<Parametro> => {
    const { data } = await api.get<Parametro>(`${BASE}/parametros/${parametroId}`);
    return data;
  },

  create: async (payload: ParametroCreate): Promise<Parametro> => {
    const { data } = await api.post<Parametro>(`${BASE}/parametros`, payload);
    return data;
  },

  update: async (parametroId: string, payload: ParametroUpdate): Promise<Parametro> => {
    const { data } = await api.put<Parametro>(`${BASE}/parametros/${parametroId}`, payload);
    return data;
  },

  delete: async (parametroId: string): Promise<void> => {
    await api.delete(`${BASE}/parametros/${parametroId}`);
  },

  reactivar: async (parametroId: string): Promise<Parametro> => {
    const { data } = await api.post<Parametro>(`${BASE}/parametros/${parametroId}/reactivar`);
    return data;
  },
};
