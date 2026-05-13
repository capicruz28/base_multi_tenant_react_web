/**
 * Zonas de Almacén — Listado y gestión. GET/POST /api/v1/wms/zonas
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, MapPin, Plus, Pencil, Search } from 'lucide-react';
import { almacenService } from '@/features/inv/services/inv.service';
import { zonaAlmacenService } from '../services/wms.service';
import type { Almacen } from '@/features/inv/types/inv.types';
import type { ZonaAlmacen, ZonaAlmacenCreate, ZonaAlmacenUpdate } from '../types/wms.types';
import { WmsPageLayout } from '../components/WmsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermission } from '@/core/auth/PermissionContext';

const TIPOS_ZONA = ['recepcion', 'almacenaje', 'picking', 'despacho', 'cuarentena', 'merma'] as const;

const DEFAULT: ZonaAlmacenCreate = {
  almacen_id: '',
  codigo: '',
  nombre: '',
  tipo_zona: 'almacenaje',
  es_activo: true,
};

export default function ZonasPage() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission('wms.zona.crear');
  const canEdit =
    hasPermission('wms.zona.actualizar') || hasPermission('wms.zona.editar');
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [list, setList] = useState<ZonaAlmacen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [almacenFilter, setAlmacenFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ZonaAlmacen | null>(null);
  const [form, setForm] = useState<ZonaAlmacenCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ZonaAlmacenUpdate>({});
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

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { solo_activos?: boolean; almacen_id?: string; tipo_zona?: string; buscar?: string } = { solo_activos: true };
      if (almacenFilter) params.almacen_id = almacenFilter;
      if (tipoFilter) params.tipo_zona = tipoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await zonaAlmacenService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [almacenFilter, tipoFilter, searchTerm]);

  useEffect(() => { loadAlmacenes(); }, [loadAlmacenes]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, almacen_id: almacenFilter || (almacenes[0]?.almacen_id ?? '') });
    setCreateOpen(true);
  };

  const openEdit = (row: ZonaAlmacen) => {
    setEditing(row);
    setEditForm({
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      tipo_zona: row.tipo_zona,
      temperatura_min: row.temperatura_min ?? undefined,
      temperatura_max: row.temperatura_max ?? undefined,
      requiere_control_temperatura: row.requiere_control_temperatura,
      capacidad_m3: row.capacidad_m3 ?? undefined,
      capacidad_kg: row.capacidad_kg ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.almacen_id || !form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Completa almacén, código y nombre.');
      return;
    }
    setSubmitting(true);
    try {
      await zonaAlmacenService.create(form);
      toast.success('Zona creada.');
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
      await zonaAlmacenService.update(editing.zona_id, editForm);
      toast.success('Zona actualizada.');
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
      title="Zonas de Almacén"
      description="Zonas dentro de cada almacén: recepción, almacenaje, picking, despacho, cuarentena, merma."
      action={
        canCreate && (
          <Button
            onClick={openCreate}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            disabled={!almacenes.length}
          >
            <Plus className="h-4 w-4 mr-2" /> Crear zona
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
              {almacenes.map((a) => (
                <option key={a.almacen_id} value={a.almacen_id}>{a.nombre}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Tipo</Label>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {TIPOS_ZONA.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {!loading && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Capacidad (m³/kg)</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {error ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />{error}</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay zonas.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.zona_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_zona}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.capacidad_m3 ?? '-'} / {row.capacidad_kg ?? '-'}</td>
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
          <DialogHeader><DialogTitle>Crear zona</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Almacén *</Label><select value={form.almacen_id} onChange={(e) => setForm((p) => ({ ...p, almacen_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{almacenes.map((a) => <option key={a.almacen_id} value={a.almacen_id}>{a.nombre}</option>)}</select></div>
              <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Tipo zona *</Label><select value={form.tipo_zona} onChange={(e) => setForm((p) => ({ ...p, tipo_zona: e.target.value as ZonaAlmacenCreate['tipo_zona'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_ZONA.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Capacidad m³</Label><input type="number" step="0.01" min="0" value={form.capacidad_m3 ?? ''} onChange={(e) => setForm((p) => ({ ...p, capacidad_m3: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Capacidad kg</Label><input type="number" step="0.01" min="0" value={form.capacidad_kg ?? ''} onChange={(e) => setForm((p) => ({ ...p, capacidad_kg: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar zona</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_activo ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" /><Label>Activo</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </WmsPageLayout>
  );
}
