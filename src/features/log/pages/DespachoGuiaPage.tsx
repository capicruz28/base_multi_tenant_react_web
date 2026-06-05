/**
 * Guías de Despacho — Gestión de guías asociadas a un despacho.
 * GET/POST /api/v1/log/despachos/{despacho_id}/guias
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Loader, ArrowLeft, Pencil, FileText, Trash2, Plus } from 'lucide-react';
import { despachoService, despachoGuiaService } from '../services/log.service';
import { guiaRemisionService } from '../services/log.service';
import type { Despacho, DespachoGuia, DespachoGuiaCreate, DespachoGuiaUpdate } from '../types/log.types';
import type { GuiaRemision } from '../types/log.types';
import { LogPageLayout } from '../components/LogPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ESTADOS_ENTREGA = ['pendiente', 'en_transito', 'entregada', 'devuelta'] as const;

const DEFAULT: DespachoGuiaCreate = {
  guia_remision_id: '',
  orden_entrega: 1,
  estado_entrega: 'pendiente',
};

export default function DespachoGuiaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [despacho, setDespacho] = useState<Despacho | null>(null);
  const [guiasDisponibles, setGuiasDisponibles] = useState<GuiaRemision[]>([]);
  const [list, setList] = useState<DespachoGuia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<DespachoGuia | null>(null);
  const [form, setForm] = useState<DespachoGuiaCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<DespachoGuiaUpdate>({});
  const [submitting, setSubmitting] = useState(false);

  const loadDespacho = useCallback(async () => {
    if (!id) return;
    try {
      const data = await despachoService.getById(id);
      setDespacho(data);
    } catch {
      setDespacho(null);
    }
  }, [id]);

  const loadGuiasDisponibles = useCallback(async () => {
    if (!despacho?.empresa_id) return;
    try {
      const data = await guiaRemisionService.list({
        empresa_id: despacho.empresa_id,
        estado: 'emitida',
      });
      setGuiasDisponibles(data);
    } catch {
      setGuiasDisponibles([]);
    }
  }, [despacho?.empresa_id]);

  const fetchList = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await despachoGuiaService.list(id);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadDespacho(); }, [loadDespacho]);
  useEffect(() => { loadGuiasDisponibles(); }, [loadGuiasDisponibles]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    const siguienteOrden = list.length > 0 ? Math.max(...list.map(g => g.orden_entrega)) + 1 : 1;
    setForm({ ...DEFAULT, orden_entrega: siguienteOrden });
    setCreateOpen(true);
  };
  const openEdit = (row: DespachoGuia) => {
    setEditing(row);
    setEditForm({
      orden_entrega: row.orden_entrega,
      estado_entrega: row.estado_entrega,
      fecha_entrega: row.fecha_entrega ?? undefined,
      receptor_nombre: row.receptor_nombre ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !form.guia_remision_id) {
      toast.error('Selecciona una guía de remisión.');
      return;
    }
    setSubmitting(true);
    try {
      await despachoGuiaService.create(id, form);
      toast.success('Guía agregada al despacho.');
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
      await despachoGuiaService.update(id, editing.despacho_guia_id, editForm);
      toast.success('Guía actualizada.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (guiaId: string) => {
    if (!id || !confirm('¿Eliminar esta guía del despacho?')) return;
    try {
      await despachoGuiaService.delete(id, guiaId);
      toast.success('Guía eliminada del despacho.');
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  if (!id) {
    return <div className="p-6">ID de despacho no válido.</div>;
  }

  const guiasYaAgregadas = list.map(g => g.guia_remision_id);
  const guiasParaAgregar = guiasDisponibles.filter(g => !guiasYaAgregadas.includes(g.guia_remision_id));

  return (
    <LogPageLayout
      title={`Guías del Despacho: ${despacho?.numero_despacho ?? 'Cargando...'}`}
      description={`Gestión de guías de remisión asociadas al despacho "${despacho?.fecha_programada ?? ''}"`}
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> Agregar guía
        </Button>
      }
    >
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate('/app/log/despachos')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a despachos
        </Button>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {!loading && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Orden</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Guía</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Destinatario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado Entrega</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha Entrega</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {error ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />{error}</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay guías en este despacho.</td></tr>
              ) : (
                list.sort((a, b) => a.orden_entrega - b.orden_entrega).map((row) => (
                  <tr key={row.despacho_guia_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.orden_entrega}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.guia_serie}-{row.guia_numero}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.guia_destinatario ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        row.estado_entrega === 'entregada' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        row.estado_entrega === 'en_transito' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        row.estado_entrega === 'devuelta' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {row.estado_entrega}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_entrega ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(row.despacho_guia_id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>Agregar guía al despacho</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><Label>Guía de Remisión *</Label><select value={form.guia_remision_id} onChange={(e) => setForm((p) => ({ ...p, guia_remision_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{guiasParaAgregar.map((g) => <option key={g.guia_remision_id} value={g.guia_remision_id}>{g.serie}-{g.numero} - {g.destinatario_razon_social}</option>)}</select></div>
              <div><Label>Orden de Entrega</Label><input type="number" min="1" value={form.orden_entrega} onChange={(e) => setForm((p) => ({ ...p, orden_entrega: parseInt(e.target.value) || 1 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            {guiasParaAgregar.length === 0 && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">No hay guías disponibles para agregar (todas ya están en el despacho o no hay guías emitidas).</p>
            )}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting || guiasParaAgregar.length === 0} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Agregar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar guía del despacho</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Orden de Entrega</Label><input type="number" min="1" value={editForm.orden_entrega ?? 1} onChange={(e) => setEditForm((p) => ({ ...p, orden_entrega: parseInt(e.target.value) || 1 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Estado Entrega</Label><select value={editForm.estado_entrega ?? 'pendiente'} onChange={(e) => setEditForm((p) => ({ ...p, estado_entrega: e.target.value as any }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS_ENTREGA.map((e) => <option key={e} value={e}>{e}</option>)}</select></div>
              {editForm.estado_entrega === 'entregada' && (
                <>
                  <div><Label>Fecha Entrega</Label><input type="datetime-local" value={editForm.fecha_entrega ? editForm.fecha_entrega.substring(0, 16) : ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_entrega: e.target.value ? `${e.target.value}:00` : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
                  <div><Label>Receptor</Label><input type="text" value={editForm.receptor_nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, receptor_nombre: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
                </>
              )}
              <div className="md:col-span-2"><Label>Observaciones</Label><textarea value={editForm.observaciones ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </LogPageLayout>
  );
}
