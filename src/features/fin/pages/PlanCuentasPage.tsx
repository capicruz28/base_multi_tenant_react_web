/**
 * Plan de Cuentas — Listado y gestión completa. GET/POST /api/v1/fin/plan-cuentas
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, BookOpen, Pencil, Search, Plus } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { planCuentaService } from '../services/fin.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { PlanCuenta, PlanCuentaCreate, PlanCuentaUpdate } from '../types/fin.types';
import { FinPageLayout } from '../components/FinPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_CUENTA = ['activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto'] as const;
const NATURALEZAS = ['deudora', 'acreedora'] as const;

const DEFAULT: PlanCuentaCreate = {
  empresa_id: '',
  codigo_cuenta: '',
  nombre_cuenta: '',
  nivel: 1,
  tipo_cuenta: 'activo',
  naturaleza: 'deudora',
  acepta_movimientos: true,
  aparece_balance: true,
  es_activo: true,
};

export default function PlanCuentasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cuentasPadre, setCuentasPadre] = useState<PlanCuenta[]>([]);
  const [list, setList] = useState<PlanCuenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PlanCuenta | null>(null);
  const [form, setForm] = useState<PlanCuentaCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<PlanCuentaUpdate>({});
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

  const loadCuentasPadre = useCallback(async () => {
    if (!empresaFilter) {
      setCuentasPadre([]);
      return;
    }
    try {
      const data = await planCuentaService.list({ empresa_id: empresaFilter, solo_activos: true });
      setCuentasPadre(data.filter(c => c.acepta_movimientos === false || c.nivel < 3));
    } catch {
      setCuentasPadre([]);
    }
  }, [empresaFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { solo_activos: true };
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (tipoFilter) params.tipo_cuenta = tipoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await planCuentaService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, tipoFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadCuentasPadre(); }, [loadCuentasPadre]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? '') });
    setCreateOpen(true);
  };
  const openEdit = (row: PlanCuenta) => {
    setEditing(row);
    setEditForm({
      codigo_cuenta: row.codigo_cuenta,
      nombre_cuenta: row.nombre_cuenta,
      descripcion: row.descripcion ?? undefined,
      cuenta_padre_id: row.cuenta_padre_id ?? undefined,
      nivel: row.nivel,
      tipo_cuenta: row.tipo_cuenta,
      categoria: row.categoria ?? undefined,
      naturaleza: row.naturaleza,
      acepta_movimientos: row.acepta_movimientos,
      requiere_centro_costo: row.requiere_centro_costo,
      aparece_balance: row.aparece_balance,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo_cuenta.trim() || !form.nombre_cuenta.trim()) {
      toast.error('Completa empresa, código y nombre de cuenta.');
      return;
    }
    setSubmitting(true);
    try {
      await planCuentaService.create(form);
      toast.success('Cuenta creada.');
      setCreateOpen(false);
      fetchList();
      loadCuentasPadre();
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
      await planCuentaService.update(editing.cuenta_id, editForm);
      toast.success('Cuenta actualizada.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
      loadCuentasPadre();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FinPageLayout
      title="Plan de Cuentas"
      description="Gestión del plan contable con estructura jerárquica de cuentas."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> Crear cuenta
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
            {TIPOS_CUENTA.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Naturaleza</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nivel</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acepta Mov.</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {error ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />{error}</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay cuentas.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.cuenta_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_cuenta}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre_cuenta}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_cuenta}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.naturaleza}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nivel}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${row.acepta_movimientos ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                        {row.acepta_movimientos ? 'Sí' : 'No'}
                      </span>
                    </td>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear cuenta</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Código *</Label><input type="text" value={form.codigo_cuenta} onChange={(e) => setForm((p) => ({ ...p, codigo_cuenta: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={form.nombre_cuenta} onChange={(e) => setForm((p) => ({ ...p, nombre_cuenta: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div className="md:col-span-2"><Label>Descripción</Label><textarea value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Cuenta Padre</Label><select value={form.cuenta_padre_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, cuenta_padre_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Ninguna</option>{cuentasPadre.map((c) => <option key={c.cuenta_id} value={c.cuenta_id}>{c.codigo_cuenta} - {c.nombre_cuenta}</option>)}</select></div>
              <div><Label>Nivel *</Label><input type="number" min="1" max="10" value={form.nivel} onChange={(e) => setForm((p) => ({ ...p, nivel: parseInt(e.target.value) || 1 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Tipo Cuenta *</Label><select value={form.tipo_cuenta} onChange={(e) => setForm((p) => ({ ...p, tipo_cuenta: e.target.value as any }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required>{TIPOS_CUENTA.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Naturaleza *</Label><select value={form.naturaleza} onChange={(e) => setForm((p) => ({ ...p, naturaleza: e.target.value as any }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required>{NATURALEZAS.map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.acepta_movimientos ?? true} onChange={(e) => setForm((p) => ({ ...p, acepta_movimientos: e.target.checked }))} className="rounded" /><Label>Acepta Movimientos</Label></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.requiere_centro_costo ?? false} onChange={(e) => setForm((p) => ({ ...p, requiere_centro_costo: e.target.checked }))} className="rounded" /><Label>Requiere Centro Costo</Label></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.aparece_balance ?? true} onChange={(e) => setForm((p) => ({ ...p, aparece_balance: e.target.checked }))} className="rounded" /><Label>Aparece en Balance</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar cuenta</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código *</Label><input type="text" value={editForm.codigo_cuenta ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_cuenta: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={editForm.nombre_cuenta ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre_cuenta: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_activo ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" /><Label>Activo</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </FinPageLayout>
  );
}
