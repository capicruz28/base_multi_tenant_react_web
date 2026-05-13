/**
 * Vacaciones HCM — Listado y gestión. GET/POST/PUT /api/v1/hcm/vacaciones
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Palmtree, Plus, Pencil } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { empleadoService } from '../services/hcm.service';
import { vacacionesService } from '../services/hcm.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Empleado } from '../types/hcm.types';
import type { Vacaciones, VacacionesCreate, VacacionesUpdate } from '../types/hcm.types';
import { HcmPageLayout } from '../components/HcmPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ESTADOS_VAC = ['pendiente', 'programada', 'aprobada', 'en_curso', 'completada', 'vencida'] as const;
const currentYear = new Date().getFullYear();

const DEFAULT: VacacionesCreate = {
  empresa_id: '',
  empleado_id: '',
  año_periodo: currentYear,
  fecha_inicio_periodo: '',
  fecha_fin_periodo: '',
  dias_ganados: 30,
  estado: 'pendiente',
};

export default function VacacionesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [list, setList] = useState<Vacaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [empleadoFilter, setEmpleadoFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Vacaciones | null>(null);
  const [form, setForm] = useState<VacacionesCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<VacacionesUpdate>({});
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

  const loadEmpleados = useCallback(async () => {
    if (!empresaFilter) { setEmpleados([]); return; }
    try {
      const data = await empleadoService.list({ empresa_id: empresaFilter, es_activo: true });
      setEmpleados(data);
    } catch {
      setEmpleados([]);
    }
  }, [empresaFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; empleado_id?: string; estado?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (empleadoFilter) params.empleado_id = empleadoFilter;
      if (estadoFilter) params.estado = estadoFilter;
      const data = await vacacionesService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, empleadoFilter, estadoFilter]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadEmpleados(); }, [loadEmpleados]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      empleado_id: (empleadoFilter || empleados[0]?.empleado_id) ?? '',
      fecha_inicio_periodo: `${currentYear}-01-01`,
      fecha_fin_periodo: `${currentYear}-12-31`,
    });
    setCreateOpen(true);
  };

  const openEdit = (row: Vacaciones) => {
    setEditing(row);
    setEditForm({
      dias_ganados: row.dias_ganados ?? undefined,
      dias_tomados: row.dias_tomados ?? undefined,
      fecha_inicio_programada: row.fecha_inicio_programada ?? undefined,
      fecha_fin_programada: row.fecha_fin_programada ?? undefined,
      estado: (row.estado as VacacionesUpdate['estado']) ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.empleado_id || !form.fecha_inicio_periodo || !form.fecha_fin_periodo) {
      toast.error('Completa empresa, empleado y fechas del periodo.');
      return;
    }
    setSubmitting(true);
    try {
      await vacacionesService.create(form);
      toast.success('Vacaciones registradas.');
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
      await vacacionesService.update(editing.vacaciones_id, editForm);
      toast.success('Vacaciones actualizadas.');
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
    <HcmPageLayout
      title="Vacaciones"
      description="Control de días ganados, programados y tomados por empleado y año."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length || !empleados.length}>
          <Plus className="h-4 w-4 mr-2" /> Registrar vacaciones
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
          <Label className="mr-2">Empleado</Label>
          <select value={empleadoFilter} onChange={(e) => setEmpleadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {empleados.map((emp) => <option key={emp.empleado_id} value={emp.empleado_id}>{emp.nombre_completo ?? `${emp.apellido_paterno} ${emp.apellido_materno}`}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ESTADOS_VAC.map((s) => <option key={s} value={s}>{s}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Año</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Empleado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Días ganados</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Días tomados</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Programada</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Palmtree className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay registros de vacaciones.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.vacaciones_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{row.año_periodo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.empleado_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.dias_ganados ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.dias_tomados ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_inicio_programada ?? '—'} / {row.fecha_fin_programada ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado}</td>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar vacaciones</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Empleado *</Label><select value={form.empleado_id} onChange={(e) => setForm((p) => ({ ...p, empleado_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empleados.map((emp) => <option key={emp.empleado_id} value={emp.empleado_id}>{emp.nombre_completo ?? `${emp.apellido_paterno} ${emp.apellido_materno}`}</option>)}</select></div>
              <div><Label>Año periodo *</Label><input type="number" min={currentYear - 2} max={currentYear + 1} value={form.año_periodo} onChange={(e) => setForm((p) => ({ ...p, año_periodo: parseInt(e.target.value, 10) }))} className={inputCls} required /></div>
              <div><Label>Fecha inicio periodo *</Label><input type="date" value={form.fecha_inicio_periodo} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio_periodo: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha fin periodo *</Label><input type="date" value={form.fecha_fin_periodo} onChange={(e) => setForm((p) => ({ ...p, fecha_fin_periodo: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Días ganados</Label><input type="number" min={0} value={form.dias_ganados ?? 30} onChange={(e) => setForm((p) => ({ ...p, dias_ganados: parseInt(e.target.value, 10) || undefined }))} className={inputCls} /></div>
              <div><Label>Estado</Label><select value={form.estado ?? 'pendiente'} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as VacacionesCreate['estado'] }))} className={selectCls}>{ESTADOS_VAC.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar vacaciones</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div><Label>Días ganados</Label><input type="number" min={0} value={editForm.dias_ganados ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, dias_ganados: e.target.value ? parseInt(e.target.value, 10) : undefined }))} className={inputCls} /></div>
              <div><Label>Días tomados</Label><input type="number" min={0} value={editForm.dias_tomados ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, dias_tomados: e.target.value ? parseInt(e.target.value, 10) : undefined }))} className={inputCls} /></div>
              <div><Label>Fecha inicio programada</Label><input type="date" value={editForm.fecha_inicio_programada ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_inicio_programada: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Fecha fin programada</Label><input type="date" value={editForm.fecha_fin_programada ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_fin_programada: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as VacacionesUpdate['estado'] }))} className={selectCls}>{ESTADOS_VAC.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </HcmPageLayout>
  );
}
