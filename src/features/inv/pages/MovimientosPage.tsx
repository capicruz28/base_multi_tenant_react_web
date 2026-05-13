/**
 * Movimientos de Inventario — Registrar entradas, salidas, transferencias entre almacenes.
 * GET/POST /api/v1/inv/movimientos
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, ArrowLeftRight, Eye } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Movimiento } from '../types/inv.types';
import { InvPageLayout } from '../components/InvPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useAlmacenes } from '../hooks/almacenes.hooks';
import { useTiposMovimiento } from '../hooks/tipos-movimiento.hooks';
import { useMovimientos, useMovimiento, useAutorizarMovimiento, useProcesarMovimiento, useAnularMovimiento } from '../hooks/movimientos.hooks';
import { useMovimientosDetalle } from '../hooks/movimientos-detalle.hooks';

export default function MovimientosPage() {
  const { can } = usePermissions();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [almacenFilter, setAlmacenFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMovimientoId, setSelectedMovimientoId] = useState<string | null>(null);

  const loadEmpresas = useCallback(async () => {
    try {
      const data = await empresaService.list({ solo_activos: true });
      setEmpresas(data);
      if (data.length === 1 && !empresaFilter) setEmpresaFilter(data[0].empresa_id);
    } catch {
      setEmpresas([]);
    }
  }, [empresaFilter]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  
  const almacenesQuery = useAlmacenes({ empresa_id: empresaFilter || undefined, solo_activos: true, enabled: !!empresaFilter });
  const almacenes = almacenesQuery.data ?? [];
  const tiposMovimientoQuery = useTiposMovimiento({ empresa_id: empresaFilter || undefined, solo_activos: true, enabled: !!empresaFilter });
  const tiposMovimiento = tiposMovimientoQuery.data ?? [];

  const movimientosQuery = useMovimientos({
    empresa_id: empresaFilter || undefined,
    almacen_id: almacenFilter || undefined,
    tipo_movimiento_id: tipoFilter || undefined,
    estado: estadoFilter || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
    enabled: true,
  });
  const list = movimientosQuery.data ?? [];

  const tipoMovimientoNombre = (id: string) => tiposMovimiento.find((t) => t.tipo_movimiento_id === id)?.nombre ?? id;
  const almacenNombre = (id: string | null | undefined) => id ? almacenes.find((a) => a.almacen_id === id)?.nombre ?? id : '-';
  const estadoColor = (estado: string | null | undefined) => {
    switch (estado) {
      case 'procesado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'autorizado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'borrador': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'anulado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const abrirDetalle = (mov: Movimiento) => {
    setSelectedMovimientoId(mov.movimiento_id);
    setDetailOpen(true);
  };

  const movimientoDetailQuery = useMovimiento(selectedMovimientoId, { enabled: detailOpen });
  const selectedMovimiento = movimientoDetailQuery.data ?? null;
  const movimientoEmpresaId = selectedMovimiento?.empresa_id || empresaFilter || undefined;
  const movimientoDetalleQuery = useMovimientosDetalle({
    empresa_id: movimientoEmpresaId,
    movimiento_id: selectedMovimientoId || undefined,
    enabled: detailOpen && !!selectedMovimientoId,
  });

  const autorizarMutation = useAutorizarMovimiento();
  const procesarMutation = useProcesarMovimiento();
  const anularMutation = useAnularMovimiento();

  const canEditar = can('inv', 'editar');

  const puedeAutorizar = selectedMovimiento?.estado === 'borrador' || !selectedMovimiento?.estado;
  const puedeProcesar = selectedMovimiento?.estado === 'autorizado';
  const puedeAnular = selectedMovimiento?.estado !== 'procesado' && selectedMovimiento?.estado !== 'anulado';

  const autorizar = async () => {
    if (!selectedMovimientoId || !canEditar) return;
    try {
      await autorizarMutation.mutateAsync({ movimientoId: selectedMovimientoId });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const procesar = async () => {
    if (!selectedMovimientoId || !canEditar) return;
    const ok = window.confirm('¿Procesar este movimiento? Esto actualizará el stock.');
    if (!ok) return;
    try {
      await procesarMutation.mutateAsync({ movimientoId: selectedMovimientoId });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const anular = async () => {
    if (!selectedMovimientoId || !canEditar) return;
    const motivo = window.prompt('Motivo de anulación (opcional):') ?? undefined;
    const ok = window.confirm('¿Anular este movimiento?');
    if (!ok) return;
    try {
      await anularMutation.mutateAsync({ movimientoId: selectedMovimientoId, payload: { motivo: motivo || null } });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  return (
    <InvPageLayout
      title="Movimientos de Inventario"
      description="Registrar entradas, salidas, transferencias entre almacenes. Kardex valorizado automático."
    >
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {empresas.length > 0 && (
          <div>
            <label className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label>
            <select
              value={empresaFilter}
              onChange={(e) => setEmpresaFilter(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todas</option>
              {empresas.map((e) => (
                <option key={e.empresa_id} value={e.empresa_id}>
                  {e.razon_social}
                </option>
              ))}
            </select>
          </div>
        )}
        {almacenes.length > 0 && (
          <div>
            <label className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Almacén</label>
            <select
              value={almacenFilter}
              onChange={(e) => setAlmacenFilter(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todos</option>
              {almacenes.map((a) => (
                <option key={a.almacen_id} value={a.almacen_id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
        {tiposMovimiento.length > 0 && (
          <div>
            <label className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de movimiento</label>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todos</option>
              {tiposMovimiento.map((t) => (
                <option key={t.tipo_movimiento_id} value={t.tipo_movimiento_id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">Todos</option>
            <option value="borrador">Borrador</option>
            <option value="autorizado">Autorizado</option>
            <option value="procesado">Procesado</option>
            <option value="anulado">Anulado</option>
          </select>
        </div>
        <div>
          <label className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha desde</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
        <div>
          <label className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha hasta</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
      </div>
      {movimientosQuery.isLoading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {movimientosQuery.error && !movimientosQuery.isLoading && (
        <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {getErrorMessage(movimientosQuery.error).message}
        </p>
      )}
      {!movimientosQuery.isLoading && !movimientosQuery.error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Almacén Origen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Almacén Destino</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cantidad</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Costo Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><ArrowLeftRight className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay movimientos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.movimiento_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_movimiento}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{tipoMovimientoNombre(row.tipo_movimiento_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{new Date(row.fecha_movimiento).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{almacenNombre(row.almacen_origen_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{almacenNombre(row.almacen_destino_id)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.total_cantidad?.toFixed(2) ?? '0.00'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.total_costo ? `${row.moneda ?? 'PEN'} ${row.total_costo.toFixed(2)}` : '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${estadoColor(row.estado)}`}>
                        {row.estado ?? 'borrador'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-brand-primary hover:text-brand-primary/80"
                        title="Ver detalle"
                        onClick={() => abrirDetalle(row)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
          {movimientoDetailQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-brand-primary" />
            </div>
          ) : movimientoDetailQuery.error ? (
            <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              {getErrorMessage(movimientoDetailQuery.error).message}
            </p>
          ) : !selectedMovimiento ? (
            <p className="text-gray-500 dark:text-gray-400">No se encontró el movimiento.</p>
          ) : (
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-200">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void autorizar()}
                  disabled={!canEditar || !puedeAutorizar || autorizarMutation.isPending}
                >
                  Autorizar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void procesar()}
                  disabled={!canEditar || !puedeProcesar || procesarMutation.isPending}
                >
                  Procesar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void anular()}
                  disabled={!canEditar || !puedeAnular || anularMutation.isPending}
                >
                  Anular
                </Button>
              </div>
              <div><span className="font-semibold">Número:</span> {selectedMovimiento?.numero_movimiento ?? '-'}</div>
              <div>
                <span className="font-semibold">Fecha movimiento:</span>{' '}
                {selectedMovimiento?.fecha_movimiento
                  ? new Date(selectedMovimiento.fecha_movimiento).toLocaleString()
                  : '-'}
              </div>
              <div>
                <span className="font-semibold">Fecha contable:</span>{' '}
                {selectedMovimiento?.fecha_contable
                  ? new Date(selectedMovimiento.fecha_contable).toLocaleDateString()
                  : '-'}
              </div>
              <div><span className="font-semibold">Tipo movimiento:</span> {selectedMovimiento?.tipo_movimiento_id ? tipoMovimientoNombre(selectedMovimiento.tipo_movimiento_id) : '-'}</div>
              <div><span className="font-semibold">Almacén origen:</span> {almacenNombre(selectedMovimiento?.almacen_origen_id)}</div>
              <div><span className="font-semibold">Almacén destino:</span> {almacenNombre(selectedMovimiento?.almacen_destino_id)}</div>
              <div><span className="font-semibold">Total ítems:</span> {selectedMovimiento.total_items ?? '-'}</div>
              <div><span className="font-semibold">Total cantidad:</span> {selectedMovimiento.total_cantidad?.toFixed(2) ?? '-'}</div>
              <div><span className="font-semibold">Total costo:</span> {selectedMovimiento.total_costo ? `${selectedMovimiento.moneda ?? 'PEN'} ${selectedMovimiento.total_costo.toFixed(2)}` : '-'}</div>
              <div><span className="font-semibold">Estado:</span> {selectedMovimiento.estado ?? 'borrador'}</div>
              {selectedMovimiento.observaciones && (
                <div>
                  <span className="font-semibold">Observaciones:</span>
                  <div className="mt-1 whitespace-pre-wrap">{selectedMovimiento.observaciones}</div>
                </div>
              )}

              <div className="pt-2">
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Líneas</div>
                {movimientoDetalleQuery.isLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader className="h-5 w-5 animate-spin text-brand-primary" />
                  </div>
                ) : movimientoDetalleQuery.error ? (
                  <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    {getErrorMessage(movimientoDetalleQuery.error).message}
                  </p>
                ) : (movimientoDetalleQuery.data ?? []).length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No hay líneas registradas.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cantidad</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Costo U.</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {(movimientoDetalleQuery.data ?? []).map((ln) => (
                          <tr key={ln.movimiento_detalle_id}>
                            <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{ln.producto_id}</td>
                            <td className="px-3 py-2 text-sm text-right text-gray-700 dark:text-gray-300">{ln.cantidad}</td>
                            <td className="px-3 py-2 text-sm text-right text-gray-700 dark:text-gray-300">{ln.costo_unitario ?? '-'}</td>
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
    </InvPageLayout>
  );
}
