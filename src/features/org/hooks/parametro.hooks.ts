import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { parametroService } from '../services/org.service';
import type { Parametro, ParametroCreate, ParametroUpdate } from '../types/org.types';

const qk = {
  list: (
    empresaId: string | undefined,
    moduloCodigo: string | undefined,
    soloActivos: boolean,
    buscar?: string
  ) =>
    [
      'org',
      'parametro',
      'list',
      empresaId ?? '',
      (moduloCodigo ?? '').trim(),
      soloActivos,
      (buscar ?? '').trim(),
    ] as const,
  detail: (parametroId: string, empresaId?: string) =>
    ['org', 'parametro', 'detail', parametroId, empresaId ?? ''] as const,
};

export function useParametros(options?: {
  empresa_id?: string;
  modulo_codigo?: string;
  solo_activos?: boolean;
  buscar?: string;
  enabled?: boolean;
}) {
  const empresaId = options?.empresa_id;
  const moduloCodigo = options?.modulo_codigo;
  const soloActivos = options?.solo_activos ?? true;
  const buscar = options?.buscar;
  const enabled = options?.enabled ?? true;

  return useTenantQuery<Parametro[], Error>({
    queryKey: qk.list(empresaId, moduloCodigo, soloActivos, buscar),
    queryFn: () =>
      parametroService.list({
        empresa_id: empresaId,
        modulo_codigo: moduloCodigo,
        solo_activos: soloActivos,
        buscar,
      }),
    enabled,
  });
}

export function useParametro(
  parametroId: string | null | undefined,
  options?: { empresa_id?: string; enabled?: boolean }
) {
  const empresaId = options?.empresa_id;
  const enabled = (options?.enabled ?? true) && !!parametroId;

  return useTenantQuery<Parametro, Error>({
    queryKey: qk.detail(parametroId ?? '', empresaId),
    queryFn: () => parametroService.getById(parametroId ?? '', { empresa_id: empresaId }),
    enabled,
  });
}

export function useCreateParametro() {
  const qc = useQueryClient();

  return useMutation<Parametro, Error, ParametroCreate>({
    mutationFn: (payload) => parametroService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org', 'parametro', 'list'] });
      toast.success('Parámetro creado.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

export function useUpdateParametro() {
  const qc = useQueryClient();

  return useMutation<
    Parametro,
    Error,
    { parametroId: string; payload: ParametroUpdate; empresa_id?: string }
  >({
    mutationFn: ({ parametroId, payload, empresa_id }) =>
      parametroService.update(parametroId, payload, { empresa_id }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'parametro', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.parametroId, vars.empresa_id) });
      toast.success('Parámetro actualizado.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

export function useDeleteParametro() {
  const qc = useQueryClient();

  return useMutation<void, Error, { parametroId: string; empresa_id?: string }>({
    mutationFn: ({ parametroId, empresa_id }) => parametroService.delete(parametroId, { empresa_id }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'parametro', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.parametroId, vars.empresa_id) });
      toast.success('Parámetro eliminado.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

export function useReactivarParametro() {
  const qc = useQueryClient();

  return useMutation<Parametro, Error, { parametroId: string; empresa_id?: string }>({
    mutationFn: ({ parametroId, empresa_id }) => parametroService.reactivar(parametroId, { empresa_id }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['org', 'parametro', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.parametroId, vars.empresa_id) });
      toast.success('Parámetro reactivado.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err).message);
    },
  });
}

