/**
 * Historial de Mantenimiento MNT — Listado y gestión. GET/POST/PUT /api/v1/mnt/historial-mantenimiento
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, History, Plus, Pencil } from 'lucide-react';
import { activoService } from '../services/mnt.service';
import { historialMantenimientoService } from '../services/mnt.service';
import type { Activo } from '../types/mnt.types';
import type { HistorialMantenimiento, HistorialMantenimientoCreate, HistorialMantenimientoUpdate } from '../types/mnt.types';
import { MntPageLayout } from '../components/MntPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_MANT = ['preventivo', 'correctivo', 'predictivo', 'modificacion'] as const;

const DEFAULT: HistorialMantenimientoCreate = {
  activo_id: '',
  fecha_mantenimiento: '',
  tipo_mantenimiento: 'correctivo',
};

export default function HistorialMantenimientoPage() {
  const [activos, setActivos] = useState<Activo[]>([]);
  const [list, setList] = useState<HistorialMantenimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activoFilter, setActivoFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<HistorialMantenimiento | null>(null);
  const [form, setForm] = useState<HistorialMantenimientoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<HistorialMantenimientoUpdate>({});
  const [submitting, setSubmitting] = useState(false);

  const loadActivos = useCallback(async () => {
    try {
      const data = await activoService.list({ es_activo: true });
      setActivos(data);
      if (data.length === 1 && !activoFilter) setActivoFilter(data[0].activo_id);
    } catch {
      setActivos([]);
    }
  }, [activoFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { activo_id?: string; tipo_mantenimiento?: string } = {};
      if (activoFilter) params.activo_id = activoFilter;
      if (tipoFilter) params.tipo_mantenimiento = tipoFilter;
      const data = await historialMantenimientoService.list(
        Object.keys(params).length ? params : undefined
      );
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [activoFilter, tipoFilter]);

  useEffect(() => { loadActivos(); }, [loadActivos]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      activo_id: (activoFilter || activos[0]?.activo_id) ?? '',
      fecha_mantenimiento: new Date().toISOString().slice(0, 10),
    });
    setCreateOpen(true);
  };

  const openEdit = (row: HistorialMantenimiento) => {
    setEditing(row);
    setEditForm({
      fecha_mantenimiento: row.fecha_mantenimiento,
      tipo_mantenimiento: row.tipo_mantenimiento,
      descripcion_trabajo: row.descripcion_trabajo ?? undefined,
      tecnico_nombre: row.tecnico_nombre ?? undefined,
      horas_uso_activo: row.horas_uso_activo ?? undefined,
      kilometraje: row.kilometraje ?? undefined,
      costo_total: row.costo_total ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await historialMantenimientoService.create(form);
      toast.success('Registro de historial creado.');
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
      await historialMantenimientoService.update(editing.historial_id, editForm);
      toast.success('Registro actualizado.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';
  const selectCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

  const getActivoNombre = (id: string) => activos.find((a) => a.activo_id === id)?.codigo_activo ?? id;

  return (
    <MntPageLayout
      title="Historial de Mantenimiento"
      description="Registro de mantenimientos realizados por activo."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!activos.length}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo registro
        </Button>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        {activos.length > 0 && (
          <div>
            <Label className="mr-2">Activo</Label>
            <select value={activoFilter} onChange={(e) => setActivoFilter(e.target.value)} className={selectCls}>
              <option value="">Todos</option>
              {activos.map((a) => <option key={a.activo_id} value={a.activo_id}>{a.codigo_activo} – {a.nombre}</option>)}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Tipo</Label>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {TIPOS_MANT.map((t) => <option key={t} value={t}>{t}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Activo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Técnico</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Costo</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><History className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay registros de historial.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.historial_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getActivoNombre(row.activo_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_mantenimiento}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_mantenimiento}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tecnico_nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.costo_total != null ? row.costo_total : '—'}</td>
                    <td className="px-4 py-3 text-center"><Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80"><Pencil className="h-4 w-4" /></Button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo registro de historial</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Activo *</Label><select value={form.activo_id} onChange={(e) => setForm((p) => ({ ...p, activo_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{activos.map((a) => <option key={a.activo_id} value={a.activo_id}>{a.codigo_activo} – {a.nombre}</option>)}</select></div>
              <div><Label>Fecha *</Label><input type="date" value={form.fecha_mantenimiento} onChange={(e) => setForm((p) => ({ ...p, fecha_mantenimiento: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo *</Label><select value={form.tipo_mantenimiento} onChange={(e) => setForm((p) => ({ ...p, tipo_mantenimiento: e.target.value }))} className={selectCls} required>{TIPOS_MANT.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Técnico</Label><input type="text" value={form.tecnico_nombre ?? ''} onChange={(e) => setForm((p) => ({ ...p, tecnico_nombre: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Descripción trabajo</Label><textarea value={form.descripcion_trabajo ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion_trabajo: e.target.value || undefined }))} className={inputCls} rows={2} /></div>
              <div><Label>Costo total</Label><input type="number" step="0.01" min={0} value={form.costo_total ?? ''} onChange={(e) => setForm((p) => ({ ...p, costo_total: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar registro de historial</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Fecha *</Label><input type="date" value={editForm.fecha_mantenimiento ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_mantenimiento: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo</Label><select value={editForm.tipo_mantenimiento ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_mantenimiento: e.target.value }))} className={selectCls}>{TIPOS_MANT.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Técnico</Label><input type="text" value={editForm.tecnico_nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tecnico_nombre: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Costo total</Label><input type="number" step="0.01" min={0} value={editForm.costo_total ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, costo_total: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MntPageLayout>
  );
}
