/**
 * Servicio del módulo DMS (Gestión Documental).
 * Base URL: /api/v1/dms
 */
import api from '@/core/api/api';
import type {
  DocumentoDms,
  DocumentoDmsCreate,
  DocumentoDmsUpdate,
} from '../types/dms.types';

const BASE = '/dms';

export const documentosService = {
  list: async (params?: {
    empresa_id?: string;
    tipo_documento?: string;
    categoria?: string;
    estado?: string;
    entidad_tipo?: string;
    entidad_id?: string;
    carpeta?: string;
    buscar?: string;
  }): Promise<DocumentoDms[]> => {
    const { data } = await api.get<DocumentoDms[]>(`${BASE}/documentos`, {
      params,
    });
    return Array.isArray(data) ? data : [];
  },

  getById: async (documentoId: string): Promise<DocumentoDms> => {
    const { data } = await api.get<DocumentoDms>(
      `${BASE}/documentos/${documentoId}`
    );
    return data;
  },

  create: async (payload: DocumentoDmsCreate): Promise<DocumentoDms> => {
    const { data } = await api.post<DocumentoDms>(
      `${BASE}/documentos`,
      payload
    );
    return data;
  },

  update: async (
    documentoId: string,
    payload: DocumentoDmsUpdate
  ): Promise<DocumentoDms> => {
    const { data } = await api.put<DocumentoDms>(
      `${BASE}/documentos/${documentoId}`,
      payload
    );
    return data;
  },
};
