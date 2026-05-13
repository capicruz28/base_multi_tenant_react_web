import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import {
  solicitudCompraService,
  solicitudCompraDetalleService,
  solicitudTransaccionalService,
} from '../services/pur.service';
import type {
  SolicitudCompra,
  SolicitudCompraCreate,
  SolicitudCompraUpdate,
  SolicitudCompraDetalle,
  SolicitudCompraTransaccionalCreate,
  PurListParams,
} from '../types/pur.types';

const qk = {
  list: (params?: PurListParams) => ['pur', 'solicitudes', params ?? {}] as const,
  detail: (id: string) => ['pur', 'solicitudes', id] as const,
  detalle: (solicitudId: string) => ['pur', 'solicitudes-detalle', solicitudId] as const,
};

export function useSolicitudesCompra(params?: PurListParams, options?: { enabled?: boolean }) {
  return useTenantQuery<SolicitudCompra[], Error>({
    queryKey: qk.list(params),
    queryFn: () => solicitudCompraService.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useSolicitudCompra(id: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!id;
  return useTenantQuery<SolicitudCompra, Error>({
    queryKey: qk.detail(id ?? ''),
    queryFn: () => solicitudCompraService.getById(id ?? ''),
    enabled,
  });
}

export function useSolicitudDetalle(solicitudId: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!solicitudId;
  return useTenantQuery<SolicitudCompraDetalle[], Error>({
    queryKey: qk.detalle(solicitudId ?? ''),
    queryFn: () => solicitudCompraDetalleService.listBySolicitud(solicitudId ?? ''),
    enabled,
  });
}

export function useCreateSolicitudCompra() {
  const qc = useQueryClient();
  return useMutation<SolicitudCompra, Error, SolicitudCompraCreate>({
    mutationFn: (payload) => solicitudCompraService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pur', 'solicitudes'] });
      toast.success('Solicitud creada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateSolicitudCompra() {
  const qc = useQueryClient();
  return useMutation<SolicitudCompra, Error, { id: string; payload: SolicitudCompraUpdate }>({
    mutationFn: ({ id, payload }) => solicitudCompraService.update(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'solicitudes'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Solicitud actualizada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useAprobarSolicitud() {
  const qc = useQueryClient();
  return useMutation<SolicitudCompra, Error, { id: string }>({
    mutationFn: ({ id }) => solicitudCompraService.aprobar(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'solicitudes'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Solicitud aprobada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useRechazarSolicitud() {
  const qc = useQueryClient();
  return useMutation<SolicitudCompra, Error, { id: string; motivo?: string }>({
    mutationFn: ({ id, motivo }) => solicitudCompraService.rechazar(id, motivo),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'solicitudes'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Solicitud rechazada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useAnularSolicitud() {
  const qc = useQueryClient();
  return useMutation<SolicitudCompra, Error, { id: string; motivo?: string }>({
    mutationFn: ({ id, motivo }) => solicitudCompraService.anular(id, motivo),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'solicitudes'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Solicitud anulada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useMarcarProcesadaSolicitud() {
  const qc = useQueryClient();
  return useMutation<SolicitudCompra, Error, { id: string }>({
    mutationFn: ({ id }) => solicitudCompraService.marcarProcesada(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'solicitudes'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Solicitud marcada como procesada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useCreateSolicitudTransaccional() {
  const qc = useQueryClient();
  return useMutation<SolicitudCompra, Error, SolicitudCompraTransaccionalCreate>({
    mutationFn: (payload) => solicitudTransaccionalService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pur', 'solicitudes'] });
      toast.success('Solicitud creada con ítems.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
