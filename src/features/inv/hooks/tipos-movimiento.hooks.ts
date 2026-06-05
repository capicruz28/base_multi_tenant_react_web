import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { tipoMovimientoService } from '../services/inv.service';
import type { TipoMovimiento, TipoMovimientoCreate, TipoMovimientoUpdate } from '../types/inv.types';
import { INV_LIST_STALE_TIME_MS } from './inv-query-defaults';
import { useInvCompanyQueryGate } from './inv-company-query-gate';

const qk = {
  list: (scopeEmpresaId: string, soloActivos: boolean) =>
    ['inv', 'tipo-movimiento', 'list', scopeEmpresaId, soloActivos] as const,
  detail: (tipoMovimientoId: string, scopeEmpresaId: string) =>
    ['inv', 'tipo-movimiento', 'detail', tipoMovimientoId, scopeEmpresaId] as const,
};

export function useTiposMovimiento(options?: { solo_activos?: boolean; enabled?: boolean }) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const soloActivos = options?.solo_activos ?? true;

  return useTenantQuery<TipoMovimiento[], Error>({
    queryKey: qk.list(scopeEmpresaId ?? '', soloActivos),
    queryFn: () =>
      tipoMovimientoService.list({
        empresa_id: scopeEmpresaId ?? undefined,
        solo_activos: soloActivos,
      }),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled: gateEnabled,
  });
}

export function useTipoMovimiento(tipoMovimientoId: string | null | undefined, options?: { enabled?: boolean }) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const enabled = gateEnabled && !!tipoMovimientoId;

  return useTenantQuery<TipoMovimiento, Error>({
    queryKey: qk.detail(tipoMovimientoId ?? '', scopeEmpresaId ?? ''),
    queryFn: () => tipoMovimientoService.getById(tipoMovimientoId ?? ''),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}

export function useCreateTipoMovimiento() {
  const qc = useQueryClient();

  return useMutation<TipoMovimiento, Error, TipoMovimientoCreate>({
    mutationFn: (payload) => tipoMovimientoService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv', 'tipo-movimiento', 'list'] });
      toast.success('Tipo de movimiento creado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateTipoMovimiento() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<TipoMovimiento, Error, { tipoMovimientoId: string; payload: TipoMovimientoUpdate }>({
    mutationFn: ({ tipoMovimientoId, payload }) => tipoMovimientoService.update(tipoMovimientoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'tipo-movimiento', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.tipoMovimientoId, scopeEmpresaId ?? ''),
      });
      toast.success('Tipo de movimiento actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useDeleteTipoMovimiento() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<void, Error, { tipoMovimientoId: string }>({
    mutationFn: ({ tipoMovimientoId }) => tipoMovimientoService.delete(tipoMovimientoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'tipo-movimiento', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.tipoMovimientoId, scopeEmpresaId ?? ''),
      });
      toast.success('Tipo de movimiento eliminado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useReactivarTipoMovimiento() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<TipoMovimiento, Error, { tipoMovimientoId: string }>({
    mutationFn: ({ tipoMovimientoId }) => tipoMovimientoService.reactivar(tipoMovimientoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'tipo-movimiento', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.tipoMovimientoId, scopeEmpresaId ?? ''),
      });
      toast.success('Tipo de movimiento reactivado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
