import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import {
  recepcionService,
  recepcionDetalleService,
  recepcionTransaccionalService,
} from '../services/pur.service';
import type {
  Recepcion,
  RecepcionCreate,
  RecepcionUpdate,
  RecepcionDetalle,
  RecepcionTransaccionalCreate,
  PurListParams,
} from '../types/pur.types';

const qk = {
  list: (params?: PurListParams) => ['pur', 'recepciones', params ?? {}] as const,
  detail: (id: string) => ['pur', 'recepciones', id] as const,
  detalle: (recepcionId: string) => ['pur', 'recepciones-detalle', recepcionId] as const,
};

export function useRecepciones(params?: PurListParams, options?: { enabled?: boolean }) {
  return useTenantQuery<Recepcion[], Error>({
    queryKey: qk.list(params),
    queryFn: () => recepcionService.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useRecepcion(id: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!id;
  return useTenantQuery<Recepcion, Error>({
    queryKey: qk.detail(id ?? ''),
    queryFn: () => recepcionService.getById(id ?? ''),
    enabled,
  });
}

export function useRecepcionDetalle(recepcionId: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!recepcionId;
  return useTenantQuery<RecepcionDetalle[], Error>({
    queryKey: qk.detalle(recepcionId ?? ''),
    queryFn: () => recepcionDetalleService.listByRecepcion(recepcionId ?? ''),
    enabled,
  });
}

export function useCreateRecepcion() {
  const qc = useQueryClient();
  return useMutation<Recepcion, Error, RecepcionCreate>({
    mutationFn: (payload) => recepcionService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pur', 'recepciones'] });
      toast.success('Recepción creada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateRecepcion() {
  const qc = useQueryClient();
  return useMutation<Recepcion, Error, { id: string; payload: RecepcionUpdate }>({
    mutationFn: ({ id, payload }) => recepcionService.update(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'recepciones'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Recepción actualizada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useAnularRecepcion() {
  const qc = useQueryClient();
  return useMutation<Recepcion, Error, { id: string }>({
    mutationFn: ({ id }) => recepcionService.anular(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'recepciones'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Recepción anulada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useAprobarRecepcion() {
  const qc = useQueryClient();
  return useMutation<Recepcion, Error, { id: string }>({
    mutationFn: ({ id }) => recepcionService.aprobar(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'recepciones'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Recepción aprobada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useProcesarRecepcion() {
  const qc = useQueryClient();
  return useMutation<Recepcion, Error, { id: string }>({
    mutationFn: ({ id }) => recepcionService.procesar(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'recepciones'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Recepción procesada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useCreateRecepcionTransaccional() {
  const qc = useQueryClient();
  return useMutation<Recepcion, Error, RecepcionTransaccionalCreate>({
    mutationFn: (payload) => recepcionTransaccionalService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pur', 'recepciones'] });
      toast.success('Recepción creada con ítems.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
