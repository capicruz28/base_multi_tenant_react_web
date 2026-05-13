/**
 * Conceptos de Planilla HCM — Listado y gestión. GET/POST/PUT /api/v1/hcm/conceptos-planilla
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Calculator, Plus, Pencil, Search } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { conceptoPlanillaService } from '../services/hcm.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { ConceptoPlanilla, ConceptoPlanillaCreate, ConceptoPlanillaUpdate } from '../types/hcm.types';
import { HcmPageLayout } from '../components/HcmPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_CONCEPTO = ['ingreso', 'descuento', 'aporte_empleador'] as const;

const DEFAULT: ConceptoPlanillaCreate = {
  empresa_id: '',
  codigo_concepto: '',
  nombre: '',
  tipo_concepto: 'ingreso',
  es_activo: true,
};

export default function ConceptosPlanillaPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [list, setList] = useState<ConceptoPlanilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ConceptoPlanilla | null>(null);
  const [form, setForm] = useState<ConceptoPlanillaCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ConceptoPlanillaUpdate>({});
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
      const params: { empresa_id?: string; tipo_concepto?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (tipoFilter) params.tipo_concepto = tipoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await conceptoPlanillaService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, tipoFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '' });
    setCreateOpen(true);
  };

  const openEdit = (row: ConceptoPlanilla) => {
    setEditing(row);
    setEditForm({
      codigo_concepto: row.codigo_concepto,
      nombre: row.nombre,
      tipo_concepto: (row.tipo_concepto as ConceptoPlanillaUpdate['tipo_concepto']) ?? undefined,
      categoria: row.categoria ?? undefined,
      es_fijo: row.es_fijo ?? undefined,
      monto_fijo: row.monto_fijo ?? undefined,
      es_porcentaje: row.es_porcentaje ?? undefined,
      porcentaje_base: row.porcentaje_base ?? undefined,
      base_calculo: row.base_calculo ?? undefined,
      afecto_renta_quinta: row.afecto_renta_quinta ?? undefined,
      afecto_essalud: row.afecto_essalud ?? undefined,
      afecto_cts: row.afecto_cts ?? undefined,
      afecto_gratificacion: row.afecto_gratificacion ?? undefined,
      afecto_vacaciones: row.afecto_vacaciones ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo_concepto.trim() || !form.nombre.trim()) {
      toast.error('Completa empresa, código y nombre.');
      return;
    }
    setSubmitting(true);
    try {
      await conceptoPlanillaService.create(form);
      toast.success('Concepto creado.');
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
      await conceptoPlanillaService.update(editing.concepto_id, editForm);
      toast.success('Concepto actualizado.');
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
      title="Conceptos de Planilla"
      description="Catálogo de ingresos, descuentos y aportes empleador para el cálculo de planillas."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo concepto
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
            {TIPOS_CONCEPTO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Buscar por código o nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" />
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Monto / %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Activo</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Calculator className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay conceptos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.concepto_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_concepto}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_concepto}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.categoria ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.es_fijo && row.monto_fijo != null ? row.monto_fijo : row.es_porcentaje && row.porcentaje_base != null ? `${row.porcentaje_base}%` : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.es_activo ? 'Sí' : 'No'}</td>
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
          <DialogHeader><DialogTitle>Nuevo concepto</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Código *</Label><input type="text" value={form.codigo_concepto} onChange={(e) => setForm((p) => ({ ...p, codigo_concepto: e.target.value }))} className={inputCls} required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo *</Label><select value={form.tipo_concepto} onChange={(e) => setForm((p) => ({ ...p, tipo_concepto: e.target.value as ConceptoPlanillaCreate['tipo_concepto'] }))} className={selectCls}>{TIPOS_CONCEPTO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Categoría</Label><input type="text" value={form.categoria ?? ''} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value || undefined }))} className={inputCls} /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_fijo ?? false} onChange={(e) => setForm((p) => ({ ...p, es_fijo: e.target.checked }))} className="rounded" /><Label>Monto fijo</Label></div>
              <div><Label>Monto fijo</Label><input type="number" step="0.01" value={form.monto_fijo ?? ''} onChange={(e) => setForm((p) => ({ ...p, monto_fijo: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_porcentaje ?? false} onChange={(e) => setForm((p) => ({ ...p, es_porcentaje: e.target.checked }))} className="rounded" /><Label>Porcentaje</Label></div>
              <div><Label>% base</Label><input type="number" step="0.01" value={form.porcentaje_base ?? ''} onChange={(e) => setForm((p) => ({ ...p, porcentaje_base: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_activo ?? true} onChange={(e) => setForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" /><Label>Activo</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar concepto</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código *</Label><input type="text" value={editForm.codigo_concepto ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_concepto: e.target.value }))} className={inputCls} required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo</Label><select value={editForm.tipo_concepto ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_concepto: e.target.value as ConceptoPlanillaUpdate['tipo_concepto'] }))} className={selectCls}>{TIPOS_CONCEPTO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Monto fijo</Label><input type="number" step="0.01" value={editForm.monto_fijo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, monto_fijo: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_activo ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" /><Label>Activo</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </HcmPageLayout>
  );
}
