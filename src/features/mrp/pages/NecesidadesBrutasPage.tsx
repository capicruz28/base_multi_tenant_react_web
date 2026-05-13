/**
 * Necesidades Brutas MRP — Listado y gestión. GET/POST/PUT /api/v1/mrp/necesidades-brutas
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, ClipboardList, Plus, Pencil } from 'lucide-react';
import { planMaestroService } from '../services/mrp.service';
import { necesidadesBrutasService } from '../services/mrp.service';
import { productoService, unidadMedidaService } from '@/features/inv/services/inv.service';
import type { PlanMaestro } from '../types/mrp.types';
import type { Producto, UnidadMedida } from '@/features/inv/types/inv.types';
import type { NecesidadBruta, NecesidadBrutaCreate, NecesidadBrutaUpdate } from '../types/mrp.types';
import { MrpPageLayout } from '../components/MrpPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ORIGENES = ['pedido_venta', 'pronostico', 'stock_seguridad', 'orden_produccion'] as const;

const DEFAULT: NecesidadBrutaCreate = {
  plan_maestro_id: '',
  producto_id: '',
  fecha_requerida: '',
  cantidad_requerida: 0,
  unidad_medida_id: '',
  origen: 'pedido_venta',
  prioridad: 3,
};

export default function NecesidadesBrutasPage() {
  const [planes, setPlanes] = useState<PlanMaestro[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [list, setList] = useState<NecesidadBruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<string>('');
  const [origenFilter, setOrigenFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<NecesidadBruta | null>(null);
  const [form, setForm] = useState<NecesidadBrutaCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<NecesidadBrutaUpdate>({});
  const [submitting, setSubmitting] = useState(false);

  const loadPlanes = useCallback(async () => {
    try {
      const data = await planMaestroService.list({});
      setPlanes(data);
      if (data.length === 1 && !planFilter) setPlanFilter(data[0].plan_maestro_id);
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
      const params: { plan_maestro_id?: string; origen?: string } = {};
      if (planFilter) params.plan_maestro_id = planFilter;
      if (origenFilter) params.origen = origenFilter;
      const data = await necesidadesBrutasService.list(
        Object.keys(params).length ? params : undefined
      );
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [planFilter, origenFilter]);

  useEffect(() => { loadPlanes(); }, [loadPlanes]);
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadUnidades(); }, [loadUnidades]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      plan_maestro_id: (planFilter || planes[0]?.plan_maestro_id) ?? '',
      producto_id: productos[0]?.producto_id ?? '',
      unidad_medida_id: unidadesMedida[0]?.unidad_medida_id ?? '',
      fecha_requerida: new Date().toISOString().slice(0, 10),
    });
    setCreateOpen(true);
  };

  const openEdit = (row: NecesidadBruta) => {
    setEditing(row);
    setEditForm({
      producto_id: row.producto_id,
      fecha_requerida: row.fecha_requerida,
      cantidad_requerida: row.cantidad_requerida,
      unidad_medida_id: row.unidad_medida_id,
      origen: row.origen as NecesidadBrutaCreate['origen'],
      documento_origen_numero: row.documento_origen_numero ?? undefined,
      prioridad: row.prioridad ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await necesidadesBrutasService.create(form);
      toast.success('Necesidad bruta creada.');
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
      await necesidadesBrutasService.update(editing.necesidad_id, editForm);
      toast.success('Necesidad bruta actualizada.');
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

  const getPlanNombre = (id: string) => planes.find((p) => p.plan_maestro_id === id)?.nombre ?? id;
  const getProductoNombre = (id: string) =>
    productos.find((p) => p.producto_id === id)?.codigo_sku ?? id;

  return (
    <MrpPageLayout
      title="Necesidades Brutas"
      description="Demanda de productos por plan maestro (pedidos, pronóstico, stock seguridad)."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!planes.length || !productos.length || !unidadesMedida.length}>
          <Plus className="h-4 w-4 mr-2" /> Nueva necesidad
        </Button>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        {planes.length > 0 && (
          <div>
            <Label className="mr-2">Plan maestro</Label>
            <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Todos</option>
              {planes.map((p) => <option key={p.plan_maestro_id} value={p.plan_maestro_id}>{p.codigo_plan} – {p.nombre}</option>)}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Origen</Label>
          <select value={origenFilter} onChange={(e) => setOrigenFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ORIGENES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !loading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha req.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cantidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Origen</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay necesidades brutas.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.necesidad_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getPlanNombre(row.plan_maestro_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getProductoNombre(row.producto_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_requerida}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.cantidad_requerida}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.origen}</td>
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
          <DialogHeader><DialogTitle>Nueva necesidad bruta</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Plan maestro *</Label><select value={form.plan_maestro_id} onChange={(e) => setForm((p) => ({ ...p, plan_maestro_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{planes.map((p) => <option key={p.plan_maestro_id} value={p.plan_maestro_id}>{p.codigo_plan} – {p.nombre}</option>)}</select></div>
              <div><Label>Producto *</Label><select value={form.producto_id} onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{productos.map((pr) => <option key={pr.producto_id} value={pr.producto_id}>{pr.codigo_sku} – {pr.nombre}</option>)}</select></div>
              <div><Label>Fecha requerida *</Label><input type="date" value={form.fecha_requerida} onChange={(e) => setForm((p) => ({ ...p, fecha_requerida: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Cantidad requerida *</Label><input type="number" step="0.0001" min={0} value={form.cantidad_requerida || ''} onChange={(e) => setForm((p) => ({ ...p, cantidad_requerida: parseFloat(e.target.value) || 0 }))} className={inputCls} required /></div>
              <div><Label>Unidad medida *</Label><select value={form.unidad_medida_id} onChange={(e) => setForm((p) => ({ ...p, unidad_medida_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{unidadesMedida.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.codigo}</option>)}</select></div>
              <div><Label>Origen *</Label><select value={form.origen} onChange={(e) => setForm((p) => ({ ...p, origen: e.target.value as NecesidadBrutaCreate['origen'] }))} className={selectCls} required>{ORIGENES.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
              <div><Label>Doc. origen número</Label><input type="text" value={form.documento_origen_numero ?? ''} onChange={(e) => setForm((p) => ({ ...p, documento_origen_numero: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Prioridad</Label><input type="number" min={1} value={form.prioridad ?? ''} onChange={(e) => setForm((p) => ({ ...p, prioridad: e.target.value ? parseInt(e.target.value, 10) : undefined }))} className={inputCls} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar necesidad bruta</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Producto *</Label><select value={editForm.producto_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, producto_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{productos.map((pr) => <option key={pr.producto_id} value={pr.producto_id}>{pr.codigo_sku} – {pr.nombre}</option>)}</select></div>
              <div><Label>Fecha requerida *</Label><input type="date" value={editForm.fecha_requerida ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_requerida: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Cantidad *</Label><input type="number" step="0.0001" min={0} value={editForm.cantidad_requerida ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cantidad_requerida: parseFloat(e.target.value) || 0 }))} className={inputCls} required /></div>
              <div><Label>Unidad medida *</Label><select value={editForm.unidad_medida_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, unidad_medida_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{unidadesMedida.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.codigo}</option>)}</select></div>
              <div><Label>Origen</Label><select value={editForm.origen ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, origen: e.target.value as NecesidadBrutaCreate['origen'] }))} className={selectCls}>{ORIGENES.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
              <div><Label>Prioridad</Label><input type="number" min={1} value={editForm.prioridad ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, prioridad: e.target.value ? parseInt(e.target.value, 10) : undefined }))} className={inputCls} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MrpPageLayout>
  );
}
