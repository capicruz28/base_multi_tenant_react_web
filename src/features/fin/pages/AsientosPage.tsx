/**
 * Asientos Contables — Listado y gestión completa. GET/POST /api/v1/fin/asientos
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, FileText, Pencil, Search, Eye, CheckCircle, XCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toAppPath } from '@/core/routing/post-login-path';
import { empresaService } from '@/features/org/services/org.service';
import { periodoContableService } from '../services/fin.service';
import { asientoContableService } from '../services/fin.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { PeriodoContable } from '../types/fin.types';
import type { AsientoContable, AsientoContableCreate, AsientoContableUpdate } from '../types/fin.types';
import { FinPageLayout } from '../components/FinPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_ASIENTO = ['apertura', 'diario', 'ajuste', 'cierre', 'provision'] as const;
const ESTADOS = ['borrador', 'registrado', 'aprobado', 'anulado'] as const;
const MONEDAS = ['PEN', 'USD'] as const;

const DEFAULT: AsientoContableCreate = {
  empresa_id: '',
  numero_asiento: '',
  fecha_asiento: new Date().toISOString().split('T')[0],
  periodo_id: '',
  tipo_asiento: 'diario',
  glosa: '',
  moneda: 'PEN',
  total_debe: 0,
  total_haber: 0,
  estado: 'borrador',
};

export default function AsientosPage() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoContable[]>([]);
  const [list, setList] = useState<AsientoContable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AsientoContable | null>(null);
  const [form, setForm] = useState<AsientoContableCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<AsientoContableUpdate>({});
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

  const loadPeriodos = useCallback(async () => {
    if (!empresaFilter) {
      setPeriodos([]);
      return;
    }
    try {
      const data = await periodoContableService.list({ empresa_id: empresaFilter, estado: 'abierto' });
      setPeriodos(data);
    } catch {
      setPeriodos([]);
    }
  }, [empresaFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await asientoContableService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadPeriodos(); }, [loadPeriodos]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? ''),
      periodo_id: periodos[0]?.periodo_id ?? '',
    });
    setCreateOpen(true);
  };
  const openEdit = (row: AsientoContable) => {
    setEditing(row);
    setEditForm({
      numero_asiento: row.numero_asiento,
      fecha_asiento: row.fecha_asiento,
      periodo_id: row.periodo_id,
      tipo_asiento: row.tipo_asiento,
      modulo_origen: row.modulo_origen ?? undefined,
      documento_origen_tipo: row.documento_origen_tipo ?? undefined,
      documento_origen_numero: row.documento_origen_numero ?? undefined,
      glosa: row.glosa,
      moneda: row.moneda ?? 'PEN',
      total_debe: row.total_debe,
      total_haber: row.total_haber,
      estado: row.estado,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.numero_asiento.trim() || !form.periodo_id || !form.glosa.trim()) {
      toast.error('Completa empresa, número, periodo y glosa.');
      return;
    }
    if (form.total_debe !== form.total_haber) {
      toast.error('El asiento debe estar cuadrado (debe = haber).');
      return;
    }
    setSubmitting(true);
    try {
      await asientoContableService.create(form);
      toast.success('Asiento creado.');
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
    if (editForm.total_debe !== undefined && editForm.total_haber !== undefined && editForm.total_debe !== editForm.total_haber) {
      toast.error('El asiento debe estar cuadrado (debe = haber).');
      return;
    }
    setSubmitting(true);
    try {
      await asientoContableService.update(editing.asiento_id, editForm);
      toast.success('Asiento actualizado.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAprobar = async (asiento: AsientoContable) => {
    if (!confirm(`¿Aprobar el asiento ${asiento.numero_asiento}?`)) return;
    try {
      await asientoContableService.aprobar(asiento.asiento_id);
      toast.success('Asiento aprobado.');
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const handleAnular = async (asiento: AsientoContable) => {
    if (!confirm(`¿Anular el asiento ${asiento.numero_asiento}?`)) return;
    try {
      await asientoContableService.anular(asiento.asiento_id);
      toast.success('Asiento anulado.');
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  return (
    <FinPageLayout
      title="Asientos Contables"
      description="Gestión de asientos contables manuales y automáticos con validación de cuadre."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> Crear asiento
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
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número o glosa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {!loading && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Glosa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Debe</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Haber</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {error ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />{error}</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay asientos.</td></tr>
              ) : (
                list.map((row) => {
                  const estaCuadrado = Math.abs(row.total_debe - row.total_haber) < 0.01;
                  return (
                    <tr key={row.asiento_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_asiento}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_asiento}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_asiento}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.glosa}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.total_debe.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.total_haber.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            row.estado === 'aprobado' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            row.estado === 'registrado' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            row.estado === 'anulado' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {row.estado}
                          </span>
                          {!estaCuadrado && (
                            <span className="text-red-600 dark:text-red-400" title="Asiento no cuadrado">⚠</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => navigate(toAppPath(`/fin/asientos/${row.asiento_id}/detalles`))} className="text-brand-primary hover:text-brand-primary/80" title="Ver detalles"><Eye className="h-4 w-4" /></Button>
                          {row.estado === 'borrador' || row.estado === 'registrado' ? (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80"><Pencil className="h-4 w-4" /></Button>
                              {row.estado === 'registrado' && estaCuadrado && (
                                <Button variant="ghost" size="icon" onClick={() => handleAprobar(row)} className="text-green-600 hover:text-green-700" title="Aprobar"><CheckCircle className="h-4 w-4" /></Button>
                              )}
                            </>
                          ) : null}
                          {row.estado !== 'anulado' && (
                            <Button variant="ghost" size="icon" onClick={() => handleAnular(row)} className="text-red-600 hover:text-red-700" title="Anular"><XCircle className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear asiento contable</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Número Asiento *</Label><input type="text" value={form.numero_asiento} onChange={(e) => setForm((p) => ({ ...p, numero_asiento: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Fecha Asiento *</Label><input type="date" value={form.fecha_asiento} onChange={(e) => setForm((p) => ({ ...p, fecha_asiento: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Periodo *</Label><select value={form.periodo_id} onChange={(e) => setForm((p) => ({ ...p, periodo_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{periodos.map((p) => <option key={p.periodo_id} value={p.periodo_id}>{p.año}-{String(p.mes).padStart(2, '0')}</option>)}</select></div>
              <div><Label>Tipo Asiento</Label><select value={form.tipo_asiento} onChange={(e) => setForm((p) => ({ ...p, tipo_asiento: e.target.value as any }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_ASIENTO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Moneda</Label><select value={form.moneda ?? 'PEN'} onChange={(e) => setForm((p) => ({ ...p, moneda: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
              <div className="md:col-span-2"><Label>Glosa *</Label><textarea value={form.glosa} onChange={(e) => setForm((p) => ({ ...p, glosa: e.target.value }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Total Debe</Label><input type="number" step="0.01" min="0" value={form.total_debe} onChange={(e) => setForm((p) => ({ ...p, total_debe: parseFloat(e.target.value) || 0 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Total Haber</Label><input type="number" step="0.01" min="0" value={form.total_haber} onChange={(e) => setForm((p) => ({ ...p, total_haber: parseFloat(e.target.value) || 0 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              {form.total_debe !== form.total_haber && (
                <div className="md:col-span-2 text-sm text-red-600 dark:text-red-400">⚠ El asiento debe estar cuadrado (debe = haber).</div>
              )}
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting || form.total_debe !== form.total_haber} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar asiento contable</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Número Asiento</Label><input type="text" value={editForm.numero_asiento ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, numero_asiento: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Glosa</Label><textarea value={editForm.glosa ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, glosa: e.target.value }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </FinPageLayout>
  );
}
