/**
 * Tareas WMS — Listado y gestión. GET/POST /api/v1/wms/tareas
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, ClipboardList, Plus, Pencil, Search } from 'lucide-react';
import { almacenService } from '@/features/inv/services/inv.service';
import { ubicacionService } from '../services/wms.service';
import { productoService } from '@/features/inv/services/inv.service';
import { unidadMedidaService } from '@/features/inv/services/inv.service';
import { tareaService } from '../services/wms.service';
import type { Almacen } from '@/features/inv/types/inv.types';
import type { Ubicacion } from '../types/wms.types';
import type { Producto } from '@/features/inv/types/inv.types';
import type { UnidadMedida } from '@/features/inv/types/inv.types';
import type { Tarea, TareaCreate, TareaUpdate } from '../types/wms.types';
import { WmsPageLayout } from '../components/WmsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermission } from '@/core/auth/PermissionContext';

const TIPOS_TAREA = ['picking', 'putaway', 'reabastecimiento', 'conteo', 'reubicacion'] as const;
const ESTADOS_TAREA = ['pendiente', 'asignada', 'en_proceso', 'completada', 'cancelada'] as const;

const DEFAULT: TareaCreate = {
  almacen_id: '',
  numero_tarea: '',
  tipo_tarea: 'picking',
  prioridad: 3,
  estado: 'pendiente',
};

export default function TareasPage() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission('wms.tarea.crear');
  const canEdit =
    hasPermission('wms.tarea.actualizar') || hasPermission('wms.tarea.editar');
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [list, setList] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [almacenFilter, setAlmacenFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Tarea | null>(null);
  const [form, setForm] = useState<TareaCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<TareaUpdate>({});
  const [submitting, setSubmitting] = useState(false);

  const loadAlmacenes = useCallback(async () => {
    try {
      const data = await almacenService.list({ solo_activos: true });
      setAlmacenes(data);
      if (data.length === 1 && !almacenFilter) setAlmacenFilter(data[0].almacen_id);
    } catch {
      setAlmacenes([]);
    }
  }, [almacenFilter]);

  const loadUbicaciones = useCallback(async () => {
    if (!almacenFilter) { setUbicaciones([]); return; }
    try {
      const data = await ubicacionService.list({ almacen_id: almacenFilter, solo_activos: true });
      setUbicaciones(data);
    } catch {
      setUbicaciones([]);
    }
  }, [almacenFilter]);

  const loadProductos = useCallback(async () => {
    try {
      const data = await productoService.list({ solo_activos: true });
      setProductos(data);
    } catch {
      setProductos([]);
    }
  }, []);

  const loadUnidadesMedida = useCallback(async () => {
    try {
      const data = await unidadMedidaService.list({ solo_activos: true });
      setUnidadesMedida(data);
    } catch {
      setUnidadesMedida([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { almacen_id?: string; tipo_tarea?: string; estado?: string; buscar?: string } = {};
      if (almacenFilter) params.almacen_id = almacenFilter;
      if (tipoFilter) params.tipo_tarea = tipoFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await tareaService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [almacenFilter, tipoFilter, estadoFilter, searchTerm]);

  useEffect(() => { loadAlmacenes(); }, [loadAlmacenes]);
  useEffect(() => { loadUbicaciones(); }, [loadUbicaciones]);
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadUnidadesMedida(); }, [loadUnidadesMedida]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      almacen_id: almacenFilter || (almacenes[0]?.almacen_id ?? ''),
      ubicacion_origen_id: ubicaciones[0]?.ubicacion_id,
      producto_id: productos[0]?.producto_id,
      unidad_medida_id: unidadesMedida[0]?.unidad_medida_id,
    });
    setCreateOpen(true);
  };

  const openEdit = (row: Tarea) => {
    setEditing(row);
    setEditForm({
      prioridad: row.prioridad ?? undefined,
      ubicacion_origen_id: row.ubicacion_origen_id ?? undefined,
      ubicacion_destino_id: row.ubicacion_destino_id ?? undefined,
      cantidad_planeada: row.cantidad_planeada ?? undefined,
      cantidad_completada: row.cantidad_completada ?? undefined,
      estado: row.estado,
      instrucciones: row.instrucciones ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.almacen_id || !form.numero_tarea.trim()) {
      toast.error('Completa almacén y número de tarea.');
      return;
    }
    setSubmitting(true);
    try {
      await tareaService.create(form);
      toast.success('Tarea creada.');
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
      await tareaService.update(editing.tarea_id, editForm);
      toast.success('Tarea actualizada.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WmsPageLayout
      title="Tareas WMS"
      description="Picking, putaway, reabastecimiento, conteo y reubicación."
      action={
        canCreate && (
          <Button
            onClick={openCreate}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            disabled={!almacenes.length}
          >
            <Plus className="h-4 w-4 mr-2" /> Crear tarea
          </Button>
        )
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        {almacenes.length > 0 && (
          <div>
            <Label className="mr-2">Almacén</Label>
            <select value={almacenFilter} onChange={(e) => setAlmacenFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Todos</option>
              {almacenes.map((a) => <option key={a.almacen_id} value={a.almacen_id}>{a.nombre}</option>)}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Tipo</Label>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {TIPOS_TAREA.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ESTADOS_TAREA.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" />
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {!loading && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Prioridad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto / Cantidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Asignado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {error ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />{error}</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay tareas.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.tarea_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_tarea}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_tarea}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.prioridad ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.producto_nombre ?? '-'} ({row.cantidad_planeada ?? 0})</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.asignado_nombre ?? '-'}</td>
                    <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 text-xs font-medium rounded ${row.estado === 'completada' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : row.estado === 'en_proceso' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : row.estado === 'cancelada' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>{row.estado}</span></td>
                    <td className="px-4 py-3 text-center">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(row)}
                          className="text-brand-primary hover:text-brand-primary/80"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear tarea</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Almacén *</Label><select value={form.almacen_id} onChange={(e) => setForm((p) => ({ ...p, almacen_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{almacenes.map((a) => <option key={a.almacen_id} value={a.almacen_id}>{a.nombre}</option>)}</select></div>
              <div><Label>Número tarea *</Label><input type="text" value={form.numero_tarea} onChange={(e) => setForm((p) => ({ ...p, numero_tarea: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Tipo</Label><select value={form.tipo_tarea} onChange={(e) => setForm((p) => ({ ...p, tipo_tarea: e.target.value as TareaCreate['tipo_tarea'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_TAREA.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Prioridad (1=Urgente)</Label><input type="number" min="1" max="4" value={form.prioridad ?? 3} onChange={(e) => setForm((p) => ({ ...p, prioridad: parseInt(e.target.value) || 3 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Ubicación origen</Label><select value={form.ubicacion_origen_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, ubicacion_origen_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Ninguna</option>{ubicaciones.map((u) => <option key={u.ubicacion_id} value={u.ubicacion_id}>{u.codigo_ubicacion}</option>)}</select></div>
              <div><Label>Ubicación destino</Label><select value={form.ubicacion_destino_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, ubicacion_destino_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Ninguna</option>{ubicaciones.map((u) => <option key={u.ubicacion_id} value={u.ubicacion_id}>{u.codigo_ubicacion}</option>)}</select></div>
              <div><Label>Producto</Label><select value={form.producto_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Ninguno</option>{productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} - {p.nombre}</option>)}</select></div>
              <div><Label>Cantidad planeada</Label><input type="number" step="0.01" min="0" value={form.cantidad_planeada ?? ''} onChange={(e) => setForm((p) => ({ ...p, cantidad_planeada: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Instrucciones</Label><textarea value={form.instrucciones ?? ''} onChange={(e) => setForm((p) => ({ ...p, instrucciones: e.target.value || undefined }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar tarea</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Estado</Label><select value={editForm.estado ?? 'pendiente'} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as TareaUpdate['estado'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS_TAREA.map((e) => <option key={e} value={e}>{e}</option>)}</select></div>
              <div><Label>Cantidad completada</Label><input type="number" step="0.01" min="0" value={editForm.cantidad_completada ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cantidad_completada: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Observaciones</Label><textarea value={editForm.observaciones ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </WmsPageLayout>
  );
}
