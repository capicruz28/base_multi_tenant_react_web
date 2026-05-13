/**
 * Comprobantes — Facturas, Boletas, NC, ND. GET/POST /api/v1/inv-bill/comprobantes
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Receipt, Plus, Pencil } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { clienteService } from '@/features/sls/services/sls.service';
import { pedidoService } from '@/features/sls/services/sls.service';
import { serieComprobanteService } from '../services/inv-bill.service';
import { comprobanteService } from '../services/inv-bill.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Cliente } from '@/features/sls/types/sls.types';
import type { Pedido } from '@/features/sls/types/sls.types';
import type { SerieComprobante } from '../types/inv-bill.types';
import type { Comprobante, ComprobanteCreate, ComprobanteUpdate } from '../types/inv-bill.types';
import { InvBillPageLayout } from '../components/InvBillPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_COMPROBANTE = [
  { value: '01', label: '01 - Factura' },
  { value: '03', label: '03 - Boleta de Venta' },
  { value: '07', label: '07 - Nota de Crédito' },
  { value: '08', label: '08 - Nota de Débito' },
] as const;

const ESTADOS = ['borrador', 'emitido', 'anulado', 'dado_baja'] as const;
const FORMAS_PAGO = ['contado', 'credito'] as const;

const DEFAULT: ComprobanteCreate = {
  empresa_id: '',
  tipo_comprobante: '01',
  serie: null,
  numero: null,
  fecha_emision: new Date().toISOString().split('T')[0],
  fecha_vencimiento: null,
  hora_emision: null,
  cliente_venta_id: null,
  cliente_tipo_documento: null,
  cliente_numero_documento: null,
  cliente_razon_social: null,
  cliente_direccion: null,
  pedido_id: null,
  moneda: 'PEN',
  tipo_cambio: 1.0,
  subtotal_gravado: null,
  subtotal_exonerado: null,
  subtotal_inafecto: null,
  subtotal_gratuito: null,
  descuento_global: null,
  igv: null,
  total: null,
  condicion_pago: null,
  forma_pago: 'credito',
  estado: 'borrador',
  observaciones: null,
  vendedor_usuario_id: null,
  vendedor_nombre: null,
};

export default function ComprobantesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [series, setSeries] = useState<SerieComprobante[]>([]);
  const [list, setList] = useState<Comprobante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Comprobante | null>(null);
  const [form, setForm] = useState<ComprobanteCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ComprobanteUpdate>({});
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

  const loadPedidos = useCallback(async () => {
    if (!empresaFilter) return;
    try {
      const data = await pedidoService.list({ empresa_id: empresaFilter });
      setPedidos(data);
    } catch {
      setPedidos([]);
    }
  }, [empresaFilter]);

  const loadSeries = useCallback(async () => {
    if (!empresaFilter) return;
    try {
      const data = await serieComprobanteService.list({ empresa_id: empresaFilter, solo_activos: true });
      setSeries(data);
    } catch {
      setSeries([]);
    }
  }, [empresaFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (tipoFilter) params.tipo_comprobante = tipoFilter;
      const data = await comprobanteService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter, tipoFilter]);

  useEffect(() => { loadEmpresas(); loadClientes(); }, [loadEmpresas, loadClientes]);
  useEffect(() => { loadPedidos(); loadSeries(); }, [loadPedidos, loadSeries]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? '') });
    setCreateOpen(true);
  };
  const openEdit = (row: Comprobante) => {
    setEditing(row);
    setEditForm({
      fecha_vencimiento: row.fecha_vencimiento ?? undefined,
      subtotal_gravado: row.subtotal_gravado ?? undefined,
      descuento_global: row.descuento_global ?? undefined,
      igv: row.igv ?? undefined,
      total: row.total ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.tipo_comprobante || !form.fecha_emision) {
      toast.error('Completa empresa, tipo de comprobante y fecha de emisión.');
      return;
    }
    setSubmitting(true);
    try {
      await comprobanteService.create(form);
      toast.success('Comprobante creado.');
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
      await comprobanteService.update(editing.comprobante_id, editForm);
      toast.success('Comprobante actualizado.');
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
      emitido: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      anulado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      dado_baja: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded ${colors[estado ?? ''] ?? colors.borrador}`}>{estado ?? 'N/A'}</span>;
  };

  const estadoSunatBadge = (estado: string | null | undefined) => {
    const colors: Record<string, string> = {
      pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      aceptado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rechazado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      baja: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded ${colors[estado ?? ''] ?? colors.pendiente}`}>{estado ?? 'N/A'}</span>;
  };

  const tipoNombre = (tipo: string | null | undefined) => {
    const t = TIPOS_COMPROBANTE.find((tc) => tc.value === tipo);
    return t ? t.label : tipo ?? '-';
  };

  const clienteNombre = (id: string | null | undefined) => id ? clientes.find((c) => c.cliente_venta_id === id)?.razon_social ?? id : '-';

  return (
    <InvBillPageLayout
      title="Comprobantes"
      description="Facturas, Boletas, Notas de Crédito y Débito. Generar comprobantes desde pedidos."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Crear comprobante
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
            {TIPOS_COMPROBANTE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
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
      {error && !loading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Serie-Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado SUNAT</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Receipt className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay comprobantes.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.comprobante_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{tipoNombre(row.tipo_comprobante)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.serie}-{row.numero}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_emision}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{clienteNombre(row.cliente_venta_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.moneda} {row.total?.toFixed(2) ?? '0.00'}</td>
                    <td className="px-4 py-3 text-sm">{estadoBadge(row.estado)}</td>
                    <td className="px-4 py-3 text-sm">{estadoSunatBadge(row.estado_sunat)}</td>
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
          <DialogHeader><DialogTitle>Crear comprobante</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Tipo Comprobante *</Label><select value={form.tipo_comprobante} onChange={(e) => setForm((p) => ({ ...p, tipo_comprobante: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required>{TIPOS_COMPROBANTE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              <div><Label>Serie</Label><select value={form.serie ?? ''} onChange={(e) => setForm((p) => ({ ...p, serie: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Seleccionar</option>{series.filter((s) => s.tipo_comprobante === form.tipo_comprobante).map((s) => <option key={s.serie_id} value={s.serie ?? ''}>{s.serie}</option>)}</select></div>
              <div><Label>Fecha Emisión *</Label><input type="date" value={form.fecha_emision} onChange={(e) => setForm((p) => ({ ...p, fecha_emision: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Cliente</Label><select value={form.cliente_venta_id ?? ''} onChange={(e) => { const c = clientes.find((cl) => cl.cliente_venta_id === e.target.value); setForm((p) => ({ ...p, cliente_venta_id: e.target.value || null, cliente_razon_social: c?.razon_social ?? null, cliente_numero_documento: c?.numero_documento ?? null, cliente_tipo_documento: c?.tipo_documento === 'RUC' ? '6' : c?.tipo_documento === 'DNI' ? '1' : null })); }} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Seleccionar</option>{clientes.map((c) => <option key={c.cliente_venta_id} value={c.cliente_venta_id}>{c.razon_social}</option>)}</select></div>
              <div><Label>Pedido</Label><select value={form.pedido_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, pedido_id: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Ninguno</option>{pedidos.map((p) => <option key={p.pedido_id} value={p.pedido_id}>{p.numero_pedido}</option>)}</select></div>
              <div><Label>Moneda</Label><select value={form.moneda ?? 'PEN'} onChange={(e) => setForm((p) => ({ ...p, moneda: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="PEN">PEN</option><option value="USD">USD</option></select></div>
              <div><Label>Forma Pago</Label><select value={form.forma_pago ?? 'credito'} onChange={(e) => setForm((p) => ({ ...p, forma_pago: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{FORMAS_PAGO.map((f) => <option key={f} value={f}>{f}</option>)}</select></div>
              <div><Label>Subtotal Gravado</Label><input type="number" step="0.01" value={form.subtotal_gravado ?? ''} onChange={(e) => setForm((p) => ({ ...p, subtotal_gravado: e.target.value ? parseFloat(e.target.value) : null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>IGV</Label><input type="number" step="0.01" value={form.igv ?? ''} onChange={(e) => setForm((p) => ({ ...p, igv: e.target.value ? parseFloat(e.target.value) : null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Total</Label><input type="number" step="0.01" value={form.total ?? ''} onChange={(e) => setForm((p) => ({ ...p, total: e.target.value ? parseFloat(e.target.value) : null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Observaciones</Label><textarea value={form.observaciones ?? ''} onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" rows={3} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar comprobante</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Subtotal Gravado</Label><input type="number" step="0.01" value={editForm.subtotal_gravado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, subtotal_gravado: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Total</Label><input type="number" step="0.01" value={editForm.total ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, total: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Observaciones</Label><textarea value={editForm.observaciones ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" rows={3} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </InvBillPageLayout>
  );
}
