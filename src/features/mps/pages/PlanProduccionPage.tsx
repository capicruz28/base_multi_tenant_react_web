/**
 * Plan de Producción MPS — Listado y gestión. GET/POST/PUT /api/v1/mps/plan-produccion
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Calendar, Plus, Pencil, Search, Eye } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { planProduccionService, planProduccionDetalleService } from '../services/mps.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { PlanProduccion, PlanProduccionCreate, PlanProduccionUpdate } from '../types/mps.types';
import type { PlanProduccionDetalle } from '../types/mps.types';
import { MpsPageLayout } from '../components/MpsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ESTADOS_PLAN = ['borrador', 'aprobado', 'ejecutado', 'cerrado'] as const;

const DEFAULT: PlanProduccionCreate = {
  empresa_id: '',
  codigo_plan: '',
  nombre: '',
  fecha_inicio: '',
  fecha_fin: '',
  estado: 'borrador',
};

export default function PlanProduccionPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [list, setList] = useState<PlanProduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PlanProduccion | null>(null);
  const [form, setForm] = useState<PlanProduccionCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<PlanProduccionUpdate>({});
  const [submitting, setSubmitting] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleLines, setDetalleLines] = useState<PlanProduccionDetalle[]>([]);
  const [detalleLoading, setDetalleLoading] = useState(false);

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
      const params: { empresa_id?: string; estado?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await planProduccionService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter, searchTerm]);

  const loadDetalle = useCallback(async (planProduccionId: string) => {
    setDetalleOpen(true);
    setDetalleLoading(true);
    try {
      const data = await planProduccionDetalleService.list({
        plan_produccion_id: planProduccionId,
      });
      setDetalleLines(data);
    } catch {
      setDetalleLines([]);
    } finally {
      setDetalleLoading(false);
    }
  }, []);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      fecha_inicio: new Date().toISOString().slice(0, 10),
      fecha_fin: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
    setCreateOpen(true);
  };

  const openEdit = (row: PlanProduccion) => {
    setEditing(row);
    setEditForm({
      codigo_plan: row.codigo_plan,
      nombre: row.nombre,
      fecha_inicio: row.fecha_inicio,
      fecha_fin: row.fecha_fin,
      estado: (row.estado as PlanProduccionCreate['estado']) ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await planProduccionService.create(form);
      toast.success('Plan de producción creado.');
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
      await planProduccionService.update(editing.plan_produccion_id, editForm);
      toast.success('Plan de producción actualizado.');
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
    <MpsPageLayout
      title="Plan de Producción"
      description="Plan maestro de producción (MPS): qué, cuánto y cuándo producir."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo plan
        </Button>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        {empresas.length > 0 && (
          <div>
            <Label className="mr-2">Empresa</Label>
            <select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Todas</option>
              {empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ESTADOS_PLAN.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <Label className="mr-2">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Código, nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" />
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Período</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay planes de producción.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.plan_produccion_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_plan}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_inicio} — {row.fecha_fin}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '—'}</td>
                    <td className="px-4 py-3 text-center flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => loadDetalle(row.plan_produccion_id)} className="text-brand-primary hover:text-brand-primary/80" title="Ver detalle"><Eye className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>Nuevo plan de producción</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Código plan *</Label><input type="text" value={form.codigo_plan} onChange={(e) => setForm((p) => ({ ...p, codigo_plan: e.target.value }))} className={inputCls} required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha inicio *</Label><input type="date" value={form.fecha_inicio} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha fin *</Label><input type="date" value={form.fecha_fin} onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Estado</Label><select value={form.estado ?? 'borrador'} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as PlanProduccionCreate['estado'] }))} className={selectCls}>{ESTADOS_PLAN.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar plan de producción</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código plan *</Label><input type="text" value={editForm.codigo_plan ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_plan: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha inicio *</Label><input type="date" value={editForm.fecha_inicio ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_inicio: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha fin *</Label><input type="date" value={editForm.fecha_fin ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_fin: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as PlanProduccionCreate['estado'] }))} className={selectCls}>{ESTADOS_PLAN.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalle del plan de producción</DialogTitle></DialogHeader>
          {detalleLoading && <div className="flex justify-center py-8"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
          {!detalleLoading && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Período</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pronóst. demanda</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cant. planif.</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cant. produc.</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">% uso capacidad</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {detalleLines.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Sin líneas de detalle.</td></tr>
                  ) : (
                    detalleLines.map((line) => (
                      <tr key={line.plan_detalle_id}>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.producto_id}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.fecha_inicio} — {line.fecha_fin}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.pronostico_demanda ?? '—'}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.cantidad_planificada}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.cantidad_producida ?? '—'}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.porcentaje_uso_capacidad != null ? `${line.porcentaje_uso_capacidad.toFixed(1)}%` : '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MpsPageLayout>
  );
}
