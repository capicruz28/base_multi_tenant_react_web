/**
 * Periodos Contables — Listado y gestión completa. GET/POST /api/v1/fin/periodos
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Calendar, Pencil, Lock, Plus } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { periodoContableService } from '../services/fin.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { PeriodoContable, PeriodoContableCreate, PeriodoContableUpdate } from '../types/fin.types';
import { FinPageLayout } from '../components/FinPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ESTADOS = ['abierto', 'cerrado', 'bloqueado'] as const;
const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

const DEFAULT: PeriodoContableCreate = {
  empresa_id: '',
  año: new Date().getFullYear(),
  mes: new Date().getMonth() + 1,
  fecha_inicio: '',
  fecha_fin: '',
  estado: 'abierto',
};

export default function PeriodosPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [list, setList] = useState<PeriodoContable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [añoFilter, setAñoFilter] = useState<number>(new Date().getFullYear());
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PeriodoContable | null>(null);
  const [form, setForm] = useState<PeriodoContableCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<PeriodoContableUpdate>({});
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

  const calcularFechas = (año: number, mes: number) => {
    const fechaInicio = new Date(año, mes - 1, 1);
    const fechaFin = new Date(año, mes, 0);
    return {
      inicio: fechaInicio.toISOString().split('T')[0],
      fin: fechaFin.toISOString().split('T')[0],
    };
  };

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (añoFilter) params.año = añoFilter;
      if (estadoFilter) params.estado = estadoFilter;
      const data = await periodoContableService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, añoFilter, estadoFilter]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    const fechas = calcularFechas(form.año, form.mes);
    setForm({
      ...DEFAULT,
      empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? ''),
      fecha_inicio: fechas.inicio,
      fecha_fin: fechas.fin,
    });
    setCreateOpen(true);
  };
  const openEdit = (row: PeriodoContable) => {
    setEditing(row);
    setEditForm({
      año: row.año,
      mes: row.mes,
      fecha_inicio: row.fecha_inicio,
      fecha_fin: row.fecha_fin,
      estado: row.estado,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.fecha_inicio || !form.fecha_fin) {
      toast.error('Completa empresa y fechas.');
      return;
    }
    setSubmitting(true);
    try {
      await periodoContableService.create(form);
      toast.success('Periodo creado.');
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
      await periodoContableService.update(editing.periodo_id, editForm);
      toast.success('Periodo actualizado.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCerrar = async (periodo: PeriodoContable) => {
    if (!confirm(`¿Cerrar el periodo ${periodo.año}-${String(periodo.mes).padStart(2, '0')}?`)) return;
    try {
      await periodoContableService.cerrar(periodo.periodo_id);
      toast.success('Periodo cerrado.');
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  return (
    <FinPageLayout
      title="Periodos Contables"
      description="Gestión de periodos contables mensuales para control de contabilización."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> Crear periodo
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
          <Label className="mr-2">Año</Label>
          <input type="number" min="2000" max="2100" value={añoFilter} onChange={(e) => setAñoFilter(parseInt(e.target.value) || new Date().getFullYear())} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm w-24" />
        </div>
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {!loading && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Periodo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha Inicio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha Fin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha Cierre</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {error ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />{error}</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay periodos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.periodo_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.año}-{String(row.mes).padStart(2, '0')}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_inicio}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_fin}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        row.estado === 'abierto' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        row.estado === 'cerrado' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {row.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_cierre ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {row.estado === 'abierto' && (
                          <Button variant="ghost" size="icon" onClick={() => handleCerrar(row)} className="text-orange-600 hover:text-orange-700" title="Cerrar periodo"><Lock className="h-4 w-4" /></Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80"><Pencil className="h-4 w-4" /></Button>
                      </div>
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
          <DialogHeader><DialogTitle>Crear periodo contable</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Año *</Label><input type="number" min="2000" max="2100" value={form.año} onChange={(e) => {
                const año = parseInt(e.target.value) || new Date().getFullYear();
                const fechas = calcularFechas(año, form.mes);
                setForm((p) => ({ ...p, año, fecha_inicio: fechas.inicio, fecha_fin: fechas.fin }));
              }} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Mes *</Label><select value={form.mes} onChange={(e) => {
                const mes = parseInt(e.target.value);
                const fechas = calcularFechas(form.año, mes);
                setForm((p) => ({ ...p, mes, fecha_inicio: fechas.inicio, fecha_fin: fechas.fin }));
              }} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required>{MESES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
              <div><Label>Fecha Inicio *</Label><input type="date" value={form.fecha_inicio} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Fecha Fin *</Label><input type="date" value={form.fecha_fin} onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Estado</Label><select value={form.estado ?? 'abierto'} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as any }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar periodo contable</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Año</Label><input type="number" min="2000" max="2100" value={editForm.año ?? new Date().getFullYear()} onChange={(e) => setEditForm((p) => ({ ...p, año: parseInt(e.target.value) || new Date().getFullYear() }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Mes</Label><select value={editForm.mes ?? 1} onChange={(e) => setEditForm((p) => ({ ...p, mes: parseInt(e.target.value) }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{MESES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
              <div><Label>Fecha Inicio</Label><input type="date" value={editForm.fecha_inicio ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_inicio: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Fecha Fin</Label><input type="date" value={editForm.fecha_fin ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_fin: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? 'abierto'} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as any }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </FinPageLayout>
  );
}
