/**
 * Actividades CRM — Listado y gestión. GET/POST /api/v1/crm/actividades
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, CalendarCheck, Plus, Pencil, Search } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { clienteService } from '@/features/sls/services/sls.service';
import { leadService, oportunidadService, actividadService } from '../services/crm.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Cliente } from '@/features/sls/types/sls.types';
import type { Lead } from '../types/crm.types';
import type { Oportunidad } from '../types/crm.types';
import type { Actividad, ActividadCreate, ActividadUpdate } from '../types/crm.types';
import { CrmPageLayout } from '../components/CrmPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_ACTIVIDAD = ['llamada', 'reunion', 'email', 'visita', 'demo', 'cotizacion_enviada'] as const;
const ESTADOS_ACTIVIDAD = ['planificada', 'completada', 'cancelada'] as const;
const RESULTADOS = ['exitosa', 'sin_respuesta', 'reagendar', 'no_interesado'] as const;

const DEFAULT: ActividadCreate = {
  empresa_id: '',
  tipo_actividad: 'reunion',
  asunto: '',
  fecha_actividad: '',
  usuario_responsable_id: '',
  estado: 'planificada',
};

export default function ActividadesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [list, setList] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Actividad | null>(null);
  const [form, setForm] = useState<ActividadCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ActividadUpdate>({});
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
      setClientes(data);
    } catch {
      setClientes([]);
    }
  }, []);

  const loadLeads = useCallback(async () => {
    try {
      const data = await leadService.list({});
      setLeads(data);
    } catch {
      setLeads([]);
    }
  }, []);

  const loadOportunidades = useCallback(async () => {
    try {
      const data = await oportunidadService.list({});
      setOportunidades(data);
    } catch {
      setOportunidades([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; tipo_actividad?: string; estado?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (tipoFilter) params.tipo_actividad = tipoFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await actividadService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, tipoFilter, estadoFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadClientes(); }, [loadClientes]);
  useEffect(() => { loadLeads(); }, [loadLeads]);
  useEffect(() => { loadOportunidades(); }, [loadOportunidades]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '', usuario_responsable_id: 'current' });
    setCreateOpen(true);
  };

  const openEdit = (row: Actividad) => {
    setEditing(row);
    setEditForm({
      tipo_actividad: row.tipo_actividad as ActividadUpdate['tipo_actividad'],
      asunto: row.asunto,
      descripcion: row.descripcion ?? undefined,
      fecha_actividad: row.fecha_actividad,
      duracion_minutos: row.duracion_minutos ?? undefined,
      resultado: (row.resultado as ActividadUpdate['resultado']) ?? undefined,
      requiere_seguimiento: row.requiere_seguimiento,
      fecha_seguimiento: row.fecha_seguimiento ?? undefined,
      estado: (row.estado as ActividadUpdate['estado']) ?? undefined,
      fecha_completado: row.fecha_completado ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.asunto.trim() || !form.fecha_actividad) {
      toast.error('Completa empresa, asunto y fecha.');
      return;
    }
    if (!form.usuario_responsable_id?.trim()) {
      toast.error('Indica el responsable.');
      return;
    }
    setSubmitting(true);
    try {
      await actividadService.create(form);
      toast.success('Actividad creada.');
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
      await actividadService.update(editing.actividad_id, editForm);
      toast.success('Actividad actualizada.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (s: string | null | undefined) => (s ? new Date(s).toLocaleString() : '-');

  return (
    <CrmPageLayout
      title="Actividades"
      description="Llamadas, reuniones, emails y visitas vinculadas a leads u oportunidades."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Crear actividad
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
          <Label className="mr-2">Tipo</Label>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {TIPOS_ACTIVIDAD.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ESTADOS_ACTIVIDAD.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por asunto o descripción..."
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Asunto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Responsable</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado / Resultado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><CalendarCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay actividades.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.actividad_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.tipo_actividad}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.asunto}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDateTime(row.fecha_actividad)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.responsable_nombre ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '-'} / {row.resultado ?? '-'}</td>
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
          <DialogHeader><DialogTitle>Crear actividad</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Tipo *</Label><select value={form.tipo_actividad} onChange={(e) => setForm((p) => ({ ...p, tipo_actividad: e.target.value as ActividadCreate['tipo_actividad'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_ACTIVIDAD.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="md:col-span-2"><Label>Asunto *</Label><input type="text" value={form.asunto} onChange={(e) => setForm((p) => ({ ...p, asunto: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Lead</Label><select value={form.lead_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, lead_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{leads.map((l) => <option key={l.lead_id} value={l.lead_id}>{l.nombre_completo}</option>)}</select></div>
              <div><Label>Oportunidad</Label><select value={form.oportunidad_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, oportunidad_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{oportunidades.map((o) => <option key={o.oportunidad_id} value={o.oportunidad_id}>{o.numero_oportunidad} – {o.nombre}</option>)}</select></div>
              <div><Label>Cliente (ventas)</Label><select value={form.cliente_venta_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, cliente_venta_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{clientes.map((c) => <option key={c.cliente_venta_id} value={c.cliente_venta_id}>{c.razon_social}</option>)}</select></div>
              <div><Label>Fecha y hora *</Label><input type="datetime-local" value={form.fecha_actividad} onChange={(e) => setForm((p) => ({ ...p, fecha_actividad: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Duración (min)</Label><input type="number" min="0" value={form.duracion_minutos ?? ''} onChange={(e) => setForm((p) => ({ ...p, duracion_minutos: e.target.value ? parseInt(e.target.value, 10) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Responsable (ID o nombre) *</Label><input type="text" value={form.responsable_nombre ?? form.usuario_responsable_id} onChange={(e) => setForm((p) => ({ ...p, usuario_responsable_id: e.target.value || '', responsable_nombre: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Estado</Label><select value={form.estado ?? 'planificada'} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as ActividadCreate['estado'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS_ACTIVIDAD.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.requiere_seguimiento ?? false} onChange={(e) => setForm((p) => ({ ...p, requiere_seguimiento: e.target.checked }))} className="rounded" /><Label>Requiere seguimiento</Label></div>
              <div><Label>Fecha seguimiento</Label><input type="date" value={form.fecha_seguimiento ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_seguimiento: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Descripción</Label><textarea value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar actividad</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Tipo</Label><select value={editForm.tipo_actividad ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_actividad: e.target.value as ActividadUpdate['tipo_actividad'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_ACTIVIDAD.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as ActividadUpdate['estado'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS_ACTIVIDAD.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="md:col-span-2"><Label>Asunto *</Label><input type="text" value={editForm.asunto ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, asunto: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              {editForm.estado === 'completada' && (
                <>
                  <div><Label>Resultado</Label><select value={editForm.resultado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, resultado: (e.target.value || undefined) as ActividadUpdate['resultado'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{RESULTADOS.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
                  <div><Label>Fecha completado</Label><input type="datetime-local" value={editForm.fecha_completado ? editForm.fecha_completado.slice(0, 16) : ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_completado: e.target.value ? `${e.target.value}:00` : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
                </>
              )}
              <div className="md:col-span-2"><Label>Observaciones</Label><textarea value={editForm.observaciones ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} rows={3} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </CrmPageLayout>
  );
}
