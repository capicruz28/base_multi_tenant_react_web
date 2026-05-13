/**
 * Planillas HCM — Listado y gestión. GET/POST/PUT /api/v1/hcm/planillas
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, ClipboardList, Plus, Pencil } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { planillaService } from '../services/hcm.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Planilla, PlanillaCreate, PlanillaUpdate } from '../types/hcm.types';
import { HcmPageLayout } from '../components/HcmPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_PLANILLA = ['mensual', 'quincenal', 'gratificacion', 'cts', 'utilidades'] as const;
const ESTADOS_PLANILLA = ['borrador', 'calculada', 'aprobada', 'pagada', 'cerrada'] as const;
const MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const currentYear = new Date().getFullYear();

const DEFAULT: PlanillaCreate = {
  empresa_id: '',
  numero_planilla: '',
  año: currentYear,
  mes: new Date().getMonth() + 1,
  tipo_planilla: 'mensual',
  fecha_inicio_periodo: '',
  fecha_fin_periodo: '',
  estado: 'borrador',
};

export default function PlanillasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [list, setList] = useState<Planilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Planilla | null>(null);
  const [form, setForm] = useState<PlanillaCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<PlanillaUpdate>({});
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
      const params: { empresa_id?: string; tipo_planilla?: string; estado?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (tipoFilter) params.tipo_planilla = tipoFilter;
      if (estadoFilter) params.estado = estadoFilter;
      const data = await planillaService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, tipoFilter, estadoFilter]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    const mes = new Date().getMonth() + 1;
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      numero_planilla: `PL-${currentYear}-${String(mes).padStart(2, '0')}`,
    });
    setCreateOpen(true);
  };

  const openEdit = (row: Planilla) => {
    setEditing(row);
    setEditForm({
      numero_planilla: row.numero_planilla,
      periodo_descripcion: row.periodo_descripcion ?? undefined,
      tipo_planilla: (row.tipo_planilla as PlanillaUpdate['tipo_planilla']) ?? undefined,
      fecha_inicio_periodo: row.fecha_inicio_periodo,
      fecha_fin_periodo: row.fecha_fin_periodo,
      fecha_pago: row.fecha_pago ?? undefined,
      estado: (row.estado as PlanillaUpdate['estado']) ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.numero_planilla.trim() || !form.fecha_inicio_periodo || !form.fecha_fin_periodo) {
      toast.error('Completa empresa, número y fechas del periodo.');
      return;
    }
    setSubmitting(true);
    try {
      await planillaService.create(form);
      toast.success('Planilla creada.');
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
      await planillaService.update(editing.planilla_id, editForm);
      toast.success('Planilla actualizada.');
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
      title="Planillas"
      description="Planillas mensuales, gratificación, CTS y utilidades."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Nueva planilla
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
          <Label className="mr-2">Tipo</Label>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {TIPOS_PLANILLA.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ESTADOS_PLANILLA.map((s) => <option key={s} value={s}>{s}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nº Planilla</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Año / Mes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Periodo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total neto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay planillas.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.planilla_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_planilla}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.año} / {row.mes}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_planilla}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_inicio_periodo} — {row.fecha_fin_periodo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.total_neto != null ? Number(row.total_neto).toLocaleString() : '—'}</td>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva planilla</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Nº planilla *</Label><input type="text" value={form.numero_planilla} onChange={(e) => setForm((p) => ({ ...p, numero_planilla: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Año *</Label><select value={form.año} onChange={(e) => setForm((p) => ({ ...p, año: parseInt(e.target.value, 10) }))} className={selectCls}>{[currentYear - 1, currentYear, currentYear + 1].map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
              <div><Label>Mes *</Label><select value={form.mes} onChange={(e) => setForm((p) => ({ ...p, mes: parseInt(e.target.value, 10) }))} className={selectCls}>{MESES.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
              <div><Label>Tipo</Label><select value={form.tipo_planilla ?? 'mensual'} onChange={(e) => setForm((p) => ({ ...p, tipo_planilla: e.target.value as PlanillaCreate['tipo_planilla'] }))} className={selectCls}>{TIPOS_PLANILLA.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Descripción periodo</Label><input type="text" placeholder="Ej: Enero 2026" value={form.periodo_descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, periodo_descripcion: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Fecha inicio periodo *</Label><input type="date" value={form.fecha_inicio_periodo} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio_periodo: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha fin periodo *</Label><input type="date" value={form.fecha_fin_periodo} onChange={(e) => setForm((p) => ({ ...p, fecha_fin_periodo: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha pago</Label><input type="date" value={form.fecha_pago ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_pago: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Estado</Label><select value={form.estado ?? 'borrador'} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as PlanillaCreate['estado'] }))} className={selectCls}>{ESTADOS_PLANILLA.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar planilla</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nº planilla *</Label><input type="text" value={editForm.numero_planilla ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, numero_planilla: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Descripción periodo</Label><input type="text" value={editForm.periodo_descripcion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, periodo_descripcion: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Fecha inicio *</Label><input type="date" value={editForm.fecha_inicio_periodo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_inicio_periodo: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha fin *</Label><input type="date" value={editForm.fecha_fin_periodo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_fin_periodo: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha pago</Label><input type="date" value={editForm.fecha_pago ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_pago: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as PlanillaUpdate['estado'] }))} className={selectCls}>{ESTADOS_PLANILLA.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </HcmPageLayout>
  );
}
