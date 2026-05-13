/**
 * Préstamos HCM — Listado y gestión. GET/POST/PUT /api/v1/hcm/prestamos
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Banknote, Plus, Pencil } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { empleadoService } from '../services/hcm.service';
import { prestamoService } from '../services/hcm.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Empleado } from '../types/hcm.types';
import type { Prestamo, PrestamoCreate, PrestamoUpdate } from '../types/hcm.types';
import { HcmPageLayout } from '../components/HcmPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_PRESTAMO = ['adelanto_sueldo', 'prestamo', 'adelanto_gratificacion'] as const;
const ESTADOS_PRESTAMO = ['activo', 'pagado', 'cancelado'] as const;

const DEFAULT: PrestamoCreate = {
  empresa_id: '',
  empleado_id: '',
  numero_prestamo: '',
  tipo_prestamo: 'prestamo',
  monto_prestamo: 0,
  numero_cuotas: 1,
  monto_cuota: 0,
  moneda: 'PEN',
  estado: 'activo',
};

export default function PrestamosPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [list, setList] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [empleadoFilter, setEmpleadoFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Prestamo | null>(null);
  const [form, setForm] = useState<PrestamoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<PrestamoUpdate>({});
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
      const data = await prestamoService.list(params);
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
      numero_prestamo: `PR-${Date.now().toString(36).toUpperCase()}`,
    });
    setCreateOpen(true);
  };

  const openEdit = (row: Prestamo) => {
    setEditing(row);
    setEditForm({
      cuotas_pagadas: row.cuotas_pagadas ?? undefined,
      saldo_pendiente: row.saldo_pendiente ?? undefined,
      estado: (row.estado as PrestamoUpdate['estado']) ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.empleado_id || !form.numero_prestamo.trim() || form.monto_prestamo <= 0 || form.numero_cuotas < 1 || form.monto_cuota <= 0) {
      toast.error('Completa empresa, empleado, número, monto y cuotas.');
      return;
    }
    setSubmitting(true);
    try {
      await prestamoService.create(form);
      toast.success('Préstamo registrado.');
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
      await prestamoService.update(editing.prestamo_id, editForm);
      toast.success('Préstamo actualizado.');
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
      title="Préstamos"
      description="Adelantos y préstamos a empleados con descuento en planilla."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length || !empleados.length}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo préstamo
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
            {ESTADOS_PRESTAMO.map((s) => <option key={s} value={s}>{s}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nº Préstamo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Empleado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Monto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cuotas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Saldo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Banknote className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay préstamos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.prestamo_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_prestamo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.empleado_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_prestamo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.moneda ?? 'PEN'} {Number(row.monto_prestamo).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.cuotas_pagadas ?? 0} / {row.numero_cuotas}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.saldo_pendiente != null ? Number(row.saldo_pendiente).toLocaleString() : '—'}</td>
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
          <DialogHeader><DialogTitle>Nuevo préstamo</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Empleado *</Label><select value={form.empleado_id} onChange={(e) => setForm((p) => ({ ...p, empleado_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empleados.map((emp) => <option key={emp.empleado_id} value={emp.empleado_id}>{emp.nombre_completo ?? `${emp.apellido_paterno} ${emp.apellido_materno}`}</option>)}</select></div>
              <div><Label>Nº préstamo *</Label><input type="text" value={form.numero_prestamo} onChange={(e) => setForm((p) => ({ ...p, numero_prestamo: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo</Label><select value={form.tipo_prestamo} onChange={(e) => setForm((p) => ({ ...p, tipo_prestamo: e.target.value as PrestamoCreate['tipo_prestamo'] }))} className={selectCls}>{TIPOS_PRESTAMO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Monto *</Label><input type="number" step="0.01" min="0" value={form.monto_prestamo || ''} onChange={(e) => setForm((p) => ({ ...p, monto_prestamo: parseFloat(e.target.value) || 0 }))} className={inputCls} required /></div>
              <div><Label>Nº cuotas *</Label><input type="number" min="1" value={form.numero_cuotas || ''} onChange={(e) => { const n = parseInt(e.target.value, 10); setForm((p) => ({ ...p, numero_cuotas: n || 1, monto_cuota: n ? (p.monto_prestamo || 0) / n : 0 })); }} className={inputCls} required /></div>
              <div><Label>Monto cuota *</Label><input type="number" step="0.01" min="0" value={form.monto_cuota || ''} onChange={(e) => setForm((p) => ({ ...p, monto_cuota: parseFloat(e.target.value) || 0 }))} className={inputCls} required /></div>
              <div><Label>Moneda</Label><input type="text" value={form.moneda ?? 'PEN'} onChange={(e) => setForm((p) => ({ ...p, moneda: e.target.value }))} className={inputCls} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar préstamo</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div><Label>Cuotas pagadas</Label><input type="number" min={0} value={editForm.cuotas_pagadas ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cuotas_pagadas: e.target.value ? parseInt(e.target.value, 10) : undefined }))} className={inputCls} /></div>
              <div><Label>Saldo pendiente</Label><input type="number" step="0.01" min="0" value={editForm.saldo_pendiente ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, saldo_pendiente: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as PrestamoUpdate['estado'] }))} className={selectCls}>{ESTADOS_PRESTAMO.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </HcmPageLayout>
  );
}
