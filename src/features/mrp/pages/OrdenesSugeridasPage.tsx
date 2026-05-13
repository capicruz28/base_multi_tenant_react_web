/**
 * Órdenes Sugeridas MRP — Listado y gestión. GET/POST/PUT /api/v1/mrp/ordenes-sugeridas
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, ShoppingCart, Plus, Pencil } from 'lucide-react';
import { planMaestroService } from '../services/mrp.service';
import { ordenesSugeridasService } from '../services/mrp.service';
import { productoService, unidadMedidaService } from '@/features/inv/services/inv.service';
import { proveedorService } from '@/features/pur/services/pur.service';
import type { PlanMaestro } from '../types/mrp.types';
import type { Producto, UnidadMedida } from '@/features/inv/types/inv.types';
import type { Proveedor } from '@/features/pur/types/pur.types';
import type { OrdenSugerida, OrdenSugeridaCreate, OrdenSugeridaUpdate } from '../types/mrp.types';
import { MrpPageLayout } from '../components/MrpPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_ORDEN = ['compra', 'produccion', 'transferencia'] as const;
const ESTADOS_ORDEN = ['sugerida', 'aprobada', 'convertida', 'rechazada'] as const;

const DEFAULT: OrdenSugeridaCreate = {
  plan_maestro_id: '',
  producto_id: '',
  tipo_orden: 'compra',
  cantidad_sugerida: 0,
  unidad_medida_id: '',
  fecha_requerida: '',
  fecha_orden_sugerida: '',
  estado: 'sugerida',
};

export default function OrdenesSugeridasPage() {
  const [planes, setPlanes] = useState<PlanMaestro[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [list, setList] = useState<OrdenSugerida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<OrdenSugerida | null>(null);
  const [form, setForm] = useState<OrdenSugeridaCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<OrdenSugeridaUpdate>({});
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

  const loadProveedores = useCallback(async () => {
    try {
      const data = await proveedorService.list({ solo_activos: true });
      setProveedores(Array.isArray(data) ? data : []);
    } catch {
      setProveedores([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { plan_maestro_id?: string; estado?: string; tipo_orden?: string } = {};
      if (planFilter) params.plan_maestro_id = planFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (tipoFilter) params.tipo_orden = tipoFilter;
      const data = await ordenesSugeridasService.list(
        Object.keys(params).length ? params : undefined
      );
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [planFilter, estadoFilter, tipoFilter]);

  useEffect(() => { loadPlanes(); }, [loadPlanes]);
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadUnidades(); }, [loadUnidades]);
  useEffect(() => { loadProveedores(); }, [loadProveedores]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      plan_maestro_id: (planFilter || planes[0]?.plan_maestro_id) ?? '',
      producto_id: productos[0]?.producto_id ?? '',
      unidad_medida_id: unidadesMedida[0]?.unidad_medida_id ?? '',
      fecha_requerida: new Date().toISOString().slice(0, 10),
      fecha_orden_sugerida: new Date().toISOString().slice(0, 10),
    });
    setCreateOpen(true);
  };

  const openEdit = (row: OrdenSugerida) => {
    setEditing(row);
    setEditForm({
      tipo_orden: row.tipo_orden as OrdenSugeridaCreate['tipo_orden'],
      cantidad_sugerida: row.cantidad_sugerida,
      unidad_medida_id: row.unidad_medida_id,
      fecha_requerida: row.fecha_requerida,
      fecha_orden_sugerida: row.fecha_orden_sugerida,
      proveedor_sugerido_id: row.proveedor_sugerido_id ?? undefined,
      lead_time_dias: row.lead_time_dias ?? undefined,
      estado: row.estado ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ordenesSugeridasService.create(form);
      toast.success('Orden sugerida creada.');
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
      await ordenesSugeridasService.update(editing.orden_sugerida_id, editForm);
      toast.success('Orden sugerida actualizada.');
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

  const getPlanNombre = (id: string) => planes.find((p) => p.plan_maestro_id === id)?.codigo_plan ?? id;
  const getProductoNombre = (id: string) =>
    productos.find((p) => p.producto_id === id)?.codigo_sku ?? id;
  const getProveedorNombre = (id: string) =>
    proveedores.find((p) => p.proveedor_id === id)?.razon_social ?? id;

  return (
    <MrpPageLayout
      title="Órdenes Sugeridas"
      description="Recomendaciones de compra o producción para cubrir necesidades."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!planes.length || !productos.length || !unidadesMedida.length}>
          <Plus className="h-4 w-4 mr-2" /> Nueva orden sugerida
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
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ESTADOS_ORDEN.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Tipo</Label>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {TIPOS_ORDEN.map((t) => <option key={t} value={t}>{t}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cantidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha req.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Proveedor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay órdenes sugeridas.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.orden_sugerida_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getPlanNombre(row.plan_maestro_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getProductoNombre(row.producto_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_orden}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.cantidad_sugerida}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_requerida}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.proveedor_sugerido_id ? getProveedorNombre(row.proveedor_sugerido_id) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '—'}</td>
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
          <DialogHeader><DialogTitle>Nueva orden sugerida</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Plan maestro *</Label><select value={form.plan_maestro_id} onChange={(e) => setForm((p) => ({ ...p, plan_maestro_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{planes.map((p) => <option key={p.plan_maestro_id} value={p.plan_maestro_id}>{p.codigo_plan} – {p.nombre}</option>)}</select></div>
              <div><Label>Producto *</Label><select value={form.producto_id} onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{productos.map((pr) => <option key={pr.producto_id} value={pr.producto_id}>{pr.codigo_sku} – {pr.nombre}</option>)}</select></div>
              <div><Label>Tipo orden *</Label><select value={form.tipo_orden} onChange={(e) => setForm((p) => ({ ...p, tipo_orden: e.target.value as OrdenSugeridaCreate['tipo_orden'] }))} className={selectCls} required>{TIPOS_ORDEN.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Cantidad sugerida *</Label><input type="number" step="0.0001" min={0} value={form.cantidad_sugerida || ''} onChange={(e) => setForm((p) => ({ ...p, cantidad_sugerida: parseFloat(e.target.value) || 0 }))} className={inputCls} required /></div>
              <div><Label>Unidad medida *</Label><select value={form.unidad_medida_id} onChange={(e) => setForm((p) => ({ ...p, unidad_medida_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{unidadesMedida.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.codigo}</option>)}</select></div>
              <div><Label>Fecha requerida *</Label><input type="date" value={form.fecha_requerida} onChange={(e) => setForm((p) => ({ ...p, fecha_requerida: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha orden sugerida *</Label><input type="date" value={form.fecha_orden_sugerida} onChange={(e) => setForm((p) => ({ ...p, fecha_orden_sugerida: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Proveedor sugerido</Label><select value={form.proveedor_sugerido_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, proveedor_sugerido_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{proveedores.map((pr) => <option key={pr.proveedor_id} value={pr.proveedor_id}>{pr.razon_social}</option>)}</select></div>
              <div><Label>Lead time (días)</Label><input type="number" min={0} value={form.lead_time_dias ?? ''} onChange={(e) => setForm((p) => ({ ...p, lead_time_dias: e.target.value ? parseInt(e.target.value, 10) : undefined }))} className={inputCls} /></div>
              <div><Label>Estado</Label><select value={form.estado ?? 'sugerida'} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))} className={selectCls}>{ESTADOS_ORDEN.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar orden sugerida</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Tipo orden</Label><select value={editForm.tipo_orden ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_orden: e.target.value as OrdenSugeridaCreate['tipo_orden'] }))} className={selectCls}>{TIPOS_ORDEN.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Cantidad *</Label><input type="number" step="0.0001" min={0} value={editForm.cantidad_sugerida ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cantidad_sugerida: parseFloat(e.target.value) || 0 }))} className={inputCls} required /></div>
              <div><Label>Fecha requerida *</Label><input type="date" value={editForm.fecha_requerida ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_requerida: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha orden sugerida *</Label><input type="date" value={editForm.fecha_orden_sugerida ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_orden_sugerida: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Proveedor</Label><select value={editForm.proveedor_sugerido_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, proveedor_sugerido_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{proveedores.map((pr) => <option key={pr.proveedor_id} value={pr.proveedor_id}>{pr.razon_social}</option>)}</select></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value }))} className={selectCls}>{ESTADOS_ORDEN.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MrpPageLayout>
  );
}
