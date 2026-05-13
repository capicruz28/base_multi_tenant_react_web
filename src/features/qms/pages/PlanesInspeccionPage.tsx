/**
 * Planes de Inspección — Listado y gestión. GET/POST /api/v1/qms/planes-inspeccion
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, ClipboardList, Plus, Pencil, Search } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { productoService, categoriaService } from '@/features/inv/services/inv.service';
import { planInspeccionService } from '../services/qms.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Producto } from '@/features/inv/types/inv.types';
import type { Categoria } from '@/features/inv/types/inv.types';
import type { PlanInspeccion, PlanInspeccionCreate, PlanInspeccionUpdate } from '../types/qms.types';
import { QmsPageLayout } from '../components/QmsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const APLICA_A = ['producto', 'categoria', 'todos'] as const;
const TIPOS_INSPECCION = ['recepcion', 'proceso', 'final', 'salida'] as const;
const TIPOS_MUESTREO = ['total', 'aleatorio', 'estadistico'] as const;

const DEFAULT: PlanInspeccionCreate = {
  empresa_id: '',
  codigo: '',
  nombre: '',
  aplica_a: 'producto',
  tipo_inspeccion: 'recepcion',
  tipo_muestreo: 'aleatorio',
  porcentaje_muestreo: 10,
  nivel_aceptacion_mayores: 2.5,
  nivel_aceptacion_menores: 4,
  es_activo: true,
};

export default function PlanesInspeccionPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [list, setList] = useState<PlanInspeccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [tipoInspeccionFilter, setTipoInspeccionFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PlanInspeccion | null>(null);
  const [form, setForm] = useState<PlanInspeccionCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<PlanInspeccionUpdate>({});
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
      setProductos(data);
    } catch {
      setProductos([]);
    }
  }, []);

  const loadCategorias = useCallback(async () => {
    try {
      const data = await categoriaService.list({ solo_activos: true });
      setCategorias(data);
    } catch {
      setCategorias([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; tipo_inspeccion?: string; solo_activos?: boolean; buscar?: string } = { solo_activos: true };
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (tipoInspeccionFilter) params.tipo_inspeccion = tipoInspeccionFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await planInspeccionService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, tipoInspeccionFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadCategorias(); }, [loadCategorias]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '' });
    setCreateOpen(true);
  };

  const openEdit = (row: PlanInspeccion) => {
    setEditing(row);
    setEditForm({
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      aplica_a: row.aplica_a as PlanInspeccionUpdate['aplica_a'],
      producto_id: row.producto_id ?? undefined,
      categoria_id: row.categoria_id ?? undefined,
      tipo_inspeccion: row.tipo_inspeccion as PlanInspeccionUpdate['tipo_inspeccion'],
      tipo_muestreo: (row.tipo_muestreo as PlanInspeccionUpdate['tipo_muestreo']) ?? undefined,
      porcentaje_muestreo: row.porcentaje_muestreo ?? undefined,
      nivel_aceptacion_mayores: row.nivel_aceptacion_mayores ?? undefined,
      nivel_aceptacion_menores: row.nivel_aceptacion_menores ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Completa empresa, código y nombre.');
      return;
    }
    setSubmitting(true);
    try {
      await planInspeccionService.create(form);
      toast.success('Plan de inspección creado.');
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
      await planInspeccionService.update(editing.plan_inspeccion_id, editForm);
      toast.success('Plan actualizado.');
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
    <QmsPageLayout
      title="Planes de Inspección"
      description="Crear planes con muestreo AQL y niveles de aceptación por tipo de inspección."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Crear plan
        </Button>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        {empresas.length > 0 && (
          <div>
            <Label className="mr-2">Empresa</Label>
            <select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Todas</option>
              {empresas.map((e) => (
                <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Tipo inspección</Label>
          <select value={tipoInspeccionFilter} onChange={(e) => setTipoInspeccionFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {TIPOS_INSPECCION.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !loading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Aplica a</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo inspección</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Muestreo %</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay planes.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.plan_inspeccion_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.aplica_a}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_inspeccion}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.porcentaje_muestreo ?? '-'}%</td>
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
          <DialogHeader><DialogTitle>Crear plan de inspección</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Aplica a *</Label><select value={form.aplica_a} onChange={(e) => setForm((p) => ({ ...p, aplica_a: e.target.value as PlanInspeccionCreate['aplica_a'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{APLICA_A.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
              {form.aplica_a === 'producto' && <div><Label>Producto</Label><select value={form.producto_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} – {p.nombre}</option>)}</select></div>}
              {form.aplica_a === 'categoria' && <div><Label>Categoría</Label><select value={form.categoria_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, categoria_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{categorias.map((c) => <option key={c.categoria_id} value={c.categoria_id}>{c.codigo} – {c.nombre}</option>)}</select></div>}
              <div><Label>Tipo inspección *</Label><select value={form.tipo_inspeccion} onChange={(e) => setForm((p) => ({ ...p, tipo_inspeccion: e.target.value as PlanInspeccionCreate['tipo_inspeccion'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_INSPECCION.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Tipo muestreo</Label><select value={form.tipo_muestreo ?? ''} onChange={(e) => setForm((p) => ({ ...p, tipo_muestreo: (e.target.value || undefined) as PlanInspeccionCreate['tipo_muestreo'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{TIPOS_MUESTREO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>% Muestreo</Label><input type="number" step="0.01" min="0" max="100" value={form.porcentaje_muestreo ?? ''} onChange={(e) => setForm((p) => ({ ...p, porcentaje_muestreo: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Nivel aceptación mayores</Label><input type="number" step="0.01" min="0" value={form.nivel_aceptacion_mayores ?? ''} onChange={(e) => setForm((p) => ({ ...p, nivel_aceptacion_mayores: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Nivel aceptación menores</Label><input type="number" step="0.01" min="0" value={form.nivel_aceptacion_menores ?? ''} onChange={(e) => setForm((p) => ({ ...p, nivel_aceptacion_menores: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_activo ?? true} onChange={(e) => setForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" /><Label>Activo</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar plan</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Aplica a</Label><select value={editForm.aplica_a ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, aplica_a: e.target.value as PlanInspeccionUpdate['aplica_a'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{APLICA_A.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
              <div><Label>Tipo inspección</Label><select value={editForm.tipo_inspeccion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_inspeccion: e.target.value as PlanInspeccionUpdate['tipo_inspeccion'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_INSPECCION.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_activo ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" /><Label>Activo</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </QmsPageLayout>
  );
}
