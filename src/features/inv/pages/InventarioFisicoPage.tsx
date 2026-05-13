/**
 * Inventario Físico — Toma de inventario y ajuste de diferencias.
 * GET/POST /api/v1/inv/inventario-fisico
 *
 * Implementación inicial: listado y creación de cabeceras de inventario físico,
 * reutilizando los servicios existentes sin modificar contratos de API.
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, ClipboardList, Plus } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { InventarioFisico, InventarioFisicoCreate } from '../types/inv.types';
import { InvPageLayout } from '../components/InvPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useAlmacenes } from '../hooks/almacenes.hooks';
import {
  useAprobarInventarioFisico,
  useAnularInventarioFisico,
  useCreateInventarioFisico,
  useInventarioFisico,
  useInventariosFisicos,
} from '../hooks/inventario-fisico.hooks';
import { useInventariosFisicosDetalle } from '../hooks/inventario-fisico-detalle.hooks';
import { useTiposMovimiento } from '../hooks/tipos-movimiento.hooks';

const DEFAULT: InventarioFisicoCreate = {
  empresa_id: '',
  fecha_inventario: new Date().toISOString().substring(0, 10),
  almacen_id: '',
  tipo_inventario: 'total',
};

export default function InventarioFisicoPage() {
  const { can } = usePermissions();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [almacenFilter, setAlmacenFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<InventarioFisicoCreate>(DEFAULT);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aprobarOpen, setAprobarOpen] = useState(false);
  const [aprobarTipoMovimientoId, setAprobarTipoMovimientoId] = useState('');
  const [aprobarObs, setAprobarObs] = useState('');

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

  const inventariosQuery = useInventariosFisicos({
    empresa_id: empresaFilter || undefined,
    almacen_id: almacenFilter || undefined,
    estado: estadoFilter || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
    enabled: true,
  });
  const list = inventariosQuery.data ?? [];

  const createMutation = useCreateInventarioFisico();
  const anularMutation = useAnularInventarioFisico();
  const aprobarMutation = useAprobarInventarioFisico();
  const submitting = createMutation.isPending || anularMutation.isPending || aprobarMutation.isPending;

  const inventarioDetailQuery = useInventarioFisico(selectedId, { enabled: detailOpen && !!selectedId });
  const selected = inventarioDetailQuery.data ?? null;
  const empresaIdDetalle = selected?.empresa_id || empresaFilter || undefined;
  const detalleQuery = useInventariosFisicosDetalle({
    empresa_id: empresaIdDetalle,
    inventario_fisico_id: selectedId || undefined,
    enabled: detailOpen && !!selectedId,
  });

  const tiposMovimientoQuery = useTiposMovimiento({
    empresa_id: empresaFilter || undefined,
    solo_activos: true,
    enabled: aprobarOpen && !!empresaFilter,
  });
  const tiposAjuste = (tiposMovimientoQuery.data ?? []).filter((t) => t.clase_movimiento === 'ajuste');

  const almacenNombre = (id: string) =>
    almacenes.find((a) => a.almacen_id === id)?.nombre ?? id;

  const openCreate = () => {
    const empresaId = empresaFilter || (empresas[0]?.empresa_id ?? '');
    setForm({
      ...DEFAULT,
      empresa_id: empresaId,
      almacen_id: '',
      fecha_inventario: new Date().toISOString().substring(0, 10),
    });
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.almacen_id || !form.fecha_inventario || !form.tipo_inventario) {
      // Validaciones mínimas; el backend aplicará reglas adicionales
      return;
    }
    try {
      await createMutation.mutateAsync(form);
      setCreateOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const estadoChipColor = (estado?: string | null) => {
    switch (estado) {
      case 'en_proceso': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'finalizado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ajustado': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'anulado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <InvPageLayout
      title="Inventario Físico"
      description="Toma de inventario y ajuste de diferencias por almacén."
      action={
        <Button
          onClick={openCreate}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white"
          disabled={!empresas.length || !can('inv', 'crear')}
        >
          <Plus className="h-4 w-4 mr-2" /> Nueva toma
        </Button>
      }
    >
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {empresas.length > 0 && (
          <div>
            <Label className="mr-2">Empresa</Label>
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
            <Label className="mr-2">Almacén</Label>
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
        <div>
          <Label className="mr-2">Estado</Label>
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">Todos</option>
            <option value="en_proceso">En proceso</option>
            <option value="finalizado">Finalizado</option>
            <option value="ajustado">Ajustado</option>
            <option value="anulado">Anulado</option>
          </select>
        </div>
        <div>
          <Label className="mr-2">Fecha desde</Label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
        <div>
          <Label className="mr-2">Fecha hasta</Label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
      </div>
      {inventariosQuery.isLoading && (
        <div className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}
      {inventariosQuery.error && !inventariosQuery.isLoading && (
        <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {getErrorMessage(inventariosQuery.error).message}
        </p>
      )}
      {!inventariosQuery.isLoading && !inventariosQuery.error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Número
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Almacén
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Productos contados
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Valor diferencias
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    No hay tomas de inventario registradas.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr
                    key={row.inventario_fisico_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      setSelectedId(row.inventario_fisico_id);
                      setDetailOpen(true);
                    }}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {row.numero_inventario}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {new Date(row.fecha_inventario).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {almacenNombre(row.almacen_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.tipo_inventario}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                      {row.total_productos_contados ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                      {row.valor_diferencias
                        ? `${row.valor_diferencias.toFixed(2)}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${estadoChipColor(
                          row.estado
                        )}`}
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

          {inventarioDetailQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-brand-primary" />
            </div>
          ) : inventarioDetailQuery.error ? (
            <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              {getErrorMessage(inventarioDetailQuery.error).message}
            </p>
          ) : !selected ? (
            <p className="text-gray-500 dark:text-gray-400">No se encontró el inventario.</p>
          ) : (
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-200">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAprobarTipoMovimientoId(tiposAjuste[0]?.tipo_movimiento_id ?? '');
                    setAprobarObs('');
                    setAprobarOpen(true);
                  }}
                  disabled={!can('inv', 'editar') || selected.estado === 'anulado' || selected.estado === 'ajustado'}
                >
                  Aprobar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={async () => {
                    if (!can('inv', 'editar') || !selectedId) return;
                    const ok = window.confirm('¿Anular este inventario físico?');
                    if (!ok) return;
                    try {
                      await anularMutation.mutateAsync({ inventarioFisicoId: selectedId });
                    } catch (err) {
                      toast.error(getErrorMessage(err).message);
                    }
                  }}
                  disabled={!can('inv', 'editar') || selected.estado === 'anulado' || anularMutation.isPending}
                >
                  Anular
                </Button>
              </div>

              <div><span className="font-semibold">Número:</span> {selected.numero_inventario}</div>
              <div><span className="font-semibold">Fecha:</span> {new Date(selected.fecha_inventario).toLocaleDateString()}</div>
              <div><span className="font-semibold">Almacén:</span> {almacenNombre(selected.almacen_id)}</div>
              <div><span className="font-semibold">Tipo:</span> {selected.tipo_inventario}</div>
              <div><span className="font-semibold">Estado:</span> {selected.estado ?? 'en_proceso'}</div>
              {selected.descripcion && (
                <div>
                  <span className="font-semibold">Descripción:</span>
                  <div className="mt-1 whitespace-pre-wrap">{selected.descripcion}</div>
                </div>
              )}

              <div className="pt-2">
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Líneas</div>
                {detalleQuery.isLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader className="h-5 w-5 animate-spin text-brand-primary" />
                  </div>
                ) : detalleQuery.error ? (
                  <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    {getErrorMessage(detalleQuery.error).message}
                  </p>
                ) : (detalleQuery.data ?? []).length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No hay líneas registradas.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sistema</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contada</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {(detalleQuery.data ?? []).map((ln) => (
                          <tr key={ln.inventario_fisico_detalle_id}>
                            <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{ln.producto_id}</td>
                            <td className="px-3 py-2 text-sm text-right text-gray-700 dark:text-gray-300">{ln.cantidad_sistema}</td>
                            <td className="px-3 py-2 text-sm text-right text-gray-700 dark:text-gray-300">{ln.cantidad_contada ?? '-'}</td>
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

      <Dialog open={aprobarOpen} onOpenChange={setAprobarOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Aprobar inventario físico</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedId) return;
              if (!aprobarTipoMovimientoId) {
                toast.error('Selecciona un tipo de movimiento (ajuste).');
                return;
              }
              try {
                await aprobarMutation.mutateAsync({
                  inventarioFisicoId: selectedId,
                  payload: { tipo_movimiento_id: aprobarTipoMovimientoId, observaciones: aprobarObs || null },
                });
                setAprobarOpen(false);
              } catch (err) {
                toast.error(getErrorMessage(err).message);
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label>Tipo de movimiento (ajuste) *</Label>
              <select
                value={aprobarTipoMovimientoId}
                onChange={(e) => setAprobarTipoMovimientoId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
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
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAprobarOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={aprobarMutation.isPending} className="bg-brand-primary hover:bg-brand-primary-hover">
                Aprobar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva toma de inventario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Empresa *</Label>
              <select
                value={form.empresa_id}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({ ...prev, empresa_id: value }));
                  setEmpresaFilter(value);
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                required
              >
                <option value="">Seleccionar</option>
                {empresas.map((e) => (
                  <option key={e.empresa_id} value={e.empresa_id}>
                    {e.razon_social}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Almacén *</Label>
              <select
                value={form.almacen_id}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, almacen_id: e.target.value }))
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                required
              >
                <option value="">Seleccionar</option>
                {almacenes.map((a) => (
                  <option key={a.almacen_id} value={a.almacen_id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Fecha de inventario *</Label>
              <input
                type="date"
                value={form.fecha_inventario}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fecha_inventario: e.target.value }))
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                required
              />
            </div>
            <div>
              <Label>Tipo de inventario *</Label>
              <select
                value={form.tipo_inventario}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tipo_inventario: e.target.value }))
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="total">Total</option>
                <option value="ciclico">Cíclico</option>
                <option value="selectivo">Selectivo</option>
              </select>
            </div>
            <div>
              <Label>Descripción</Label>
              <textarea
                value={form.descripcion ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    descripcion: e.target.value || undefined,
                  }))
                }
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-brand-primary hover:bg-brand-primary-hover"
              >
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </InvPageLayout>
  );
}

