/**
 * Servicio del módulo ORG (Organización)
 * Base URL: /api/v1/org/
 * Autenticación: Bearer token (header enviado por la instancia axios).
 */
import api from '@/core/api/api';
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
  OrgListParams,
} from '../types/org.types';

const BASE = '/org';

// ─── Empresa ─────────────────────────────────────────────────────────────

export const empresaService = {
  list: async (params?: { solo_activos?: boolean; buscar?: string }): Promise<Empresa[]> => {
    const { data } = await api.get<Empresa[]>(`${BASE}/empresa`, {
      params: { solo_activos: params?.solo_activos ?? true, buscar: params?.buscar },
    });
    return Array.isArray(data) ? data : [];
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

// ─── Sucursales ───────────────────────────────────────────────────────────

export const sucursalService = {
  list: async (params?: OrgListParams & { buscar?: string }): Promise<Sucursal[]> => {
    const q: Record<string, string | boolean> = { solo_activos: params?.solo_activos ?? true };
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.buscar) q.buscar = params.buscar;
    const { data } = await api.get<Sucursal[]>(`${BASE}/sucursales`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (sucursalId: string, params?: { empresa_id?: string }): Promise<Sucursal> => {
    const { data } = await api.get<Sucursal>(`${BASE}/sucursales/${sucursalId}`, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
    return data;
  },

  create: async (payload: SucursalCreate): Promise<Sucursal> => {
    const { data } = await api.post<Sucursal>(`${BASE}/sucursales`, payload);
    return data;
  },

  update: async (sucursalId: string, payload: SucursalUpdate, params?: { empresa_id?: string }): Promise<Sucursal> => {
    const { data } = await api.put<Sucursal>(`${BASE}/sucursales/${sucursalId}`, payload, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
    return data;
  },

  delete: async (sucursalId: string, params?: { empresa_id?: string }): Promise<void> => {
    await api.delete(`${BASE}/sucursales/${sucursalId}`, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
  },

  reactivar: async (sucursalId: string, params?: { empresa_id?: string }): Promise<Sucursal> => {
    const { data } = await api.post<Sucursal>(`${BASE}/sucursales/${sucursalId}/reactivar`, null, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
    return data;
  },
};

// ─── Centros de costo ─────────────────────────────────────────────────────

export const centroCostoService = {
  list: async (params?: OrgListParams & { buscar?: string }): Promise<CentroCosto[]> => {
    const q: Record<string, string | boolean> = { solo_activos: params?.solo_activos ?? true };
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.buscar) q.buscar = params.buscar;
    const { data } = await api.get<CentroCosto[]>(`${BASE}/centros-costo`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (centroCostoId: string, params?: { empresa_id?: string }): Promise<CentroCosto> => {
    const { data } = await api.get<CentroCosto>(`${BASE}/centros-costo/${centroCostoId}`, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
    return data;
  },

  create: async (payload: CentroCostoCreate): Promise<CentroCosto> => {
    const { data } = await api.post<CentroCosto>(`${BASE}/centros-costo`, payload);
    return data;
  },

  update: async (centroCostoId: string, payload: CentroCostoUpdate, params?: { empresa_id?: string }): Promise<CentroCosto> => {
    const { data } = await api.put<CentroCosto>(`${BASE}/centros-costo/${centroCostoId}`, payload, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
    return data;
  },

  delete: async (centroCostoId: string, params?: { empresa_id?: string }): Promise<void> => {
    await api.delete(`${BASE}/centros-costo/${centroCostoId}`, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
  },

  reactivar: async (centroCostoId: string, params?: { empresa_id?: string }): Promise<CentroCosto> => {
    const { data } = await api.post<CentroCosto>(`${BASE}/centros-costo/${centroCostoId}/reactivar`, null, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
    return data;
  },
};

// ─── Departamentos ────────────────────────────────────────────────────────

export const departamentoService = {
  list: async (params?: OrgListParams & { buscar?: string }): Promise<Departamento[]> => {
    const q: Record<string, string | boolean> = { solo_activos: params?.solo_activos ?? true };
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.buscar) q.buscar = params.buscar;
    const { data } = await api.get<Departamento[]>(`${BASE}/departamentos`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (departamentoId: string, params?: { empresa_id?: string }): Promise<Departamento> => {
    const { data } = await api.get<Departamento>(`${BASE}/departamentos/${departamentoId}`, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
    return data;
  },

  create: async (payload: DepartamentoCreate): Promise<Departamento> => {
    const { data } = await api.post<Departamento>(`${BASE}/departamentos`, payload);
    return data;
  },

  update: async (
    departamentoId: string,
    payload: DepartamentoUpdate,
    params?: { empresa_id?: string }
  ): Promise<Departamento> => {
    const { data } = await api.put<Departamento>(`${BASE}/departamentos/${departamentoId}`, payload, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
    return data;
  },

  delete: async (departamentoId: string, params?: { empresa_id?: string }): Promise<void> => {
    await api.delete(`${BASE}/departamentos/${departamentoId}`, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
  },

  reactivar: async (departamentoId: string, params?: { empresa_id?: string }): Promise<Departamento> => {
    const { data } = await api.post<Departamento>(`${BASE}/departamentos/${departamentoId}/reactivar`, null, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
    return data;
  },
};

// ─── Cargos ──────────────────────────────────────────────────────────────

export const cargoService = {
  list: async (params?: OrgListParams & { buscar?: string }): Promise<Cargo[]> => {
    const q: Record<string, string | boolean> = { solo_activos: params?.solo_activos ?? true };
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.buscar) q.buscar = params.buscar;
    const { data } = await api.get<Cargo[]>(`${BASE}/cargos`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (cargoId: string, params?: { empresa_id?: string }): Promise<Cargo> => {
    const { data } = await api.get<Cargo>(`${BASE}/cargos/${cargoId}`, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
    return data;
  },

  create: async (payload: CargoCreate): Promise<Cargo> => {
    const { data } = await api.post<Cargo>(`${BASE}/cargos`, payload);
    return data;
  },

  update: async (cargoId: string, payload: CargoUpdate, params?: { empresa_id?: string }): Promise<Cargo> => {
    const { data } = await api.put<Cargo>(`${BASE}/cargos/${cargoId}`, payload, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
    return data;
  },

  delete: async (cargoId: string, params?: { empresa_id?: string }): Promise<void> => {
    await api.delete(`${BASE}/cargos/${cargoId}`, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
  },

  reactivar: async (cargoId: string, params?: { empresa_id?: string }): Promise<Cargo> => {
    const { data } = await api.post<Cargo>(`${BASE}/cargos/${cargoId}/reactivar`, null, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
    return data;
  },
};

// ─── Parámetros ──────────────────────────────────────────────────────────

export const parametroService = {
  list: async (params?: OrgListParams & { modulo_codigo?: string; buscar?: string }): Promise<Parametro[]> => {
    const q: Record<string, string | boolean> = { solo_activos: params?.solo_activos ?? true };
    if (params?.empresa_id) q.empresa_id = params.empresa_id;
    if (params?.modulo_codigo) q.modulo_codigo = params.modulo_codigo;
    if (params?.buscar) q.buscar = params.buscar;
    const { data } = await api.get<Parametro[]>(`${BASE}/parametros`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  getById: async (parametroId: string, params?: { empresa_id?: string }): Promise<Parametro> => {
    const { data } = await api.get<Parametro>(`${BASE}/parametros/${parametroId}`, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
    return data;
  },

  create: async (payload: ParametroCreate): Promise<Parametro> => {
    const { data } = await api.post<Parametro>(`${BASE}/parametros`, payload);
    return data;
  },

  update: async (parametroId: string, payload: ParametroUpdate, params?: { empresa_id?: string }): Promise<Parametro> => {
    const { data } = await api.put<Parametro>(`${BASE}/parametros/${parametroId}`, payload, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
    return data;
  },

  delete: async (parametroId: string, params?: { empresa_id?: string }): Promise<void> => {
    await api.delete(`${BASE}/parametros/${parametroId}`, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
  },

  reactivar: async (parametroId: string, params?: { empresa_id?: string }): Promise<Parametro> => {
    const { data } = await api.post<Parametro>(`${BASE}/parametros/${parametroId}/reactivar`, null, {
      params: params?.empresa_id ? { empresa_id: params.empresa_id } : undefined,
    });
    return data;
  },
};
