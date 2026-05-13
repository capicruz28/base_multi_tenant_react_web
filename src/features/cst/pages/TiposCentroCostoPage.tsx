/**
 * Tipos de Centro de Costo CST — Listado y gestión. GET/POST/PUT /api/v1/cst/tipos-centro-costo
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Layers, Plus, Pencil, Search } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { tiposCentroCostoService } from '../services/cst.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { CentroCostoTipo, CentroCostoTipoCreate, CentroCostoTipoUpdate } from '../types/cst.types';
import { CstPageLayout } from '../components/CstPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_CLASIF = ['productivo', 'servicio', 'administrativo'] as const;
const BASE_DISTRIBUCION = ['horas_hombre', 'unidades_producidas', 'ventas', 'area_m2'] as const;

const DEFAULT: CentroCostoTipoCreate = {
  empresa_id: '',
  codigo: '',
  nombre: '',
  tipo_clasificacion: 'productivo',
  es_activo: true,
};

export default function TiposCentroCostoPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [list, setList] = useState<CentroCostoTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CentroCostoTipo | null>(null);
  const [form, setForm] = useState<CentroCostoTipoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<CentroCostoTipoUpdate>({});
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

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; tipo_clasificacion?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (tipoFilter) params.tipo_clasificacion = tipoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await tiposCentroCostoService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, tipoFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
    });
    setCreateOpen(true);
  };

  const openEdit = (row: CentroCostoTipo) => {
    setEditing(row);
    setEditForm({
      codigo: row.codigo,
      nombre: row.nombre,
      tipo_clasificacion: row.tipo_clasificacion,
      base_distribucion: row.base_distribucion ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await tiposCentroCostoService.create(form);
      toast.success('Tipo de centro de costo creado.');
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
      await tiposCentroCostoService.update(editing.cc_tipo_id, editForm);
      toast.success('Tipo actualizado.');
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

  return (
    <CstPageLayout
      title="Tipos de Centro de Costo"
      description="Clasificación de centros de costo para distribución de costos indirectos."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo tipo
        </Button>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
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
          <Label className="mr-2">Clasificación</Label>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className={selectCls}>
            <option value="">Todas</option>
            {TIPOS_CLASIF.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="mr-2">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Código, nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`pl-9 w-full ${inputCls}`} />
          </div>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clasificación</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Base distribución</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Layers className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay tipos de centro de costo.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.cc_tipo_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_clasificacion}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.base_distribucion ?? '—'}</td>
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
          <DialogHeader><DialogTitle>Nuevo tipo de centro de costo</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className={inputCls} required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Clasificación *</Label><select value={form.tipo_clasificacion} onChange={(e) => setForm((p) => ({ ...p, tipo_clasificacion: e.target.value as CentroCostoTipoCreate['tipo_clasificacion'] }))} className={selectCls} required>{TIPOS_CLASIF.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Base distribución</Label><select value={form.base_distribucion ?? ''} onChange={(e) => setForm((p) => ({ ...p, base_distribucion: e.target.value ? (e.target.value as CentroCostoTipoCreate['base_distribucion']) : undefined }))} className={selectCls}><option value="">—</option>{BASE_DISTRIBUCION.map((b) => <option key={b} value={b}>{b}</option>)}</select></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="create-es_activo" checked={form.es_activo ?? true} onChange={(e) => setForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label htmlFor="create-es_activo">Activo</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar tipo de centro de costo</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Clasificación</Label><select value={editForm.tipo_clasificacion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_clasificacion: e.target.value }))} className={selectCls}>{TIPOS_CLASIF.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Base distribución</Label><select value={editForm.base_distribucion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, base_distribucion: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{BASE_DISTRIBUCION.map((b) => <option key={b} value={b}>{b}</option>)}</select></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="edit-es_activo" checked={editForm.es_activo ?? true} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label htmlFor="edit-es_activo">Activo</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </CstPageLayout>
  );
}
