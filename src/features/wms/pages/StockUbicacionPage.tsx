/**
 * Stock por Ubicación — Listado y gestión. GET/POST /api/v1/wms/stock-ubicacion
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Package, Plus, Pencil } from 'lucide-react';
import { almacenService } from '@/features/inv/services/inv.service';
import { productoService } from '@/features/inv/services/inv.service';
import { unidadMedidaService } from '@/features/inv/services/inv.service';
import { ubicacionService } from '../services/wms.service';
import { stockUbicacionService } from '../services/wms.service';
import type { Almacen } from '@/features/inv/types/inv.types';
import type { Producto } from '@/features/inv/types/inv.types';
import type { UnidadMedida } from '@/features/inv/types/inv.types';
import type { Ubicacion } from '../types/wms.types';
import type { StockUbicacion, StockUbicacionCreate, StockUbicacionUpdate } from '../types/wms.types';
import { WmsPageLayout } from '../components/WmsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermission } from '@/core/auth/PermissionContext';

const ESTADOS_STOCK = ['disponible', 'reservado', 'bloqueado', 'cuarentena'] as const;

const DEFAULT: StockUbicacionCreate = {
  almacen_id: '',
  ubicacion_id: '',
  producto_id: '',
  cantidad: 0,
  unidad_medida_id: '',
  estado_stock: 'disponible',
};

export default function StockUbicacionPage() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission('wms.stock_ubicacion.crear');
  const canEdit =
    hasPermission('wms.stock_ubicacion.actualizar') ||
    hasPermission('wms.stock_ubicacion.editar');
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [list, setList] = useState<StockUbicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [almacenFilter, setAlmacenFilter] = useState<string>('');
  const [ubicacionFilter, setUbicacionFilter] = useState<string>('');
  const [productoFilter, setProductoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<StockUbicacion | null>(null);
  const [form, setForm] = useState<StockUbicacionCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<StockUbicacionUpdate>({});
  const [submitting, setSubmitting] = useState(false);

  const loadAlmacenes = useCallback(async () => {
    try {
      const data = await almacenService.list({ solo_activos: true });
      setAlmacenes(data);
      if (data.length === 1 && !almacenFilter) setAlmacenFilter(data[0].almacen_id);
    } catch {
      setAlmacenes([]);
    }
  }, [almacenFilter]);

  const loadUbicaciones = useCallback(async () => {
    if (!almacenFilter) { setUbicaciones([]); return; }
    try {
      const data = await ubicacionService.list({ almacen_id: almacenFilter, solo_activos: true });
      setUbicaciones(data);
    } catch {
      setUbicaciones([]);
    }
  }, [almacenFilter]);

  const loadProductos = useCallback(async () => {
    try {
      const data = await productoService.list({ solo_activos: true });
      setProductos(data);
    } catch {
      setProductos([]);
    }
  }, []);

  const loadUnidadesMedida = useCallback(async () => {
    try {
      const data = await unidadMedidaService.list({ solo_activos: true });
      setUnidadesMedida(data);
    } catch {
      setUnidadesMedida([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { almacen_id?: string; ubicacion_id?: string; producto_id?: string } = {};
      if (almacenFilter) params.almacen_id = almacenFilter;
      if (ubicacionFilter) params.ubicacion_id = ubicacionFilter;
      if (productoFilter) params.producto_id = productoFilter;
      const data = await stockUbicacionService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [almacenFilter, ubicacionFilter, productoFilter]);

  useEffect(() => { loadAlmacenes(); }, [loadAlmacenes]);
  useEffect(() => { loadUbicaciones(); }, [loadUbicaciones]);
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadUnidadesMedida(); }, [loadUnidadesMedida]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      almacen_id: almacenFilter || (almacenes[0]?.almacen_id ?? ''),
      ubicacion_id: ubicacionFilter || (ubicaciones[0]?.ubicacion_id ?? ''),
      unidad_medida_id: unidadesMedida[0]?.unidad_medida_id ?? '',
    });
    setCreateOpen(true);
  };

  const openEdit = (row: StockUbicacion) => {
    setEditing(row);
    setEditForm({
      cantidad: row.cantidad,
      unidad_medida_id: row.unidad_medida_id,
      lote: row.lote ?? undefined,
      numero_serie: row.numero_serie ?? undefined,
      fecha_vencimiento: row.fecha_vencimiento ?? undefined,
      estado_stock: row.estado_stock,
      motivo_bloqueo: row.motivo_bloqueo ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.almacen_id || !form.ubicacion_id || !form.producto_id || !form.unidad_medida_id || form.cantidad <= 0) {
      toast.error('Completa almacén, ubicación, producto, unidad y cantidad.');
      return;
    }
    setSubmitting(true);
    try {
      await stockUbicacionService.create(form);
      toast.success('Stock por ubicación creado.');
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
      await stockUbicacionService.update(editing.stock_ubicacion_id, editForm);
      toast.success('Stock actualizado.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WmsPageLayout
      title="Stock por Ubicación"
      description="Cantidades de productos en cada ubicación física (lote, vencimiento, estado)."
      action={
        canCreate && (
          <Button
            onClick={openCreate}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            disabled={!almacenes.length || !ubicaciones.length || !productos.length}
          >
            <Plus className="h-4 w-4 mr-2" /> Crear stock
          </Button>
        )
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        {almacenes.length > 0 && (
          <div>
            <Label className="mr-2">Almacén</Label>
            <select value={almacenFilter} onChange={(e) => setAlmacenFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Todos</option>
              {almacenes.map((a) => <option key={a.almacen_id} value={a.almacen_id}>{a.nombre}</option>)}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Ubicación</Label>
          <select value={ubicacionFilter} onChange={(e) => setUbicacionFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todas</option>
            {ubicaciones.map((u) => <option key={u.ubicacion_id} value={u.ubicacion_id}>{u.codigo_ubicacion}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Producto</Label>
          <select value={productoFilter} onChange={(e) => setProductoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} - {p.nombre}</option>)}
          </select>
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {!loading && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ubicación</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cantidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Lote</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {error ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Package className="h-10 w-10 mx-auto mb-2 opacity-50" />{error}</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Package className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay stock por ubicación.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.stock_ubicacion_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.ubicacion_codigo ?? row.ubicacion_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.producto_nombre ?? row.producto_codigo ?? row.producto_id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.cantidad} {row.unidad_medida_codigo ?? ''}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.lote ?? '-'}</td>
                    <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 text-xs font-medium rounded ${row.estado_stock === 'disponible' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : row.estado_stock === 'reservado' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>{row.estado_stock}</span></td>
                    <td className="px-4 py-3 text-center">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(row)}
                          className="text-brand-primary hover:text-brand-primary/80"
                        >
                          <Pencil className="h-4 w-4" />
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
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear stock por ubicación</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Almacén *</Label><select value={form.almacen_id} onChange={(e) => setForm((p) => ({ ...p, almacen_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{almacenes.map((a) => <option key={a.almacen_id} value={a.almacen_id}>{a.nombre}</option>)}</select></div>
              <div><Label>Ubicación *</Label><select value={form.ubicacion_id} onChange={(e) => setForm((p) => ({ ...p, ubicacion_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{ubicaciones.filter(u => u.almacen_id === form.almacen_id).map((u) => <option key={u.ubicacion_id} value={u.ubicacion_id}>{u.codigo_ubicacion}</option>)}</select></div>
              <div className="md:col-span-2"><Label>Producto *</Label><select value={form.producto_id} onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} - {p.nombre}</option>)}</select></div>
              <div><Label>Cantidad *</Label><input type="number" step="0.01" min="0" value={form.cantidad || ''} onChange={(e) => setForm((p) => ({ ...p, cantidad: parseFloat(e.target.value) || 0 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Unidad medida *</Label><select value={form.unidad_medida_id} onChange={(e) => setForm((p) => ({ ...p, unidad_medida_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{unidadesMedida.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.codigo} - {u.nombre}</option>)}</select></div>
              <div><Label>Lote</Label><input type="text" value={form.lote ?? ''} onChange={(e) => setForm((p) => ({ ...p, lote: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Fecha vencimiento</Label><input type="date" value={form.fecha_vencimiento ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_vencimiento: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar stock por ubicación</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Cantidad</Label><input type="number" step="0.01" min="0" value={editForm.cantidad ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cantidad: parseFloat(e.target.value) || 0 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Estado</Label><select value={editForm.estado_stock ?? 'disponible'} onChange={(e) => setEditForm((p) => ({ ...p, estado_stock: e.target.value as StockUbicacionUpdate['estado_stock'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS_STOCK.map((e) => <option key={e} value={e}>{e}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </WmsPageLayout>
  );
}
