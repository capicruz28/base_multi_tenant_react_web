/**
 * Leads CRM — Listado y gestión. GET/POST /api/v1/crm/leads
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Target, Plus, Pencil, Search } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { clienteService } from '@/features/sls/services/sls.service';
import { campanaService, leadService } from '../services/crm.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Cliente } from '@/features/sls/types/sls.types';
import type { Campana } from '../types/crm.types';
import type { Lead, LeadCreate, LeadUpdate } from '../types/crm.types';
import { CrmPageLayout } from '../components/CrmPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ORIGENES = ['web', 'telefono', 'referido', 'evento', 'campana', 'redes_sociales'] as const;
const CALIFICACIONES = ['caliente', 'tibio', 'frio'] as const;
const ESTADOS_LEAD = ['nuevo', 'contactado', 'calificado', 'convertido', 'descartado'] as const;

const DEFAULT: LeadCreate = {
  empresa_id: '',
  nombre_completo: '',
  origen_lead: 'web',
  estado: 'nuevo',
};

export default function LeadsPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [list, setList] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<LeadUpdate>({});
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

  const loadCampanas = useCallback(async () => {
    try {
      const data = await campanaService.list({});
      setCampanas(data);
    } catch {
      setCampanas([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; estado?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await leadService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadClientes(); }, [loadClientes]);
  useEffect(() => { loadCampanas(); }, [loadCampanas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '' });
    setCreateOpen(true);
  };

  const openEdit = (row: Lead) => {
    setEditing(row);
    setEditForm({
      nombre_completo: row.nombre_completo,
      empresa_nombre: row.empresa_nombre ?? undefined,
      cargo: row.cargo ?? undefined,
      telefono: row.telefono ?? undefined,
      telefono_movil: row.telefono_movil ?? undefined,
      email: row.email ?? undefined,
      direccion: row.direccion ?? undefined,
      ciudad: row.ciudad ?? undefined,
      pais: row.pais ?? undefined,
      origen_lead: row.origen_lead as LeadUpdate['origen_lead'],
      campana_id: row.campana_id ?? undefined,
      calificacion: (row.calificacion as LeadUpdate['calificacion']) ?? undefined,
      puntuacion: row.puntuacion ?? undefined,
      asignado_vendedor_nombre: row.asignado_vendedor_nombre ?? undefined,
      estado: (row.estado as LeadUpdate['estado']) ?? undefined,
      convertido_cliente: row.convertido_cliente,
      cliente_venta_id: row.cliente_venta_id ?? undefined,
      motivo_descarte: row.motivo_descarte ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.nombre_completo.trim()) {
      toast.error('Completa empresa y nombre.');
      return;
    }
    setSubmitting(true);
    try {
      await leadService.create(form);
      toast.success('Lead creado.');
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
      await leadService.update(editing.lead_id, editForm);
      toast.success('Lead actualizado.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const clienteNombre = (id: string | null | undefined) =>
    id ? (clientes.find((c) => c.cliente_venta_id === id)?.razon_social ?? id) : '-';

  return (
    <CrmPageLayout
      title="Leads"
      description="Prospectos con lead scoring; convertir a cliente cuando esté calificado."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Crear lead
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
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ESTADOS_LEAD.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, empresa o email..."
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email / Tel</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Origen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Calif. / Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Target className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay leads.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.lead_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.nombre_completo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.empresa_nombre ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.email ?? row.telefono_movil ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.origen_lead}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.calificacion ?? '-'} / {row.estado ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.convertido_cliente ? clienteNombre(row.cliente_venta_id) : '-'}</td>
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
          <DialogHeader><DialogTitle>Crear lead</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Nombre completo *</Label><input type="text" value={form.nombre_completo} onChange={(e) => setForm((p) => ({ ...p, nombre_completo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Empresa (prospecto)</Label><input type="text" value={form.empresa_nombre ?? ''} onChange={(e) => setForm((p) => ({ ...p, empresa_nombre: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Cargo</Label><input type="text" value={form.cargo ?? ''} onChange={(e) => setForm((p) => ({ ...p, cargo: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Email</Label><input type="email" value={form.email ?? ''} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Teléfono móvil</Label><input type="text" value={form.telefono_movil ?? ''} onChange={(e) => setForm((p) => ({ ...p, telefono_movil: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Origen *</Label><select value={form.origen_lead} onChange={(e) => setForm((p) => ({ ...p, origen_lead: e.target.value as LeadCreate['origen_lead'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ORIGENES.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
              <div><Label>Campaña</Label><select value={form.campana_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, campana_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{campanas.map((c) => <option key={c.campana_id} value={c.campana_id}>{c.nombre}</option>)}</select></div>
              <div><Label>Calificación</Label><select value={form.calificacion ?? ''} onChange={(e) => setForm((p) => ({ ...p, calificacion: (e.target.value || undefined) as LeadCreate['calificacion'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{CALIFICACIONES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><Label>Puntuación (0-100)</Label><input type="number" min="0" max="100" value={form.puntuacion ?? ''} onChange={(e) => setForm((p) => ({ ...p, puntuacion: e.target.value ? parseInt(e.target.value, 10) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Observaciones</Label><textarea value={form.observaciones ?? ''} onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar lead</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><Label>Nombre completo *</Label><input type="text" value={editForm.nombre_completo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre_completo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Email</Label><input type="email" value={editForm.email ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Teléfono móvil</Label><input type="text" value={editForm.telefono_movil ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, telefono_movil: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Calificación</Label><select value={editForm.calificacion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, calificacion: (e.target.value || undefined) as LeadUpdate['calificacion'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{CALIFICACIONES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as LeadUpdate['estado'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS_LEAD.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              {editForm.estado === 'convertido' && (
                <div className="md:col-span-2"><Label>Cliente (ventas)</Label><select value={editForm.cliente_venta_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cliente_venta_id: e.target.value || undefined, convertido_cliente: !!e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{clientes.map((c) => <option key={c.cliente_venta_id} value={c.cliente_venta_id}>{c.razon_social}</option>)}</select></div>
              )}
              {editForm.estado === 'descartado' && (
                <div className="md:col-span-2"><Label>Motivo descarte</Label><input type="text" value={editForm.motivo_descarte ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, motivo_descarte: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              )}
              <div className="md:col-span-2"><Label>Observaciones</Label><textarea value={editForm.observaciones ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </CrmPageLayout>
  );
}
