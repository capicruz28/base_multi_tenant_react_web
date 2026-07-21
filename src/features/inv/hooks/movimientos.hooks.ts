import { useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { useErpListQuery, type ErpListResourceConfig } from '@/core/list';
import { getErrorMessage } from '@/core/services/error.service';
import { buildInvListQuery, invFetchList, movimientoService } from '../services/inv.service';
import type { InvListParams, Movimiento, MovimientoConDetalle, MovimientoConDetalleCreate, MovimientoConDetalleUpdate, MovimientoCreate, MovimientoUpdate, AnularMovimientoRequest, EstornarMovimientoRequest } from '../types/inv.types';
import { INV_LIST_STALE_TIME_MS } from './inv-query-defaults';
import { useInvCompanyQueryGate } from './inv-company-query-gate';
import {
  serializeMovimientoCreatePayload,
  serializeMovimientoUpdatePayload,
} from '../codigo';

/** Whitelist sort + Tier C — FRONTEND_LISTADOS_CONTRACT_V1 §4 INV movimientos. */
export const MOVIMIENTOS_LIST_CONFIG: ErpListResourceConfig = {
  tier: 'C',
  sortableColumns: [
    'numero_movimiento',
    'fecha_movimiento',
    'fecha_contable',
    'estado',
    'fecha_creacion',
  ],
  defaultLimit: 50,
  forcePagination: true,
  defaultSort: { sort_by: 'fecha_movimiento', sort_dir: 'desc' },
};

const qk = {
  list: (
    scopeEmpresaId: string,
    tipoMovimientoId: string,
    almacenId: string,
    estado: string,
    fechaDesde: string,
    fechaHasta: string,
  ) =>
    [
      'inv',
      'movimiento',
      'list',
      scopeEmpresaId,
      tipoMovimientoId,
      almacenId,
      estado,
      fechaDesde,
      fechaHasta,
    ] as const,
  detail: (movimientoId: string, scopeEmpresaId: string) =>
    ['inv', 'movimiento', 'detail', movimientoId, scopeEmpresaId] as const,
  conDetalle: (movimientoId: string, scopeEmpresaId: string) =>
    ['inv', 'movimiento', 'con-detalle', movimientoId, scopeEmpresaId] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────

export function useMovimientosErpList(options?: {
  tipo_movimiento_id?: string;
  almacen_id?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  enabled?: boolean;
}) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const enabled = gateEnabled && (options?.enabled ?? true);

  const baseFilters = useMemo(
    () => ({
      empresa_id: scopeEmpresaId ?? undefined,
      tipo_movimiento_id: options?.tipo_movimiento_id,
      almacen_id: options?.almacen_id,
      estado: options?.estado,
      fecha_desde: options?.fecha_desde,
      fecha_hasta: options?.fecha_hasta,
    }),
    [
      scopeEmpresaId,
      options?.tipo_movimiento_id,
      options?.almacen_id,
      options?.estado,
      options?.fecha_desde,
      options?.fecha_hasta,
    ],
  );

  const listQuery = useErpListQuery<Movimiento, typeof baseFilters>({
    queryKeyPrefix: ['inv', 'movimiento', 'list', scopeEmpresaId ?? ''],
    fetcher: (params) =>
      invFetchList<Movimiento>(
        '/movimientos',
        buildInvListQuery(params as InvListParams, { includeSoloActivosDefault: false }),
      ),
    baseFilters,
    config: MOVIMIENTOS_LIST_CONFIG,
    enabled,
    staleTime: INV_LIST_STALE_TIME_MS,
  });

  const { setPage } = listQuery;

  useEffect(() => {
    setPage(1);
  }, [
    options?.tipo_movimiento_id,
    options?.almacen_id,
    options?.estado,
    options?.fecha_desde,
    options?.fecha_hasta,
    setPage,
  ]);

  return listQuery;
}

export function useMovimientos(options?: {
  tipo_movimiento_id?: string;
  almacen_id?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  enabled?: boolean;
}) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const enabled = gateEnabled && (options?.enabled ?? true);

  return useTenantQuery<Movimiento[], Error>({
    queryKey: qk.list(
      scopeEmpresaId ?? '',
      options?.tipo_movimiento_id ?? '',
      options?.almacen_id ?? '',
      options?.estado ?? '',
      options?.fecha_desde ?? '',
      options?.fecha_hasta ?? '',
    ),
    queryFn: () =>
      movimientoService.list({
        empresa_id: scopeEmpresaId ?? undefined,
        tipo_movimiento_id: options?.tipo_movimiento_id,
        almacen_id: options?.almacen_id,
        estado: options?.estado,
        fecha_desde: options?.fecha_desde,
        fecha_hasta: options?.fecha_hasta,
      }),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}

export function useMovimiento(movimientoId: string | null | undefined, options?: { enabled?: boolean }) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const enabled = gateEnabled && (options?.enabled ?? true) && !!movimientoId;

  return useTenantQuery<Movimiento, Error>({
    queryKey: qk.detail(movimientoId ?? '', scopeEmpresaId ?? ''),
    queryFn: () => movimientoService.getById(movimientoId ?? ''),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}

/** Carga cabecera + líneas en una sola query usando GET /movimientos/{id}/con-detalle */
export function useMovimientoConDetalle(
  movimientoId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const { scopeEmpresaId, enabled: gateEnabled } = useInvCompanyQueryGate(options);
  const enabled = gateEnabled && (options?.enabled ?? true) && !!movimientoId;

  return useTenantQuery<MovimientoConDetalle, Error>({
    queryKey: qk.conDetalle(movimientoId ?? '', scopeEmpresaId ?? ''),
    queryFn: () => movimientoService.getConDetalle(movimientoId ?? ''),
    staleTime: INV_LIST_STALE_TIME_MS,
    enabled,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────

/**
 * @deprecated Preferir {@link useCreateMovimientoConDetalle}: el flujo operativo envía cabecera + líneas en POST `/movimientos/con-detalle`. Este hook solo crea cabecera vía POST `/movimientos`.
 */
export function useCreateMovimiento() {
  const qc = useQueryClient();

  return useMutation<Movimiento, Error, MovimientoCreate>({
    mutationFn: (payload) => movimientoService.create(serializeMovimientoCreatePayload(payload)),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['inv', 'movimiento', 'list'] });
      toast.success(`Movimiento creado: ${data.numero_movimiento}`);
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

/**
 * @deprecated Preferir {@link useUpdateMovimientoConDetalle}: el flujo operativo actualiza cabecera + líneas en PUT `/movimientos/{id}/con-detalle`. Este hook solo actualiza cabecera vía PUT `/movimientos/{id}`.
 */
export function useUpdateMovimiento() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<Movimiento, Error, { movimientoId: string; payload: MovimientoUpdate }>({
    mutationFn: ({ movimientoId, payload }) =>
      movimientoService.update(movimientoId, serializeMovimientoUpdatePayload(payload)),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'movimiento', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.movimientoId, scopeEmpresaId ?? '') });
      qc.invalidateQueries({ queryKey: qk.conDetalle(vars.movimientoId, scopeEmpresaId ?? '') });
      toast.success('Movimiento actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

/** Crea movimiento + líneas en una sola llamada (POST /movimientos/con-detalle) */
export function useCreateMovimientoConDetalle() {
  const qc = useQueryClient();

  return useMutation<MovimientoConDetalle, Error, MovimientoConDetalleCreate>({
    mutationFn: (payload) =>
      movimientoService.createConDetalle(serializeMovimientoCreatePayload(payload)),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['inv', 'movimiento', 'list'] });
      qc.invalidateQueries({ queryKey: ['inv', 'stock', 'list'] });
      toast.success(`Movimiento creado: ${data.numero_movimiento}`);
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

/** Actualiza movimiento + líneas en una sola llamada (PUT /movimientos/{id}/con-detalle) */
export function useUpdateMovimientoConDetalle() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<MovimientoConDetalle, Error, { movimientoId: string; payload: MovimientoConDetalleUpdate }>({
    mutationFn: ({ movimientoId, payload }) =>
      movimientoService.updateConDetalle(
        movimientoId,
        serializeMovimientoUpdatePayload(payload),
      ),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'movimiento', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.movimientoId, scopeEmpresaId ?? '') });
      qc.invalidateQueries({ queryKey: qk.conDetalle(vars.movimientoId, scopeEmpresaId ?? '') });
      qc.invalidateQueries({ queryKey: ['inv', 'stock', 'list'] });
      toast.success('Movimiento actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useAutorizarMovimiento() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<Movimiento, Error, { movimientoId: string }>({
    mutationFn: ({ movimientoId }) => movimientoService.autorizar(movimientoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'movimiento', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.movimientoId, scopeEmpresaId ?? '') });
      qc.invalidateQueries({ queryKey: qk.conDetalle(vars.movimientoId, scopeEmpresaId ?? '') });
      void qc.invalidateQueries({ queryKey: ['inv', 'kardex'] });
      toast.success('Movimiento autorizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useProcesarMovimiento() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<Movimiento, Error, { movimientoId: string }>({
    mutationFn: ({ movimientoId }) => movimientoService.procesar(movimientoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'movimiento', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.movimientoId, scopeEmpresaId ?? '') });
      qc.invalidateQueries({ queryKey: qk.conDetalle(vars.movimientoId, scopeEmpresaId ?? '') });
      qc.invalidateQueries({ queryKey: ['inv', 'stock', 'list'] });
      qc.invalidateQueries({ queryKey: ['inv', 'stock', 'alertas'] });
      void qc.invalidateQueries({ queryKey: ['inv', 'kardex'] });
      toast.success('Movimiento procesado y stock actualizado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useAnularMovimiento() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<Movimiento, Error, { movimientoId: string; payload?: AnularMovimientoRequest }>({
    mutationFn: ({ movimientoId, payload }) => movimientoService.anular(movimientoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'movimiento', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.movimientoId, scopeEmpresaId ?? '') });
      qc.invalidateQueries({ queryKey: qk.conDetalle(vars.movimientoId, scopeEmpresaId ?? '') });
      void qc.invalidateQueries({ queryKey: ['inv', 'kardex'] });
      toast.success('Movimiento anulado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}

export function useEstornarMovimiento() {
  const qc = useQueryClient();
  const { scopeEmpresaId } = useInvCompanyQueryGate();

  return useMutation<Movimiento, Error, { movimientoId: string; payload?: EstornarMovimientoRequest }>({
    mutationFn: ({ movimientoId, payload }) => movimientoService.estornar(movimientoId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['inv', 'movimiento', 'list'] });
      qc.invalidateQueries({ queryKey: qk.detail(vars.movimientoId, scopeEmpresaId ?? '') });
      qc.invalidateQueries({ queryKey: qk.conDetalle(vars.movimientoId, scopeEmpresaId ?? '') });
      qc.invalidateQueries({ queryKey: ['inv', 'stock', 'list'] });
      qc.invalidateQueries({ queryKey: ['inv', 'stock', 'alertas'] });
      void qc.invalidateQueries({ queryKey: ['inv', 'kardex'] });
      toast.success('Movimiento estornado.');
    },
    onError: (err) => toast.error(getErrorMessage(err).message),
  });
}
