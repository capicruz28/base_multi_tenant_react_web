import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { proveedorService } from '../services/pur.service';
import type { Proveedor, ProveedorCreate, ProveedorUpdate, PurListParams } from '../types/pur.types';

const qk = {
  list: (params?: PurListParams) => ['pur', 'proveedores', params ?? {}] as const,
  detail: (id: string) => ['pur', 'proveedores', id] as const,
};

export function useProveedores(params?: PurListParams, options?: { enabled?: boolean }) {
  return useTenantQuery<Proveedor[], Error>({
    queryKey: qk.list(params),
    queryFn: () => proveedorService.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useProveedor(id: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!id;
  return useTenantQuery<Proveedor, Error>({
    queryKey: qk.detail(id ?? ''),
    queryFn: () => proveedorService.getById(id ?? ''),
    enabled,
  });
}

export function useCreateProveedor() {
  const qc = useQueryClient();
  return useMutation<Proveedor, Error, ProveedorCreate>({
    mutationFn: (payload) => proveedorService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pur', 'proveedores'] });
      toast.success('Proveedor creado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateProveedor() {
  const qc = useQueryClient();
  return useMutation<Proveedor, Error, { id: string; payload: ProveedorUpdate }>({
    mutationFn: ({ id, payload }) => proveedorService.update(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'proveedores'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Proveedor actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useReactivarProveedor() {
  const qc = useQueryClient();
  return useMutation<Proveedor, Error, { id: string }>({
    mutationFn: ({ id }) => proveedorService.reactivar(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'proveedores'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Proveedor reactivado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
