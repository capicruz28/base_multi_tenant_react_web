/**
 * Pronóstico de Demanda MPS — Listado y gestión. GET/POST/PUT /api/v1/mps/pronostico-demanda
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, TrendingUp, Plus, Pencil } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { productoService, unidadMedidaService } from '@/features/inv/services/inv.service';
import { pronosticoDemandaService } from '../services/mps.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Producto, UnidadMedida } from '@/features/inv/types/inv.types';
import type {
  PronosticoDemanda,
  PronosticoDemandaCreate,
  PronosticoDemandaUpdate,
} from '../types/mps.types';
import { MpsPageLayout } from '../components/MpsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const METODOS_PRONOSTICO = ['historico', 'tendencia', 'estacional', 'manual'] as const;
const MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => currentYear - 2 + i);

const DEFAULT: PronosticoDemandaCreate = {
  empresa_id: '',
  producto_id: '',
  anio: currentYear,
  mes: new Date().getMonth() + 1,
  fecha_inicio: '',
  fecha_fin: '',
  cantidad_pronosticada: 0,
  unidad_medida_id: '',
  metodo_pronostico: 'manual',
};

export default function PronosticoDemandaPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [list, setList] = useState<PronosticoDemanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [productoFilter, setProductoFilter] = useState<string>('');
  const [anioFilter, setAnioFilter] = useState<number>(currentYear);
  const [mesFilter, setMesFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PronosticoDemanda | null>(null);
  const [form, setForm] = useState<PronosticoDemandaCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<PronosticoDemandaUpdate>({});
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
      const params: { empresa_id?: string; producto_id?: string; anio?: number; mes?: number } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (productoFilter) params.producto_id = productoFilter;
      params.anio = anioFilter;
      if (mesFilter) params.mes = parseInt(mesFilter, 10);
      const data = await pronosticoDemandaService.list(params);
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
  useEffect(() => { loadUnidades(); }, [loadUnidades]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      producto_id: productos[0]?.producto_id ?? '',
      unidad_medida_id: unidadesMedida[0]?.unidad_medida_id ?? '',
      anio: now.getFullYear(),
      mes: now.getMonth() + 1,
      fecha_inicio: firstDay.toISOString().slice(0, 10),
      fecha_fin: lastDay.toISOString().slice(0, 10),
    });
    setCreateOpen(true);
  };

  const openEdit = (row: PronosticoDemanda) => {
    setEditing(row);
    setEditForm({
      producto_id: row.producto_id,
      anio: row.anio,
      mes: row.mes,
      semana: row.semana ?? undefined,
      fecha_inicio: row.fecha_inicio,
      fecha_fin: row.fecha_fin,
      cantidad_pronosticada: row.cantidad_pronosticada,
      unidad_medida_id: row.unidad_medida_id,
      metodo_pronostico: (row.metodo_pronostico as PronosticoDemandaCreate['metodo_pronostico']) ?? undefined,
      confiabilidad_porcentaje: row.confiabilidad_porcentaje ?? undefined,
      cantidad_real: row.cantidad_real ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await pronosticoDemandaService.create(form);
      toast.success('Pronóstico creado.');
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
      await pronosticoDemandaService.update(editing.pronostico_id, editForm);
      toast.success('Pronóstico actualizado.');
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

  const getProductoNombre = (id: string) =>
    productos.find((p) => p.producto_id === id)?.codigo_sku ?? id;

  return (
    <MpsPageLayout
      title="Pronóstico de Demanda"
      description="Estimación de demanda futura por producto y periodo para planificar producción."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length || !productos.length || !unidadesMedida.length}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo pronóstico
        </Button>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        {empresas.length > 0 && (
          <div>
            <Label className="mr-2">Empresa</Label>
            <select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Todas</option>
              {empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Producto</Label>
          <select value={productoFilter} onChange={(e) => setProductoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} – {p.nombre}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Año</Label>
          <select value={anioFilter} onChange={(e) => setAnioFilter(parseInt(e.target.value, 10))} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Mes</Label>
          <select value={mesFilter} onChange={(e) => setMesFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Período</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cant. pronóst.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cant. real</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Desviación</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay pronósticos de demanda.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.pronostico_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getProductoNombre(row.producto_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.anio} / {row.mes}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_inicio} — {row.fecha_fin}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.cantidad_pronosticada}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.cantidad_real ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.desviacion != null ? row.desviacion : '—'}</td>
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
          <DialogHeader><DialogTitle>Nuevo pronóstico de demanda</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Producto *</Label><select value={form.producto_id} onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} – {p.nombre}</option>)}</select></div>
              <div><Label>Año *</Label><select value={form.anio} onChange={(e) => setForm((p) => ({ ...p, anio: parseInt(e.target.value, 10) }))} className={selectCls} required>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
              <div><Label>Mes *</Label><select value={form.mes} onChange={(e) => setForm((p) => ({ ...p, mes: parseInt(e.target.value, 10) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 }))} className={selectCls} required>{MESES.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
              <div><Label>Fecha inicio *</Label><input type="date" value={form.fecha_inicio} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha fin *</Label><input type="date" value={form.fecha_fin} onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Cantidad pronosticada *</Label><input type="number" step="0.0001" min={0} value={form.cantidad_pronosticada || ''} onChange={(e) => setForm((p) => ({ ...p, cantidad_pronosticada: parseFloat(e.target.value) || 0 }))} className={inputCls} required /></div>
              <div><Label>Unidad medida *</Label><select value={form.unidad_medida_id} onChange={(e) => setForm((p) => ({ ...p, unidad_medida_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{unidadesMedida.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.codigo}</option>)}</select></div>
              <div><Label>Método pronóstico</Label><select value={form.metodo_pronostico ?? 'manual'} onChange={(e) => setForm((p) => ({ ...p, metodo_pronostico: e.target.value as PronosticoDemandaCreate['metodo_pronostico'] }))} className={selectCls}>{METODOS_PRONOSTICO.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
              <div><Label>Confiabilidad %</Label><input type="number" step="0.01" min={0} max={100} value={form.confiabilidad_porcentaje ?? ''} onChange={(e) => setForm((p) => ({ ...p, confiabilidad_porcentaje: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar pronóstico de demanda</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Producto *</Label><select value={editForm.producto_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, producto_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} – {p.nombre}</option>)}</select></div>
              <div><Label>Año *</Label><input type="number" min={2000} max={2100} value={editForm.anio ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, anio: parseInt(e.target.value, 10) }))} className={inputCls} required /></div>
              <div><Label>Mes *</Label><select value={editForm.mes ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, mes: parseInt(e.target.value, 10) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 }))} className={selectCls} required>{MESES.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
              <div><Label>Fecha inicio *</Label><input type="date" value={editForm.fecha_inicio ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_inicio: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha fin *</Label><input type="date" value={editForm.fecha_fin ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_fin: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Cantidad pronosticada *</Label><input type="number" step="0.0001" min={0} value={editForm.cantidad_pronosticada ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cantidad_pronosticada: parseFloat(e.target.value) || 0 }))} className={inputCls} required /></div>
              <div><Label>Unidad medida *</Label><select value={editForm.unidad_medida_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, unidad_medida_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{unidadesMedida.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.codigo}</option>)}</select></div>
              <div><Label>Cantidad real</Label><input type="number" step="0.0001" min={0} value={editForm.cantidad_real ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cantidad_real: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Método pronóstico</Label><select value={editForm.metodo_pronostico ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, metodo_pronostico: e.target.value as PronosticoDemandaCreate['metodo_pronostico'] }))} className={selectCls}>{METODOS_PRONOSTICO.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MpsPageLayout>
  );
}
