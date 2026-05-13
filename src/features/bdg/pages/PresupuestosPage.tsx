/**
 * Presupuestos BDG — Cabecera y detalle. GET/POST/PUT /api/v1/bdg/presupuestos y presupuesto-detalle
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Wallet, Plus, Pencil, List } from 'lucide-react';
import { empresaService, centroCostoService } from '@/features/org/services/org.service';
import { planCuentaService } from '@/features/fin/services/fin.service';
import { presupuestosService, presupuestoDetalleService } from '../services/bdg.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { CentroCosto } from '@/features/org/types/org.types';
import type { PlanCuenta } from '@/features/fin/types/fin.types';
import type {
  Presupuesto,
  PresupuestoCreate,
  PresupuestoUpdate,
  PresupuestoDetalle,
  PresupuestoDetalleCreate,
  PresupuestoDetalleUpdate,
} from '../types/bdg.types';
import { BdgPageLayout } from '../components/BdgPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_PRESUPUESTO = ['anual', 'mensual', 'trimestral'] as const;
const ESTADOS = ['borrador', 'aprobado', 'vigente', 'cerrado'] as const;
const MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

const DEFAULT_PRESUPUESTO: PresupuestoCreate = {
  empresa_id: '',
  codigo_presupuesto: '',
  nombre: '',
  anio: currentYear,
  tipo_presupuesto: 'anual',
  estado: 'borrador',
};

export default function PresupuestosPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
  const [cuentas, setCuentas] = useState<PlanCuenta[]>([]);
  const [list, setList] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [anioFilter, setAnioFilter] = useState<number>(currentYear);
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Presupuesto | null>(null);
  const [form, setForm] = useState<PresupuestoCreate>(DEFAULT_PRESUPUESTO);
  const [editForm, setEditForm] = useState<PresupuestoUpdate>({});
  const [submitting, setSubmitting] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [presupuestoDetalle, setPresupuestoDetalle] = useState<Presupuesto | null>(null);
  const [detalleList, setDetalleList] = useState<PresupuestoDetalle[]>([]);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleAddOpen, setDetalleAddOpen] = useState(false);
  const [detalleEditOpen, setDetalleEditOpen] = useState(false);
  const [detalleForm, setDetalleForm] = useState<PresupuestoDetalleCreate>({ presupuesto_id: '', cuenta_id: '', monto_presupuestado: 0 });
  const [detalleEditForm, setDetalleEditForm] = useState<PresupuestoDetalleUpdate>({});
  const [editingDetalle, setEditingDetalle] = useState<PresupuestoDetalle | null>(null);
  const [detalleCuentas, setDetalleCuentas] = useState<PlanCuenta[]>([]);
  const [detalleCentros, setDetalleCentros] = useState<CentroCosto[]>([]);

  const loadEmpresas = useCallback(async () => {
    try {
      const data = await empresaService.list({ solo_activos: true });
      setEmpresas(data);
      if (data.length === 1 && !empresaFilter) setEmpresaFilter(data[0].empresa_id);
    } catch {
      setEmpresas([]);
    }
  }, [empresaFilter]);

  const loadCentrosCuentas = useCallback(async () => {
    const empId = empresaFilter || empresas[0]?.empresa_id;
    if (!empId) {
      setCentrosCosto([]);
      setCuentas([]);
      return;
    }
    try {
      const [cc, cu] = await Promise.all([
        centroCostoService.list({ empresa_id: empId, solo_activos: true }),
        planCuentaService.list({ empresa_id: empId, solo_activos: true }),
      ]);
      setCentrosCosto(Array.isArray(cc) ? cc : []);
      setCuentas(Array.isArray(cu) ? cu : []);
    } catch {
      setCentrosCosto([]);
      setCuentas([]);
    }
  }, [empresaFilter, empresas]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; anio?: number; tipo_presupuesto?: string; estado?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      params.anio = anioFilter;
      if (tipoFilter) params.tipo_presupuesto = tipoFilter;
      if (estadoFilter) params.estado = estadoFilter;
      const data = await presupuestosService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, anioFilter, tipoFilter, estadoFilter]);

  const fetchDetalle = useCallback(async (presupuestoId: string) => {
    setDetalleLoading(true);
    try {
      const data = await presupuestoDetalleService.list({ presupuesto_id: presupuestoId });
      setDetalleList(Array.isArray(data) ? data : []);
    } catch {
      setDetalleList([]);
    } finally {
      setDetalleLoading(false);
    }
  }, []);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadCentrosCuentas(); }, [loadCentrosCuentas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT_PRESUPUESTO,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      anio: anioFilter,
    });
    setCreateOpen(true);
  };

  const openEdit = (row: Presupuesto) => {
    setEditing(row);
    setEditForm({
      codigo_presupuesto: row.codigo_presupuesto,
      nombre: row.nombre,
      tipo_presupuesto: row.tipo_presupuesto ?? undefined,
      monto_total_presupuestado: row.monto_total_presupuestado ?? undefined,
      monto_total_ejecutado: row.monto_total_ejecutado ?? undefined,
      estado: row.estado ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const openDetalle = useCallback(async (row: Presupuesto) => {
    setPresupuestoDetalle(row);
    setDetalleOpen(true);
    fetchDetalle(row.presupuesto_id);
    try {
      const [cu, cc] = await Promise.all([
        planCuentaService.list({ empresa_id: row.empresa_id, solo_activos: true }),
        centroCostoService.list({ empresa_id: row.empresa_id, solo_activos: true }),
      ]);
      setDetalleCuentas(Array.isArray(cu) ? cu : []);
      setDetalleCentros(Array.isArray(cc) ? cc : []);
    } catch {
      setDetalleCuentas([]);
      setDetalleCentros([]);
    }
  }, [fetchDetalle]);

  const openDetalleAdd = () => {
    if (!presupuestoDetalle) return;
    setDetalleForm({
      presupuesto_id: presupuestoDetalle.presupuesto_id,
      cuenta_id: detalleCuentas[0]?.cuenta_id ?? '',
      monto_presupuestado: 0,
    });
    setDetalleAddOpen(true);
  };

  const openDetalleEdit = (row: PresupuestoDetalle) => {
    setEditingDetalle(row);
    setDetalleEditForm({
      cuenta_id: row.cuenta_id,
      centro_costo_id: row.centro_costo_id ?? undefined,
      mes: row.mes ?? undefined,
      monto_presupuestado: row.monto_presupuestado,
      monto_ejecutado: row.monto_ejecutado ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setDetalleEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await presupuestosService.create(form);
      toast.success('Presupuesto creado.');
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
      await presupuestosService.update(editing.presupuesto_id, editForm);
      toast.success('Presupuesto actualizado.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetalleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await presupuestoDetalleService.create(detalleForm);
      toast.success('Línea agregada.');
      setDetalleAddOpen(false);
      if (presupuestoDetalle) fetchDetalle(presupuestoDetalle.presupuesto_id);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetalleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDetalle) return;
    setSubmitting(true);
    try {
      await presupuestoDetalleService.update(editingDetalle.presupuesto_detalle_id, detalleEditForm);
      toast.success('Línea actualizada.');
      setDetalleEditOpen(false);
      setEditingDetalle(null);
      if (presupuestoDetalle) fetchDetalle(presupuestoDetalle.presupuesto_id);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const getCuentaLabel = (id: string) => cuentas.find((c) => c.cuenta_id === id)?.codigo_cuenta ?? id;
  const getCentroLabel = (id: string | null | undefined) => (id ? (centrosCosto.find((c) => c.centro_costo_id === id)?.codigo ?? id) : '—');

  const inputCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';
  const selectCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

  return (
    <BdgPageLayout
      title="Presupuestos"
      description="Cabecera de presupuestos y detalle por cuenta y centro de costo."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo presupuesto
        </Button>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4 flex-wrap">
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
          <Label className="mr-2">Año</Label>
          <select value={anioFilter} onChange={(e) => setAnioFilter(parseInt(e.target.value, 10))} className={selectCls}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Tipo</Label>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {TIPOS_PRESUPUESTO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Año</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Presupuestado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ejecutado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">% Ej.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Wallet className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay presupuestos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.presupuesto_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_presupuesto}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.anio}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_presupuesto ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.monto_total_presupuestado ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.monto_total_ejecutado ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.porcentaje_ejecucion != null ? `${row.porcentaje_ejecucion.toFixed(1)}%` : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="icon" onClick={() => openDetalle(row)} className="text-brand-primary hover:text-brand-primary/80" title="Detalle"><List className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80"><Pencil className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear Presupuesto */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo presupuesto</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Código *</Label><input type="text" value={form.codigo_presupuesto} onChange={(e) => setForm((p) => ({ ...p, codigo_presupuesto: e.target.value }))} className={inputCls} required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Año *</Label><select value={form.anio} onChange={(e) => setForm((p) => ({ ...p, anio: parseInt(e.target.value, 10) }))} className={selectCls} required>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
              <div><Label>Tipo</Label><select value={form.tipo_presupuesto ?? 'anual'} onChange={(e) => setForm((p) => ({ ...p, tipo_presupuesto: e.target.value as PresupuestoCreate['tipo_presupuesto'] }))} className={selectCls}>{TIPOS_PRESUPUESTO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Estado</Label><select value={form.estado ?? 'borrador'} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as PresupuestoCreate['estado'] }))} className={selectCls}>{ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <div><Label>Observaciones</Label><textarea value={form.observaciones ?? ''} onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} className={inputCls} rows={2} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Presupuesto */}
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar presupuesto</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código *</Label><input type="text" value={editForm.codigo_presupuesto ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_presupuesto: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo</Label><select value={editForm.tipo_presupuesto ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_presupuesto: e.target.value || undefined }))} className={selectCls}>{TIPOS_PRESUPUESTO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value || undefined }))} className={selectCls}>{ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><Label>Monto presupuestado</Label><input type="number" step="0.01" min={0} value={editForm.monto_total_presupuestado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, monto_total_presupuestado: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Monto ejecutado</Label><input type="number" step="0.01" min={0} value={editForm.monto_total_ejecutado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, monto_total_ejecutado: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
            </div>
            <div><Label>Observaciones</Label><textarea value={editForm.observaciones ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} className={inputCls} rows={2} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle del presupuesto */}
      <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle presupuesto {presupuestoDetalle?.codigo_presupuesto ?? ''}</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <Button type="button" size="sm" onClick={openDetalleAdd} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!presupuestoDetalle || !detalleCuentas.length}>
              <Plus className="h-4 w-4 mr-2" /> Agregar línea
            </Button>
          </div>
          {detalleLoading && <div className="flex justify-center py-4"><Loader className="h-6 w-6 animate-spin text-brand-primary" /></div>}
          {!detalleLoading && (
            <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cuenta</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Centro costo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mes</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Presupuestado</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ejecutado</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Disponible</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {detalleList.length === 0 ? (
                    <tr><td colSpan={7} className="px-3 py-4 text-center text-gray-500">Sin líneas.</td></tr>
                  ) : (
                    detalleList.map((d) => (
                      <tr key={d.presupuesto_detalle_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{getCuentaLabel(d.cuenta_id)}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{getCentroLabel(d.centro_costo_id)}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{d.mes ?? '—'}</td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{d.monto_presupuestado}</td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{d.monto_ejecutado ?? 0}</td>
                        <td className={`px-3 py-2 text-right font-medium ${(d.monto_disponible ?? 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{d.monto_disponible ?? '—'}</td>
                        <td className="px-3 py-2 text-center"><Button variant="ghost" size="icon" onClick={() => openDetalleEdit(d)} className="text-brand-primary"><Pencil className="h-4 w-4" /></Button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Agregar línea detalle */}
      <Dialog open={detalleAddOpen} onOpenChange={setDetalleAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Agregar línea al detalle</DialogTitle></DialogHeader>
          <form onSubmit={handleDetalleCreate} className="space-y-4">
            <div><Label>Cuenta *</Label><select value={detalleForm.cuenta_id} onChange={(e) => setDetalleForm((p) => ({ ...p, cuenta_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{cuentas.map((c) => <option key={c.cuenta_id} value={c.cuenta_id}>{c.codigo_cuenta} – {c.nombre_cuenta}</option>)}</select></div>
            <div><Label>Centro de costo</Label><select value={detalleForm.centro_costo_id ?? ''} onChange={(e) => setDetalleForm((p) => ({ ...p, centro_costo_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{centrosCosto.map((c) => <option key={c.centro_costo_id} value={c.centro_costo_id}>{c.codigo} – {c.nombre}</option>)}</select></div>
            <div><Label>Mes</Label><select value={detalleForm.mes ?? ''} onChange={(e) => setDetalleForm((p) => ({ ...p, mes: e.target.value ? parseInt(e.target.value, 10) : undefined }))} className={selectCls}><option value="">—</option>{MESES.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
            <div><Label>Monto presupuestado *</Label><input type="number" step="0.01" min={0} value={detalleForm.monto_presupuestado} onChange={(e) => setDetalleForm((p) => ({ ...p, monto_presupuestado: parseFloat(e.target.value) || 0 }))} className={inputCls} required /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDetalleAddOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Agregar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar línea detalle */}
      <Dialog open={detalleEditOpen} onOpenChange={(o) => !o && setEditingDetalle(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar línea</DialogTitle></DialogHeader>
          <form onSubmit={handleDetalleUpdate} className="space-y-4">
            <div><Label>Cuenta *</Label><select value={detalleEditForm.cuenta_id ?? ''} onChange={(e) => setDetalleEditForm((p) => ({ ...p, cuenta_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{detalleCuentas.map((c) => <option key={c.cuenta_id} value={c.cuenta_id}>{c.codigo_cuenta} – {c.nombre_cuenta}</option>)}</select></div>
            <div><Label>Centro de costo</Label><select value={detalleEditForm.centro_costo_id ?? ''} onChange={(e) => setDetalleEditForm((p) => ({ ...p, centro_costo_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{detalleCentros.map((c) => <option key={c.centro_costo_id} value={c.centro_costo_id}>{c.codigo} – {c.nombre}</option>)}</select></div>
            <div><Label>Mes</Label><select value={detalleEditForm.mes ?? ''} onChange={(e) => setDetalleEditForm((p) => ({ ...p, mes: e.target.value ? parseInt(e.target.value, 10) : undefined }))} className={selectCls}><option value="">—</option>{MESES.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
            <div><Label>Monto presupuestado</Label><input type="number" step="0.01" min={0} value={detalleEditForm.monto_presupuestado ?? ''} onChange={(e) => setDetalleEditForm((p) => ({ ...p, monto_presupuestado: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
            <div><Label>Monto ejecutado</Label><input type="number" step="0.01" min={0} value={detalleEditForm.monto_ejecutado ?? ''} onChange={(e) => setDetalleEditForm((p) => ({ ...p, monto_ejecutado: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDetalleEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </BdgPageLayout>
  );
}
