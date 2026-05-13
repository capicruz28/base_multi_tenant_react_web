/**
 * Ventas POS — Listado, crear (cabecera + items) y anular. GET/POST/PUT /api/v1/pos/ventas
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, ShoppingCart, Plus, Ban } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { clienteService } from '@/features/sls/services/sls.service';
import { productoService, unidadMedidaService } from '@/features/inv/services/inv.service';
import { puntoVentaService, turnoCajaService, ventaService, ventaDetalleService } from '../services/pos.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Cliente } from '@/features/sls/types/sls.types';
import type { Producto } from '@/features/inv/types/inv.types';
import type { UnidadMedida } from '@/features/inv/types/inv.types';
import type { PuntoVenta } from '../types/pos.types';
import type { TurnoCaja } from '../types/pos.types';
import type { Venta, VentaCreate } from '../types/pos.types';
import type { VentaDetalle } from '../types/pos.types';
import { PosPageLayout } from '../components/PosPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const FORMAS_PAGO = ['efectivo', 'tarjeta', 'transferencia', 'mixto'] as const;
const ESTADOS_VENTA = ['borrador', 'completada', 'anulada'] as const;
const IGV_PERCENT = 18;

interface LineItem {
  producto_id: string;
  descripcion: string;
  cantidad: number;
  unidad_medida_id: string;
  precio_unitario: number;
  descuento_porcentaje: number;
}

export default function VentasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>([]);
  const [turnosAbiertos, setTurnosAbiertos] = useState<TurnoCaja[]>([]);
  const [list, setList] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [puntoVentaFilter, setPuntoVentaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [anularOpen, setAnularOpen] = useState(false);
  const [anulando, setAnulando] = useState<Venta | null>(null);
  const [detalleVenta, setDetalleVenta] = useState<VentaDetalle[]>([]);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [form, setForm] = useState<{ empresa_id: string; punto_venta_id: string; turno_caja_id: string; vendedor_usuario_id: string; vendedor_nombre?: string; cliente_venta_id?: string; cliente_nombre?: string; forma_pago: VentaCreate['forma_pago']; moneda: string; lineas: LineItem[] }>({ empresa_id: '', punto_venta_id: '', turno_caja_id: '', vendedor_usuario_id: '', forma_pago: 'efectivo', moneda: 'PEN', lineas: [] });
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
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

  const loadProductos = useCallback(async () => {
    try {
      const data = await productoService.list({ solo_activos: true });
      setProductos(data);
    } catch {
      setProductos([]);
    }
  }, []);

  const loadUnidades = useCallback(async () => {
    try {
      const data = await unidadMedidaService.list({ solo_activos: true });
      setUnidades(data);
    } catch {
      setUnidades([]);
    }
  }, []);

  const loadPuntosVenta = useCallback(async () => {
    try {
      const params = empresaFilter ? { empresa_id: empresaFilter } : {};
      const data = await puntoVentaService.list(params);
      setPuntosVenta(data);
    } catch {
      setPuntosVenta([]);
    }
  }, [empresaFilter]);

  const loadTurnosAbiertos = useCallback(async () => {
    try {
      const data = await turnoCajaService.list({ estado: 'abierto' });
      setTurnosAbiertos(data);
    } catch {
      setTurnosAbiertos([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { punto_venta_id?: string; estado?: string } = {};
      if (puntoVentaFilter) params.punto_venta_id = puntoVentaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      const data = await ventaService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [puntoVentaFilter, estadoFilter]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadClientes(); }, [loadClientes]);
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadUnidades(); }, [loadUnidades]);
  useEffect(() => { loadPuntosVenta(); }, [loadPuntosVenta]);
  useEffect(() => { loadTurnosAbiertos(); }, [loadTurnosAbiertos]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const turnosParaPunto = turnosAbiertos.filter((t) => t.punto_venta_id === form.punto_venta_id);

  const subtotal = form.lineas.reduce((s, l) => {
    const bruto = l.cantidad * l.precio_unitario;
    const desc = (l.descuento_porcentaje / 100) * bruto;
    return s + (bruto - desc);
  }, 0);
  const igv = (subtotal * IGV_PERCENT) / 100;
  const total = subtotal + igv;

  const openCreate = () => {
    const pvId = (puntoVentaFilter || puntosVenta[0]?.punto_venta_id) ?? '';
    const turnosDelPv = turnosAbiertos.filter((t) => t.punto_venta_id === pvId);
    setForm({
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      punto_venta_id: pvId,
      turno_caja_id: turnosDelPv[0]?.turno_id ?? '',
      vendedor_usuario_id: '',
      forma_pago: 'efectivo',
      moneda: 'PEN',
      lineas: [],
    });
    setCreateOpen(true);
  };

  const addLinea = () => {
    const firstUm = unidades[0]?.unidad_medida_id ?? '';
    setForm((p) => ({
      ...p,
      lineas: [...p.lineas, { producto_id: '', descripcion: '', cantidad: 1, unidad_medida_id: firstUm, precio_unitario: 0, descuento_porcentaje: 0 }],
    }));
  };

  const updateLinea = (idx: number, field: keyof LineItem, value: string | number) => {
    setForm((p) => ({
      ...p,
      lineas: p.lineas.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    }));
  };

  const removeLinea = (idx: number) => {
    setForm((p) => ({ ...p, lineas: p.lineas.filter((_, i) => i !== idx) }));
  };

  const onSelectProducto = (idx: number, productoId: string) => {
    const p = productos.find((x) => x.producto_id === productoId);
    if (!p) return;
    setForm((prev) => ({
      ...prev,
      lineas: prev.lineas.map((l, i) =>
        i === idx
          ? { ...l, producto_id: p.producto_id, descripcion: p.nombre, precio_unitario: 0, unidad_medida_id: p.unidad_medida_base_id }
          : l
      ),
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.punto_venta_id || !form.turno_caja_id || !form.vendedor_usuario_id?.trim()) {
      toast.error('Completa empresa, punto de venta, turno y vendedor.');
      return;
    }
    if (form.lineas.length === 0 || form.lineas.some((l) => !l.producto_id || l.cantidad <= 0)) {
      toast.error('Agrega al menos un item con producto y cantidad.');
      return;
    }
    setSubmitting(true);
    try {
      const numeroVenta = `V-${String(list.length + 1).padStart(3, '0')}`;
      const payload: VentaCreate = {
        empresa_id: form.empresa_id,
        numero_venta: numeroVenta,
        punto_venta_id: form.punto_venta_id,
        turno_caja_id: form.turno_caja_id,
        vendedor_usuario_id: form.vendedor_usuario_id,
        vendedor_nombre: form.vendedor_nombre ?? undefined,
        cliente_venta_id: form.cliente_venta_id ?? undefined,
        cliente_nombre: form.cliente_nombre ?? undefined,
        moneda: form.moneda,
        subtotal: Math.round(subtotal * 100) / 100,
        igv: Math.round(igv * 100) / 100,
        total: Math.round(total * 100) / 100,
        forma_pago: form.forma_pago,
        monto_efectivo: form.forma_pago === 'efectivo' ? total : undefined,
        monto_recibido: form.forma_pago === 'efectivo' ? total : undefined,
        estado: 'completada',
      };
      const venta = await ventaService.create(payload);
      for (let i = 0; i < form.lineas.length; i++) {
        const l = form.lineas[i];
        if (!l.producto_id || l.cantidad <= 0) continue;
        await ventaDetalleService.create({
          venta_id: venta.venta_id,
          item: i + 1,
          producto_id: l.producto_id,
          descripcion: l.descripcion || undefined,
          cantidad: l.cantidad,
          unidad_medida_id: l.unidad_medida_id,
          precio_unitario: l.precio_unitario,
          descuento_porcentaje: l.descuento_porcentaje || 0,
        });
      }
      toast.success('Venta registrada.');
      setCreateOpen(false);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const openAnular = (row: Venta) => {
    setAnulando(row);
    setMotivoAnulacion(row.motivo_anulacion ?? '');
    setAnularOpen(true);
  };

  const handleAnular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anulando) return;
    if (!motivoAnulacion.trim()) {
      toast.error('Indica el motivo de anulación.');
      return;
    }
    setSubmitting(true);
    try {
      await ventaService.update(anulando.venta_id, {
        estado: 'anulada',
        fecha_anulacion: new Date().toISOString(),
        motivo_anulacion: motivoAnulacion.trim(),
      });
      toast.success('Venta anulada.');
      setAnularOpen(false);
      setAnulando(null);
      setMotivoAnulacion('');
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const openDetalle = async (ventaId: string) => {
    try {
      const data = await ventaDetalleService.list(ventaId);
      setDetalleVenta(data);
      setDetalleOpen(true);
    } catch {
      toast.error('No se pudo cargar el detalle.');
    }
  };

  const formatDateTime = (s: string | null | undefined) => (s ? new Date(s).toLocaleString() : '-');
  const formatMoney = (n: number | null | undefined) => (n != null ? n.toLocaleString() : '-');

  return (
    <PosPageLayout
      title="Ventas POS"
      description="Registro de ventas rápidas por turno; anular cuando corresponda."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length || !puntosVenta.length || turnosAbiertos.length === 0}>
          <Plus className="h-4 w-4 mr-2" /> Nueva venta
        </Button>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        {empresas.length > 0 && (
          <div>
            <Label className="mr-2">Empresa</Label>
            <select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Todas</option>
              {empresas.map((e) => (
                <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Punto de venta</Label>
          <select value={puntoVentaFilter} onChange={(e) => setPuntoVentaFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {puntosVenta.map((p) => (
              <option key={p.punto_venta_id} value={p.punto_venta_id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ESTADOS_VENTA.map((s) => <option key={s} value={s}>{s}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Forma pago</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay ventas.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.venta_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_venta}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDateTime(row.fecha_venta)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.cliente_nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatMoney(row.total)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.forma_pago}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="sm" onClick={() => openDetalle(row.venta_id)} className="text-brand-primary hover:text-brand-primary/80 mr-1">Ver</Button>
                      {row.estado === 'completada' && (
                        <Button variant="ghost" size="sm" onClick={() => openAnular(row)} className="text-red-600 hover:text-red-700"><Ban className="h-4 w-4 inline mr-1" />Anular</Button>
                      )}
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
          <DialogHeader><DialogTitle>Nueva venta</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Punto de venta *</Label><select value={form.punto_venta_id} onChange={(e) => setForm((p) => ({ ...p, punto_venta_id: e.target.value, turno_caja_id: turnosAbiertos.find((t) => t.punto_venta_id === e.target.value)?.turno_id ?? '' }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{puntosVenta.map((p) => <option key={p.punto_venta_id} value={p.punto_venta_id}>{p.nombre}</option>)}</select></div>
              <div><Label>Turno (abierto) *</Label><select value={form.turno_caja_id} onChange={(e) => setForm((p) => ({ ...p, turno_caja_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{turnosParaPunto.map((t) => <option key={t.turno_id} value={t.turno_id}>{t.numero_turno}</option>)}</select></div>
              <div><Label>Vendedor (ID o nombre) *</Label><input type="text" value={form.vendedor_nombre ?? form.vendedor_usuario_id} onChange={(e) => setForm((p) => ({ ...p, vendedor_usuario_id: e.target.value || '', vendedor_nombre: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Cliente</Label><select value={form.cliente_venta_id ?? ''} onChange={(e) => { const c = clientes.find((x) => x.cliente_venta_id === e.target.value); setForm((p) => ({ ...p, cliente_venta_id: e.target.value || undefined, cliente_nombre: c?.razon_social })); }} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{clientes.map((c) => <option key={c.cliente_venta_id} value={c.cliente_venta_id}>{c.razon_social}</option>)}</select></div>
              <div><Label>Forma de pago *</Label><select value={form.forma_pago} onChange={(e) => setForm((p) => ({ ...p, forma_pago: e.target.value as VentaCreate['forma_pago'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{FORMAS_PAGO.map((f) => <option key={f} value={f}>{f}</option>)}</select></div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLinea}>+ Agregar línea</Button>
              </div>
              <div className="border rounded-md overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-2 py-2 text-left">Producto</th>
                      <th className="px-2 py-2 text-right">Cant.</th>
                      <th className="px-2 py-2 text-right">P. unit.</th>
                      <th className="px-2 py-2 text-right">Desc %</th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {form.lineas.map((l, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-1">
                          <select value={l.producto_id} onChange={(e) => onSelectProducto(idx, e.target.value)} className="w-full max-w-xs px-2 py-1 border rounded dark:bg-gray-700 dark:text-white text-sm">
                            <option value="">—</option>
                            {productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} – {p.nombre}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1"><input type="number" min="0.01" step="0.01" value={l.cantidad} onChange={(e) => updateLinea(idx, 'cantidad', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded dark:bg-gray-700 dark:text-white text-sm text-right" /></td>
                        <td className="px-2 py-1"><input type="number" min="0" step="0.01" value={l.precio_unitario} onChange={(e) => updateLinea(idx, 'precio_unitario', parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1 border rounded dark:bg-gray-700 dark:text-white text-sm text-right" /></td>
                        <td className="px-2 py-1"><input type="number" min="0" max="100" value={l.descuento_porcentaje} onChange={(e) => updateLinea(idx, 'descuento_porcentaje', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 border rounded dark:bg-gray-700 dark:text-white text-sm text-right" /></td>
                        <td className="px-2 py-1"><Button type="button" variant="ghost" size="icon" onClick={() => removeLinea(idx)} className="text-red-600">×</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Subtotal: {formatMoney(Math.round(subtotal * 100) / 100)} | IGV 18%: {formatMoney(Math.round(igv * 100) / 100)} | Total: {formatMoney(Math.round(total * 100) / 100)}
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Registrar venta</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={anularOpen} onOpenChange={(o) => !o && setAnulando(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Anular venta</DialogTitle></DialogHeader>
          <form onSubmit={handleAnular} className="space-y-4">
            <div><Label>Motivo de anulación *</Label><textarea value={motivoAnulacion} onChange={(e) => setMotivoAnulacion(e.target.value)} rows={3} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setAnularOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">Anular venta</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalle de venta</DialogTitle></DialogHeader>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-left">Descripción</th>
                  <th className="px-3 py-2 text-right">Cant.</th>
                  <th className="px-3 py-2 text-right">P. unit.</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {detalleVenta.map((d) => (
                  <tr key={d.venta_detalle_id}>
                    <td className="px-3 py-2">{d.item}</td>
                    <td className="px-3 py-2">{d.descripcion ?? d.producto_codigo}</td>
                    <td className="px-3 py-2 text-right">{d.cantidad}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(d.precio_unitario)}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(d.cantidad * d.precio_unitario)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </PosPageLayout>
  );
}
