/**
 * Asistencia HCM — Listado y registro de marcaciones. GET/POST/PUT /api/v1/hcm/asistencia
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, CalendarCheck, Plus, Pencil } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { empleadoService } from '../services/hcm.service';
import { asistenciaService } from '../services/hcm.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Empleado } from '../types/hcm.types';
import type { Asistencia, AsistenciaCreate, AsistenciaUpdate } from '../types/hcm.types';
import { HcmPageLayout } from '../components/HcmPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_ASISTENCIA = ['presente', 'falta', 'tardanza', 'licencia', 'vacaciones', 'descanso_medico'] as const;

const DEFAULT: AsistenciaCreate = {
  empresa_id: '',
  empleado_id: '',
  fecha: new Date().toISOString().slice(0, 10),
  tipo_asistencia: 'presente',
};

export default function AsistenciaPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [list, setList] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [empleadoFilter, setEmpleadoFilter] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [fechaHasta, setFechaHasta] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Asistencia | null>(null);
  const [form, setForm] = useState<AsistenciaCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<AsistenciaUpdate>({});
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
      const params: { empresa_id?: string; empleado_id?: string; fecha_desde?: string; fecha_hasta?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (empleadoFilter) params.empleado_id = empleadoFilter;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      const data = await asistenciaService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, empleadoFilter, fechaDesde, fechaHasta]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadEmpleados(); }, [loadEmpleados]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      empleado_id: (empleadoFilter || empleados[0]?.empleado_id) ?? '',
      fecha: new Date().toISOString().slice(0, 10),
    });
    setCreateOpen(true);
  };

  const openEdit = (row: Asistencia) => {
    setEditing(row);
    setEditForm({
      fecha: row.fecha,
      hora_entrada: row.hora_entrada ?? undefined,
      hora_salida: row.hora_salida ?? undefined,
      horas_trabajadas: row.horas_trabajadas ?? undefined,
      horas_extras: row.horas_extras ?? undefined,
      tipo_asistencia: (row.tipo_asistencia as AsistenciaUpdate['tipo_asistencia']) ?? undefined,
      minutos_tardanza: row.minutos_tardanza ?? undefined,
      justificacion: row.justificacion ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.empleado_id || !form.fecha) {
      toast.error('Completa empresa, empleado y fecha.');
      return;
    }
    setSubmitting(true);
    try {
      await asistenciaService.create(form);
      toast.success('Asistencia registrada.');
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
      await asistenciaService.update(editing.asistencia_id, editForm);
      toast.success('Asistencia actualizada.');
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
      title="Asistencia"
      description="Registro de marcaciones de entrada/salida por empleado y fecha."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length || !empleados.length}>
          <Plus className="h-4 w-4 mr-2" /> Registrar asistencia
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
          <Label className="mr-2">Desde</Label>
          <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" />
        </div>
        <div>
          <Label className="mr-2">Hasta</Label>
          <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" />
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !loading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Empleado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Entrada</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Salida</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Horas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><CalendarCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay registros de asistencia.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.asistencia_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{row.fecha}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.empleado_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.hora_entrada ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.hora_salida ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.horas_trabajadas ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_asistencia}</td>
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
          <DialogHeader><DialogTitle>Registrar asistencia</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Empleado *</Label><select value={form.empleado_id} onChange={(e) => setForm((p) => ({ ...p, empleado_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empleados.map((emp) => <option key={emp.empleado_id} value={emp.empleado_id}>{emp.nombre_completo ?? `${emp.apellido_paterno} ${emp.apellido_materno}`}</option>)}</select></div>
              <div><Label>Fecha *</Label><input type="date" value={form.fecha} onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Hora entrada</Label><input type="time" value={form.hora_entrada ?? ''} onChange={(e) => setForm((p) => ({ ...p, hora_entrada: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Hora salida</Label><input type="time" value={form.hora_salida ?? ''} onChange={(e) => setForm((p) => ({ ...p, hora_salida: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Tipo</Label><select value={form.tipo_asistencia ?? 'presente'} onChange={(e) => setForm((p) => ({ ...p, tipo_asistencia: e.target.value as AsistenciaCreate['tipo_asistencia'] }))} className={selectCls}>{TIPOS_ASISTENCIA.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Justificación</Label><input type="text" value={form.justificacion ?? ''} onChange={(e) => setForm((p) => ({ ...p, justificacion: e.target.value || undefined }))} className={inputCls} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Registrar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar asistencia</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div><Label>Fecha *</Label><input type="date" value={editForm.fecha ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Hora entrada</Label><input type="time" value={editForm.hora_entrada ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, hora_entrada: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Hora salida</Label><input type="time" value={editForm.hora_salida ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, hora_salida: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Tipo</Label><select value={editForm.tipo_asistencia ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_asistencia: e.target.value as AsistenciaUpdate['tipo_asistencia'] }))} className={selectCls}>{TIPOS_ASISTENCIA.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Justificación</Label><input type="text" value={editForm.justificacion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, justificacion: e.target.value || undefined }))} className={inputCls} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </HcmPageLayout>
  );
}
