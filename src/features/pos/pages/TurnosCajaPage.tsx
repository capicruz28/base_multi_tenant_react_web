/**
 * Turnos de Caja — Listado, abrir y cerrar. GET/POST/PUT /api/v1/pos/turnos-caja
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Clock, Plus } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { puntoVentaService, turnoCajaService } from '../services/pos.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { PuntoVenta } from '../types/pos.types';
import type { TurnoCaja, TurnoCajaCreate } from '../types/pos.types';
import { PosPageLayout } from '../components/PosPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ESTADOS_TURNO = ['abierto', 'cerrado'] as const;

const DEFAULT: TurnoCajaCreate = {
  empresa_id: '',
  punto_venta_id: '',
  numero_turno: '',
  cajero_usuario_id: '',
  monto_apertura: 0,
  estado: 'abierto',
};

export default function TurnosCajaPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>([]);
  const [list, setList] = useState<TurnoCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [puntoVentaFilter, setPuntoVentaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [cerrarOpen, setCerrarOpen] = useState(false);
  const [cerrando, setCerrando] = useState<TurnoCaja | null>(null);
  const [form, setForm] = useState<TurnoCajaCreate>(DEFAULT);
  const [cierreForm, setCierreForm] = useState<{ monto_cierre_real?: number; observaciones_cierre?: string }>({});
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

  const loadPuntosVenta = useCallback(async () => {
    try {
      const params = empresaFilter ? { empresa_id: empresaFilter } : {};
      const data = await puntoVentaService.list(params);
      setPuntosVenta(data);
    } catch {
      setPuntosVenta([]);
    }
  }, [empresaFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { punto_venta_id?: string; estado?: string } = {};
      if (puntoVentaFilter) params.punto_venta_id = puntoVentaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      const data = await turnoCajaService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [puntoVentaFilter, estadoFilter]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadPuntosVenta(); }, [loadPuntosVenta]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    const empId = (empresaFilter || empresas[0]?.empresa_id) ?? '';
    const pvId = (puntoVentaFilter || puntosVenta[0]?.punto_venta_id) ?? '';
    const num = `T-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(list.length + 1).padStart(3, '0')}`;
    setForm({ ...DEFAULT, empresa_id: empId, punto_venta_id: pvId, numero_turno: num });
    setCreateOpen(true);
  };

  const openCerrar = (row: TurnoCaja) => {
    setCerrando(row);
    setCierreForm({
      monto_cierre_real: row.monto_cierre_esperado ?? row.total_ventas ?? undefined,
      observaciones_cierre: row.observaciones_cierre ?? undefined,
    });
    setCerrarOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.punto_venta_id || !form.numero_turno.trim()) {
      toast.error('Completa empresa, punto de venta y número de turno.');
      return;
    }
    setSubmitting(true);
    try {
      await turnoCajaService.create(form);
      toast.success('Turno abierto.');
      setCreateOpen(false);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCerrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cerrando) return;
    setSubmitting(true);
    try {
      await turnoCajaService.update(cerrando.turno_id, {
        estado: 'cerrado',
        fecha_cierre: new Date().toISOString(),
        monto_cierre_real: cierreForm.monto_cierre_real,
        observaciones_cierre: cierreForm.observaciones_cierre ?? undefined,
      });
      toast.success('Turno cerrado.');
      setCerrarOpen(false);
      setCerrando(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (s: string | null | undefined) => (s ? new Date(s).toLocaleString() : '-');
  const formatMoney = (n: number | null | undefined) => (n != null ? n.toLocaleString() : '-');

  return (
    <PosPageLayout
      title="Turnos de Caja"
      description="Apertura con fondo inicial y cierre con arqueo."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length || !puntosVenta.length}>
          <Plus className="h-4 w-4 mr-2" /> Abrir turno
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
            {ESTADOS_TURNO.map((s) => <option key={s} value={s}>{s}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número turno</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Punto venta</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cajero</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Apertura</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total ventas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay turnos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.turno_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_turno}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.punto_venta_nombre ?? row.punto_venta_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.cajero_nombre ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDateTime(row.fecha_apertura)} / {formatMoney(row.monto_apertura)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatMoney(row.total_ventas)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {row.estado === 'abierto' && (
                        <Button variant="ghost" size="sm" onClick={() => openCerrar(row)} className="text-brand-primary hover:text-brand-primary/80">Cerrar</Button>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Abrir turno</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Punto de venta *</Label><select value={form.punto_venta_id} onChange={(e) => setForm((p) => ({ ...p, punto_venta_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{puntosVenta.map((p) => <option key={p.punto_venta_id} value={p.punto_venta_id}>{p.nombre}</option>)}</select></div>
              <div><Label>Número turno *</Label><input type="text" value={form.numero_turno} onChange={(e) => setForm((p) => ({ ...p, numero_turno: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Cajero (ID o nombre) *</Label><input type="text" value={form.cajero_nombre ?? form.cajero_usuario_id} onChange={(e) => setForm((p) => ({ ...p, cajero_usuario_id: e.target.value || '', cajero_nombre: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Monto apertura *</Label><input type="number" step="0.01" min="0" value={form.monto_apertura || ''} onChange={(e) => setForm((p) => ({ ...p, monto_apertura: parseFloat(e.target.value) || 0 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Observaciones apertura</Label><textarea value={form.observaciones_apertura ?? ''} onChange={(e) => setForm((p) => ({ ...p, observaciones_apertura: e.target.value || undefined }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Abrir turno</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={cerrarOpen} onOpenChange={(o) => !o && setCerrando(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Cerrar turno</DialogTitle></DialogHeader>
          <form onSubmit={handleCerrar} className="space-y-4">
            {cerrando && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Turno <strong>{cerrando.numero_turno}</strong>. Total ventas: {formatMoney(cerrando.total_ventas)}.
              </p>
            )}
            <div><Label>Monto cierre real</Label><input type="number" step="0.01" value={cierreForm.monto_cierre_real ?? ''} onChange={(e) => setCierreForm((p) => ({ ...p, monto_cierre_real: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            <div><Label>Observaciones cierre</Label><textarea value={cierreForm.observaciones_cierre ?? ''} onChange={(e) => setCierreForm((p) => ({ ...p, observaciones_cierre: e.target.value || undefined }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCerrarOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Cerrar turno</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PosPageLayout>
  );
}
