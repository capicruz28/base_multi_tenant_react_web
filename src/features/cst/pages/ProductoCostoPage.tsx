/**
 * Costo de Productos CST — Listado y gestión. GET/POST/PUT /api/v1/cst/producto-costo
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, DollarSign, Plus, Pencil } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { productoService } from '@/features/inv/services/inv.service';
import { ordenProduccionService } from '@/features/mfg/services/mfg.service';
import { productoCostoService } from '../services/cst.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Producto } from '@/features/inv/types/inv.types';
import type { ProductoCosto, ProductoCostoCreate, ProductoCostoUpdate } from '../types/cst.types';
import { CstPageLayout } from '../components/CstPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const METODOS_COSTEO = ['real', 'estandar', 'promedio'] as const;
const MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

const DEFAULT: ProductoCostoCreate = {
  empresa_id: '',
  producto_id: '',
  anio: currentYear,
  mes: new Date().getMonth() + 1,
  metodo_costeo: 'real',
};

export default function ProductoCostoPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ordenesProduccion, setOrdenesProduccion] = useState<{ orden_produccion_id: string; numero_op: string }[]>([]);
  const [list, setList] = useState<ProductoCosto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [productoFilter, setProductoFilter] = useState<string>('');
  const [anioFilter, setAnioFilter] = useState<number>(currentYear);
  const [mesFilter, setMesFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ProductoCosto | null>(null);
  const [form, setForm] = useState<ProductoCostoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ProductoCostoUpdate>({});
  const [submitting, setSubmitting] = useState(false);

  const loadEmpresas = useCallback(async () => {
    try {
      const data = await empresaService.list({ solo_activos: true });
      setEmpresas(data);
      if (data.length === 1 && !empresaFilter) setEmpresaFilter(data[0].empresa_id);
    } catch {
      setEmpresas([]);
    }
  }, [empresaFilter]);

  const loadProductos = useCallback(async () => {
    try {
      const data = await productoService.list({ solo_activos: true });
      setProductos(Array.isArray(data) ? data : []);
    } catch {
      setProductos([]);
    }
  }, []);

  const loadOrdenesProduccion = useCallback(async () => {
    try {
      const data = await ordenProduccionService.list({});
      setOrdenesProduccion(Array.isArray(data) ? data.map((o) => ({ orden_produccion_id: o.orden_produccion_id, numero_op: o.numero_op })) : []);
    } catch {
      setOrdenesProduccion([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; producto_id?: string; anio?: number; mes?: number } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (productoFilter) params.producto_id = productoFilter;
      params.anio = anioFilter;
      if (mesFilter) params.mes = parseInt(mesFilter, 10);
      const data = await productoCostoService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, productoFilter, anioFilter, mesFilter]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadOrdenesProduccion(); }, [loadOrdenesProduccion]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      producto_id: productos[0]?.producto_id ?? '',
      anio: currentYear,
      mes: new Date().getMonth() + 1,
    });
    setCreateOpen(true);
  };

  const openEdit = (row: ProductoCosto) => {
    setEditing(row);
    setEditForm({
      costo_material_directo: row.costo_material_directo ?? undefined,
      costo_mano_obra_directa: row.costo_mano_obra_directa ?? undefined,
      costo_indirecto_fabricacion: row.costo_indirecto_fabricacion ?? undefined,
      cantidad_producida: row.cantidad_producida ?? undefined,
      orden_produccion_id: row.orden_produccion_id ?? undefined,
      metodo_costeo: row.metodo_costeo ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await productoCostoService.create(form);
      toast.success('Registro de costo creado.');
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
      await productoCostoService.update(editing.producto_costo_id, editForm);
      toast.success('Costo actualizado.');
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

  const getProductoNombre = (id: string) => productos.find((p) => p.producto_id === id)?.codigo_sku ?? id;

  return (
    <CstPageLayout
      title="Costo de Productos"
      description="Registro de costos por producto (material, mano de obra, CIF) y periodo."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length || !productos.length}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo costo
        </Button>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4 flex-wrap">
        {empresas.length > 0 && (
          <div>
            <Label className="mr-2">Empresa</Label>
            <select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value)} className={selectCls}>
              <option value="">Todas</option>
              {empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Producto</Label>
          <select value={productoFilter} onChange={(e) => setProductoFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} – {p.nombre}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Año</Label>
          <select value={anioFilter} onChange={(e) => setAnioFilter(parseInt(e.target.value, 10))} className={selectCls}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Mes</Label>
          <select value={mesFilter} onChange={(e) => setMesFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {MESES.map((m) => <option key={m} value={m}>{m}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Año / Mes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Material</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mano obra</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">CIF</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Unitario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Método</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><DollarSign className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay registros de costo.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.producto_costo_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getProductoNombre(row.producto_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.anio} / {row.mes}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.costo_material_directo ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.costo_mano_obra_directa ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.costo_indirecto_fabricacion ?? 0}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.costo_total ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.costo_unitario != null ? row.costo_unitario : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.metodo_costeo ?? '—'}</td>
                    <td className="px-4 py-3 text-center"><Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80"><Pencil className="h-4 w-4" /></Button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo registro de costo</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Producto *</Label><select value={form.producto_id} onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} – {p.nombre}</option>)}</select></div>
              <div><Label>Año *</Label><select value={form.anio} onChange={(e) => setForm((p) => ({ ...p, anio: parseInt(e.target.value, 10) }))} className={selectCls} required>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
              <div><Label>Mes *</Label><select value={form.mes} onChange={(e) => setForm((p) => ({ ...p, mes: parseInt(e.target.value, 10) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 }))} className={selectCls} required>{MESES.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
              <div><Label>Costo material directo</Label><input type="number" step="0.0001" min={0} value={form.costo_material_directo ?? ''} onChange={(e) => setForm((p) => ({ ...p, costo_material_directo: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Costo mano obra directa</Label><input type="number" step="0.0001" min={0} value={form.costo_mano_obra_directa ?? ''} onChange={(e) => setForm((p) => ({ ...p, costo_mano_obra_directa: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Costo CIF</Label><input type="number" step="0.0001" min={0} value={form.costo_indirecto_fabricacion ?? ''} onChange={(e) => setForm((p) => ({ ...p, costo_indirecto_fabricacion: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Cantidad producida</Label><input type="number" step="0.0001" min={0} value={form.cantidad_producida ?? ''} onChange={(e) => setForm((p) => ({ ...p, cantidad_producida: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Orden producción</Label><select value={form.orden_produccion_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, orden_produccion_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{ordenesProduccion.map((o) => <option key={o.orden_produccion_id} value={o.orden_produccion_id}>{o.numero_op}</option>)}</select></div>
              <div><Label>Método costeo</Label><select value={form.metodo_costeo ?? 'real'} onChange={(e) => setForm((p) => ({ ...p, metodo_costeo: e.target.value as ProductoCostoCreate['metodo_costeo'] }))} className={selectCls}>{METODOS_COSTEO.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar costo de producto</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Costo material directo</Label><input type="number" step="0.0001" min={0} value={editForm.costo_material_directo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, costo_material_directo: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Costo mano obra directa</Label><input type="number" step="0.0001" min={0} value={editForm.costo_mano_obra_directa ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, costo_mano_obra_directa: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Costo CIF</Label><input type="number" step="0.0001" min={0} value={editForm.costo_indirecto_fabricacion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, costo_indirecto_fabricacion: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Cantidad producida</Label><input type="number" step="0.0001" min={0} value={editForm.cantidad_producida ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cantidad_producida: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Método costeo</Label><select value={editForm.metodo_costeo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, metodo_costeo: e.target.value || undefined }))} className={selectCls}>{METODOS_COSTEO.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </CstPageLayout>
  );
}
