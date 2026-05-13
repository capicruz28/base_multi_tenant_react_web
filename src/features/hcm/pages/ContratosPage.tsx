/**
 * Contratos HCM — Listado y gestión. GET/POST/PUT /api/v1/hcm/contratos
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, FileText, Plus, Pencil } from 'lucide-react';
import { empresaService, cargoService } from '@/features/org/services/org.service';
import { empleadoService } from '../services/hcm.service';
import { contratoService } from '../services/hcm.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Cargo } from '@/features/org/types/org.types';
import type { Empleado } from '../types/hcm.types';
import type { Contrato, ContratoCreate, ContratoUpdate } from '../types/hcm.types';
import { HcmPageLayout } from '../components/HcmPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_CONTRATO = ['plazo_indeterminado', 'plazo_fijo', 'part_time', 'locacion_servicios', 'practicas'] as const;
const ESTADOS_CONTRATO = ['vigente', 'vencido', 'rescindido'] as const;

const DEFAULT: ContratoCreate = {
  empresa_id: '',
  empleado_id: '',
  numero_contrato: '',
  tipo_contrato: 'plazo_indeterminado',
  fecha_inicio: '',
  remuneracion_basica: 0,
  moneda: 'PEN',
  tipo_remuneracion: 'mensual',
  tiene_cts: true,
  tiene_gratificacion: true,
  estado_contrato: 'vigente',
};

export default function ContratosPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [list, setList] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [empleadoFilter, setEmpleadoFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Contrato | null>(null);
  const [form, setForm] = useState<ContratoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ContratoUpdate>({});
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

  const loadCargos = useCallback(async () => {
    if (!empresaFilter) { setCargos([]); return; }
    try {
      const data = await cargoService.list({ empresa_id: empresaFilter, solo_activos: true });
      setCargos(data);
    } catch {
      setCargos([]);
    }
  }, [empresaFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; empleado_id?: string; estado_contrato?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (empleadoFilter) params.empleado_id = empleadoFilter;
      if (estadoFilter) params.estado_contrato = estadoFilter;
      const data = await contratoService.list(params);
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
  useEffect(() => { loadCargos(); }, [loadCargos]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      empleado_id: (empleadoFilter || empleados[0]?.empleado_id) ?? '',
    });
    setCreateOpen(true);
  };

  const openEdit = (row: Contrato) => {
    setEditing(row);
    setEditForm({
      numero_contrato: row.numero_contrato,
      tipo_contrato: row.tipo_contrato,
      fecha_inicio: row.fecha_inicio,
      fecha_fin: row.fecha_fin ?? undefined,
      cargo_id: row.cargo_id ?? undefined,
      remuneracion_basica: row.remuneracion_basica,
      moneda: row.moneda ?? undefined,
      tipo_remuneracion: row.tipo_remuneracion ?? undefined,
      tiene_cts: row.tiene_cts ?? undefined,
      tiene_gratificacion: row.tiene_gratificacion ?? undefined,
      estado_contrato: (row.estado_contrato as ContratoUpdate['estado_contrato']) ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.empleado_id || !form.numero_contrato.trim() || !form.fecha_inicio || form.remuneracion_basica <= 0) {
      toast.error('Completa empresa, empleado, número, fecha inicio y remuneración.');
      return;
    }
    setSubmitting(true);
    try {
      await contratoService.create(form);
      toast.success('Contrato creado.');
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
      await contratoService.update(editing.contrato_id, editForm);
      toast.success('Contrato actualizado.');
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
      title="Contratos"
      description="Contratos laborales: plazo indeterminado, plazo fijo, part-time; remuneración, CTS y gratificación."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length || !empleados.length}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo contrato
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
            {empleados.map((emp) => <option key={emp.empleado_id} value={emp.empleado_id}>{emp.nombre_completo ?? `${emp.apellido_paterno} ${emp.apellido_materno}, ${emp.nombres}`}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ESTADOS_CONTRATO.map((s) => <option key={s} value={s}>{s}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nº Contrato</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Empleado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vigencia</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Remuneración</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay contratos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.contrato_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_contrato}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.empleado_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_contrato}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_inicio} / {row.fecha_fin ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.moneda ?? 'PEN'} {Number(row.remuneracion_basica).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado_contrato}</td>
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
          <DialogHeader><DialogTitle>Nuevo contrato</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Empleado *</Label><select value={form.empleado_id} onChange={(e) => setForm((p) => ({ ...p, empleado_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empleados.map((emp) => <option key={emp.empleado_id} value={emp.empleado_id}>{emp.nombre_completo ?? `${emp.apellido_paterno} ${emp.apellido_materno}`}</option>)}</select></div>
              <div><Label>Nº contrato *</Label><input type="text" value={form.numero_contrato} onChange={(e) => setForm((p) => ({ ...p, numero_contrato: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo</Label><select value={form.tipo_contrato} onChange={(e) => setForm((p) => ({ ...p, tipo_contrato: e.target.value }))} className={selectCls}>{TIPOS_CONTRATO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Fecha inicio *</Label><input type="date" value={form.fecha_inicio} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha fin</Label><input type="date" value={form.fecha_fin ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Cargo</Label><select value={form.cargo_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, cargo_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{cargos.map((c) => <option key={c.cargo_id} value={c.cargo_id}>{c.nombre}</option>)}</select></div>
              <div><Label>Remuneración básica *</Label><input type="number" step="0.01" min="0" value={form.remuneracion_basica || ''} onChange={(e) => setForm((p) => ({ ...p, remuneracion_basica: parseFloat(e.target.value) || 0 }))} className={inputCls} required /></div>
              <div><Label>Moneda</Label><input type="text" value={form.moneda ?? 'PEN'} onChange={(e) => setForm((p) => ({ ...p, moneda: e.target.value }))} className={inputCls} /></div>
              <div><Label>Tipo remuneración</Label><input type="text" value={form.tipo_remuneracion ?? 'mensual'} onChange={(e) => setForm((p) => ({ ...p, tipo_remuneracion: e.target.value }))} className={inputCls} /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.tiene_cts ?? true} onChange={(e) => setForm((p) => ({ ...p, tiene_cts: e.target.checked }))} className="rounded" /><Label>CTS</Label></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.tiene_gratificacion ?? true} onChange={(e) => setForm((p) => ({ ...p, tiene_gratificacion: e.target.checked }))} className="rounded" /><Label>Gratificación</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar contrato</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nº contrato *</Label><input type="text" value={editForm.numero_contrato ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, numero_contrato: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo</Label><select value={editForm.tipo_contrato ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_contrato: e.target.value }))} className={selectCls}>{TIPOS_CONTRATO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Fecha inicio *</Label><input type="date" value={editForm.fecha_inicio ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_inicio: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha fin</Label><input type="date" value={editForm.fecha_fin ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_fin: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Remuneración *</Label><input type="number" step="0.01" min="0" value={editForm.remuneracion_basica ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, remuneracion_basica: parseFloat(e.target.value) || 0 }))} className={inputCls} required /></div>
              <div><Label>Estado</Label><select value={editForm.estado_contrato ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado_contrato: e.target.value as ContratoUpdate['estado_contrato'] }))} className={selectCls}>{ESTADOS_CONTRATO.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </HcmPageLayout>
  );
}
