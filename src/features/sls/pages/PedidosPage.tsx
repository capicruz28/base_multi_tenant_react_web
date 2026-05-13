/**
 * Pedidos — Formalización de venta. GET/POST /api/v1/sls/pedidos
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, ShoppingBag, Plus, Pencil } from 'lucide-react';
import { empresaService, centroCostoService } from '@/features/org/services/org.service';
import { clienteService } from '../services/sls.service';
import { cotizacionService } from '../services/sls.service';
import { pedidoService } from '../services/sls.service';
import type { Empresa, CentroCosto } from '@/features/org/types/org.types';
import type { Cliente } from '../types/sls.types';
import type { Cotizacion } from '../types/sls.types';
import type { Pedido, PedidoCreate, PedidoUpdate } from '../types/sls.types';
import { SlsPageLayout } from '../components/SlsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ESTADOS = ['borrador', 'confirmado', 'aprobado', 'parcial', 'completo', 'facturado', 'anulado'] as const;
const CONDICIONES_PAGO = ['contado', '7_dias', '15_dias', '30_dias', '45_dias', '60_dias', '90_dias'] as const;
const PRIORIDADES = [1, 2, 3, 4] as const; // 1=Urgente, 2=Alta, 3=Normal, 4=Baja

const DEFAULT: PedidoCreate = {
  empresa_id: '',
  numero_pedido: null,
  fecha_pedido: new Date().toISOString().split('T')[0],
  fecha_entrega_prometida: null,
  cliente_venta_id: '',
  cliente_razon_social: null,
  cliente_ruc: null,
  direccion_entrega_id: null,
  direccion_entrega_texto: null,
  cotizacion_id: null,
  orden_compra_cliente: null,
  condicion_pago: '30_dias',
  dias_credito: 30,
  moneda: 'PEN',
  tipo_cambio: 1.0,
  subtotal: null,
  descuento_global: null,
  igv: null,
  total: null,
  total_items: null,
  items_despachados: null,
  porcentaje_despacho: null,
  estado: 'borrador',
  requiere_aprobacion: false,
  prioridad: 3,
  centro_costo_id: null,
  observaciones: null,
  instrucciones_despacho: null,
};

export default function PedidosPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [list, setList] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Pedido | null>(null);
  const [form, setForm] = useState<PedidoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<PedidoUpdate>({});
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

  const loadCentrosCosto = useCallback(async () => {
    if (!empresaFilter) return;
    try {
      const data = await centroCostoService.list({ empresa_id: empresaFilter, solo_activos: true });
      setCentrosCosto(data);
    } catch {
      setCentrosCosto([]);
    }
  }, [empresaFilter]);

  const loadCotizaciones = useCallback(async () => {
    if (!empresaFilter) return;
    try {
      const data = await cotizacionService.list({ empresa_id: empresaFilter });
      setCotizaciones(data);
    } catch {
      setCotizaciones([]);
    }
  }, [empresaFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      const data = await pedidoService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter]);

  useEffect(() => { loadEmpresas(); loadClientes(); }, [loadEmpresas, loadClientes]);
  useEffect(() => { loadCentrosCosto(); loadCotizaciones(); }, [loadCentrosCosto, loadCotizaciones]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? ''), cliente_venta_id: clientes[0]?.cliente_venta_id ?? '' });
    setCreateOpen(true);
  };
  const openEdit = (row: Pedido) => {
    setEditing(row);
    setEditForm({
      fecha_entrega_prometida: row.fecha_entrega_prometida ?? undefined,
      direccion_entrega_texto: row.direccion_entrega_texto ?? undefined,
      condicion_pago: row.condicion_pago ?? undefined,
      dias_credito: row.dias_credito ?? undefined,
      subtotal: row.subtotal ?? undefined,
      descuento_global: row.descuento_global ?? undefined,
      igv: row.igv ?? undefined,
      total: row.total ?? undefined,
      prioridad: row.prioridad ?? undefined,
      observaciones: row.observaciones ?? undefined,
      instrucciones_despacho: row.instrucciones_despacho ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.cliente_venta_id || !form.fecha_pedido || !form.condicion_pago) {
      toast.error('Completa empresa, cliente, fecha y condición de pago.');
      return;
    }
    setSubmitting(true);
    try {
      await pedidoService.create(form);
      toast.success('Pedido creado.');
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
      await pedidoService.update(editing.pedido_id, editForm);
      toast.success('Pedido actualizado.');
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
      confirmado: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      aprobado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      parcial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      completo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      facturado: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      anulado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded ${colors[estado ?? ''] ?? colors.borrador}`}>{estado ?? 'N/A'}</span>;
  };

  const clienteNombre = (id: string) => clientes.find((c) => c.cliente_venta_id === id)?.razon_social ?? id;

  return (
    <SlsPageLayout
      title="Pedidos"
      description="Crear pedido desde cotización o manualmente. Control de estados y seguimiento de despacho."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length || !clientes.length}>
          <Plus className="h-4 w-4 mr-2" /> Crear pedido
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">% Despacho</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay pedidos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.pedido_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_pedido}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_pedido}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{clienteNombre(row.cliente_venta_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.moneda} {row.total?.toFixed(2) ?? '0.00'}</td>
                    <td className="px-4 py-3 text-sm">{estadoBadge(row.estado)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.porcentaje_despacho?.toFixed(1) ?? '0.0'}%</td>
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
          <DialogHeader><DialogTitle>Crear pedido</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Cliente *</Label><select value={form.cliente_venta_id} onChange={(e) => { const c = clientes.find((cl) => cl.cliente_venta_id === e.target.value); setForm((p) => ({ ...p, cliente_venta_id: e.target.value, cliente_razon_social: c?.razon_social ?? null, cliente_ruc: c?.numero_documento ?? null })); }} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{clientes.map((c) => <option key={c.cliente_venta_id} value={c.cliente_venta_id}>{c.razon_social}</option>)}</select></div>
              <div><Label>Fecha Pedido *</Label><input type="date" value={form.fecha_pedido} onChange={(e) => setForm((p) => ({ ...p, fecha_pedido: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Fecha Entrega Prometida</Label><input type="date" value={form.fecha_entrega_prometida ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_entrega_prometida: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Cotización</Label><select value={form.cotizacion_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, cotizacion_id: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Ninguna</option>{cotizaciones.map((c) => <option key={c.cotizacion_id} value={c.cotizacion_id}>{c.numero_cotizacion}</option>)}</select></div>
              <div><Label>Centro Costo</Label><select value={form.centro_costo_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, centro_costo_id: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Seleccionar</option>{centrosCosto.map((c) => <option key={c.centro_costo_id} value={c.centro_costo_id}>{c.nombre}</option>)}</select></div>
              <div><Label>Condición Pago *</Label><select value={form.condicion_pago ?? '30_dias'} onChange={(e) => setForm((p) => ({ ...p, condicion_pago: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required>{CONDICIONES_PAGO.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}</select></div>
              <div><Label>Prioridad</Label><select value={form.prioridad ?? 3} onChange={(e) => setForm((p) => ({ ...p, prioridad: parseInt(e.target.value) || 3 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{PRIORIDADES.map((p) => <option key={p} value={p}>{p === 1 ? 'Urgente' : p === 2 ? 'Alta' : p === 3 ? 'Normal' : 'Baja'}</option>)}</select></div>
              <div><Label>Subtotal</Label><input type="number" step="0.01" value={form.subtotal ?? ''} onChange={(e) => setForm((p) => ({ ...p, subtotal: e.target.value ? parseFloat(e.target.value) : null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Total</Label><input type="number" step="0.01" value={form.total ?? ''} onChange={(e) => setForm((p) => ({ ...p, total: e.target.value ? parseFloat(e.target.value) : null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Dirección Entrega</Label><input type="text" value={form.direccion_entrega_texto ?? ''} onChange={(e) => setForm((p) => ({ ...p, direccion_entrega_texto: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Observaciones</Label><textarea value={form.observaciones ?? ''} onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" rows={3} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar pedido</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Total</Label><input type="number" step="0.01" value={editForm.total ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, total: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Observaciones</Label><textarea value={editForm.observaciones ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" rows={3} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SlsPageLayout>
  );
}
