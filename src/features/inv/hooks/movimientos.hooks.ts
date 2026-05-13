import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { movimientoService } from '../services/inv.service';
import type { AnularMovimientoRequest, Movimiento, MovimientoCreate, MovimientoUpdate } from '../types/inv.types';

const qk = {
  list: (
    empresaId?: string,
    tipoMovimientoId?: string,
    almacenId?: string,
    estado?: string,
    fechaDesde?: string,
    fechaHasta?: string
  ) =>
    [
      'inv',
      'movimiento',
      'list',
      empresaId ?? '',
      tipoMovimientoId ?? '',
      almacenId ?? '',
      estado ?? '',
      fechaDesde ?? '',
      fechaHasta ?? '',
    ] as const,
  detail: (movimientoId: string) => ['inv', 'movimiento', 'detail', movimientoId] as const,
};

export function useMovimientos(options?: {
  empresa_id?: string;
  tipo_movimiento_id?: string;
  almacen_id?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  enabled?: boolean;
}) {
  const enabled = options?.enabled ?? true;
  return useTenantQuery<Movimiento[], Error>({
    queryKey: qk.list(
      options?.empresa_id,
      options?.tipo_movimiento_id,
      options?.almacen_id,
      options?.estado,
      options?.fecha_desde,
      options?.fecha_hasta
    ),
    queryFn: () =>
      movimientoService.list({
        empresa_id: options?.empresa_id,
        tipo_movimiento_id: options?.tipo_movimiento_id,
        almacen_id: options?.almacen_id,
        estado: options?.estado,
        fecha_desde: options?.fecha_desde,
        fecha_hasta: options?.fecha_hasta,
      }),
    enabled,
  });
}

export function useMovimiento(movimientoId: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!movimientoId;

  return useTenantQuery<Movimiento, Error>({
    queryKey: qk.detail(movimientoId ?? ''),
    queryFn: () => movimientoService.getById(movimientoId ?? ''),
    enabled,
  });
}

export function useCreateMovimiento() {
  const qc = useQueryClient();

  return useMutation<Movimiento, Error, MovimientoCreate>({
    mutationFn: (payload) => movimientoService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv', 'movimiento', 'list'] });
      toast.success('Movimiento creado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateMovimiento() {
  const qc = useQueryClient();

  return useMutation<Movimiento, Error, { movimientoId: string; payload: MovimientoUpdate }>({
    mutationFn: ({ movimientoId, payload }) => movimientoService.update(movimientoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'movimiento', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.movimientoId) });
      toast.success('Movimiento actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useAutorizarMovimiento() {
  const qc = useQueryClient();

  return useMutation<Movimiento, Error, { movimientoId: string }>({
    mutationFn: ({ movimientoId }) => movimientoService.autorizar(movimientoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'movimiento', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.movimientoId) });
      toast.success('Movimiento autorizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useProcesarMovimiento() {
  const qc = useQueryClient();

  return useMutation<Movimiento, Error, { movimientoId: string }>({
    mutationFn: ({ movimientoId }) => movimientoService.procesar(movimientoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'movimiento', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.movimientoId) });
      toast.success('Movimiento procesado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useAnularMovimiento() {
  const qc = useQueryClient();

  return useMutation<Movimiento, Error, { movimientoId: string; payload?: AnularMovimientoRequest }>({
    mutationFn: ({ movimientoId, payload }) => movimientoService.anular(movimientoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'movimiento', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.movimientoId) });
      toast.success('Movimiento anulado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

