import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { librosElectronicosService } from '../services/tax.service';
import type {
  EstadoLibroTax,
  LibroElectronico,
  LibroElectronicoCreate,
  LibroElectronicoRegistrarEnvio,
  LibroElectronicoUpdate,
} from '../types/tax.types';

const qk = {
  list: (
    empresaId?: string,
    tipoLibro?: string,
    anio?: number,
    mes?: number,
    estado?: string
  ) =>
    [
      'tax',
      'libros-electronicos',
      'list',
      empresaId ?? '',
      tipoLibro ?? '',
      anio ?? '',
      mes ?? '',
      estado ?? '',
    ] as const,
  detail: (libroId: string) => ['tax', 'libros-electronicos', 'detail', libroId] as const,
};

export function useLibrosElectronicos(options?: {
  empresa_id?: string;
  tipo_libro?: string;
  anio?: number;
  mes?: number;
  estado?: EstadoLibroTax;
  enabled?: boolean;
}) {
  const enabled = options?.enabled ?? true;

  return useTenantQuery<LibroElectronico[], Error>({
    queryKey: qk.list(
      options?.empresa_id,
      options?.tipo_libro,
      options?.anio,
      options?.mes,
      options?.estado
    ),
    queryFn: () =>
      librosElectronicosService.list({
        empresa_id: options?.empresa_id,
        tipo_libro: options?.tipo_libro,
        anio: options?.anio,
        mes: options?.mes,
        estado: options?.estado,
      }),
    enabled,
  });
}

export function useLibroElectronico(
  libroId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const enabled = (options?.enabled ?? true) && !!libroId;

  return useTenantQuery<LibroElectronico, Error>({
    queryKey: qk.detail(libroId ?? ''),
    queryFn: () => librosElectronicosService.getById(libroId ?? ''),
    enabled,
  });
}

export function useCreateLibroElectronico() {
  const qc = useQueryClient();

  return useMutation<LibroElectronico, Error, LibroElectronicoCreate>({
    mutationFn: (payload) => librosElectronicosService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tax', 'libros-electronicos', 'list'] });
      toast.success('Libro electrónico registrado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useUpdateLibroElectronico() {
  const qc = useQueryClient();

  return useMutation<
    LibroElectronico,
    Error,
    { libroId: string; payload: LibroElectronicoUpdate }
  >({
    mutationFn: ({ libroId, payload }) =>
      librosElectronicosService.update(libroId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['tax', 'libros-electronicos', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.libroId) });
      toast.success('Libro electrónico actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useMarcarGenerado() {
  const qc = useQueryClient();

  return useMutation<LibroElectronico, Error, { libroId: string }>({
    mutationFn: ({ libroId }) => librosElectronicosService.marcarGenerado(libroId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['tax', 'libros-electronicos', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.libroId) });
      toast.success('Libro marcado como generado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useRegistrarEnvio() {
  const qc = useQueryClient();

  return useMutation<
    LibroElectronico,
    Error,
    { libroId: string; payload?: LibroElectronicoRegistrarEnvio }
  >({
    mutationFn: ({ libroId, payload }) =>
      librosElectronicosService.registrarEnvio(libroId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['tax', 'libros-electronicos', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.libroId) });
      toast.success('Envío a SUNAT registrado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useAnularLibro() {
  const qc = useQueryClient();

  return useMutation<LibroElectronico, Error, { libroId: string }>({
    mutationFn: ({ libroId }) => librosElectronicosService.anular(libroId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['tax', 'libros-electronicos', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.libroId) });
      toast.success('Libro anulado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
