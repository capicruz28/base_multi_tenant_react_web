/**
 * Órdenes de Trabajo MNT — Listado y gestión. GET/POST/PUT /api/v1/mnt/ordenes-trabajo
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, ClipboardList, Plus, Pencil } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { activoService, planMantenimientoService, ordenTrabajoService } from '../services/mnt.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Activo, PlanMantenimiento } from '../types/mnt.types';
import type { OrdenTrabajo, OrdenTrabajoCreate, OrdenTrabajoUpdate } from '../types/mnt.types';
import { MntPageLayout } from '../components/MntPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_OT = ['preventivo', 'correctivo', 'predictivo', 'modificacion'] as const;
const PRIORIDADES = ['urgente', 'alta', 'media', 'baja'] as const;
const ESTADOS_OT = ['solicitada', 'programada', 'en_proceso', 'pausada', 'completada', 'cerrada', 'cancelada'] as const;

const DEFAULT: OrdenTrabajoCreate = {
  empresa_id: '',
  numero_ot: '',
  activo_id: '',
  tipo_mantenimiento: 'correctivo',
  trabajo_a_realizar: '',
  prioridad: 'media',
  estado: 'solicitada',
};

export default function OrdenesTrabajoPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [activos, setActivos] = useState<Activo[]>([]);
  const [list, setList] = useState<OrdenTrabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [activoFilter, setActivoFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<OrdenTrabajo | null>(null);
  const [form, setForm] = useState<OrdenTrabajoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<OrdenTrabajoUpdate>({});
  const [submitting, setSubmitting] = useState(false);
  const [planes, setPlanes] = useState<PlanMantenimiento[]>([]);

  const loadEmpresas = useCallback(async () => {
    try {
      const data = await empresaService.list({ solo_activos: true });
      setEmpresas(data);
      if (data.length === 1 && !empresaFilter) setEmpresaFilter(data[0].empresa_id);
    } catch {
      setEmpresas([]);
    }
  }, [empresaFilter]);

  const loadActivos = useCallback(async () => {
    try {
      const data = await activoService.list({ es_activo: true });
      setActivos(data);
    } catch {
      setActivos([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; activo_id?: string; estado?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (activoFilter) params.activo_id = activoFilter;
      if (estadoFilter) params.estado = estadoFilter;
      const data = await ordenTrabajoService.list(
        Object.keys(params).length ? params : undefined
      );
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, activoFilter, estadoFilter]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadActivos(); }, [loadActivos]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const loadPlanesForActivo = useCallback(async (activoId: string) => {
    try {
      const data = await planMantenimientoService.list({ activo_id: activoId, es_activo: true });
      setPlanes(data);
    } catch {
      setPlanes([]);
    }
  }, []);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      activo_id: activos[0]?.activo_id ?? '',
    });
    setPlanes([]);
    if (activos[0]?.activo_id) loadPlanesForActivo(activos[0].activo_id);
    setCreateOpen(true);
  };

  const openEdit = (row: OrdenTrabajo) => {
    setEditing(row);
    setEditForm({
      activo_id: row.activo_id,
      plan_mantenimiento_id: row.plan_mantenimiento_id ?? undefined,
      tipo_mantenimiento: row.tipo_mantenimiento,
      prioridad: (row.prioridad as OrdenTrabajoCreate['prioridad']) ?? undefined,
      problema_detectado: row.problema_detectado ?? undefined,
      trabajo_a_realizar: row.trabajo_a_realizar,
      tecnico_nombre: row.tecnico_nombre ?? undefined,
      fecha_programada: row.fecha_programada ?? undefined,
      fecha_inicio_real: row.fecha_inicio_real ?? undefined,
      fecha_fin_real: row.fecha_fin_real ?? undefined,
      trabajo_realizado: row.trabajo_realizado ?? undefined,
      costo_mano_obra: row.costo_mano_obra ?? undefined,
      costo_repuestos: row.costo_repuestos ?? undefined,
      costo_servicios_terceros: row.costo_servicios_terceros ?? undefined,
      estado: row.estado ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ordenTrabajoService.create(form);
      toast.success('Orden de trabajo creada.');
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
      await ordenTrabajoService.update(editing.orden_trabajo_id, editForm);
      toast.success('Orden de trabajo actualizada.');
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

  const getActivoNombre = (id: string) => activos.find((a) => a.activo_id === id)?.codigo_activo ?? id;

  return (
    <MntPageLayout
      title="Órdenes de Trabajo"
      description="OT de mantenimiento: preventivo, correctivo, predictivo."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length || !activos.length}>
          <Plus className="h-4 w-4 mr-2" /> Nueva OT
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
          <Label className="mr-2">Activo</Label>
          <select value={activoFilter} onChange={(e) => setActivoFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {activos.map((a) => <option key={a.activo_id} value={a.activo_id}>{a.codigo_activo} – {a.nombre}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {ESTADOS_OT.map((s) => <option key={s} value={s}>{s}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nº OT</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Activo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Prioridad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Programada</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Costo total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay órdenes de trabajo.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.orden_trabajo_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_ot}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getActivoNombre(row.activo_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_mantenimiento}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.prioridad ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_programada ? String(row.fecha_programada).slice(0, 10) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.costo_total != null ? row.costo_total : '—'}</td>
                    <td className="px-4 py-3 text-center"><Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80"><Pencil className="h-4 w-4" /></Button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva orden de trabajo</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Nº OT *</Label><input type="text" value={form.numero_ot} onChange={(e) => setForm((p) => ({ ...p, numero_ot: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Activo *</Label><select value={form.activo_id} onChange={(e) => { setForm((p) => ({ ...p, activo_id: e.target.value, plan_mantenimiento_id: undefined })); loadPlanesForActivo(e.target.value); }} className={selectCls} required><option value="">Seleccionar</option>{activos.map((a) => <option key={a.activo_id} value={a.activo_id}>{a.codigo_activo} – {a.nombre}</option>)}</select></div>
              <div><Label>Plan mantenimiento</Label><select value={form.plan_mantenimiento_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, plan_mantenimiento_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{planes.map((p) => <option key={p.plan_mantenimiento_id} value={p.plan_mantenimiento_id}>{p.codigo_plan} – {p.nombre}</option>)}</select></div>
              <div><Label>Tipo *</Label><select value={form.tipo_mantenimiento} onChange={(e) => setForm((p) => ({ ...p, tipo_mantenimiento: e.target.value }))} className={selectCls} required>{TIPOS_OT.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Prioridad</Label><select value={form.prioridad ?? 'media'} onChange={(e) => setForm((p) => ({ ...p, prioridad: e.target.value as OrdenTrabajoCreate['prioridad'] }))} className={selectCls}>{PRIORIDADES.map((pr) => <option key={pr} value={pr}>{pr}</option>)}</select></div>
              <div className="md:col-span-2"><Label>Trabajo a realizar *</Label><textarea value={form.trabajo_a_realizar} onChange={(e) => setForm((p) => ({ ...p, trabajo_a_realizar: e.target.value }))} className={inputCls} rows={2} required /></div>
              <div><Label>Técnico</Label><input type="text" value={form.tecnico_nombre ?? ''} onChange={(e) => setForm((p) => ({ ...p, tecnico_nombre: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Fecha programada</Label><input type="datetime-local" value={form.fecha_programada ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_programada: e.target.value || undefined }))} className={inputCls} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar orden de trabajo</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value }))} className={selectCls}>{ESTADOS_OT.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><Label>Fecha programada</Label><input type="datetime-local" value={editForm.fecha_programada ? String(editForm.fecha_programada).slice(0, 16) : ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_programada: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Fecha inicio real</Label><input type="datetime-local" value={editForm.fecha_inicio_real ? String(editForm.fecha_inicio_real).slice(0, 16) : ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_inicio_real: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Fecha fin real</Label><input type="datetime-local" value={editForm.fecha_fin_real ? String(editForm.fecha_fin_real).slice(0, 16) : ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_fin_real: e.target.value || undefined }))} className={inputCls} /></div>
              <div className="md:col-span-2"><Label>Trabajo realizado</Label><textarea value={editForm.trabajo_realizado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, trabajo_realizado: e.target.value || undefined }))} className={inputCls} rows={2} /></div>
              <div><Label>Costo mano obra</Label><input type="number" step="0.01" min={0} value={editForm.costo_mano_obra ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, costo_mano_obra: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Costo repuestos</Label><input type="number" step="0.01" min={0} value={editForm.costo_repuestos ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, costo_repuestos: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MntPageLayout>
  );
}
