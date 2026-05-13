/**
 * Servicio del módulo TAX (Libros Electrónicos / PLE SUNAT).
 * Base URL: /api/v1/tax
 */
import api from '@/core/api/api';
import type {
  LibroElectronico,
  LibroElectronicoCreate,
  LibroElectronicoUpdate,
  LibroElectronicoRegistrarEnvio,
} from '../types/tax.types';

const BASE = '/tax';

export const librosElectronicosService = {
  list: async (params?: {
    empresa_id?: string;
    tipo_libro?: string;
    anio?: number;
    mes?: number;
    estado?: string;
  }): Promise<LibroElectronico[]> => {
    const { data } = await api.get<LibroElectronico[]>(
      `${BASE}/libros-electronicos`,
      { params }
    );
    return Array.isArray(data) ? data : [];
  },

  getById: async (libroId: string): Promise<LibroElectronico> => {
    const { data } = await api.get<LibroElectronico>(
      `${BASE}/libros-electronicos/${libroId}`
    );
    return data;
  },

  create: async (payload: LibroElectronicoCreate): Promise<LibroElectronico> => {
    const { data } = await api.post<LibroElectronico>(
      `${BASE}/libros-electronicos`,
      payload
    );
    return data;
  },

  update: async (
    libroId: string,
    payload: LibroElectronicoUpdate
  ): Promise<LibroElectronico> => {
    const { data } = await api.put<LibroElectronico>(
      `${BASE}/libros-electronicos/${libroId}`,
      payload
    );
    return data;
  },

  marcarGenerado: async (libroId: string): Promise<LibroElectronico> => {
    const { data } = await api.post<LibroElectronico>(
      `${BASE}/libros-electronicos/${libroId}/marcar-generado`
    );
    return data;
  },

  registrarEnvio: async (
    libroId: string,
    payload?: LibroElectronicoRegistrarEnvio
  ): Promise<LibroElectronico> => {
    const { data } = await api.post<LibroElectronico>(
      `${BASE}/libros-electronicos/${libroId}/registrar-envio`,
      payload ?? null
    );
    return data;
  },

  anular: async (libroId: string): Promise<LibroElectronico> => {
    const { data } = await api.post<LibroElectronico>(
      `${BASE}/libros-electronicos/${libroId}/anular`
    );
    return data;
  },
};
