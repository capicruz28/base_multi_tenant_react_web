/**
 * Cotizaciones — Comparación de precios. GET/POST /api/v1/sls/cotizaciones
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, FileSearch, Plus, Pencil } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { clienteService } from '../services/sls.service';
import { cotizacionService } from '../services/sls.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Cliente } from '../types/sls.types';
import type { Cotizacion, CotizacionCreate, CotizacionUpdate } from '../types/sls.types';
import { SlsPageLayout } from '../components/SlsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ESTADOS = ['borrador', 'enviada', 'aceptada', 'rechazada', 'vencida', 'convertida'] as const;
const CONDICIONES_PAGO = ['contado', '7_dias', '15_dias', '30_dias', '45_dias', '60_dias', '90_dias'] as const;

const DEFAULT: CotizacionCreate = {
  empresa_id: '',
  numero_cotizacion: null,
  fecha_cotizacion: new Date().toISOString().split('T')[0],
  fecha_vencimiento: null,
  cliente_venta_id: '',
  cliente_razon_social: null,
  cliente_ruc: null,
  contacto_nombre: null,
  condicion_pago: '30_dias',
  dias_credito: 30,
  tiempo_entrega_dias: null,
  moneda: 'PEN',
  tipo_cambio: 1.0,
  subtotal: null,
  descuento_global: null,
  igv: null,
  total: null,
  estado: 'borrador',
  observaciones: null,
  terminos_condiciones: null,
};

export default function CotizacionesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [list, setList] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Cotizacion | null>(null);
  const [form, setForm] = useState<CotizacionCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<CotizacionUpdate>({});
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

  const loadClientes = useCallback(async () => {
    try {
      const data = await clienteService.list({ solo_activos: true });
      setClientes(data);
    } catch {
      setClientes([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      const data = await cotizacionService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter]);

  useEffect(() => { loadEmpresas(); loadClientes(); }, [loadEmpresas, loadClientes]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? ''), cliente_venta_id: clientes[0]?.cliente_venta_id ?? '' });
    setCreateOpen(true);
  };
  const openEdit = (row: Cotizacion) => {
    setEditing(row);
    setEditForm({
      fecha_vencimiento: row.fecha_vencimiento ?? undefined,
      condicion_pago: row.condicion_pago ?? undefined,
      dias_credito: row.dias_credito ?? undefined,
      tiempo_entrega_dias: row.tiempo_entrega_dias ?? undefined,
      subtotal: row.subtotal ?? undefined,
      descuento_global: row.descuento_global ?? undefined,
      igv: row.igv ?? undefined,
      total: row.total ?? undefined,
      estado: row.estado ?? undefined,
      observaciones: row.observaciones ?? undefined,
      terminos_condiciones: row.terminos_condiciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.cliente_venta_id || !form.fecha_cotizacion) {
      toast.error('Completa empresa, cliente y fecha cotización.');
      return;
    }
    setSubmitting(true);
    try {
      await cotizacionService.create(form);
      toast.success('Cotización creada.');
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
      await cotizacionService.update(editing.cotizacion_id, editForm);
      toast.success('Cotización actualizada.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const estadoBadge = (estado: string | null | undefined) => {
    const colors: Record<string, string> = {
      borrador: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      enviada: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      aceptada: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rechazada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      vencida: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      convertida: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded ${colors[estado ?? ''] ?? colors.borrador}`}>{estado ?? 'N/A'}</span>;
  };

  const clienteNombre = (id: string) => clientes.find((c) => c.cliente_venta_id === id)?.razon_social ?? id;

  return (
    <SlsPageLayout
      title="Cotizaciones"
      description="Crear cotización desde cliente. Convertir cotización a pedido."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length || !clientes.length}>
          <Plus className="h-4 w-4 mr-2" /> Crear cotización
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
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !loading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><FileSearch className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay cotizaciones.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.cotizacion_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_cotizacion}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_cotizacion}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{clienteNombre(row.cliente_venta_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.moneda} {row.total?.toFixed(2) ?? '0.00'}</td>
                    <td className="px-4 py-3 text-sm">{estadoBadge(row.estado)}</td>
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
          <DialogHeader><DialogTitle>Crear cotización</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Cliente *</Label><select value={form.cliente_venta_id} onChange={(e) => { const c = clientes.find((cl) => cl.cliente_venta_id === e.target.value); setForm((p) => ({ ...p, cliente_venta_id: e.target.value, cliente_razon_social: c?.razon_social ?? null, cliente_ruc: c?.numero_documento ?? null })); }} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{clientes.map((c) => <option key={c.cliente_venta_id} value={c.cliente_venta_id}>{c.razon_social}</option>)}</select></div>
              <div><Label>Fecha Cotización *</Label><input type="date" value={form.fecha_cotizacion} onChange={(e) => setForm((p) => ({ ...p, fecha_cotizacion: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Fecha Vencimiento</Label><input type="date" value={form.fecha_vencimiento ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_vencimiento: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Condición Pago</Label><select value={form.condicion_pago ?? '30_dias'} onChange={(e) => setForm((p) => ({ ...p, condicion_pago: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{CONDICIONES_PAGO.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}</select></div>
              <div><Label>Días Crédito</Label><input type="number" value={form.dias_credito ?? 30} onChange={(e) => setForm((p) => ({ ...p, dias_credito: parseInt(e.target.value) || 30 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Subtotal</Label><input type="number" step="0.01" value={form.subtotal ?? ''} onChange={(e) => setForm((p) => ({ ...p, subtotal: e.target.value ? parseFloat(e.target.value) : null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Total</Label><input type="number" step="0.01" value={form.total ?? ''} onChange={(e) => setForm((p) => ({ ...p, total: e.target.value ? parseFloat(e.target.value) : null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Observaciones</Label><textarea value={form.observaciones ?? ''} onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" rows={3} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar cotización</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Subtotal</Label><input type="number" step="0.01" value={editForm.subtotal ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, subtotal: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Total</Label><input type="number" step="0.01" value={editForm.total ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, total: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? 'borrador'} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SlsPageLayout>
  );
}
