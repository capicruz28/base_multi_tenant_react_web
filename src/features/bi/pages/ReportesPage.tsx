/**
 * Reportes BI — CRUD de reportes. GET/POST/PUT /api/v1/bi/reportes
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, BarChart3, Plus, Pencil, Search } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { reportesService } from '../services/bi.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { ReporteRead, ReporteCreate, ReporteUpdate } from '../types/bi.types';
import { BiPageLayout } from '../components/BiPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_REPORTE = ['sql', 'olap', 'dashboard'] as const;
const MODULOS_ORIGEN = ['INV', 'SLS', 'FIN', 'ORG', 'PUR', 'HCM', 'BDG', 'PM', 'SVC', 'TKT', 'DMS', 'WFL', 'MFG', 'MRP', 'MNT', 'CRM', 'PRC', ''];

const DEFAULT: ReporteCreate = {
  empresa_id: '',
  codigo_reporte: '',
  nombre: '',
  tipo_reporte: 'sql',
  es_activo: true,
  es_publico: false,
};

export default function ReportesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [list, setList] = useState<ReporteRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [moduloFilter, setModuloFilter] = useState<string>('');
  const [activoFilter, setActivoFilter] = useState<string>('true');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ReporteRead | null>(null);
  const [form, setForm] = useState<ReporteCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ReporteUpdate>({});
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
      const params: { empresa_id?: string; tipo_reporte?: string; modulo_origen?: string; es_activo?: boolean; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (tipoFilter) params.tipo_reporte = tipoFilter;
      if (moduloFilter) params.modulo_origen = moduloFilter;
      if (activoFilter !== '') params.es_activo = activoFilter === 'true';
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await reportesService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, tipoFilter, moduloFilter, activoFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
    });
    setCreateOpen(true);
  };

  const openEdit = (row: ReporteRead) => {
    setEditing(row);
    setEditForm({
      codigo_reporte: row.codigo_reporte ?? undefined,
      nombre: row.nombre ?? undefined,
      descripcion: row.descripcion ?? undefined,
      modulo_origen: row.modulo_origen ?? undefined,
      categoria: row.categoria ?? undefined,
      tipo_reporte: row.tipo_reporte ?? undefined,
      query_sql: row.query_sql ?? undefined,
      configuracion_json: row.configuracion_json ?? undefined,
      es_publico: row.es_publico,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reportesService.create(form);
      toast.success('Reporte creado.');
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
      await reportesService.update(editing.reporte_id, editForm);
      toast.success('Reporte actualizado.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (s: string | null | undefined) => (s ? new Date(s).toLocaleString() : '—');
  const inputCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';
  const selectCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

  return (
    <BiPageLayout
      title="Reportes"
      description="Reportes personalizados (SQL, OLAP, dashboard). Configuración de gráficos y filtros en JSON."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo reporte
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
          <Label className="mr-2">Tipo</Label>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {TIPOS_REPORTE.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Módulo</Label>
          <select value={moduloFilter} onChange={(e) => setModuloFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {MODULOS_ORIGEN.filter(Boolean).map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Activo</Label>
          <select value={activoFilter} onChange={(e) => setActivoFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Módulo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Público</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Activo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Creación</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay reportes.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.reporte_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_reporte ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_reporte ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.modulo_origen ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.categoria ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.es_publico ? 'Sí' : 'No'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.es_activo ? 'Sí' : 'No'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDateTime(row.fecha_creacion)}</td>
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
          <DialogHeader><DialogTitle>Nuevo reporte</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Código reporte *</Label><input type="text" value={form.codigo_reporte} onChange={(e) => setForm((p) => ({ ...p, codigo_reporte: e.target.value }))} className={inputCls} required placeholder="ej. RPT-VENTAS-01" /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo reporte</Label><select value={form.tipo_reporte ?? 'sql'} onChange={(e) => setForm((p) => ({ ...p, tipo_reporte: e.target.value as ReporteCreate['tipo_reporte'] }))} className={selectCls}>{TIPOS_REPORTE.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Módulo origen</Label><select value={form.modulo_origen ?? ''} onChange={(e) => setForm((p) => ({ ...p, modulo_origen: e.target.value || undefined }))} className={selectCls}>{MODULOS_ORIGEN.map((m) => <option key={m || 'v'} value={m}>{m || '—'}</option>)}</select></div>
              <div><Label>Categoría</Label><input type="text" value={form.categoria ?? ''} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value || undefined }))} className={inputCls} placeholder="ventas, inventarios, finanzas" /></div>
              <div className="md:col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.es_activo ?? true} onChange={(e) => setForm((p) => ({ ...p, es_activo: e.target.checked }))} />Activo</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.es_publico ?? false} onChange={(e) => setForm((p) => ({ ...p, es_publico: e.target.checked }))} />Público</label>
              </div>
            </div>
            <div><Label>Descripción</Label><textarea value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputCls} rows={2} /></div>
            <div><Label>Query SQL (solo almacenamiento; ejecución por endpoint dedicado)</Label><textarea value={form.query_sql ?? ''} onChange={(e) => setForm((p) => ({ ...p, query_sql: e.target.value || undefined }))} className={inputCls} rows={3} placeholder="SELECT ..." /></div>
            <div><Label>Configuración JSON (gráficos, filtros)</Label><textarea value={form.configuracion_json ?? ''} onChange={(e) => setForm((p) => ({ ...p, configuracion_json: e.target.value || undefined }))} className={inputCls} rows={4} placeholder='{"graficos":[{"tipo":"line","ejeX":"fecha","ejeY":"total"}]}' /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar reporte</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código reporte *</Label><input type="text" value={editForm.codigo_reporte ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_reporte: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo reporte</Label><select value={editForm.tipo_reporte ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_reporte: e.target.value || undefined }))} className={selectCls}>{TIPOS_REPORTE.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Módulo origen</Label><select value={editForm.modulo_origen ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, modulo_origen: e.target.value || undefined }))} className={selectCls}>{MODULOS_ORIGEN.map((m) => <option key={m || 'v'} value={m}>{m || '—'}</option>)}</select></div>
              <div><Label>Categoría</Label><input type="text" value={editForm.categoria ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, categoria: e.target.value || undefined }))} className={inputCls} /></div>
              <div className="md:col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_activo ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} />Activo</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_publico ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_publico: e.target.checked }))} />Público</label>
              </div>
            </div>
            <div><Label>Descripción</Label><textarea value={editForm.descripcion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputCls} rows={2} /></div>
            <div><Label>Query SQL</Label><textarea value={editForm.query_sql ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, query_sql: e.target.value || undefined }))} className={inputCls} rows={3} /></div>
            <div><Label>Configuración JSON</Label><textarea value={editForm.configuracion_json ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, configuracion_json: e.target.value || undefined }))} className={inputCls} rows={4} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </BiPageLayout>
  );
}
