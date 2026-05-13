import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { contactoProveedorService } from '../services/pur.service';
import type { ContactoProveedor, ContactoProveedorCreate, ContactoProveedorUpdate, PurListParams } from '../types/pur.types';

const qk = {
  list: (params?: PurListParams) => ['pur', 'contactos', params ?? {}] as const,
  detail: (id: string) => ['pur', 'contactos', id] as const,
};

export function useContactosProveedor(params?: PurListParams, options?: { enabled?: boolean }) {
  return useTenantQuery<ContactoProveedor[], Error>({
    queryKey: qk.list(params),
    queryFn: () => contactoProveedorService.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useContactoProveedor(id: string | null | undefined, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!id;
  return useTenantQuery<ContactoProveedor, Error>({
    queryKey: qk.detail(id ?? ''),
    queryFn: () => contactoProveedorService.getById(id ?? ''),
    enabled,
  });
}

export function useCreateContactoProveedor() {
  const qc = useQueryClient();
  return useMutation<ContactoProveedor, Error, ContactoProveedorCreate>({
    mutationFn: (payload) => contactoProveedorService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pur', 'contactos'] });
      toast.success('Contacto creado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateContactoProveedor() {
  const qc = useQueryClient();
  return useMutation<ContactoProveedor, Error, { id: string; payload: ContactoProveedorUpdate }>({
    mutationFn: ({ id, payload }) => contactoProveedorService.update(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'contactos'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Contacto actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useReactivarContactoProveedor() {
  const qc = useQueryClient();
  return useMutation<ContactoProveedor, Error, { id: string }>({
    mutationFn: ({ id }) => contactoProveedorService.reactivar(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pur', 'contactos'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.id) });
      toast.success('Contacto reactivado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
