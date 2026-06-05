/**
 * Inventario Físico — Listado, detalle (con-detalle), aprobar, finalizar, anular.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toAppPath } from '@/core/routing/post-login-path';
import { Loader, ClipboardList, Plus, Pencil } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { InventarioFisico, Producto } from '../types/inv.types';
import { productoService } from '../services/inv.service';
import { InvPageLayout } from '../components/InvPageLayout';
import { InvTableSkeleton } from '../components/InvTableSkeleton';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useAlmacenes } from '../hooks/almacenes.hooks';
import {
  useAprobarInventarioFisico,
  useAnularInventarioFisico,
  useFinalizarInventarioFisico,
  useInventarioFisicoConDetalle,
  useInventariosFisicos,
} from '../hooks/inventario-fisico.hooks';
import { useTiposMovimiento } from '../hooks/tipos-movimiento.hooks';
import { useInvScopeEmpresaReset } from '../hooks/useInvSessionScope';
import { resetInventarioFisicoListUiState } from '../utils/inv-list-empresa-reset';

function fmtValorDif(v: string | null | undefined): string {
  if (v == null || v === '') return '-';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : v;
}

export default function InventarioFisicoPage() {
  const { can } = usePermissions();
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
  const [anularOpen, setAnularOpen] = useState(false);
  const [finalizarOpen, setFinalizarOpen] = useState(false);

  const resetPageFilters = useCallback(() => {
    setAlmacenFilter('');
    setEstadoFilter('');
    setFechaDesde('');
    setFechaHasta('');
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
  }, []);
  useInvScopeEmpresaReset(resetPageFilters);

  const almacenesQuery = useAlmacenes({
    solo_activos: true,
  });
  const almacenes = almacenesQuery.data ?? [];

  const inventariosQuery = useInventariosFisicos({
    almacen_id: almacenFilter || undefined,
    estado: estadoFilter || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
    enabled: true,
  });
  const list = inventariosQuery.data ?? [];

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
  const tiposAjuste = (tiposMovimientoQuery.data ?? []).filter((t) => t.clase_movimiento === 'ajuste');

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

  const canEditar = can('inv', 'editar');
  const canCrear = can('inv', 'crear');

  const puedeAprobar = selected && selected.estado !== 'anulado' && selected.estado !== 'ajustado';
  const puedeAnular = selected && selected.estado !== 'anulado';
  const puedeFinalizar = selected && selected.estado === 'en_proceso';
  const puedeEditarForm = selected && selected.estado !== 'anulado' && selected.estado !== 'ajustado';

  const inventarioFisicoConfirmLabel = selected?.numero_inventario ?? '—';

  const cerrarAprobar = () => {
    setAprobarOpen(false);
    setAprobarTipoMovimientoId('');
    setAprobarObs('');
  };

  const handleAprobarConfirm = () => {
    if (!selectedId) return;
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
        cerrarAprobar();
      });
  };

  const handleAnularInventarioConfirm = () => {
    if (!selectedId) return;
    void anularMutation.mutateAsync({ inventarioFisicoId: selectedId }).then(() => setAnularOpen(false));
  };

  const handleFinalizarConfirm = () => {
    if (!selectedId) return;
    void finalizarMutation.mutateAsync({ inventarioFisicoId: selectedId }).then(() => setFinalizarOpen(false));
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
        {canCrear ? (
          <Button asChild className="ml-auto bg-brand-primary hover:bg-brand-primary-hover text-white">
            <Link to="/app/inv/inventario-fisico/nuevo">
              <Plus className="h-4 w-4 mr-2 inline" /> Nueva toma
            </Link>
          </Button>
        ) : (
          <Button className="ml-auto opacity-50" disabled>
            <Plus className="h-4 w-4 mr-2 inline" /> Nueva toma
          </Button>
        )}
      </div>
      {inventariosQuery.isLoading && <InvTableSkeleton columns={7} />}
      {inventariosQuery.error && !inventariosQuery.isLoading && (
        <p className="text-error bg-error/10 p-4 rounded-lg">
          {getErrorMessage(inventariosQuery.error).message}
        </p>
      )}
      {!inventariosQuery.isLoading && !inventariosQuery.error && (
        <div className="overflow-x-auto rounded-lg border border-border-base shadow">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-subtle">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Almacén</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-soft uppercase">Contados</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-soft uppercase">Valor dif.</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <ClipboardList className="h-12 w-12 mx-auto mb-3 text-text-soft opacity-70" />
                    <p className="text-sm font-medium text-text-soft">No hay tomas de inventario registradas.</p>
                  </td>
                </tr>
              ) : (
                list.map((row: InventarioFisico) => (
                  <tr
                    key={row.inventario_fisico_id}
                    className="hover:bg-overlay dark:hover:bg-overlay cursor-pointer"
                    onClick={() => {
                      setSelectedId(row.inventario_fisico_id);
                      setDetailOpen(true);
                    }}
                  >
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de inventario físico</DialogTitle>
          </DialogHeader>

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
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAprobarTipoMovimientoId(tiposAjuste[0]?.tipo_movimiento_id ?? '');
                    setAprobarObs('');
                    setAprobarOpen(true);
                  }}
                  disabled={!canEditar || !puedeAprobar}
                >
                  Aprobar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFinalizarOpen(true)}
                  disabled={!canEditar || !puedeFinalizar || finalizarMutation.isPending}
                >
                  Finalizar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setAnularOpen(true)}
                  disabled={!canEditar || !puedeAnular || anularMutation.isPending}
                >
                  Anular
                </Button>
                {puedeEditarForm && selectedId ? (
                  <Button variant="secondary" asChild>
                    <Link to={toAppPath(`/inv/inventario-fisico/${selectedId}/editar`)}>
                      <Pencil className="h-4 w-4 mr-1 inline" /> Editar
                    </Link>
                  </Button>
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
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={aprobarOpen}
        onClose={cerrarAprobar}
        onConfirm={() => void handleAprobarConfirm()}
        title="Aprobar inventario físico"
        message={`¿Aprobar inventario físico '${inventarioFisicoConfirmLabel}'? Se registrará el ajuste con el tipo de movimiento indicado.`}
        confirmText="Aprobar"
        cancelText="Cancelar"
        variant="danger"
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
        onClose={() => setAnularOpen(false)}
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
        onClose={() => setFinalizarOpen(false)}
        onConfirm={() => void handleFinalizarConfirm()}
        title="Finalizar inventario físico"
        message={`¿Finalizar inventario físico '${inventarioFisicoConfirmLabel}'? Se marcará la toma como finalizada según el flujo del backend.`}
        confirmText="Finalizar"
        cancelText="Cancelar"
        variant="danger"
        loading={finalizarMutation.isPending}
      />
    </InvPageLayout>
  );
}
