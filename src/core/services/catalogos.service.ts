import api from '@/core/api/api';
import type {
  CatMoneda,
  CatMonedaCreate,
  CatMonedaUpdate,
  CatPais,
  CatPaisCreate,
  CatPaisUpdate,
  CatDepartamento,
  CatDepartamentoCreate,
  CatDepartamentoUpdate,
  CatProvincia,
  CatProvinciaCreate,
  CatProvinciaUpdate,
  CatDistrito,
  CatDistritoCreate,
  CatDistritoUpdate,
} from '@/types/catalogos.types';

// ─── Catálogos de solo lectura (para tenants / módulos como ORG) ──────────

const PUBLIC_BASE = '/catalogos';

export interface CatalogosListParams {
  solo_activos?: boolean;
  pais_id?: string;
  departamento_id?: string;
  provincia_id?: string;
}

export const catalogosService = {
  // Monedas disponibles para selección (tenant)
  async listMonedas(params?: { solo_activos?: boolean }): Promise<CatMoneda[]> {
    const q: Record<string, string | boolean> = {};
    if (params?.solo_activos !== undefined) q.solo_activos = params.solo_activos;
    const { data } = await api.get<CatMoneda[]>(`${PUBLIC_BASE}/monedas`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  async listPaises(params?: { solo_activos?: boolean }): Promise<CatPais[]> {
    const q: Record<string, string | boolean> = {};
    if (params?.solo_activos !== undefined) q.solo_activos = params.solo_activos;
    const { data } = await api.get<CatPais[]>(`${PUBLIC_BASE}/paises`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  async listDepartamentos(params: CatalogosListParams = {}): Promise<CatDepartamento[]> {
    const q: Record<string, string | boolean> = {};
    if (params.solo_activos !== undefined) q.solo_activos = params.solo_activos;
    if (params.pais_id) q.pais_id = params.pais_id;
    const { data } = await api.get<CatDepartamento[]>(`${PUBLIC_BASE}/departamentos`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  async listProvincias(params: CatalogosListParams = {}): Promise<CatProvincia[]> {
    const q: Record<string, string | boolean> = {};
    if (params.solo_activos !== undefined) q.solo_activos = params.solo_activos;
    if (params.departamento_id) q.departamento_id = params.departamento_id;
    const { data } = await api.get<CatProvincia[]>(`${PUBLIC_BASE}/provincias`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  async listDistritos(params: CatalogosListParams = {}): Promise<CatDistrito[]> {
    const q: Record<string, string | boolean> = {};
    if (params.solo_activos !== undefined) q.solo_activos = params.solo_activos;
    if (params.provincia_id) q.provincia_id = params.provincia_id;
    const { data } = await api.get<CatDistrito[]>(`${PUBLIC_BASE}/distritos`, { params: q });
    return Array.isArray(data) ? data : [];
  },
};

// ─── Catálogos globales (CRUD, solo SuperAdmin) ───────────────────────────

const GLOBAL_BASE = '/catalogos-globales';

export const catalogosGlobalService = {
  // Monedas
  // DEPRECATED: usar platformCatalogGlobalService
  async listMonedas(params?: { solo_activos?: boolean }): Promise<CatMoneda[]> {
    const q: Record<string, string | boolean> = {};
    if (params?.solo_activos !== undefined) q.solo_activos = params.solo_activos;
    const { data } = await api.get<CatMoneda[]>(`${GLOBAL_BASE}/monedas`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  // DEPRECATED: usar platformCatalogGlobalService
  async createMoneda(payload: CatMonedaCreate): Promise<CatMoneda> {
    const { data } = await api.post<CatMoneda>(`${GLOBAL_BASE}/monedas`, payload);
    return data;
  },

  // DEPRECATED: usar platformCatalogGlobalService
  async updateMoneda(monedaId: string, payload: CatMonedaUpdate): Promise<CatMoneda> {
    const { data } = await api.put<CatMoneda>(`${GLOBAL_BASE}/monedas/${monedaId}`, payload);
    return data;
  },

  // DEPRECATED: usar platformCatalogGlobalService
  async deleteMoneda(monedaId: string): Promise<void> {
    await api.delete(`${GLOBAL_BASE}/monedas/${monedaId}`);
  },

  // Paises
  // DEPRECATED: usar platformCatalogGlobalService
  async listPaises(params?: { solo_activos?: boolean }): Promise<CatPais[]> {
    const q: Record<string, string | boolean> = {};
    if (params?.solo_activos !== undefined) q.solo_activos = params.solo_activos;
    const { data } = await api.get<CatPais[]>(`${GLOBAL_BASE}/paises`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  // DEPRECATED: usar platformCatalogGlobalService
  async createPais(payload: CatPaisCreate): Promise<CatPais> {
    const { data } = await api.post<CatPais>(`${GLOBAL_BASE}/paises`, payload);
    return data;
  },

  // DEPRECATED: usar platformCatalogGlobalService
  async updatePais(paisId: string, payload: CatPaisUpdate): Promise<CatPais> {
    const { data } = await api.put<CatPais>(`${GLOBAL_BASE}/paises/${paisId}`, payload);
    return data;
  },

  // DEPRECATED: usar platformCatalogGlobalService
  async deletePais(paisId: string): Promise<void> {
    // El backend también podría exponer reactivar; por ahora usamos DELETE como indica el OpenAPI.
    await api.delete(`${GLOBAL_BASE}/paises/${paisId}`);
  },

  // Departamentos
  // DEPRECATED: usar platformCatalogGlobalService
  async listDepartamentos(params?: { pais_id?: string; solo_activos?: boolean }): Promise<CatDepartamento[]> {
    const q: Record<string, string | boolean> = {};
    if (params?.pais_id) q.pais_id = params.pais_id;
    if (params?.solo_activos !== undefined) q.solo_activos = params.solo_activos;
    const { data } = await api.get<CatDepartamento[]>(`${GLOBAL_BASE}/departamentos`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  // DEPRECATED: usar platformCatalogGlobalService
  async createDepartamento(payload: CatDepartamentoCreate): Promise<CatDepartamento> {
    const { data } = await api.post<CatDepartamento>(`${GLOBAL_BASE}/departamentos`, payload);
    return data;
  },

  // DEPRECATED: usar platformCatalogGlobalService
  async updateDepartamento(departamentoId: string, payload: CatDepartamentoUpdate): Promise<CatDepartamento> {
    const { data } = await api.put<CatDepartamento>(`${GLOBAL_BASE}/departamentos/${departamentoId}`, payload);
    return data;
  },

  // DEPRECATED: usar platformCatalogGlobalService
  async deleteDepartamento(departamentoId: string): Promise<void> {
    await api.delete(`${GLOBAL_BASE}/departamentos/${departamentoId}`);
  },

  // Provincias
  // DEPRECATED: usar platformCatalogGlobalService
  async listProvincias(params?: { departamento_id?: string; solo_activos?: boolean }): Promise<CatProvincia[]> {
    const q: Record<string, string | boolean> = {};
    if (params?.departamento_id) q.departamento_id = params.departamento_id;
    if (params?.solo_activos !== undefined) q.solo_activos = params.solo_activos;
    const { data } = await api.get<CatProvincia[]>(`${GLOBAL_BASE}/provincias`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  // DEPRECATED: usar platformCatalogGlobalService
  async createProvincia(payload: CatProvinciaCreate): Promise<CatProvincia> {
    const { data } = await api.post<CatProvincia>(`${GLOBAL_BASE}/provincias`, payload);
    return data;
  },

  // DEPRECATED: usar platformCatalogGlobalService
  async updateProvincia(provinciaId: string, payload: CatProvinciaUpdate): Promise<CatProvincia> {
    const { data } = await api.put<CatProvincia>(`${GLOBAL_BASE}/provincias/${provinciaId}`, payload);
    return data;
  },

  // DEPRECATED: usar platformCatalogGlobalService
  async deleteProvincia(provinciaId: string): Promise<void> {
    await api.delete(`${GLOBAL_BASE}/provincias/${provinciaId}`);
  },

  // Distritos
  // DEPRECATED: usar platformCatalogGlobalService
  async listDistritos(params?: { provincia_id?: string; solo_activos?: boolean }): Promise<CatDistrito[]> {
    const q: Record<string, string | boolean> = {};
    if (params?.provincia_id) q.provincia_id = params.provincia_id;
    if (params?.solo_activos !== undefined) q.solo_activos = params.solo_activos;
    const { data } = await api.get<CatDistrito[]>(`${GLOBAL_BASE}/distritos`, { params: q });
    return Array.isArray(data) ? data : [];
  },

  // DEPRECATED: usar platformCatalogGlobalService
  async createDistrito(payload: CatDistritoCreate): Promise<CatDistrito> {
    const { data } = await api.post<CatDistrito>(`${GLOBAL_BASE}/distritos`, payload);
    return data;
  },

  // DEPRECATED: usar platformCatalogGlobalService
  async updateDistrito(distritoId: string, payload: CatDistritoUpdate): Promise<CatDistrito> {
    const { data } = await api.put<CatDistrito>(`${GLOBAL_BASE}/distritos/${distritoId}`, payload);
    return data;
  },

  // DEPRECATED: usar platformCatalogGlobalService
  async deleteDistrito(distritoId: string): Promise<void> {
    await api.delete(`${GLOBAL_BASE}/distritos/${distritoId}`);
  },
};

