/**
 * Órdenes de Servicio SVC — Listado y gestión. GET/POST/PUT /api/v1/svc/ordenes-servicio
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Wrench, Plus, Pencil, Search } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { clienteService } from '@/features/sls/services/sls.service';
import { ordenesServicioService } from '../services/svc.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Cliente } from '@/features/sls/types/sls.types';
import type { OrdenServicio, OrdenServicioCreate, OrdenServicioUpdate } from '../types/svc.types';
import { SvcPageLayout } from '../components/SvcPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ESTADOS: { value: OrdenServicioCreate['estado']; label: string }[] = [
  { value: 'solicitada', label: 'Solicitada' },
  { value: 'asignada', label: 'Asignada' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
];

const TIPOS_SERVICIO = ['postventa', 'soporte', 'taller_externo', 'tercerización', 'reparacion', 'mantenimiento'] as const;

const DEFAULT: OrdenServicioCreate = {
  empresa_id: '',
  numero_os: '',
  tipo_servicio: 'postventa',
  estado: 'solicitada',
};

export default function OrdenesServicioPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [list, setList] = useState<OrdenServicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [clienteFilter, setClienteFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<OrdenServicio | null>(null);
  const [form, setForm] = useState<OrdenServicioCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<OrdenServicioUpdate>({});
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
      const params: { empresa_id?: string; estado?: string; cliente_venta_id?: string; tipo_servicio?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (clienteFilter) params.cliente_venta_id = clienteFilter;
      if (tipoFilter) params.tipo_servicio = tipoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await ordenesServicioService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter, clienteFilter, tipoFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadClientes(); }, [loadClientes]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      numero_os: `OS-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(list.length + 1).padStart(4, '0')}`,
      fecha_solicitud: now.toISOString(),
      estado: 'solicitada',
    });
    setCreateOpen(true);
  };

  const openEdit = (row: OrdenServicio) => {
    setEditing(row);
    setEditForm({
      numero_os: row.numero_os,
      fecha_solicitud: row.fecha_solicitud ?? undefined,
      cliente_venta_id: row.cliente_venta_id ?? undefined,
      tipo_servicio: row.tipo_servicio ?? undefined,
      descripcion_servicio: row.descripcion_servicio ?? undefined,
      fecha_inicio_programada: row.fecha_inicio_programada ?? undefined,
      fecha_inicio_real: row.fecha_inicio_real ?? undefined,
      fecha_fin_real: row.fecha_fin_real ?? undefined,
      estado: row.estado ?? undefined,
      monto_servicio: row.monto_servicio ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ordenesServicioService.create(form);
      toast.success('Orden de servicio creada.');
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
      await ordenesServicioService.update(editing.orden_servicio_id, editForm);
      toast.success('Orden actualizada.');
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

  const formatDateTime = (s: string | null | undefined) =>
    s ? new Date(s).toLocaleString() : '—';

  const inputCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';
  const selectCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

  return (
    <SvcPageLayout
      title="Órdenes de Servicio"
      description="Gestión de órdenes de servicio: solicitud, asignación, ejecución y cierre."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Nueva orden
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
          <Label className="mr-2">Tipo servicio</Label>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {TIPOS_SERVICIO.map((t) => <option key={t} value={t}>{t}</option>)}
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
            <input type="text" placeholder="Nº OS, descripción..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`pl-9 w-full ${inputCls}`} />
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nº OS</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Solicitud</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Inicio prog.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Monto</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Wrench className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay órdenes de servicio.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.orden_servicio_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_os}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getClienteLabel(row.cliente_venta_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_servicio ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDateTime(row.fecha_solicitud)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDateTime(row.fecha_inicio_programada)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.monto_servicio ?? 0}</td>
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
          <DialogHeader><DialogTitle>Nueva orden de servicio</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Nº OS *</Label><input type="text" value={form.numero_os} onChange={(e) => setForm((p) => ({ ...p, numero_os: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo servicio *</Label><select value={form.tipo_servicio} onChange={(e) => setForm((p) => ({ ...p, tipo_servicio: e.target.value }))} className={selectCls} required>{TIPOS_SERVICIO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Estado</Label><select value={form.estado ?? 'solicitada'} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as OrdenServicioCreate['estado'] }))} className={selectCls}>{ESTADOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
              <div><Label>Cliente (venta)</Label><select value={form.cliente_venta_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, cliente_venta_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{clientes.map((c) => <option key={c.cliente_venta_id} value={c.cliente_venta_id}>{c.razon_social}</option>)}</select></div>
              <div><Label>Monto servicio</Label><input type="number" step="0.01" min={0} value={form.monto_servicio ?? ''} onChange={(e) => setForm((p) => ({ ...p, monto_servicio: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
            </div>
            <div><Label>Descripción</Label><textarea value={form.descripcion_servicio ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion_servicio: e.target.value || undefined }))} className={inputCls} rows={3} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Fecha inicio programada</Label><input type="datetime-local" value={form.fecha_inicio_programada ? form.fecha_inicio_programada.slice(0, 16) : ''} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio_programada: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} className={inputCls} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar orden de servicio</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nº OS *</Label><input type="text" value={editForm.numero_os ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, numero_os: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo servicio</Label><select value={editForm.tipo_servicio ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_servicio: e.target.value || undefined }))} className={selectCls}>{TIPOS_SERVICIO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Cliente (venta)</Label><select value={editForm.cliente_venta_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cliente_venta_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{clientes.map((c) => <option key={c.cliente_venta_id} value={c.cliente_venta_id}>{c.razon_social}</option>)}</select></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value || undefined }))} className={selectCls}>{ESTADOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
              <div><Label>Monto servicio</Label><input type="number" step="0.01" min={0} value={editForm.monto_servicio ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, monto_servicio: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Fecha inicio programada</Label><input type="datetime-local" value={editForm.fecha_inicio_programada ? editForm.fecha_inicio_programada.slice(0, 16) : ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_inicio_programada: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} className={inputCls} /></div>
              <div><Label>Fecha inicio real</Label><input type="datetime-local" value={editForm.fecha_inicio_real ? editForm.fecha_inicio_real.slice(0, 16) : ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_inicio_real: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} className={inputCls} /></div>
              <div><Label>Fecha fin real</Label><input type="datetime-local" value={editForm.fecha_fin_real ? editForm.fecha_fin_real.slice(0, 16) : ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_fin_real: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} className={inputCls} /></div>
            </div>
            <div><Label>Descripción</Label><textarea value={editForm.descripcion_servicio ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion_servicio: e.target.value || undefined }))} className={inputCls} rows={3} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SvcPageLayout>
  );
}
