import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { getErrorMessage } from '@/core/services/error.service';
import { inventarioFisicoService } from '../services/inv.service';
import { INV_LIST_STALE_TIME_MS } from './inv-query-defaults';
import { useInvCompanyQueryGate } from './inv-company-query-gate';
import type {
  AprobarInventarioFisicoRequest,
  InventarioFisico,
  InventarioFisicoConDetalle,
  InventarioFisicoConDetalleCreate,
  InventarioFisicoConDetalleUpdate,
  InventarioFisicoCreate,
  InventarioFisicoUpdate,
} from '../types/inv.types';

const qk = {
  list: (
    scopeEmpresaId: string,
    almacenId: string,
    estado: string,
    fechaDesde: string,
    fechaHasta: string,
  ) =>
    [
      'inv',
      'inventario-fisico',
      'list',
      scopeEmpresaId,
      almacenId,
      estado,
      fechaDesde,
      fechaHasta,
    ] as const,
  detail: (inventarioFisicoId: string, scopeEmpresaId: string) =>
    ['inv', 'inventario-fisico', 'detail', inventarioFisicoId, scopeEmpresaId] as const,
  conDetalle: (inventarioFisicoId: string, scopeEmpresaId: string) =>
    ['inv', 'inventario-fisico', 'con-detalle', inventarioFisicoId, scopeEmpresaId] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────

export function useInventariosFisicos(options?: {
  almacen_id?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  enabled?: boolean;
}) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const enabled = gateEnabled && (options?.enabled ?? true);

  return useTenantQuery<InventarioFisico[], Error>({
    queryKey: qk.list(
      scopeEmpresaId ?? '',
      options?.almacen_id ?? '',
      options?.estado ?? '',
      options?.fecha_desde ?? '',
      options?.fecha_hasta ?? '',
    ),
    queryFn: () =>
      inventarioFisicoService.list({
        empresa_id: scopeEmpresaId ?? undefined,
        almacen_id: options?.almacen_id,
        estado: options?.estado,
        fecha_desde: options?.fecha_desde,
        fecha_hasta: options?.fecha_hasta,
      }),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}

export function useInventarioFisico(
  inventarioFisicoId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const enabled = gateEnabled && (options?.enabled ?? true) && !!inventarioFisicoId;

  return useTenantQuery<InventarioFisico, Error>({
    queryKey: qk.detail(inventarioFisicoId ?? '', scopeEmpresaId ?? ''),
    queryFn: () => inventarioFisicoService.getById(inventarioFisicoId ?? ''),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}

/** Carga cabecera + líneas en una sola query usando GET /inventario-fisico/{id}/con-detalle */
export function useInventarioFisicoConDetalle(
  inventarioFisicoId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const enabled = gateEnabled && (options?.enabled ?? true) && !!inventarioFisicoId;

  return useTenantQuery<InventarioFisicoConDetalle, Error>({
    queryKey: qk.conDetalle(inventarioFisicoId ?? '', scopeEmpresaId ?? ''),
    queryFn: () => inventarioFisicoService.getConDetalle(inventarioFisicoId ?? ''),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────

/**
 * @deprecated Preferir {@link useCreateInventarioFisicoConDetalle}: el flujo operativo envía cabecera + líneas en POST `/inventario-fisico/con-detalle`. Este hook solo crea cabecera vía POST `/inventario-fisico`.
 */
export function useCreateInventarioFisico() {
  const qc = useQueryClient();

  return useMutation<InventarioFisico, Error, InventarioFisicoCreate>({
    mutationFn: (payload) => inventarioFisicoService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv', 'inventario-fisico', 'list'] });
      toast.success('Inventario físico creado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

/**
 * @deprecated Preferir {@link useUpdateInventarioFisicoConDetalle}: el flujo operativo actualiza cabecera + líneas en PUT `/inventario-fisico/{id}/con-detalle`. Este hook solo actualiza cabecera vía PUT `/inventario-fisico/{id}`.
 */
export function useUpdateInventarioFisico() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<InventarioFisico, Error, { inventarioFisicoId: string; payload: InventarioFisicoUpdate }>({
    mutationFn: ({ inventarioFisicoId, payload }) =>
      inventarioFisicoService.update(inventarioFisicoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'inventario-fisico', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.inventarioFisicoId, scopeEmpresaId ?? '') });
      qc.invalidateQueries({ queryKey: qk.conDetalle(vars.inventarioFisicoId, scopeEmpresaId ?? '') });
      toast.success('Inventario físico actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

/** Crea inventario físico + líneas en una sola llamada (POST /inventario-fisico/con-detalle) */
export function useCreateInventarioFisicoConDetalle() {
  const qc = useQueryClient();

  return useMutation<InventarioFisicoConDetalle, Error, InventarioFisicoConDetalleCreate>({
    mutationFn: (payload) => inventarioFisicoService.createConDetalle(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv', 'inventario-fisico', 'list'] });
      toast.success('Inventario físico creado con líneas.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

/** Actualiza inventario físico + líneas en una sola llamada (PUT /inventario-fisico/{id}/con-detalle) */
export function useUpdateInventarioFisicoConDetalle() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<
    InventarioFisicoConDetalle,
    Error,
    { inventarioFisicoId: string; payload: InventarioFisicoConDetalleUpdate }
  >({
    mutationFn: ({ inventarioFisicoId, payload }) =>
      inventarioFisicoService.updateConDetalle(inventarioFisicoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'inventario-fisico', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.inventarioFisicoId, scopeEmpresaId ?? '') });
      qc.invalidateQueries({ queryKey: qk.conDetalle(vars.inventarioFisicoId, scopeEmpresaId ?? '') });
      toast.success('Inventario físico actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useAnularInventarioFisico() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<InventarioFisico, Error, { inventarioFisicoId: string }>({
    mutationFn: ({ inventarioFisicoId }) => inventarioFisicoService.anular(inventarioFisicoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'inventario-fisico', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.inventarioFisicoId, scopeEmpresaId ?? '') });
      qc.invalidateQueries({ queryKey: qk.conDetalle(vars.inventarioFisicoId, scopeEmpresaId ?? '') });
      toast.success('Inventario físico anulado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useFinalizarInventarioFisico() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<InventarioFisico, Error, { inventarioFisicoId: string }>({
    mutationFn: ({ inventarioFisicoId }) => inventarioFisicoService.finalizar(inventarioFisicoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'inventario-fisico', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.inventarioFisicoId, scopeEmpresaId ?? '') });
      qc.invalidateQueries({ queryKey: qk.conDetalle(vars.inventarioFisicoId, scopeEmpresaId ?? '') });
      toast.success('Inventario físico finalizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useAprobarInventarioFisico() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<
    InventarioFisico,
    Error,
    { inventarioFisicoId: string; payload: AprobarInventarioFisicoRequest }
  >({
    mutationFn: ({ inventarioFisicoId, payload }) =>
      inventarioFisicoService.aprobar(inventarioFisicoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'inventario-fisico', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.inventarioFisicoId, scopeEmpresaId ?? '') });
      qc.invalidateQueries({ queryKey: qk.conDetalle(vars.inventarioFisicoId, scopeEmpresaId ?? '') });
      qc.invalidateQueries({ queryKey: ['inv', 'stock', 'list'] });
      qc.invalidateQueries({ queryKey: ['inv', 'stock', 'alertas'] });
      void qc.invalidateQueries({ queryKey: ['inv', 'kardex'] });
      toast.success('Inventario físico aprobado y stock ajustado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
