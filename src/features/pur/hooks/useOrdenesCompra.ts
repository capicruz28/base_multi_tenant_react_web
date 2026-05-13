import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import {
  ordenCompraService,
  ordenCompraDetalleService,
  ordenCompraTransaccionalService,
} from '../services/pur.service';
import type {
  OrdenCompra,
  OrdenCompraCreate,
  OrdenCompraUpdate,
  OrdenCompraDetalle,
  OrdenCompraTransaccionalCreate,
  PurListParams,
} from '../types/pur.types';

const qk = {
  list: (params?: PurListParams) => ['pur', 'ordenes-compra', params ?? {}] as const,
  detail: (id: string) => ['pur', 'ordenes-compra', id] as const,
  detalle: (ordenId: string) => ['pur', 'ordenes-compra-detalle', ordenId] as const,
};

export function useOrdenesCompra(params?: PurListParams, options?: { enabled?: boolean }) {
  return useTenantQuery<OrdenCompra[], Error>({
    queryKey: qk.list(params),
    queryFn: () => ordenCompraService.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useOrdenCompra(id: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!id;
  return useTenantQuery<OrdenCompra, Error>({
    queryKey: qk.detail(id ?? ''),
    queryFn: () => ordenCompraService.getById(id ?? ''),
    enabled,
  });
}

export function useOrdenCompraDetalle(ordenId: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!ordenId;
  return useTenantQuery<OrdenCompraDetalle[], Error>({
    queryKey: qk.detalle(ordenId ?? ''),
    queryFn: () => ordenCompraDetalleService.listByOrdenCompra(ordenId ?? ''),
    enabled,
  });
}

export function useCreateOrdenCompra() {
  const qc = useQueryClient();
  return useMutation<OrdenCompra, Error, OrdenCompraCreate>({
    mutationFn: (payload) => ordenCompraService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pur', 'ordenes-compra'] });
      toast.success('Orden de compra creada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateOrdenCompra() {
  const qc = useQueryClient();
  return useMutation<OrdenCompra, Error, { id: string; payload: OrdenCompraUpdate }>({
    mutationFn: ({ id, payload }) => ordenCompraService.update(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'ordenes-compra'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Orden de compra actualizada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useAprobarOrdenCompra() {
  const qc = useQueryClient();
  return useMutation<OrdenCompra, Error, { id: string }>({
    mutationFn: ({ id }) => ordenCompraService.aprobar(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'ordenes-compra'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Orden de compra aprobada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useEmitirOrdenCompra() {
  const qc = useQueryClient();
  return useMutation<OrdenCompra, Error, { id: string }>({
    mutationFn: ({ id }) => ordenCompraService.emitir(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'ordenes-compra'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Orden de compra emitida.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useAnularOrdenCompra() {
  const qc = useQueryClient();
  return useMutation<OrdenCompra, Error, { id: string; motivo?: string }>({
    mutationFn: ({ id, motivo }) => ordenCompraService.anular(id, motivo),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'ordenes-compra'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Orden de compra anulada.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useCreateOrdenCompraTransaccional() {
  const qc = useQueryClient();
  return useMutation<OrdenCompra, Error, OrdenCompraTransaccionalCreate>({
    mutationFn: (payload) => ordenCompraTransaccionalService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pur', 'ordenes-compra'] });
      toast.success('Orden de compra creada con ítems.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
