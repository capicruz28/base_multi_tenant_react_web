/**
 * Tickets TKT — Mesa de Ayuda. GET/POST/PUT /api/v1/tkt/tickets
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Ticket as TicketIcon, Plus, Pencil, Search } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { ticketsService } from '../services/tkt.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Ticket, TicketCreate, TicketUpdate } from '../types/tkt.types';
import { TktPageLayout } from '../components/TktPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const CATEGORIAS: { value: TicketCreate['categoria']; label: string }[] = [
  { value: 'soporte_tecnico', label: 'Soporte técnico' },
  { value: 'consulta', label: 'Consulta' },
  { value: 'incidencia', label: 'Incidencia' },
  { value: 'requerimiento', label: 'Requerimiento' },
];
const PRIORIDADES: { value: TicketCreate['prioridad']; label: string }[] = [
  { value: 'urgente', label: 'Urgente' },
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];
const ESTADOS: { value: TicketCreate['estado']; label: string }[] = [
  { value: 'abierto', label: 'Abierto' },
  { value: 'asignado', label: 'Asignado' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'resuelto', label: 'Resuelto' },
  { value: 'cerrado', label: 'Cerrado' },
];

const DEFAULT: TicketCreate = {
  empresa_id: '',
  numero_ticket: '',
  asunto: '',
  prioridad: 'media',
  estado: 'abierto',
};

export default function TicketsPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [list, setList] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [prioridadFilter, setPrioridadFilter] = useState<string>('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [form, setForm] = useState<TicketCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<TicketUpdate>({});
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
      const params: { empresa_id?: string; estado?: string; prioridad?: string; categoria?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (prioridadFilter) params.prioridad = prioridadFilter;
      if (categoriaFilter) params.categoria = categoriaFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await ticketsService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter, prioridadFilter, categoriaFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    const now = new Date();
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      numero_ticket: `TKT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(list.length + 1).padStart(4, '0')}`,
      estado: 'abierto',
    });
    setCreateOpen(true);
  };

  const openEdit = (row: Ticket) => {
    setEditing(row);
    setEditForm({
      numero_ticket: row.numero_ticket,
      solicitante_nombre: row.solicitante_nombre ?? undefined,
      solicitante_email: row.solicitante_email ?? undefined,
      asunto: row.asunto ?? undefined,
      descripcion: row.descripcion ?? undefined,
      categoria: row.categoria ?? undefined,
      prioridad: row.prioridad ?? undefined,
      estado: row.estado ?? undefined,
      fecha_resolucion: row.fecha_resolucion ?? undefined,
      solucion: row.solucion ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ticketsService.create(form);
      toast.success('Ticket creado.');
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
      await ticketsService.update(editing.ticket_id, editForm);
      toast.success('Ticket actualizado.');
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
    <TktPageLayout
      title="Tickets — Mesa de Ayuda"
      description="Gestión de tickets: apertura, asignación, seguimiento y cierre."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo ticket
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
          <Label className="mr-2">Prioridad</Label>
          <select value={prioridadFilter} onChange={(e) => setPrioridadFilter(e.target.value)} className={selectCls}>
            <option value="">Todas</option>
            {PRIORIDADES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Categoría</Label>
          <select value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)} className={selectCls}>
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="mr-2">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Nº, asunto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`pl-9 w-full ${inputCls}`} />
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nº</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Asunto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Prioridad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Creación</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Horas res.</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><TicketIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay tickets.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.ticket_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_ticket}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.asunto ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.categoria ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.prioridad ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDateTime(row.fecha_creacion)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.tiempo_resolucion_horas != null ? row.tiempo_resolucion_horas : '—'}</td>
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
          <DialogHeader><DialogTitle>Nuevo ticket</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Nº ticket *</Label><input type="text" value={form.numero_ticket} onChange={(e) => setForm((p) => ({ ...p, numero_ticket: e.target.value }))} className={inputCls} required /></div>
              <div className="md:col-span-2"><Label>Asunto *</Label><input type="text" value={form.asunto} onChange={(e) => setForm((p) => ({ ...p, asunto: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Categoría</Label><select value={form.categoria ?? ''} onChange={(e) => setForm((p) => ({ ...p, categoria: (e.target.value || undefined) as TicketCreate['categoria'] }))} className={selectCls}><option value="">—</option>{CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
              <div><Label>Prioridad</Label><select value={form.prioridad ?? 'media'} onChange={(e) => setForm((p) => ({ ...p, prioridad: e.target.value as TicketCreate['prioridad'] }))} className={selectCls}>{PRIORIDADES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
              <div><Label>Solicitante (nombre)</Label><input type="text" value={form.solicitante_nombre ?? ''} onChange={(e) => setForm((p) => ({ ...p, solicitante_nombre: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Solicitante (email)</Label><input type="email" value={form.solicitante_email ?? ''} onChange={(e) => setForm((p) => ({ ...p, solicitante_email: e.target.value || undefined }))} className={inputCls} /></div>
            </div>
            <div><Label>Descripción</Label><textarea value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputCls} rows={3} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar ticket</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nº ticket *</Label><input type="text" value={editForm.numero_ticket ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, numero_ticket: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Asunto *</Label><input type="text" value={editForm.asunto ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, asunto: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Categoría</Label><select value={editForm.categoria ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, categoria: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
              <div><Label>Prioridad</Label><select value={editForm.prioridad ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, prioridad: e.target.value || undefined }))} className={selectCls}>{PRIORIDADES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value || undefined }))} className={selectCls}>{ESTADOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
              <div><Label>Solicitante (nombre)</Label><input type="text" value={editForm.solicitante_nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, solicitante_nombre: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Solicitante (email)</Label><input type="email" value={editForm.solicitante_email ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, solicitante_email: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Fecha resolución</Label><input type="datetime-local" value={editForm.fecha_resolucion ? editForm.fecha_resolucion.slice(0, 16) : ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_resolucion: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} className={inputCls} /></div>
            </div>
            <div><Label>Descripción</Label><textarea value={editForm.descripcion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputCls} rows={2} /></div>
            <div><Label>Solución</Label><textarea value={editForm.solucion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, solucion: e.target.value || undefined }))} className={inputCls} rows={3} placeholder="Texto de resolución o cierre" /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </TktPageLayout>
  );
}
