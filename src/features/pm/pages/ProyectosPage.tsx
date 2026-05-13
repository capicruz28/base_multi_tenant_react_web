/**
 * Proyectos PM — Listado y gestión. GET/POST/PUT /api/v1/pm/proyectos
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, FolderKanban, Plus, Pencil, Search } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { clienteService } from '@/features/sls/services/sls.service';
import { proyectosService } from '../services/pm.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Cliente } from '@/features/sls/types/sls.types';
import type { Proyecto, ProyectoCreate, ProyectoUpdate } from '../types/pm.types';
import { PmPageLayout } from '../components/PmPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ESTADOS: { value: ProyectoCreate['estado']; label: string }[] = [
  { value: 'planificado', label: 'Planificado' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const DEFAULT: ProyectoCreate = {
  empresa_id: '',
  codigo_proyecto: '',
  nombre: '',
  fecha_inicio: new Date().toISOString().slice(0, 10),
  estado: 'planificado',
};

export default function ProyectosPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [list, setList] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [clienteFilter, setClienteFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Proyecto | null>(null);
  const [form, setForm] = useState<ProyectoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ProyectoUpdate>({});
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

  const loadClientes = useCallback(async () => {
    try {
      const data = await clienteService.list({ solo_activos: true });
      setClientes(Array.isArray(data) ? data : []);
    } catch {
      setClientes([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; estado?: string; cliente_venta_id?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (clienteFilter) params.cliente_venta_id = clienteFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await proyectosService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter, clienteFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadClientes(); }, [loadClientes]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      fecha_inicio: new Date().toISOString().slice(0, 10),
    });
    setCreateOpen(true);
  };

  const openEdit = (row: Proyecto) => {
    setEditing(row);
    setEditForm({
      codigo_proyecto: row.codigo_proyecto,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      cliente_venta_id: row.cliente_venta_id ?? undefined,
      fecha_inicio: row.fecha_inicio ?? undefined,
      fecha_fin_estimada: row.fecha_fin_estimada ?? undefined,
      fecha_fin_real: row.fecha_fin_real ?? undefined,
      presupuesto: row.presupuesto ?? undefined,
      costo_real: row.costo_real ?? undefined,
      estado: row.estado ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await proyectosService.create(form);
      toast.success('Proyecto creado.');
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
      await proyectosService.update(editing.proyecto_id, editForm);
      toast.success('Proyecto actualizado.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const getClienteLabel = (id: string | null | undefined) =>
    id ? (clientes.find((c) => c.cliente_venta_id === id)?.razon_social ?? id) : '—';

  const inputCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';
  const selectCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

  return (
    <PmPageLayout
      title="Proyectos"
      description="Gestión de proyectos: planificación, fechas, presupuesto y costo real."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo proyecto
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
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {ESTADOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Cliente</Label>
          <select value={clienteFilter} onChange={(e) => setClienteFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {clientes.map((c) => <option key={c.cliente_venta_id} value={c.cliente_venta_id}>{c.razon_social}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Inicio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fin est.</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Presupuesto</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Costo real</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><FolderKanban className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay proyectos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.proyecto_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_proyecto}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getClienteLabel(row.cliente_venta_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_inicio ? new Date(row.fecha_inicio).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_fin_estimada ? new Date(row.fecha_fin_estimada).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.presupuesto ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.costo_real ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '—'}</td>
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
          <DialogHeader><DialogTitle>Nuevo proyecto</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Código *</Label><input type="text" value={form.codigo_proyecto} onChange={(e) => setForm((p) => ({ ...p, codigo_proyecto: e.target.value }))} className={inputCls} required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div className="md:col-span-2"><Label>Descripción</Label><textarea value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputCls} rows={2} /></div>
              <div><Label>Cliente (venta)</Label><select value={form.cliente_venta_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, cliente_venta_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{clientes.map((c) => <option key={c.cliente_venta_id} value={c.cliente_venta_id}>{c.razon_social}</option>)}</select></div>
              <div><Label>Estado</Label><select value={form.estado ?? 'planificado'} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as ProyectoCreate['estado'] }))} className={selectCls}>{ESTADOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
              <div><Label>Fecha inicio *</Label><input type="date" value={form.fecha_inicio} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha fin estimada</Label><input type="date" value={form.fecha_fin_estimada ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_fin_estimada: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Presupuesto</Label><input type="number" step="0.01" min={0} value={form.presupuesto ?? ''} onChange={(e) => setForm((p) => ({ ...p, presupuesto: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Costo real</Label><input type="number" step="0.01" min={0} value={form.costo_real ?? ''} onChange={(e) => setForm((p) => ({ ...p, costo_real: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar proyecto</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código *</Label><input type="text" value={editForm.codigo_proyecto ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_proyecto: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div className="md:col-span-2"><Label>Descripción</Label><textarea value={editForm.descripcion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputCls} rows={2} /></div>
              <div><Label>Cliente (venta)</Label><select value={editForm.cliente_venta_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cliente_venta_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{clientes.map((c) => <option key={c.cliente_venta_id} value={c.cliente_venta_id}>{c.razon_social}</option>)}</select></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value || undefined }))} className={selectCls}>{ESTADOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
              <div><Label>Fecha inicio</Label><input type="date" value={editForm.fecha_inicio ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_inicio: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Fecha fin estimada</Label><input type="date" value={editForm.fecha_fin_estimada ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_fin_estimada: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Fecha fin real</Label><input type="date" value={editForm.fecha_fin_real ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_fin_real: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Presupuesto</Label><input type="number" step="0.01" min={0} value={editForm.presupuesto ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, presupuesto: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Costo real</Label><input type="number" step="0.01" min={0} value={editForm.costo_real ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, costo_real: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PmPageLayout>
  );
}
