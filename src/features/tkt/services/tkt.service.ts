/**
 * Servicio del módulo TKT (Mesa de Ayuda / Ticketing).
 * Base URL: /api/v1/tkt
 */
import api from '@/core/api/api';
import type { Ticket, TicketCreate, TicketUpdate } from '../types/tkt.types';

const BASE = '/tkt';

export const ticketsService = {
  list: async (params?: {
    empresa_id?: string;
    estado?: string;
    prioridad?: string;
    categoria?: string;
    asignado_usuario_id?: string;
    buscar?: string;
  }): Promise<Ticket[]> => {
    const { data } = await api.get<Ticket[]>(`${BASE}/tickets`, {
      params,
    });
    return Array.isArray(data) ? data : [];
  },

  getById: async (ticketId: string): Promise<Ticket> => {
    const { data } = await api.get<Ticket>(`${BASE}/tickets/${ticketId}`);
    return data;
  },

  create: async (payload: TicketCreate): Promise<Ticket> => {
    const { data } = await api.post<Ticket>(`${BASE}/tickets`, payload);
    return data;
  },

  update: async (ticketId: string, payload: TicketUpdate): Promise<Ticket> => {
    const { data } = await api.put<Ticket>(
      `${BASE}/tickets/${ticketId}`,
      payload
    );
    return data;
  },
};
