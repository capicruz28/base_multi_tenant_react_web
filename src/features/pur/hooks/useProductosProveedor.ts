import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { productoProveedorService } from '../services/pur.service';
import type { ProductoProveedor, ProductoProveedorCreate, ProductoProveedorUpdate, PurListParams } from '../types/pur.types';

const qk = {
  list: (params?: PurListParams) => ['pur', 'productos-proveedor', params ?? {}] as const,
  detail: (id: string) => ['pur', 'productos-proveedor', id] as const,
};

export function useProductosProveedor(params?: PurListParams, options?: { enabled?: boolean }) {
  return useTenantQuery<ProductoProveedor[], Error>({
    queryKey: qk.list(params),
    queryFn: () => productoProveedorService.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useProductoProveedor(id: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!id;
  return useTenantQuery<ProductoProveedor, Error>({
    queryKey: qk.detail(id ?? ''),
    queryFn: () => productoProveedorService.getById(id ?? ''),
    enabled,
  });
}

export function useCreateProductoProveedor() {
  const qc = useQueryClient();
  return useMutation<ProductoProveedor, Error, ProductoProveedorCreate>({
    mutationFn: (payload) => productoProveedorService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pur', 'productos-proveedor'] });
      toast.success('Producto-proveedor creado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateProductoProveedor() {
  const qc = useQueryClient();
  return useMutation<ProductoProveedor, Error, { id: string; payload: ProductoProveedorUpdate }>({
    mutationFn: ({ id, payload }) => productoProveedorService.update(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'productos-proveedor'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Producto-proveedor actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useReactivarProductoProveedor() {
  const qc = useQueryClient();
  return useMutation<ProductoProveedor, Error, { id: string }>({
    mutationFn: ({ id }) => productoProveedorService.reactivar(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'productos-proveedor'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Producto-proveedor reactivado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
