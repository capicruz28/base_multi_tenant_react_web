import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { productoService } from '../services/inv.service';
import type { Producto, ProductoCreate, ProductoUpdate } from '../types/inv.types';

const qk = {
  list: (empresaId: string | undefined, soloActivos: boolean, categoriaId?: string, tipoProducto?: string, buscar?: string) =>
    [
      'inv',
      'producto',
      'list',
      empresaId ?? '',
      soloActivos,
      categoriaId ?? '',
      tipoProducto ?? '',
      (buscar ?? '').trim(),
    ] as const,
  detail: (productoId: string) => ['inv', 'producto', 'detail', productoId] as const,
};

export function useProductos(options?: {
  empresa_id?: string;
  categoria_id?: string;
  tipo_producto?: string;
  solo_activos?: boolean;
  buscar?: string;
  enabled?: boolean;
}) {
  const empresaId = options?.empresa_id;
  const categoriaId = options?.categoria_id;
  const tipoProducto = options?.tipo_producto;
  const soloActivos = options?.solo_activos ?? true;
  const buscar = options?.buscar;
  const enabled = options?.enabled ?? true;

  return useTenantQuery<Producto[], Error>({
    queryKey: qk.list(empresaId, soloActivos, categoriaId, tipoProducto, buscar),
    queryFn: () =>
      productoService.list({
        empresa_id: empresaId,
        categoria_id: categoriaId,
        tipo_producto: tipoProducto,
        solo_activos: soloActivos,
        buscar,
      }),
    enabled,
  });
}

export function useProducto(productoId: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!productoId;

  return useTenantQuery<Producto, Error>({
    queryKey: qk.detail(productoId ?? ''),
    queryFn: () => productoService.getById(productoId ?? ''),
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

  return useMutation<Producto, Error, { productoId: string; payload: ProductoUpdate }>({
    mutationFn: ({ productoId, payload }) => productoService.update(productoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'producto', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.productoId) });
      toast.success('Producto actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useDeleteProducto() {
  const qc = useQueryClient();

  return useMutation<void, Error, { productoId: string }>({
    mutationFn: ({ productoId }) => productoService.delete(productoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'producto', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.productoId) });
      toast.success('Producto eliminado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useReactivarProducto() {
  const qc = useQueryClient();

  return useMutation<Producto, Error, { productoId: string }>({
    mutationFn: ({ productoId }) => productoService.reactivar(productoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'producto', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.productoId) });
      toast.success('Producto reactivado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

