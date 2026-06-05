/**
 * Detalles de Asiento Contable — Gestión de líneas de un asiento.
 * GET/POST /api/v1/fin/asientos/{asiento_id}/detalles
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Loader, ArrowLeft, Pencil, FileText, Trash2, Plus } from 'lucide-react';
import { asientoContableService, asientoDetalleService } from '../services/fin.service';
import { planCuentaService } from '../services/fin.service';
import { centroCostoService } from '@/features/org/services/org.service';
import type { AsientoContable, AsientoDetalle, AsientoDetalleCreate, AsientoDetalleUpdate } from '../types/fin.types';
import type { PlanCuenta } from '../types/fin.types';
import type { CentroCosto } from '@/features/org/types/org.types';
import { FinPageLayout } from '../components/FinPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const DEFAULT: AsientoDetalleCreate = {
  item: 1,
  cuenta_id: '',
  debe: 0,
  haber: 0,
};

export default function AsientoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asiento, setAsiento] = useState<AsientoContable | null>(null);
  const [cuentas, setCuentas] = useState<PlanCuenta[]>([]);
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
  const [list, setList] = useState<AsientoDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AsientoDetalle | null>(null);
  const [form, setForm] = useState<AsientoDetalleCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<AsientoDetalleUpdate>({});
  const [submitting, setSubmitting] = useState(false);

  const loadAsiento = useCallback(async () => {
    if (!id) return;
    try {
      const data = await asientoContableService.getById(id);
      setAsiento(data);
    } catch {
      setAsiento(null);
    }
  }, [id]);

  const loadCuentas = useCallback(async () => {
    if (!asiento?.empresa_id) return;
    try {
      const data = await planCuentaService.list({ empresa_id: asiento.empresa_id, solo_activos: true });
      setCuentas(data.filter(c => c.acepta_movimientos));
    } catch {
      setCuentas([]);
    }
  }, [asiento?.empresa_id]);

  const loadCentrosCosto = useCallback(async () => {
    if (!asiento?.empresa_id) return;
    try {
      const data = await centroCostoService.list({ empresa_id: asiento.empresa_id, solo_activos: true });
      setCentrosCosto(data);
    } catch {
      setCentrosCosto([]);
    }
  }, [asiento?.empresa_id]);

  const fetchList = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await asientoDetalleService.list(id);
      setList(data.sort((a, b) => a.item - b.item));
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const recalculateTotals = useCallback(async () => {
    if (!id) return;
    const detalles = await asientoDetalleService.list(id);
    const totalDebe = detalles.reduce((sum, d) => sum + d.debe, 0);
    const totalHaber = detalles.reduce((sum, d) => sum + d.haber, 0);
    await asientoContableService.update(id, { total_debe: totalDebe, total_haber: totalHaber });
    await loadAsiento();
  }, [id, loadAsiento]);

  useEffect(() => { loadAsiento(); }, [loadAsiento]);
  useEffect(() => { loadCuentas(); }, [loadCuentas]);
  useEffect(() => { loadCentrosCosto(); }, [loadCentrosCosto]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    const siguienteItem = list.length > 0 ? Math.max(...list.map(d => d.item)) + 1 : 1;
    setForm({ ...DEFAULT, item: siguienteItem });
    setCreateOpen(true);
  };
  const openEdit = (row: AsientoDetalle) => {
    setEditing(row);
    setEditForm({
      item: row.item,
      cuenta_id: row.cuenta_id,
      debe: row.debe,
      haber: row.haber,
      glosa: row.glosa ?? undefined,
      centro_costo_id: row.centro_costo_id ?? undefined,
      tercero_tipo: row.tercero_tipo ?? undefined,
      tercero_id: row.tercero_id ?? undefined,
      fecha_vencimiento: row.fecha_vencimiento ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !form.cuenta_id || (form.debe === 0 && form.haber === 0)) {
      toast.error('Completa cuenta y debe o haber.');
      return;
    }
    if (form.debe > 0 && form.haber > 0) {
      toast.error('Solo debe tener debe o haber, no ambos.');
      return;
    }
    setSubmitting(true);
    try {
      await asientoDetalleService.create(id, form);
      toast.success('Detalle agregado.');
      setCreateOpen(false);
      await fetchList();
      await recalculateTotals();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !id) return;
    if (editForm.debe !== undefined && editForm.haber !== undefined && editForm.debe > 0 && editForm.haber > 0) {
      toast.error('Solo debe tener debe o haber, no ambos.');
      return;
    }
    setSubmitting(true);
    try {
      await asientoDetalleService.update(id, editing.asiento_detalle_id, editForm);
      toast.success('Detalle actualizado.');
      setEditOpen(false);
      setEditing(null);
      await fetchList();
      await recalculateTotals();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (detalleId: string) => {
    if (!id || !confirm('¿Eliminar esta línea del asiento?')) return;
    try {
      await asientoDetalleService.delete(id, detalleId);
      toast.success('Detalle eliminado.');
      await fetchList();
      await recalculateTotals();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  if (!id) {
    return <div className="p-6">ID de asiento no válido.</div>;
  }

  const totalDebe = list.reduce((sum, d) => sum + d.debe, 0);
  const totalHaber = list.reduce((sum, d) => sum + d.haber, 0);
  const estaCuadrado = Math.abs(totalDebe - totalHaber) < 0.01;

  return (
    <FinPageLayout
      title={`Detalles: ${asiento?.numero_asiento ?? 'Cargando...'}`}
      description={`Gestión de líneas del asiento "${asiento?.glosa ?? ''}"`}
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> Agregar línea
        </Button>
      }
    >
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate('/app/fin/asientos')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a asientos
        </Button>
        {asiento && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="font-medium">Fecha:</span> {asiento.fecha_asiento}</div>
              <div><span className="font-medium">Tipo:</span> {asiento.tipo_asiento}</div>
              <div><span className="font-medium">Estado:</span> {asiento.estado}</div>
              <div><span className="font-medium">Moneda:</span> {asiento.moneda ?? 'PEN'}</div>
            </div>
            <div className="mt-2 text-sm"><span className="font-medium">Glosa:</span> {asiento.glosa}</div>
          </div>
        )}
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span className="font-medium">Total Debe:</span> {totalDebe.toFixed(2)} | <span className="font-medium">Total Haber:</span> {totalHaber.toFixed(2)}
            </div>
            {estaCuadrado ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-sm font-medium">✓ Cuadrado</span>
            ) : (
              <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-sm font-medium">⚠ No cuadrado (Diferencia: {Math.abs(totalDebe - totalHaber).toFixed(2)})</span>
            )}
          </div>
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {!loading && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cuenta</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Glosa</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Debe</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Haber</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Centro Costo</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {error ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />{error}</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay detalles en este asiento.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.asiento_detalle_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.item}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.cuenta_codigo} - {row.cuenta_nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.glosa ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{row.debe > 0 ? row.debe.toFixed(2) : '-'}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{row.haber > 0 ? row.haber.toFixed(2) : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.centro_costo_nombre ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {asiento?.estado === 'borrador' || asiento?.estado === 'registrado' ? (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80"><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(row.asiento_detalle_id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">Solo lectura</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-800 font-medium">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">TOTALES:</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">{totalDebe.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">{totalHaber.toFixed(2)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Agregar línea al asiento</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Item</Label><input type="number" min="1" value={form.item} onChange={(e) => setForm((p) => ({ ...p, item: parseInt(e.target.value) || 1 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Cuenta *</Label><select value={form.cuenta_id} onChange={(e) => setForm((p) => ({ ...p, cuenta_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{cuentas.map((c) => <option key={c.cuenta_id} value={c.cuenta_id}>{c.codigo_cuenta} - {c.nombre_cuenta}</option>)}</select></div>
              <div className="md:col-span-2"><Label>Glosa</Label><textarea value={form.glosa ?? ''} onChange={(e) => setForm((p) => ({ ...p, glosa: e.target.value || undefined }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Debe</Label><input type="number" step="0.01" min="0" value={form.debe} onChange={(e) => {
                const debe = parseFloat(e.target.value) || 0;
                setForm((p) => ({ ...p, debe, haber: debe > 0 ? 0 : p.haber }));
              }} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Haber</Label><input type="number" step="0.01" min="0" value={form.haber} onChange={(e) => {
                const haber = parseFloat(e.target.value) || 0;
                setForm((p) => ({ ...p, haber, debe: haber > 0 ? 0 : p.debe }));
              }} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Centro de Costo</Label><select value={form.centro_costo_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, centro_costo_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Seleccionar</option>{centrosCosto.map((cc) => <option key={cc.centro_costo_id} value={cc.centro_costo_id}>{cc.codigo} - {cc.nombre}</option>)}</select></div>
              <div><Label>Fecha Vencimiento</Label><input type="date" value={form.fecha_vencimiento ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_vencimiento: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            {(form.debe > 0 && form.haber > 0) && (
              <p className="text-sm text-red-600 dark:text-red-400">⚠ Solo debe tener debe o haber, no ambos.</p>
            )}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting || (form.debe > 0 && form.haber > 0)} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Agregar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar detalle</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Debe</Label><input type="number" step="0.01" min="0" value={editForm.debe ?? 0} onChange={(e) => {
                const debe = parseFloat(e.target.value) || 0;
                setEditForm((p) => ({ ...p, debe, haber: debe > 0 ? 0 : (p.haber ?? 0) }));
              }} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Haber</Label><input type="number" step="0.01" min="0" value={editForm.haber ?? 0} onChange={(e) => {
                const haber = parseFloat(e.target.value) || 0;
                setEditForm((p) => ({ ...p, haber, debe: haber > 0 ? 0 : (p.debe ?? 0) }));
              }} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            {(editForm.debe !== undefined && editForm.haber !== undefined && editForm.debe > 0 && editForm.haber > 0) && (
              <p className="text-sm text-red-600 dark:text-red-400">⚠ Solo debe tener debe o haber, no ambos.</p>
            )}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting || (editForm.debe !== undefined && editForm.haber !== undefined && editForm.debe > 0 && editForm.haber > 0)} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </FinPageLayout>
  );
}
