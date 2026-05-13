import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import {
  cotizacionService,
  cotizacionDetalleService,
  cotizacionTransaccionalService,
} from '../services/pur.service';
import type {
  Cotizacion,
  CotizacionCreate,
  CotizacionUpdate,
  CotizacionDetalle,
  CotizacionTransaccionalCreate,
  PurListParams,
} from '../types/pur.types';

const qk = {
  list: (params?: PurListParams) => ['pur', 'cotizaciones', params ?? {}] as const,
  detail: (id: string) => ['pur', 'cotizaciones', id] as const,
  detalle: (cotizacionId: string) => ['pur', 'cotizaciones-detalle', cotizacionId] as const,
};

export function useCotizaciones(params?: PurListParams, options?: { enabled?: boolean }) {
  return useTenantQuery<Cotizacion[], Error>({
    queryKey: qk.list(params),
    queryFn: () => cotizacionService.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useCotizacion(id: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!id;
  return useTenantQuery<Cotizacion, Error>({
    queryKey: qk.detail(id ?? ''),
    queryFn: () => cotizacionService.getById(id ?? ''),
    enabled,
  });
}

export function useCotizacionDetalle(cotizacionId: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!cotizacionId;
  return useTenantQuery<CotizacionDetalle[], Error>({
    queryKey: qk.detalle(cotizacionId ?? ''),
    queryFn: () => cotizacionDetalleService.listByCotizacion(cotizacionId ?? ''),
    enabled,
  });
}

export function useCreateCotizacion() {
  const qc = useQueryClient();
  return useMutation<Cotizacion, Error, CotizacionCreate>({
    mutationFn: (payload) => cotizacionService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pur', 'cotizaciones'] });
      toast.success('Cotización creada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateCotizacion() {
  const qc = useQueryClient();
  return useMutation<Cotizacion, Error, { id: string; payload: CotizacionUpdate }>({
    mutationFn: ({ id, payload }) => cotizacionService.update(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'cotizaciones'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Cotización actualizada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useAceptarCotizacion() {
  const qc = useQueryClient();
  return useMutation<Cotizacion, Error, { id: string }>({
    mutationFn: ({ id }) => cotizacionService.aceptar(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'cotizaciones'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Cotización aceptada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useRechazarCotizacion() {
  const qc = useQueryClient();
  return useMutation<Cotizacion, Error, { id: string; motivo?: string }>({
    mutationFn: ({ id, motivo }) => cotizacionService.rechazar(id, motivo),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'cotizaciones'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Cotización rechazada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useMarcarGanadoraCotizacion() {
  const qc = useQueryClient();
  return useMutation<Cotizacion, Error, { id: string }>({
    mutationFn: ({ id }) => cotizacionService.marcarGanadora(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'cotizaciones'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Cotización marcada como ganadora.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useCreateCotizacionTransaccional() {
  const qc = useQueryClient();
  return useMutation<Cotizacion, Error, CotizacionTransaccionalCreate>({
    mutationFn: (payload) => cotizacionTransaccionalService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pur', 'cotizaciones'] });
      toast.success('Cotización creada con ítems.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
