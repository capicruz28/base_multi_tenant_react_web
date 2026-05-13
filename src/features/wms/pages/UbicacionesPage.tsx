/**
 * Ubicaciones — Listado y gestión. GET/POST /api/v1/wms/ubicaciones
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Box, Plus, Pencil, Search } from 'lucide-react';
import { almacenService } from '@/features/inv/services/inv.service';
import { zonaAlmacenService } from '../services/wms.service';
import { ubicacionService } from '../services/wms.service';
import type { Almacen } from '@/features/inv/types/inv.types';
import type { ZonaAlmacen } from '../types/wms.types';
import type { Ubicacion, UbicacionCreate, UbicacionUpdate } from '../types/wms.types';
import { WmsPageLayout } from '../components/WmsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermission } from '@/core/auth/PermissionContext';

const TIPOS_UBICACION = ['rack', 'piso', 'estanteria', 'caja', 'pallet'] as const;
const ESTADOS_UBICACION = ['disponible', 'ocupada', 'bloqueada', 'mantenimiento'] as const;

const DEFAULT: UbicacionCreate = {
  almacen_id: '',
  codigo_ubicacion: '',
  tipo_ubicacion: 'rack',
  estado_ubicacion: 'disponible',
  es_activo: true,
};

export default function UbicacionesPage() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission('wms.ubicacion.crear');
  const canEdit =
    hasPermission('wms.ubicacion.actualizar') ||
    hasPermission('wms.ubicacion.editar');
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [zonas, setZonas] = useState<ZonaAlmacen[]>([]);
  const [list, setList] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [almacenFilter, setAlmacenFilter] = useState<string>('');
  const [zonaFilter, setZonaFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Ubicacion | null>(null);
  const [form, setForm] = useState<UbicacionCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<UbicacionUpdate>({});
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

  const loadZonas = useCallback(async () => {
    if (!almacenFilter) { setZonas([]); return; }
    try {
      const data = await zonaAlmacenService.list({ almacen_id: almacenFilter, solo_activos: true });
      setZonas(data);
    } catch {
      setZonas([]);
    }
  }, [almacenFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { solo_activos?: boolean; almacen_id?: string; zona_id?: string; tipo_ubicacion?: string; buscar?: string } = { solo_activos: true };
      if (almacenFilter) params.almacen_id = almacenFilter;
      if (zonaFilter) params.zona_id = zonaFilter;
      if (tipoFilter) params.tipo_ubicacion = tipoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await ubicacionService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [almacenFilter, zonaFilter, tipoFilter, searchTerm]);

  useEffect(() => { loadAlmacenes(); }, [loadAlmacenes]);
  useEffect(() => { loadZonas(); }, [loadZonas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, almacen_id: almacenFilter || (almacenes[0]?.almacen_id ?? ''), zona_id: zonaFilter || undefined });
    setCreateOpen(true);
  };

  const openEdit = (row: Ubicacion) => {
    setEditing(row);
    setEditForm({
      zona_id: row.zona_id ?? undefined,
      codigo_ubicacion: row.codigo_ubicacion,
      pasillo: row.pasillo ?? undefined,
      rack: row.rack ?? undefined,
      nivel: row.nivel ?? undefined,
      nombre: row.nombre ?? undefined,
      tipo_ubicacion: row.tipo_ubicacion,
      capacidad_kg: row.capacidad_kg ?? undefined,
      capacidad_m3: row.capacidad_m3 ?? undefined,
      estado_ubicacion: row.estado_ubicacion,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.almacen_id || !form.codigo_ubicacion.trim()) {
      toast.error('Completa almacén y código de ubicación.');
      return;
    }
    setSubmitting(true);
    try {
      await ubicacionService.create(form);
      toast.success('Ubicación creada.');
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
      await ubicacionService.update(editing.ubicacion_id, editForm);
      toast.success('Ubicación actualizada.');
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
      title="Ubicaciones"
      description="Ubicaciones físicas dentro de zonas: pasillo, rack, nivel."
      action={
        canCreate && (
          <Button
            onClick={openCreate}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            disabled={!almacenes.length}
          >
            <Plus className="h-4 w-4 mr-2" /> Crear ubicación
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
          <Label className="mr-2">Zona</Label>
          <select value={zonaFilter} onChange={(e) => setZonaFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todas</option>
            {zonas.map((z) => <option key={z.zona_id} value={z.zona_id}>{z.codigo} - {z.nombre}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Tipo</Label>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {TIPOS_UBICACION.map((t) => <option key={t} value={t}>{t}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pasillo / Rack / Nivel</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {error ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Box className="h-10 w-10 mx-auto mb-2 opacity-50" />{error}</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Box className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay ubicaciones.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.ubicacion_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_ubicacion}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.pasillo ?? '-'} / {row.rack ?? '-'} / {row.nivel ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_ubicacion}</td>
                    <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 text-xs font-medium rounded ${row.estado_ubicacion === 'disponible' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : row.estado_ubicacion === 'ocupada' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>{row.estado_ubicacion}</span></td>
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
          <DialogHeader><DialogTitle>Crear ubicación</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Almacén *</Label><select value={form.almacen_id} onChange={(e) => setForm((p) => ({ ...p, almacen_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{almacenes.map((a) => <option key={a.almacen_id} value={a.almacen_id}>{a.nombre}</option>)}</select></div>
              <div><Label>Zona</Label><select value={form.zona_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, zona_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Ninguna</option>{zonas.map((z) => <option key={z.zona_id} value={z.zona_id}>{z.codigo} - {z.nombre}</option>)}</select></div>
              <div><Label>Código ubicación *</Label><input type="text" value={form.codigo_ubicacion} onChange={(e) => setForm((p) => ({ ...p, codigo_ubicacion: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Tipo</Label><select value={form.tipo_ubicacion} onChange={(e) => setForm((p) => ({ ...p, tipo_ubicacion: e.target.value as UbicacionCreate['tipo_ubicacion'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_UBICACION.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Pasillo</Label><input type="text" value={form.pasillo ?? ''} onChange={(e) => setForm((p) => ({ ...p, pasillo: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Rack</Label><input type="text" value={form.rack ?? ''} onChange={(e) => setForm((p) => ({ ...p, rack: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Nivel</Label><input type="number" min="0" value={form.nivel ?? ''} onChange={(e) => setForm((p) => ({ ...p, nivel: e.target.value ? parseInt(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar ubicación</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Estado</Label><select value={editForm.estado_ubicacion ?? 'disponible'} onChange={(e) => setEditForm((p) => ({ ...p, estado_ubicacion: e.target.value as UbicacionUpdate['estado_ubicacion'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS_UBICACION.map((e) => <option key={e} value={e}>{e}</option>)}</select></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_activo ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" /><Label>Activo</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </WmsPageLayout>
  );
}
