/**
 * Inventario Físico — Listado, detalle (con-detalle), aprobar, finalizar, anular.
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toAppPath } from '@/core/routing/post-login-path';
import { Loader, ClipboardList, Plus, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type {
  InventarioFisico,
  InventarioFisicoConDetalle,
  InventarioFisicoDetalleRead,
  Producto,
} from '../types/inv.types';
import { productoService } from '../services/inv.service';
import { InvPageLayout } from '../components/InvPageLayout';
import { InvTableSkeleton } from '../components/InvTableSkeleton';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermission } from '@/core/auth/PermissionContext';
import { INV_PERMISSIONS } from '../constants/inv-permissions';
import { useAlmacenes } from '../hooks/almacenes.hooks';
import {
  useAprobarInventarioFisico,
  useAnularInventarioFisico,
  useFinalizarInventarioFisico,
  useInventarioFisicoConDetalle,
  useInventariosFisicosErpList,
  INVENTARIO_FISICO_LIST_CONFIG,
} from '../hooks/inventario-fisico.hooks';
import { ErpPagination, ErpSortableHeader } from '@/shared/components/erp-list';
import { useTiposMovimiento } from '../hooks/tipos-movimiento.hooks';
import { useInvScopeEmpresaReset } from '../hooks/useInvSessionScope';
import { resetInventarioFisicoListUiState } from '../utils/inv-list-empresa-reset';
import { OrgDiscardConfirmDialog } from '@/features/org/components/OrgDiscardConfirmDialog';
import type { OrgDiscardPending } from '@/features/org/types/org-discard.types';
import { scheduleModalStackValidation } from '@/features/admin/utils/iam-modal-stack-validation';

interface AprobarConfirmBaseline {
  tipoMovimientoId: string;
  obs: string;
}

function fmtValorDif(v: string | null | undefined): string {
  if (v == null || v === '') return '-';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : v;
}

function cantidadContadaInformada(cantidad: string | null | undefined): boolean {
  return cantidad != null && String(cantidad).trim() !== '';
}

function numeroDistintoDeCero(v: string | number | null | undefined): boolean {
  if (v == null || v === '') return false;
  const n = Number(v);
  return Number.isFinite(n) && n !== 0;
}

function lineaTieneDiferenciaCantidad(ln: InventarioFisicoDetalleRead): boolean {
  if (!cantidadContadaInformada(ln.cantidad_contada)) return false;
  const sistema = Number(ln.cantidad_sistema);
  const contada = Number(ln.cantidad_contada);
  if (!Number.isFinite(sistema) || !Number.isFinite(contada)) return false;
  return sistema !== contada;
}

function tieneDiferenciasParaAjustar(doc: InventarioFisicoConDetalle): boolean {
  if (numeroDistintoDeCero(doc.valor_diferencias)) return true;
  if (doc.total_diferencias != null && doc.total_diferencias !== 0) return true;
  const lineas = doc.detalles ?? [];
  if (
    lineas.some(
      (ln) => numeroDistintoDeCero(ln.diferencia) || numeroDistintoDeCero(ln.valor_diferencia),
    )
  ) {
    return true;
  }
  return lineas.some(lineaTieneDiferenciaCantidad);
}

function getFinalizarDisabledTitle(
  doc: InventarioFisicoConDetalle | null,
  canFinalizar: boolean,
  isPending: boolean,
): string | undefined {
  if (!canFinalizar) return undefined;
  if (isPending) return 'Finalizando…';
  if (!doc || doc.estado !== 'en_proceso') return 'Solo disponible mientras el inventario está en proceso.';
  const lineas = doc.detalles ?? [];
  if (lineas.length === 0) return 'No hay líneas de detalle registradas.';
  if (lineas.some((ln) => !cantidadContadaInformada(ln.cantidad_contada))) {
    return 'Todas las líneas deben tener cantidad contada informada.';
  }
  return undefined;
}

function getAprobarDisabledTitle(
  doc: InventarioFisicoConDetalle | null,
  canAprobar: boolean,
  discardPending: OrgDiscardPending,
): string | undefined {
  if (!canAprobar) return undefined;
  if (discardPending !== null) return 'Complete o descarte la confirmación pendiente.';
  if (!doc) return undefined;
  if (doc.estado === 'en_proceso') return 'Finalice el inventario antes de aprobar el ajuste.';
  if (doc.estado !== 'finalizado') return 'Solo disponible cuando el inventario está finalizado.';
  const lineas = doc.detalles ?? [];
  if (lineas.length === 0) return 'No hay líneas de detalle registradas.';
  if (!tieneDiferenciasParaAjustar(doc)) return 'No hay diferencias de inventario para ajustar.';
  return undefined;
}

export default function InventarioFisicoPage() {
  const { hasPermission } = usePermission();
  const [almacenFilter, setAlmacenFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [productosMap, setProductosMap] = useState<Record<string, Producto>>({});
  const [aprobarOpen, setAprobarOpen] = useState(false);
  const [aprobarTipoMovimientoId, setAprobarTipoMovimientoId] = useState('');
  const [aprobarObs, setAprobarObs] = useState('');
  const [aprobarBaseline, setAprobarBaseline] = useState<AprobarConfirmBaseline | null>(null);
  const [discardPending, setDiscardPending] = useState<OrgDiscardPending>(null);
  const aprobarBaselineCapturedRef = useRef(false);
  const [anularOpen, setAnularOpen] = useState(false);
  const [finalizarOpen, setFinalizarOpen] = useState(false);

  const inventariosList = useInventariosFisicosErpList({
    almacen_id: almacenFilter || undefined,
    estado: estadoFilter || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
    enabled: true,
  });

  const resetPageFilters = useCallback(() => {
    setAlmacenFilter('');
    setEstadoFilter('');
    setFechaDesde('');
    setFechaHasta('');
    inventariosList.setPage(1);
    inventariosList.resetSortState();
    setProductosMap({});
    resetInventarioFisicoListUiState({
      setDetailOpen,
      setSelectedId,
      setAprobarOpen,
      setAprobarTipoMovimientoId,
      setAprobarObs,
      setAnularOpen,
      setFinalizarOpen,
    });
    setAprobarBaseline(null);
    setDiscardPending(null);
    aprobarBaselineCapturedRef.current = false;
  }, [inventariosList.setPage, inventariosList.resetSortState]);
  useInvScopeEmpresaReset(resetPageFilters);

  const almacenesQuery = useAlmacenes({
    solo_activos: true,
  });
  const almacenes = almacenesQuery.data ?? [];

  const list = inventariosList.items;

  const conDetalleQuery = useInventarioFisicoConDetalle(selectedId, {
    enabled: detailOpen && !!selectedId,
  });
  const selected = conDetalleQuery.data ?? null;

  const detalleLineIds = useMemo(() => {
    if (!selected?.detalles?.length) return '';
    return selected.detalles
      .map((x) => x.producto_id)
      .sort()
      .join(',');
  }, [selected]);

  useEffect(() => {
    if (!selected?.detalles?.length) return;
    const ids = [...new Set(selected.detalles.map((l) => l.producto_id))].filter((id) => id && !productosMap[id]);
    if (!ids.length) return;
    void (async () => {
      const resultados = await Promise.all(
        ids.map(async (id) => {
          try {
            const prod = await productoService.getById(id);
            return { id, prod };
          } catch {
            return null;
          }
        })
      );
      setProductosMap((prev) => {
        const next = { ...prev };
        resultados.forEach((r) => {
          if (r?.prod) next[r.id] = r.prod;
        });
        return next;
      });
    })();
  }, [detalleLineIds, productosMap]);

  const anularMutation = useAnularInventarioFisico();
  const aprobarMutation = useAprobarInventarioFisico();
  const finalizarMutation = useFinalizarInventarioFisico();

  const almacenNombre = (id: string) => almacenes.find((a) => a.almacen_id === id)?.nombre ?? '—';

  const productoNombre = (id: string) => {
    const p = productosMap[id];
    return p ? `${p.codigo_sku} — ${p.nombre}` : '—';
  };

  const tiposMovimientoQuery = useTiposMovimiento({
    solo_activos: true,
    enabled: aprobarOpen,
  });
  const tiposAjuste = (tiposMovimientoQuery.data ?? []).filter((t) => t.clase_movimiento === 'AJUSTE');

  useEffect(() => {
    if (!aprobarOpen || tiposMovimientoQuery.isLoading || !tiposMovimientoQuery.isFetched) return;
    if (aprobarBaselineCapturedRef.current) return;

    const defaultTipoId = tiposAjuste[0]?.tipo_movimiento_id ?? '';
    const tipoId = aprobarTipoMovimientoId !== '' ? aprobarTipoMovimientoId : defaultTipoId;

    if (aprobarTipoMovimientoId === '' && defaultTipoId !== '') {
      setAprobarTipoMovimientoId(defaultTipoId);
    }

    setAprobarBaseline({
      tipoMovimientoId: tipoId,
      obs: aprobarObs,
    });
    aprobarBaselineCapturedRef.current = true;
  }, [
    aprobarOpen,
    aprobarObs,
    aprobarTipoMovimientoId,
    tiposAjuste,
    tiposMovimientoQuery.isFetched,
    tiposMovimientoQuery.isLoading,
  ]);

  const isAprobarConfirmDirty = useMemo(() => {
    if (!aprobarBaseline) return false;
    return (
      aprobarTipoMovimientoId !== aprobarBaseline.tipoMovimientoId ||
      aprobarObs.trim() !== aprobarBaseline.obs.trim()
    );
  }, [aprobarBaseline, aprobarTipoMovimientoId, aprobarObs]);

  const estadoChipColor = (estado?: string | null) => {
    switch (estado) {
      case 'en_proceso':
        return 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary';
      case 'finalizado':
        return 'bg-success/10 text-success';
      case 'ajustado':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'anulado':
        return 'bg-error/10 text-error';
      default:
        return 'bg-subtle text-text-base dark:bg-subtle dark:text-text-base';
    }
  };

  const canCrearInventarioFisico = hasPermission(INV_PERMISSIONS.INVENTARIO_FISICO_CREAR);
  const canActualizarInventarioFisico = hasPermission(INV_PERMISSIONS.INVENTARIO_FISICO_ACTUALIZAR);
  const canFinalizarLifecycle = hasPermission(INV_PERMISSIONS.INVENTARIO_FISICO_FINALIZAR);
  const canAprobarLifecycle = hasPermission(INV_PERMISSIONS.INVENTARIO_FISICO_APROBAR);
  const canAnularLifecycle = hasPermission(INV_PERMISSIONS.INVENTARIO_FISICO_ANULAR);

  const puedeAprobarPorEstado = selected?.estado === 'finalizado';
  const lineasDetalle = selected?.detalles ?? [];
  const finalizarBloqueoDatos =
    selected != null &&
    selected.estado === 'en_proceso' &&
    (lineasDetalle.length === 0 ||
      lineasDetalle.some((ln) => !cantidadContadaInformada(ln.cantidad_contada)));
  const aprobarBloqueoDatos =
    selected != null &&
    selected.estado === 'finalizado' &&
    (lineasDetalle.length === 0 || !tieneDiferenciasParaAjustar(selected));

  const puedeAprobar = puedeAprobarPorEstado && !aprobarBloqueoDatos;
  const puedeAnular =
    selected != null && (selected.estado === 'en_proceso' || selected.estado === 'finalizado');
  const puedeFinalizar = selected?.estado === 'en_proceso' && !finalizarBloqueoDatos;
  const showAprobar = canAprobarLifecycle && puedeAprobar;
  const showFinalizar = canFinalizarLifecycle && puedeFinalizar;
  const showAnular = canAnularLifecycle && puedeAnular;
  const puedeEditarDocumento =
    canActualizarInventarioFisico &&
    selected != null &&
    selected.estado !== 'anulado' &&
    selected.estado !== 'ajustado';

  const finalizarDisabledTitle = getFinalizarDisabledTitle(
    selected,
    canFinalizarLifecycle,
    finalizarMutation.isPending,
  );
  const aprobarDisabledTitle = getAprobarDisabledTitle(selected, canAprobarLifecycle, discardPending);
  const accionBloqueoVisible = (() => {
    if (!selected) return null;
    if (selected.estado === 'en_proceso') {
      if (canFinalizarLifecycle && finalizarBloqueoDatos && finalizarDisabledTitle) {
        return finalizarDisabledTitle;
      }
      if (canAprobarLifecycle && !puedeAprobarPorEstado && aprobarDisabledTitle) {
        return aprobarDisabledTitle;
      }
    }
    if (
      selected.estado === 'finalizado' &&
      canAprobarLifecycle &&
      aprobarBloqueoDatos &&
      aprobarDisabledTitle
    ) {
      return aprobarDisabledTitle;
    }
    return null;
  })();

  const abrirDetalle = (row: InventarioFisico) => {
    setSelectedId(row.inventario_fisico_id);
    setDetailOpen(true);
  };

  const workflowConfirmOpen = aprobarOpen || anularOpen || finalizarOpen;
  const detailDialogOpen = detailOpen && !workflowConfirmOpen && discardPending === null;

  const inventarioFisicoConfirmLabel = selected?.numero_inventario ?? '—';

  const reopenDetailIfSelected = () => {
    if (selectedId) setDetailOpen(true);
  };

  const cerrarAprobar = (reopenDetail = true) => {
    setAprobarOpen(false);
    setAprobarTipoMovimientoId('');
    setAprobarObs('');
    setAprobarBaseline(null);
    setDiscardPending(null);
    aprobarBaselineCapturedRef.current = false;
    if (reopenDetail) reopenDetailIfSelected();
  };

  const handleOpenAprobar = () => {
    setAprobarTipoMovimientoId('');
    setAprobarObs('');
    setAprobarBaseline(null);
    setDiscardPending(null);
    aprobarBaselineCapturedRef.current = false;
    setDetailOpen(false);
    setAprobarOpen(true);
  };

  const handleRequestCloseAprobar = () => {
    if (aprobarMutation.isPending) return;
    if (isAprobarConfirmDirty) {
      setAprobarOpen(false);
      setDiscardPending('edit');
      scheduleModalStackValidation('inv-inventario-fisico-aprobar-request-close-dirty');
      return;
    }
    cerrarAprobar(true);
  };

  const handleAprobarDiscardCancel = () => {
    setDiscardPending(null);
    setAprobarOpen(true);
    scheduleModalStackValidation('inv-inventario-fisico-aprobar-discard-cancel-resume');
  };

  const handleAprobarDiscardConfirm = () => {
    setDiscardPending(null);
    cerrarAprobar(true);
    scheduleModalStackValidation('inv-inventario-fisico-aprobar-discard-confirmed');
  };

  const cerrarAnular = (reopenDetail = true) => {
    setAnularOpen(false);
    if (reopenDetail) reopenDetailIfSelected();
  };

  const cerrarFinalizar = (reopenDetail = true) => {
    setFinalizarOpen(false);
    if (reopenDetail) reopenDetailIfSelected();
  };

  const handleAprobarConfirm = () => {
    if (!selectedId || !canAprobarLifecycle) return;
    if (!aprobarTipoMovimientoId) {
      toast.error('Selecciona un tipo de movimiento (ajuste).');
      return;
    }
    void aprobarMutation
      .mutateAsync({
        inventarioFisicoId: selectedId,
        payload: { tipo_movimiento_id: aprobarTipoMovimientoId, observaciones: aprobarObs || null },
      })
      .then(() => {
        cerrarAprobar(false);
      });
  };

  const handleAnularInventarioConfirm = () => {
    if (!selectedId || !canAnularLifecycle) return;
    void anularMutation.mutateAsync({ inventarioFisicoId: selectedId }).then(() => cerrarAnular(false));
  };

  const handleFinalizarConfirm = () => {
    if (!selectedId || !canFinalizarLifecycle) return;
    void finalizarMutation.mutateAsync({ inventarioFisicoId: selectedId }).then(() => cerrarFinalizar(false));
  };

  return (
    <InvPageLayout>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {almacenes.length > 0 && (
          <select
            value={almacenFilter}
            onChange={(e) => setAlmacenFilter(e.target.value)}
            className="px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
          >
            <option value="">Todos los almacenes</option>
            {almacenes.map((a) => (
              <option key={a.almacen_id} value={a.almacen_id}>
                {a.nombre}
              </option>
            ))}
          </select>
        )}
        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          className="px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
        >
          <option value="">Estado</option>
          <option value="en_proceso">En proceso</option>
          <option value="finalizado">Finalizado</option>
          <option value="ajustado">Ajustado</option>
          <option value="anulado">Anulado</option>
        </select>
        <input
          type="date"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
          className="px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
          title="Fecha desde"
        />
        <input
          type="date"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
          className="px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
          title="Fecha hasta"
        />
        {canCrearInventarioFisico ? (
          <Button asChild className="ml-auto bg-brand-primary hover:bg-brand-primary-hover text-white">
            <Link to="/app/inv/inventario-fisico/nuevo">
              <Plus className="h-4 w-4 mr-2 inline" /> Nueva toma
            </Link>
          </Button>
        ) : null}
      </div>
      {inventariosList.isLoading && <InvTableSkeleton columns={8} />}
      {inventariosList.isError && !inventariosList.isLoading && (
        <p className="text-error bg-error/10 p-4 rounded-lg">
          {getErrorMessage(inventariosList.error).message}
        </p>
      )}
      {!inventariosList.isLoading && !inventariosList.isError && (
        <div className="overflow-x-auto rounded-lg border border-border-base shadow">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-subtle">
              <tr>
                <ErpSortableHeader
                  column="numero_inventario"
                  label="Número"
                  sortableColumns={INVENTARIO_FISICO_LIST_CONFIG.sortableColumns}
                  sort={inventariosList.sort}
                  onSort={inventariosList.toggleSort}
                />
                <ErpSortableHeader
                  column="fecha_inventario"
                  label="Fecha"
                  sortableColumns={INVENTARIO_FISICO_LIST_CONFIG.sortableColumns}
                  sort={inventariosList.sort}
                  onSort={inventariosList.toggleSort}
                />
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Almacén</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-soft uppercase">Contados</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-soft uppercase">Valor dif.</th>
                <ErpSortableHeader
                  column="estado"
                  label="Estado"
                  sortableColumns={INVENTARIO_FISICO_LIST_CONFIG.sortableColumns}
                  sort={inventariosList.sort}
                  onSort={inventariosList.toggleSort}
                  className="text-center"
                />
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <ClipboardList className="h-12 w-12 mx-auto mb-3 text-text-soft opacity-70" />
                    <p className="text-sm font-medium text-text-soft">No hay tomas de inventario registradas.</p>
                  </td>
                </tr>
              ) : (
                list.map((row: InventarioFisico) => (
                  <tr key={row.inventario_fisico_id} className="hover:bg-overlay dark:hover:bg-overlay">
                    <td className="px-4 py-3 text-sm font-medium text-text-base">{row.numero_inventario}</td>
                    <td className="px-4 py-3 text-sm text-text-base">
                      {new Date(row.fecha_inventario).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-base">{almacenNombre(row.almacen_id)}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.tipo_inventario}</td>
                    <td className="px-4 py-3 text-sm text-right text-text-base">
                      {row.total_productos_contados ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-text-base">{fmtValorDif(row.valor_diferencias)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${estadoChipColor(row.estado)}`}
                      >
                        {row.estado ?? 'en_proceso'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-brand-primary hover:text-brand-primary/80"
                          title="Ver detalle"
                          aria-label="Ver detalle"
                          onClick={() => abrirDetalle(row)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {inventariosList.pagination ? (
            <ErpPagination
              pagination={inventariosList.pagination}
              onPageChange={inventariosList.setPage}
              onLimitChange={inventariosList.setLimit}
              disabled={discardPending !== null || inventariosList.isFetching}
            />
          ) : null}
        </div>
      )}

      <Dialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          if (!open && !workflowConfirmOpen && discardPending === null) setDetailOpen(false);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
            <DialogTitle>Detalle de inventario físico</DialogTitle>
          </DialogHeader>
          <DialogBody className="px-6 pb-6">

          {conDetalleQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-brand-primary" />
            </div>
          ) : conDetalleQuery.error ? (
            <p className="text-error bg-error/10 p-4 rounded-lg">
              {getErrorMessage(conDetalleQuery.error).message}
            </p>
          ) : !selected ? (
            <p className="text-text-soft">No se encontró el inventario.</p>
          ) : (
            <div className="space-y-4 text-sm text-text-base">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                {showAprobar ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenAprobar}
                    disabled={discardPending !== null}
                  >
                    Aprobar
                  </Button>
                ) : null}
                {showFinalizar ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDetailOpen(false);
                      setFinalizarOpen(true);
                    }}
                    disabled={finalizarMutation.isPending}
                  >
                    Finalizar
                  </Button>
                ) : null}
                {showAnular ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setDetailOpen(false);
                      setAnularOpen(true);
                    }}
                    disabled={anularMutation.isPending}
                  >
                    Anular
                  </Button>
                ) : null}
                {puedeEditarDocumento && selectedId ? (
                  <Button variant="secondary" asChild>
                    <Link to={toAppPath(`/inv/inventario-fisico/${selectedId}/editar`)}>Editar documento</Link>
                  </Button>
                ) : null}
                </div>
                {accionBloqueoVisible ? (
                  <p className="text-xs text-text-soft">{accionBloqueoVisible}</p>
                ) : null}
              </div>

              <div>
                <span className="font-semibold">Número:</span> {selected.numero_inventario}
              </div>
              <div>
                <span className="font-semibold">Fecha:</span> {new Date(selected.fecha_inventario).toLocaleDateString()}
              </div>
              <div>
                <span className="font-semibold">Almacén:</span> {almacenNombre(selected.almacen_id)}
              </div>
              <div>
                <span className="font-semibold">Tipo:</span> {selected.tipo_inventario}
              </div>
              <div>
                <span className="font-semibold">Estado:</span> {selected.estado ?? 'en_proceso'}
              </div>
              {selected.supervisor_nombre ? (
                <div>
                  <span className="font-semibold">Supervisor:</span> {selected.supervisor_nombre}
                </div>
              ) : null}
              <div>
                <span className="font-semibold">Valor diferencias:</span> {fmtValorDif(selected.valor_diferencias)}
              </div>
              {selected.descripcion ? (
                <div>
                  <span className="font-semibold">Descripción:</span>
                  <div className="mt-1 whitespace-pre-wrap">{selected.descripcion}</div>
                </div>
              ) : null}

              <div className="pt-2">
                <div className="text-sm font-semibold text-text-base mb-2">Líneas</div>
                {(selected.detalles ?? []).length === 0 ? (
                  <p className="text-text-soft">No hay líneas registradas.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border-base">
                    <table className="min-w-full divide-y divide-border-base">
                      <thead className="bg-subtle">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-soft uppercase">
                            Producto
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-text-soft uppercase">
                            Sistema
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-text-soft uppercase">
                            Contada
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-surface divide-y divide-border-base">
                        {(selected.detalles ?? []).map((ln) => (
                          <tr key={ln.inventario_fisico_detalle_id}>
                            <td className="px-3 py-2 text-sm text-text-base">{productoNombre(ln.producto_id)}</td>
                            <td className="px-3 py-2 text-sm text-right text-text-base">{ln.cantidad_sistema}</td>
                            <td className="px-3 py-2 text-sm text-right text-text-base">{ln.cantidad_contada ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <OrgDiscardConfirmDialog
        discardPending={discardPending}
        entityLabel="la aprobación"
        onClose={handleAprobarDiscardCancel}
        onConfirm={handleAprobarDiscardConfirm}
      />

      <ConfirmDialog
        isOpen={aprobarOpen}
        onClose={handleRequestCloseAprobar}
        onConfirm={() => void handleAprobarConfirm()}
        title="Aprobar inventario físico"
        message={`¿Aprobar inventario físico '${inventarioFisicoConfirmLabel}'? Se registrará el ajuste de stock por las diferencias del conteo.`}
        confirmText="Aprobar"
        cancelText="Cancelar"
        variant="warning"
        loading={aprobarMutation.isPending}
        panelClassName="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <Label>Tipo de movimiento (ajuste) *</Label>
            <select
              value={aprobarTipoMovimientoId}
              onChange={(e) => setAprobarTipoMovimientoId(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
              required
            >
              <option value="">Seleccionar</option>
              {tiposAjuste.map((t) => (
                <option key={t.tipo_movimiento_id} value={t.tipo_movimiento_id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Observaciones</Label>
            <textarea
              value={aprobarObs}
              onChange={(e) => setAprobarObs(e.target.value)}
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={anularOpen}
        onClose={() => cerrarAnular()}
        onConfirm={() => void handleAnularInventarioConfirm()}
        title="Anular inventario físico"
        message={`¿Anular inventario físico '${inventarioFisicoConfirmLabel}'? Esta acción suele ser irreversible según reglas de negocio.`}
        confirmText="Anular"
        cancelText="Cancelar"
        variant="danger"
        loading={anularMutation.isPending}
      />

      <ConfirmDialog
        isOpen={finalizarOpen}
        onClose={() => cerrarFinalizar()}
        onConfirm={() => void handleFinalizarConfirm()}
        title="Finalizar inventario físico"
        message={`¿Finalizar inventario físico '${inventarioFisicoConfirmLabel}'? Se cerrará el conteo. Todas las líneas deben tener cantidad contada informada.`}
        confirmText="Finalizar"
        cancelText="Cancelar"
        variant="warning"
        loading={finalizarMutation.isPending}
      />
    </InvPageLayout>
  );
}
