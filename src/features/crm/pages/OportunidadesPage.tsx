/**
 * Oportunidades CRM — Listado y gestión. GET/POST /api/v1/crm/oportunidades
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Briefcase, Plus, Pencil, Search } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { clienteService } from '@/features/sls/services/sls.service';
import { campanaService, leadService, oportunidadService } from '../services/crm.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Cliente } from '@/features/sls/types/sls.types';
import type { Campana } from '../types/crm.types';
import type { Lead } from '../types/crm.types';
import type { Oportunidad, OportunidadCreate, OportunidadUpdate } from '../types/crm.types';
import { CrmPageLayout } from '../components/CrmPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ETAPAS = ['calificacion', 'necesidad_analisis', 'propuesta', 'negociacion', 'cierre'] as const;
const ESTADOS_OP = ['abierta', 'ganada', 'perdida', 'cancelada'] as const;
const TIPOS_OP = ['nuevo_negocio', 'upselling', 'cross_selling', 'renovacion'] as const;

const DEFAULT: OportunidadCreate = {
  empresa_id: '',
  numero_oportunidad: '',
  nombre: '',
  vendedor_usuario_id: '',
  monto_estimado: 0,
  etapa: 'calificacion',
  tipo_oportunidad: 'nuevo_negocio',
  estado: 'abierta',
};

export default function OportunidadesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [list, setList] = useState<Oportunidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [etapaFilter, setEtapaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Oportunidad | null>(null);
  const [form, setForm] = useState<OportunidadCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<OportunidadUpdate>({});
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

  const loadLeads = useCallback(async () => {
    try {
      const data = await leadService.list({});
      setLeads(data);
    } catch {
      setLeads([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; etapa?: string; estado?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (etapaFilter) params.etapa = etapaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await oportunidadService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, etapaFilter, estadoFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadClientes(); }, [loadClientes]);
  useEffect(() => { loadCampanas(); }, [loadCampanas]);
  useEffect(() => { loadLeads(); }, [loadLeads]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '' });
    setCreateOpen(true);
  };

  const openEdit = (row: Oportunidad) => {
    setEditing(row);
    setEditForm({
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      monto_estimado: row.monto_estimado,
      probabilidad_cierre: row.probabilidad_cierre ?? undefined,
      fecha_cierre_estimada: row.fecha_cierre_estimada ?? undefined,
      fecha_cierre_real: row.fecha_cierre_real ?? undefined,
      etapa: (row.etapa as OportunidadUpdate['etapa']) ?? undefined,
      tipo_oportunidad: (row.tipo_oportunidad as OportunidadUpdate['tipo_oportunidad']) ?? undefined,
      estado: (row.estado as OportunidadUpdate['estado']) ?? undefined,
      motivo_ganada: row.motivo_ganada ?? undefined,
      motivo_perdida: row.motivo_perdida ?? undefined,
      observaciones: row.observaciones ?? undefined,
      proxima_accion: row.proxima_accion ?? undefined,
      fecha_proxima_accion: row.fecha_proxima_accion ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.numero_oportunidad.trim() || !form.nombre.trim()) {
      toast.error('Completa empresa, número y nombre.');
      return;
    }
    if (!form.vendedor_usuario_id?.trim()) {
      toast.error('Indica el vendedor (puedes usar un identificador o nombre).');
      return;
    }
    setSubmitting(true);
    try {
      await oportunidadService.create(form);
      toast.success('Oportunidad creada.');
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
      await oportunidadService.update(editing.oportunidad_id, editForm);
      toast.success('Oportunidad actualizada.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatMoney = (n: number | null | undefined, moneda?: string | null) =>
    n != null ? `${moneda ?? 'PEN'} ${n.toLocaleString()}` : '-';

  const clienteNombre = (id: string | null | undefined) =>
    id ? (clientes.find((c) => c.cliente_venta_id === id)?.razon_social ?? id) : '-';

  return (
    <CrmPageLayout
      title="Oportunidades"
      description="Pipeline de ventas: calificación, propuesta, negociación y cierre (ganada/perdida)."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Crear oportunidad
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
          <Label className="mr-2">Etapa</Label>
          <select value={etapaFilter} onChange={(e) => setEtapaFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todas</option>
            {ETAPAS.map((et) => <option key={et} value={et}>{et}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ESTADOS_OP.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, número o cliente..."
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Monto / Prob.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Etapa / Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Briefcase className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay oportunidades.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.oportunidad_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_oportunidad}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{clienteNombre(row.cliente_venta_id) ?? row.nombre_cliente_prospecto ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatMoney(row.monto_estimado, row.moneda)} / {row.probabilidad_cierre ?? '-'}%</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.etapa} / {row.estado ?? '-'}</td>
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
          <DialogHeader><DialogTitle>Crear oportunidad</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Número *</Label><input type="text" value={form.numero_oportunidad} onChange={(e) => setForm((p) => ({ ...p, numero_oportunidad: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Cliente (ventas)</Label><select value={form.cliente_venta_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, cliente_venta_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{clientes.map((c) => <option key={c.cliente_venta_id} value={c.cliente_venta_id}>{c.razon_social}</option>)}</select></div>
              <div><Label>Lead</Label><select value={form.lead_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, lead_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{leads.filter((l) => l.estado === 'calificado' || l.estado === 'convertido').map((l) => <option key={l.lead_id} value={l.lead_id}>{l.nombre_completo} – {l.empresa_nombre ?? ''}</option>)}</select></div>
              <div><Label>Vendedor (ID o nombre) *</Label><input type="text" value={form.vendedor_nombre ?? form.vendedor_usuario_id} onChange={(e) => setForm((p) => ({ ...p, vendedor_usuario_id: e.target.value || '', vendedor_nombre: e.target.value || undefined }))} placeholder="ID usuario o nombre" className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Campaña</Label><select value={form.campana_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, campana_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{campanas.map((c) => <option key={c.campana_id} value={c.campana_id}>{c.nombre}</option>)}</select></div>
              <div><Label>Monto estimado *</Label><input type="number" step="0.01" min="0" value={form.monto_estimado || ''} onChange={(e) => setForm((p) => ({ ...p, monto_estimado: parseFloat(e.target.value) || 0 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Probabilidad cierre %</Label><input type="number" min="0" max="100" value={form.probabilidad_cierre ?? ''} onChange={(e) => setForm((p) => ({ ...p, probabilidad_cierre: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Fecha apertura</Label><input type="date" value={form.fecha_apertura ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_apertura: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Fecha cierre estimada</Label><input type="date" value={form.fecha_cierre_estimada ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_cierre_estimada: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Etapa *</Label><select value={form.etapa} onChange={(e) => setForm((p) => ({ ...p, etapa: e.target.value as OportunidadCreate['etapa'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ETAPAS.map((et) => <option key={et} value={et}>{et}</option>)}</select></div>
              <div><Label>Tipo</Label><select value={form.tipo_oportunidad ?? ''} onChange={(e) => setForm((p) => ({ ...p, tipo_oportunidad: (e.target.value || undefined) as OportunidadCreate['tipo_oportunidad'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{TIPOS_OP.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="md:col-span-2"><Label>Próxima acción</Label><input type="text" value={form.proxima_accion ?? ''} onChange={(e) => setForm((p) => ({ ...p, proxima_accion: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar oportunidad</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Monto estimado</Label><input type="number" step="0.01" min="0" value={editForm.monto_estimado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, monto_estimado: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Probabilidad %</Label><input type="number" min="0" max="100" value={editForm.probabilidad_cierre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, probabilidad_cierre: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Etapa</Label><select value={editForm.etapa ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, etapa: e.target.value as OportunidadUpdate['etapa'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ETAPAS.map((et) => <option key={et} value={et}>{et}</option>)}</select></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as OportunidadUpdate['estado'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS_OP.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              {editForm.estado === 'ganada' && <div className="md:col-span-2"><Label>Motivo ganada</Label><input type="text" value={editForm.motivo_ganada ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, motivo_ganada: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>}
              {editForm.estado === 'perdida' && <div className="md:col-span-2"><Label>Motivo perdida</Label><input type="text" value={editForm.motivo_perdida ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, motivo_perdida: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>}
              <div className="md:col-span-2"><Label>Observaciones</Label><textarea value={editForm.observaciones ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </CrmPageLayout>
  );
}
