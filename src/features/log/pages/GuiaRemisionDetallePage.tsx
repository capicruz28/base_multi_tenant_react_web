/**
 * Detalles de Guía de Remisión — Gestión de productos en una guía.
 * GET/POST /api/v1/log/guias-remision/{guia_remision_id}/detalles
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Loader, ArrowLeft, Pencil, Package, Trash2, Plus } from 'lucide-react';
import { guiaRemisionService, guiaRemisionDetalleService } from '../services/log.service';
import { productoService } from '@/features/inv/services/inv.service';
import { unidadMedidaService } from '@/features/inv/services/inv.service';
import type { GuiaRemision, GuiaRemisionDetalle, GuiaRemisionDetalleCreate, GuiaRemisionDetalleUpdate } from '../types/log.types';
import type { Producto } from '@/features/inv/types/inv.types';
import type { UnidadMedida } from '@/features/inv/types/inv.types';
import { LogPageLayout } from '../components/LogPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const DEFAULT: GuiaRemisionDetalleCreate = {
  producto_id: '',
  cantidad: 1,
  unidad_medida_id: '',
  peso_kg: undefined,
};

export default function GuiaRemisionDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [guiaRemision, setGuiaRemision] = useState<GuiaRemision | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [list, setList] = useState<GuiaRemisionDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<GuiaRemisionDetalle | null>(null);
  const [form, setForm] = useState<GuiaRemisionDetalleCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<GuiaRemisionDetalleUpdate>({});
  const [submitting, setSubmitting] = useState(false);

  const loadGuiaRemision = useCallback(async () => {
    if (!id) return;
    try {
      const data = await guiaRemisionService.getById(id);
      setGuiaRemision(data);
    } catch {
      setGuiaRemision(null);
    }
  }, [id]);

  const loadProductos = useCallback(async () => {
    if (!guiaRemision?.empresa_id) return;
    try {
      const data = await productoService.list({ empresa_id: guiaRemision.empresa_id, solo_activos: true });
      setProductos(data);
    } catch {
      setProductos([]);
    }
  }, [guiaRemision?.empresa_id]);

  const loadUnidadesMedida = useCallback(async () => {
    if (!guiaRemision?.empresa_id) return;
    try {
      const data = await unidadMedidaService.list({ empresa_id: guiaRemision.empresa_id, solo_activos: true });
      setUnidadesMedida(data);
    } catch {
      setUnidadesMedida([]);
    }
  }, [guiaRemision?.empresa_id]);

  const fetchList = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await guiaRemisionDetalleService.list(id);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadGuiaRemision(); }, [loadGuiaRemision]);
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadUnidadesMedida(); }, [loadUnidadesMedida]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, unidad_medida_id: unidadesMedida[0]?.unidad_medida_id ?? '' });
    setCreateOpen(true);
  };
  const openEdit = (row: GuiaRemisionDetalle) => {
    setEditing(row);
    setEditForm({
      cantidad: row.cantidad,
      unidad_medida_id: row.unidad_medida_id,
      peso_kg: row.peso_kg ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !form.producto_id || !form.unidad_medida_id || form.cantidad <= 0) {
      toast.error('Completa producto, unidad de medida y cantidad.');
      return;
    }
    setSubmitting(true);
    try {
      await guiaRemisionDetalleService.create(id, form);
      toast.success('Producto agregado.');
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
    if (!editing || !id) return;
    setSubmitting(true);
    try {
      await guiaRemisionDetalleService.update(id, editing.guia_remision_detalle_id, editForm);
      toast.success('Detalle actualizado.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (detalleId: string) => {
    if (!id || !confirm('¿Eliminar este producto de la guía?')) return;
    try {
      await guiaRemisionDetalleService.delete(id, detalleId);
      toast.success('Producto eliminado.');
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  if (!id) {
    return <div className="p-6">ID de guía no válido.</div>;
  }

  return (
    <LogPageLayout
      title={`Detalles: ${guiaRemision?.serie ?? ''}-${guiaRemision?.numero ?? 'Cargando...'}`}
      description={`Gestión de productos en la guía de remisión "${guiaRemision?.destinatario_razon_social ?? ''}"`}
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> Agregar producto
        </Button>
      }
    >
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate('/log/guias-remision')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a guías
        </Button>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {!loading && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cantidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Unidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Peso (kg)</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {error ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Package className="h-10 w-10 mx-auto mb-2 opacity-50" />{error}</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Package className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay productos en esta guía.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.guia_remision_detalle_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.producto_nombre ?? row.producto_id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.cantidad}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.unidad_medida_nombre ?? row.unidad_medida_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.peso_kg?.toFixed(2) ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(row.guia_remision_detalle_id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                      </div>
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
          <DialogHeader><DialogTitle>Agregar producto a guía</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><Label>Producto *</Label><select value={form.producto_id} onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} - {p.nombre}</option>)}</select></div>
              <div><Label>Cantidad *</Label><input type="number" step="0.01" min="0" value={form.cantidad} onChange={(e) => setForm((p) => ({ ...p, cantidad: parseFloat(e.target.value) || 1 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Unidad de Medida *</Label><select value={form.unidad_medida_id} onChange={(e) => setForm((p) => ({ ...p, unidad_medida_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{unidadesMedida.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.codigo} - {u.nombre}</option>)}</select></div>
              <div><Label>Peso (kg)</Label><input type="number" step="0.01" min="0" value={form.peso_kg ?? ''} onChange={(e) => setForm((p) => ({ ...p, peso_kg: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Agregar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar detalle</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Cantidad</Label><input type="number" step="0.01" min="0" value={editForm.cantidad ?? 1} onChange={(e) => setEditForm((p) => ({ ...p, cantidad: parseFloat(e.target.value) || 1 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Unidad de Medida</Label><select value={editForm.unidad_medida_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, unidad_medida_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Seleccionar</option>{unidadesMedida.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.codigo} - {u.nombre}</option>)}</select></div>
              <div><Label>Peso (kg)</Label><input type="number" step="0.01" min="0" value={editForm.peso_kg ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, peso_kg: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </LogPageLayout>
  );
}
