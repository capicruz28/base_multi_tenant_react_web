/**
 * Movimientos de Inventario — Listado y detalle (una query con-detalle).
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toAppPath } from '@/core/routing/post-login-path';
import { Loader, ArrowLeftRight, Eye, Pencil } from 'lucide-react';
import type { Movimiento, MovimientoConDetalle, Producto } from '../types/inv.types';
import { productoService } from '../services/inv.service';
import { InvPageLayout } from '../components/InvPageLayout';
import { InvTableSkeleton } from '../components/InvTableSkeleton';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useAlmacenes } from '../hooks/almacenes.hooks';
import { useTiposMovimiento } from '../hooks/tipos-movimiento.hooks';
import {
  useMovimientos,
  useMovimientoConDetalle,
  useAutorizarMovimiento,
  useProcesarMovimiento,
  useAnularMovimiento,
} from '../hooks/movimientos.hooks';
import { useInvScopeEmpresaReset } from '../hooks/useInvSessionScope';
import { resetMovimientosListUiState } from '../utils/inv-list-empresa-reset';

function fmtDecimal(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === '') return '-';
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : String(v);
}

export default function MovimientosPage() {
  const { can } = usePermissions();
  const [almacenFilter, setAlmacenFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMovimientoId, setSelectedMovimientoId] = useState<string | null>(null);
  const [productosMap, setProductosMap] = useState<Record<string, Producto>>({});
  const [procesarOpen, setProcesarOpen] = useState(false);
  const [autorizarOpen, setAutorizarOpen] = useState(false);
  const [anularOpen, setAnularOpen] = useState(false);
  const [anularMotivo, setAnularMotivo] = useState('');

  const resetPageFilters = useCallback(() => {
    setAlmacenFilter('');
    setTipoFilter('');
    setEstadoFilter('');
    setFechaDesde('');
    setFechaHasta('');
    setProductosMap({});
    resetMovimientosListUiState({
      setDetailOpen,
      setSelectedMovimientoId,
      setAutorizarOpen,
      setProcesarOpen,
      setAnularOpen,
      setAnularMotivo,
    });
  }, []);
  useInvScopeEmpresaReset(resetPageFilters);

  const almacenesQuery = useAlmacenes({
    solo_activos: true,
  });
  const almacenes = almacenesQuery.data ?? [];
  const tiposMovimientoQuery = useTiposMovimiento({
    solo_activos: true,
  });
  const tiposMovimiento = tiposMovimientoQuery.data ?? [];

  const movimientosQuery = useMovimientos({
    almacen_id: almacenFilter || undefined,
    tipo_movimiento_id: tipoFilter || undefined,
    estado: estadoFilter || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
    enabled: true,
  });
  const list = movimientosQuery.data ?? [];

  const conDetalleQuery = useMovimientoConDetalle(selectedMovimientoId, {
    enabled: detailOpen && !!selectedMovimientoId,
  });
  const detalleData = conDetalleQuery.data ?? null;

  const detalleIdsMemo = useMemo(() => {
    const d = detalleData;
    if (!d?.detalles?.length) return '';
    return d.detalles
      .map((x) => x.producto_id)
      .sort()
      .join(',');
  }, [detalleData]);

  useEffect(() => {
    if (!detalleData?.detalles?.length) return;
    const ids = [...new Set(detalleData.detalles.map((l) => l.producto_id))].filter((id) => id && !productosMap[id]);
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
  }, [detalleIdsMemo, productosMap, detalleData]);

  const tipoMovimientoNombre = (id: string) => tiposMovimiento.find((t) => t.tipo_movimiento_id === id)?.nombre ?? '—';
  const almacenNombre = (id: string | null | undefined) =>
    id ? almacenes.find((a) => a.almacen_id === id)?.nombre ?? '—' : '—';
  const productoNombre = (id: string) => {
    const p = productosMap[id];
    return p ? `${p.codigo_sku} — ${p.nombre}` : '—';
  };

  const estadoColor = (estado: string | null | undefined) => {
    switch (estado) {
      case 'procesado':
        return 'bg-success/10 text-success';
      case 'autorizado':
        return 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary';
      case 'borrador':
        return 'bg-subtle text-text-base dark:bg-subtle dark:text-text-base';
      case 'anulado':
        return 'bg-error/10 text-error';
      default:
        return 'bg-subtle text-text-base dark:bg-subtle dark:text-text-base';
    }
  };

  const abrirDetalle = (mov: Movimiento) => {
    setSelectedMovimientoId(mov.movimiento_id);
    setDetailOpen(true);
  };

  const autorizarMutation = useAutorizarMovimiento();
  const procesarMutation = useProcesarMovimiento();
  const anularMutation = useAnularMovimiento();

  const canEditar = can('inv', 'editar');
  const canCrear = can('inv', 'crear');

  const selectedCabecera: Movimiento | MovimientoConDetalle | null = detalleData;
  const puedeAutorizar =
    !selectedCabecera?.estado || selectedCabecera.estado === 'borrador';
  const puedeProcesar = selectedCabecera?.estado === 'autorizado';
  const puedeAnular = selectedCabecera?.estado !== 'procesado' && selectedCabecera?.estado !== 'anulado';
  const puedeEditarForm =
    canEditar && (selectedCabecera?.estado === 'borrador' || !selectedCabecera?.estado);

  const ejecutarAutorizar = () => {
    if (!selectedMovimientoId || !canEditar) return;
    void autorizarMutation.mutateAsync({ movimientoId: selectedMovimientoId }).then(() => setAutorizarOpen(false));
  };

  const ejecutarProcesar = () => {
    if (!selectedMovimientoId || !canEditar) return;
    void procesarMutation.mutateAsync({ movimientoId: selectedMovimientoId }).then(() => setProcesarOpen(false));
  };

  const ejecutarAnular = () => {
    if (!selectedMovimientoId || !canEditar) return;
    void anularMutation
      .mutateAsync({ movimientoId: selectedMovimientoId, payload: { motivo: anularMotivo.trim() || null } })
      .then(() => {
        setAnularOpen(false);
        setAnularMotivo('');
      });
  };

  const movConfirmLabel = selectedCabecera?.numero_movimiento ?? '—';

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
        {tiposMovimiento.length > 0 && (
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
          >
            <option value="">Tipo de movimiento</option>
            {tiposMovimiento.map((t) => (
              <option key={t.tipo_movimiento_id} value={t.tipo_movimiento_id}>
                {t.nombre}
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
          <option value="borrador">Borrador</option>
          <option value="autorizado">Autorizado</option>
          <option value="procesado">Procesado</option>
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
            <Link to="/app/inv/movimientos/nuevo">Nuevo movimiento</Link>
          </Button>
        ) : (
          <Button className="ml-auto bg-brand-primary text-white opacity-50" disabled>
            Nuevo movimiento
          </Button>
        )}
      </div>
      {movimientosQuery.isLoading && <InvTableSkeleton columns={9} />}
      {movimientosQuery.error && !movimientosQuery.isLoading && (
        <p className="text-error bg-error/10 p-4 rounded-lg">
          {getErrorMessage(movimientosQuery.error).message}
        </p>
      )}
      {!movimientosQuery.isLoading && !movimientosQuery.error && (
        <div className="overflow-x-auto rounded-lg border border-border-base shadow">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-subtle">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">
                  Número
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">
                  Origen
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Destino</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-soft uppercase">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-soft uppercase">
                  Costo Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 text-text-soft opacity-70" />
                    <p className="text-sm font-medium text-text-soft">No hay movimientos.</p>
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.movimiento_id} className="hover:bg-overlay dark:hover:bg-overlay">
                    <td className="px-4 py-3 text-sm font-medium text-text-base">{row.numero_movimiento}</td>
                    <td className="px-4 py-3 text-sm text-text-base">
                      {tipoMovimientoNombre(row.tipo_movimiento_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-base">
                      {new Date(row.fecha_movimiento).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-base">{almacenNombre(row.almacen_origen_id)}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{almacenNombre(row.almacen_destino_id)}</td>
                    <td className="px-4 py-3 text-sm text-right text-text-base">
                      {fmtDecimal(row.total_cantidad)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-text-base">
                      {row.total_costo != null && row.total_costo !== ''
                        ? `${row.moneda ?? 'PEN'} ${fmtDecimal(row.total_costo)}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor(row.estado)}`}
                      >
                        {row.estado ?? 'borrador'}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-brand-primary hover:text-brand-primary/80"
                          title="Ver detalle"
                          onClick={() => abrirDetalle(row)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(row.estado === 'borrador' || !row.estado) && canEditar && (
                          <Button variant="ghost" size="icon" asChild title="Editar">
                            <Link to={toAppPath(`/inv/movimientos/${row.movimiento_id}/editar`)}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={detailOpen} onOpenChange={(open) => { if (!open) setDetailOpen(false); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de movimiento</DialogTitle>
          </DialogHeader>
          {conDetalleQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-brand-primary" />
            </div>
          ) : conDetalleQuery.error ? (
            <p className="text-error bg-error/10 p-4 rounded-lg">
              {getErrorMessage(conDetalleQuery.error).message}
            </p>
          ) : !selectedCabecera ? (
            <p className="text-text-soft">No se encontró el movimiento.</p>
          ) : (
            <div className="space-y-4 text-sm text-text-base">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAutorizarOpen(true)}
                  disabled={!canEditar || !puedeAutorizar || autorizarMutation.isPending}
                >
                  Autorizar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setProcesarOpen(true)}
                  disabled={!canEditar || !puedeProcesar || procesarMutation.isPending}
                >
                  Procesar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setAnularOpen(true)}
                  disabled={!canEditar || !puedeAnular || anularMutation.isPending}
                >
                  Anular
                </Button>
                {puedeEditarForm && selectedMovimientoId ? (
                  <Button variant="secondary" asChild>
                    <Link to={toAppPath(`/inv/movimientos/${selectedMovimientoId}/editar`)}>Editar cabecera y líneas</Link>
                  </Button>
                ) : null}
              </div>
              <div>
                <span className="font-semibold">Número:</span> {selectedCabecera.numero_movimiento ?? '-'}
              </div>
              <div>
                <span className="font-semibold">Fecha movimiento:</span>{' '}
                {selectedCabecera.fecha_movimiento ? new Date(selectedCabecera.fecha_movimiento).toLocaleString() : '-'}
              </div>
              <div>
                <span className="font-semibold">Fecha contable:</span>{' '}
                {selectedCabecera.fecha_contable ? new Date(selectedCabecera.fecha_contable).toLocaleDateString() : '-'}
              </div>
              <div>
                <span className="font-semibold">Tipo movimiento:</span>{' '}
                {selectedCabecera.tipo_movimiento_id ? tipoMovimientoNombre(selectedCabecera.tipo_movimiento_id) : '-'}
              </div>
              <div>
                <span className="font-semibold">Almacén origen:</span> {almacenNombre(selectedCabecera.almacen_origen_id)}
              </div>
              <div>
                <span className="font-semibold">Almacén destino:</span> {almacenNombre(selectedCabecera.almacen_destino_id)}
              </div>
              <div>
                <span className="font-semibold">Total ítems:</span> {selectedCabecera.total_items ?? '-'}
              </div>
              <div>
                <span className="font-semibold">Total cantidad:</span> {fmtDecimal(selectedCabecera.total_cantidad)}
              </div>
              <div>
                <span className="font-semibold">Total costo:</span>{' '}
                {selectedCabecera.total_costo != null && selectedCabecera.total_costo !== ''
                  ? `${selectedCabecera.moneda ?? 'PEN'} ${fmtDecimal(selectedCabecera.total_costo)}`
                  : '-'}
              </div>
              <div>
                <span className="font-semibold">Estado:</span> {selectedCabecera.estado ?? 'borrador'}
              </div>
              {selectedCabecera.observaciones ? (
                <div>
                  <span className="font-semibold">Observaciones:</span>
                  <div className="mt-1 whitespace-pre-wrap">{selectedCabecera.observaciones}</div>
                </div>
              ) : null}
              <div className="pt-2">
                <div className="text-sm font-semibold text-text-base mb-2">Líneas</div>
                {(detalleData?.detalles ?? []).length === 0 ? (
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
                            Cantidad
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-text-soft uppercase">
                            Costo U.
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-surface divide-y divide-border-base">
                        {(detalleData?.detalles ?? []).map((ln) => (
                          <tr key={ln.movimiento_detalle_id}>
                            <td className="px-3 py-2 text-sm text-text-base">{productoNombre(ln.producto_id)}</td>
                            <td className="px-3 py-2 text-sm text-right text-text-base">{ln.cantidad}</td>
                            <td className="px-3 py-2 text-sm text-right text-text-base">
                              {ln.costo_unitario ?? '-'}
                            </td>
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
        isOpen={autorizarOpen}
        onClose={() => setAutorizarOpen(false)}
        onConfirm={() => void ejecutarAutorizar()}
        title="Autorizar movimiento"
        message={`¿Autorizar el movimiento '${movConfirmLabel}'? Quedará listo para procesar y actualizar el stock.`}
        confirmText="Autorizar"
        cancelText="Cancelar"
        variant="danger"
        loading={autorizarMutation.isPending}
      />

      <ConfirmDialog
        isOpen={procesarOpen}
        onClose={() => setProcesarOpen(false)}
        onConfirm={() => void ejecutarProcesar()}
        title="Procesar movimiento"
        message={`¿Procesar el movimiento '${movConfirmLabel}'? Actualizará el stock según las líneas del movimiento.`}
        confirmText="Procesar"
        cancelText="Cancelar"
        variant="danger"
        loading={procesarMutation.isPending}
      />

      <ConfirmDialog
        isOpen={anularOpen}
        onClose={() => {
          setAnularOpen(false);
          setAnularMotivo('');
        }}
        onConfirm={() => void ejecutarAnular()}
        title="Anular movimiento"
        message={`¿Anular el movimiento '${movConfirmLabel}'? Podrá indicar un motivo opcional abajo.`}
        confirmText="Anular"
        cancelText="Cancelar"
        variant="danger"
        loading={anularMutation.isPending}
      >
        <div className="space-y-2">
          <Label>Motivo (opcional)</Label>
          <textarea
            value={anularMotivo}
            onChange={(e) => setAnularMotivo(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-border-base rounded-md dark:bg-subtle dark:text-text-base text-sm"
          />
        </div>
      </ConfirmDialog>
    </InvPageLayout>
  );
}
