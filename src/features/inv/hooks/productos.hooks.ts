import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { productoService } from '../services/inv.service';
import type { Producto, ProductoCreate, ProductoUpdate } from '../types/inv.types';
import { INV_LIST_STALE_TIME_MS } from './inv-query-defaults';
import { useInvCompanyQueryGate } from './inv-company-query-gate';

const qk = {
  list: (
    scopeEmpresaId: string,
    soloActivos: boolean,
    categoriaId: string,
    tipoProducto: string,
    buscar: string,
  ) =>
    [
      'inv',
      'producto',
      'list',
      scopeEmpresaId,
      soloActivos,
      categoriaId,
      tipoProducto,
      buscar,
    ] as const,
  detail: (productoId: string, scopeEmpresaId: string) =>
    ['inv', 'producto', 'detail', productoId, scopeEmpresaId] as const,
};

export function useProductos(options?: {
  categoria_id?: string;
  tipo_producto?: string;
  solo_activos?: boolean;
  buscar?: string;
  enabled?: boolean;
}) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const categoriaId = options?.categoria_id ?? '';
  const tipoProducto = options?.tipo_producto ?? '';
  const soloActivos = options?.solo_activos ?? true;
  const buscar = (options?.buscar ?? '').trim();

  return useTenantQuery<Producto[], Error>({
    queryKey: qk.list(scopeEmpresaId ?? '', soloActivos, categoriaId, tipoProducto, buscar),
    queryFn: () =>
      productoService.list({
        empresa_id: scopeEmpresaId ?? undefined,
        categoria_id: options?.categoria_id,
        tipo_producto: options?.tipo_producto,
        solo_activos: soloActivos,
        buscar: buscar || undefined,
      }),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled: gateEnabled,
  });
}

export function useProducto(productoId: string | null | undefined, options?: { enabled?: boolean }) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const enabled = gateEnabled && !!productoId;

  return useTenantQuery<Producto, Error>({
    queryKey: qk.detail(productoId ?? '', scopeEmpresaId ?? ''),
    queryFn: () => productoService.getById(productoId ?? ''),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}

export function useCreateProducto() {
  const qc = useQueryClient();

  return useMutation<Producto, Error, ProductoCreate>({
    mutationFn: (payload) => productoService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv', 'producto', 'list'] });
      toast.success('Producto creado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateProducto() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<Producto, Error, { productoId: string; payload: ProductoUpdate }>({
    mutationFn: ({ productoId, payload }) => productoService.update(productoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'producto', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.productoId, scopeEmpresaId ?? ''),
      });
      toast.success('Producto actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useDeleteProducto() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<void, Error, { productoId: string }>({
    mutationFn: ({ productoId }) => productoService.delete(productoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'producto', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.productoId, scopeEmpresaId ?? ''),
      });
      toast.success('Producto eliminado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useReactivarProducto() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<Producto, Error, { productoId: string }>({
    mutationFn: ({ productoId }) => productoService.reactivar(productoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'producto', 'list'] });
      qc.invalidateQueries({
        queryKey: qk.detail(vars.productoId, scopeEmpresaId ?? ''),
      });
      toast.success('Producto reactivado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
