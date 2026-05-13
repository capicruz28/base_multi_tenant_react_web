/**
 * Plan de Producción Detalle MPS — Listado y gestión. GET/POST/PUT /api/v1/mps/plan-produccion-detalle
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, List, Plus, Pencil } from 'lucide-react';
import { planProduccionService } from '../services/mps.service';
import { planProduccionDetalleService } from '../services/mps.service';
import { productoService, unidadMedidaService } from '@/features/inv/services/inv.service';
import type { PlanProduccion } from '../types/mps.types';
import type { Producto, UnidadMedida } from '@/features/inv/types/inv.types';
import type {
  PlanProduccionDetalle,
  PlanProduccionDetalleCreate,
  PlanProduccionDetalleUpdate,
} from '../types/mps.types';
import { MpsPageLayout } from '../components/MpsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const DEFAULT: PlanProduccionDetalleCreate = {
  plan_produccion_id: '',
  producto_id: '',
  fecha_inicio: '',
  fecha_fin: '',
  cantidad_planificada: 0,
  unidad_medida_id: '',
};

export default function PlanProduccionDetallePage() {
  const [planes, setPlanes] = useState<PlanProduccion[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [list, setList] = useState<PlanProduccionDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<string>('');
  const [productoFilter, setProductoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PlanProduccionDetalle | null>(null);
  const [form, setForm] = useState<PlanProduccionDetalleCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<PlanProduccionDetalleUpdate>({});
  const [submitting, setSubmitting] = useState(false);

  const loadPlanes = useCallback(async () => {
    try {
      const data = await planProduccionService.list({});
      setPlanes(data);
      if (data.length === 1 && !planFilter) setPlanFilter(data[0].plan_produccion_id);
    } catch {
      setPlanes([]);
    }
  }, [planFilter]);

  const loadProductos = useCallback(async () => {
    try {
      const data = await productoService.list({ solo_activos: true });
      setProductos(Array.isArray(data) ? data : []);
    } catch {
      setProductos([]);
    }
  }, []);

  const loadUnidades = useCallback(async () => {
    try {
      const data = await unidadMedidaService.list({ solo_activos: true });
      setUnidadesMedida(Array.isArray(data) ? data : []);
    } catch {
      setUnidadesMedida([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { plan_produccion_id?: string; producto_id?: string } = {};
      if (planFilter) params.plan_produccion_id = planFilter;
      if (productoFilter) params.producto_id = productoFilter;
      const data = await planProduccionDetalleService.list(
        Object.keys(params).length ? params : undefined
      );
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [planFilter, productoFilter]);

  useEffect(() => { loadPlanes(); }, [loadPlanes]);
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadUnidades(); }, [loadUnidades]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      plan_produccion_id: (planFilter || planes[0]?.plan_produccion_id) ?? '',
      producto_id: productos[0]?.producto_id ?? '',
      unidad_medida_id: unidadesMedida[0]?.unidad_medida_id ?? '',
      fecha_inicio: new Date().toISOString().slice(0, 10),
      fecha_fin: new Date().toISOString().slice(0, 10),
    });
    setCreateOpen(true);
  };

  const openEdit = (row: PlanProduccionDetalle) => {
    setEditing(row);
    setEditForm({
      producto_id: row.producto_id,
      fecha_inicio: row.fecha_inicio,
      fecha_fin: row.fecha_fin,
      pronostico_demanda: row.pronostico_demanda ?? undefined,
      pedidos_firmes: row.pedidos_firmes ?? undefined,
      stock_inicial: row.stock_inicial ?? undefined,
      stock_seguridad: row.stock_seguridad ?? undefined,
      cantidad_planificada: row.cantidad_planificada,
      cantidad_producida: row.cantidad_producida ?? undefined,
      unidad_medida_id: row.unidad_medida_id,
      capacidad_disponible: row.capacidad_disponible ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await planProduccionDetalleService.create(form);
      toast.success('Línea de detalle creada.');
      setCreateOpen(false);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await planProduccionDetalleService.update(editing.plan_detalle_id, editForm);
      toast.success('Línea de detalle actualizada.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';
  const selectCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

  const getPlanNombre = (id: string) =>
    planes.find((p) => p.plan_produccion_id === id)?.codigo_plan ?? id;
  const getProductoNombre = (id: string) =>
    productos.find((p) => p.producto_id === id)?.codigo_sku ?? id;

  return (
    <MpsPageLayout
      title="Detalle del Plan de Producción"
      description="Líneas por producto y periodo: cantidades planificadas y uso de capacidad."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!planes.length || !productos.length || !unidadesMedida.length}>
          <Plus className="h-4 w-4 mr-2" /> Nueva línea
        </Button>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        {planes.length > 0 && (
          <div>
            <Label className="mr-2">Plan de producción *</Label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Seleccionar plan</option>
              {planes.map((p) => (
                <option key={p.plan_produccion_id} value={p.plan_produccion_id}>
                  {p.codigo_plan} – {p.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Producto</Label>
          <select
            value={productoFilter}
            onChange={(e) => setProductoFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">Todos</option>
            {productos.map((p) => (
              <option key={p.producto_id} value={p.producto_id}>
                {p.codigo_sku} – {p.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
      {!planFilter && (
        <p className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mb-4">
          Seleccione un plan de producción para ver el detalle.
        </p>
      )}
      {loading && planFilter && (
        <div className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}
      {error && !loading && (
        <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {error}
        </p>
      )}
      {!loading && !error && planFilter && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Período</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pronóst. demanda</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cant. planif.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">% uso cap.</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <List className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    No hay líneas de detalle.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.plan_detalle_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getPlanNombre(row.plan_produccion_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getProductoNombre(row.producto_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_inicio} — {row.fecha_fin}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.pronostico_demanda ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.cantidad_planificada}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.porcentaje_uso_capacidad != null ? `${row.porcentaje_uso_capacidad.toFixed(1)}%` : '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80"><Pencil className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva línea de detalle</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Plan de producción *</Label><select value={form.plan_produccion_id} onChange={(e) => setForm((p) => ({ ...p, plan_produccion_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{planes.map((p) => <option key={p.plan_produccion_id} value={p.plan_produccion_id}>{p.codigo_plan} – {p.nombre}</option>)}</select></div>
              <div><Label>Producto *</Label><select value={form.producto_id} onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} – {p.nombre}</option>)}</select></div>
              <div><Label>Fecha inicio *</Label><input type="date" value={form.fecha_inicio} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha fin *</Label><input type="date" value={form.fecha_fin} onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Pronóstico demanda</Label><input type="number" step="0.0001" min={0} value={form.pronostico_demanda ?? ''} onChange={(e) => setForm((p) => ({ ...p, pronostico_demanda: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Pedidos firmes</Label><input type="number" step="0.0001" min={0} value={form.pedidos_firmes ?? ''} onChange={(e) => setForm((p) => ({ ...p, pedidos_firmes: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Stock inicial</Label><input type="number" step="0.0001" min={0} value={form.stock_inicial ?? ''} onChange={(e) => setForm((p) => ({ ...p, stock_inicial: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Stock seguridad</Label><input type="number" step="0.0001" min={0} value={form.stock_seguridad ?? ''} onChange={(e) => setForm((p) => ({ ...p, stock_seguridad: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Cantidad planificada *</Label><input type="number" step="0.0001" min={0} value={form.cantidad_planificada || ''} onChange={(e) => setForm((p) => ({ ...p, cantidad_planificada: parseFloat(e.target.value) || 0 }))} className={inputCls} required /></div>
              <div><Label>Unidad medida *</Label><select value={form.unidad_medida_id} onChange={(e) => setForm((p) => ({ ...p, unidad_medida_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{unidadesMedida.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.codigo}</option>)}</select></div>
              <div><Label>Capacidad disponible</Label><input type="number" step="0.0001" min={0} value={form.capacidad_disponible ?? ''} onChange={(e) => setForm((p) => ({ ...p, capacidad_disponible: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar línea de detalle</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Producto *</Label><select value={editForm.producto_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, producto_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} – {p.nombre}</option>)}</select></div>
              <div><Label>Fecha inicio *</Label><input type="date" value={editForm.fecha_inicio ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_inicio: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha fin *</Label><input type="date" value={editForm.fecha_fin ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_fin: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Cantidad planificada *</Label><input type="number" step="0.0001" min={0} value={editForm.cantidad_planificada ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cantidad_planificada: parseFloat(e.target.value) || 0 }))} className={inputCls} required /></div>
              <div><Label>Cantidad producida</Label><input type="number" step="0.0001" min={0} value={editForm.cantidad_producida ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cantidad_producida: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Capacidad disponible</Label><input type="number" step="0.0001" min={0} value={editForm.capacidad_disponible ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, capacidad_disponible: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MpsPageLayout>
  );
}
