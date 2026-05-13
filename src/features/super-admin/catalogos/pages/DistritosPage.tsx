/**
 * Distritos (catálogo global) — Super Admin. CRUD vía catalogosGlobalService.
 * FK: provincia_id → cat_provincia. Incluye ubigeo.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { LocateFixed, Plus, Pencil, Trash2, Search, RefreshCw } from 'lucide-react';
import { catalogosGlobalService } from '@/core/services/catalogos.service';
import type { CatProvincia, CatDistrito, CatDistritoCreate, CatDistritoUpdate } from '@/types/catalogos.types';
import { useAuth } from '@/shared/context/AuthContext';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogBody, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';

const DEFAULT: CatDistritoCreate = { provincia_id: '', codigo: '', nombre: '', ubigeo: '' };

const DistritosPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [provincias, setProvincias] = useState<CatProvincia[]>([]);
  const [list, setList] = useState<CatDistrito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provinciaFilter, setProvinciaFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CatDistrito | null>(null);
  const [form, setForm] = useState<CatDistritoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<CatDistritoUpdate>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CatDistrito | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProvincias = useCallback(async () => {
    try {
      const data = await catalogosGlobalService.listProvincias();
      setProvincias(Array.isArray(data) ? data : []);
    } catch {
      setProvincias([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = provinciaFilter ? { provincia_id: provinciaFilter } : {};
      const data = await catalogosGlobalService.listDistritos(params);
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [provinciaFilter]);

  useEffect(() => {
    if (isSuperAdmin) fetchProvincias();
  }, [isSuperAdmin, fetchProvincias]);

  useEffect(() => {
    if (isSuperAdmin) fetchList();
  }, [isSuperAdmin, provinciaFilter, fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, provincia_id: provinciaFilter || (provincias[0]?.provincia_id ?? '') });
    setCreateOpen(true);
  };

  const openEdit = (row: CatDistrito) => {
    setEditing(row);
    setEditForm({ provincia_id: row.provincia_id, codigo: row.codigo, nombre: row.nombre, ubigeo: row.ubigeo });
    setEditOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await catalogosGlobalService.deleteDistrito(deleteTarget.distrito_id);
      toast.success('Distrito eliminado.');
      setDeleteTarget(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.provincia_id || !form.codigo.trim() || !form.nombre.trim() || !form.ubigeo.trim()) {
      toast.error('Provincia, código, nombre y ubigeo son requeridos.');
      return;
    }
    setSubmitting(true);
    try {
      await catalogosGlobalService.createDistrito(form);
      toast.success('Distrito creado.');
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
      await catalogosGlobalService.updateDistrito(editing.distrito_id, editForm);
      toast.success('Distrito actualizado.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const provinciaNombre = (id: string) => provincias.find((p) => p.provincia_id === id)?.nombre ?? id;

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LocateFixed className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Acceso restringido</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No tienes permisos para acceder a este catálogo.</p>
        </div>
      </div>
    );
  }

  const inputClass = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';
  const selectClass = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

  const q = searchTerm.trim().toLowerCase();
  const filteredList = q
    ? list.filter((d) => (d.codigo?.toLowerCase().includes(q) || d.nombre?.toLowerCase().includes(q) || d.ubigeo?.toLowerCase().includes(q)))
    : list;

  const selectToolbarClass = 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white text-sm';

  return (
    <div className="w-full">
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar distritos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select value={provinciaFilter} onChange={(e) => setProvinciaFilter(e.target.value)} className={selectToolbarClass}>
              <option value="">Todas las provincias</option>
              {provincias.map((p) => <option key={p.provincia_id} value={p.provincia_id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => fetchList()} disabled={loading} className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Actualizar">
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={openCreate} disabled={provincias.length === 0} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="h-4 w-4" />
              Nuevo Distrito
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="animate-spin h-6 w-6 text-brand-primary" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando distritos...</span>
          </div>
        )}
        {error && !loading && (
          <div className="p-6">
            <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>
          </div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ubigeo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Provincia</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredList.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><LocateFixed className="h-10 w-10 mx-auto mb-2 opacity-50" />{list.length === 0 ? 'No hay distritos.' : 'No hay resultados para la búsqueda.'}</td></tr>
                ) : (
                  filteredList.map((row) => (
                  <tr key={row.distrito_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.ubigeo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{provinciaNombre(row.provincia_id)}</td>
                    <td className="px-4 py-3 flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Crear distrito</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2">
              <div className="space-y-4">
                <div><Label>Provincia *</Label><select value={form.provincia_id} onChange={(e) => setForm((p) => ({ ...p, provincia_id: e.target.value }))} className={selectClass} required><option value="">Seleccionar</option>{provincias.map((p) => <option key={p.provincia_id} value={p.provincia_id}>{p.nombre}</option>)}</select></div>
                <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className={inputClass} required /></div>
                <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                <div><Label>Ubigeo *</Label><input type="text" value={form.ubigeo} onChange={(e) => setForm((p) => ({ ...p, ubigeo: e.target.value }))} className={inputClass} required maxLength={6} placeholder="6 dígitos" /></div>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Editar distrito</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2">
              <div className="space-y-4">
                <div><Label>Provincia *</Label><select value={editForm.provincia_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, provincia_id: e.target.value }))} className={selectClass} required><option value="">Seleccionar</option>{provincias.map((p) => <option key={p.provincia_id} value={p.provincia_id}>{p.nombre}</option>)}</select></div>
                <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className={inputClass} required /></div>
                <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                <div><Label>Ubigeo *</Label><input type="text" value={editForm.ubigeo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, ubigeo: e.target.value }))} className={inputClass} required maxLength={6} /></div>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700"><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} title="Eliminar distrito" message={deleteTarget ? `¿Eliminar el distrito "${deleteTarget.nombre}"?` : ''} confirmText="Eliminar" cancelText="Cancelar" variant="danger" loading={deleting} />
    </div>
  );
};

export default DistritosPage;
