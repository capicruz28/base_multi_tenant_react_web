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
import { getErrorMessage, getValidationErrors } from '@/core/services/error.service';
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
  const [showInactivos, setShowInactivos] = useState(false);
  const [activeTarget, setActiveTarget] = useState<CatDistrito | null>(null);
  const [activeAction, setActiveAction] = useState<'deactivate' | 'reactivate' | null>(null);
  const [togglingActive, setTogglingActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

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
      const params = {
        ...(provinciaFilter ? { provincia_id: provinciaFilter } : {}),
        solo_activos: !showInactivos,
      };
      const data = await catalogosGlobalService.listDistritos(params);
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [provinciaFilter, showInactivos]);

  useEffect(() => {
    if (isSuperAdmin) fetchProvincias();
  }, [isSuperAdmin, fetchProvincias]);

  useEffect(() => {
    if (isSuperAdmin) fetchList();
  }, [isSuperAdmin, provinciaFilter, fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, provincia_id: provinciaFilter || (provincias[0]?.provincia_id ?? '') });
    setFieldErrors({});
    setCreateOpen(true);
  };

  const openEdit = (row: CatDistrito) => {
    setEditing(row);
    setEditFieldErrors({});
    setEditForm({ provincia_id: row.provincia_id, codigo: row.codigo, nombre: row.nombre, ubigeo: row.ubigeo });
    setEditOpen(true);
  };

  const closeActiveConfirm = () => {
    setActiveTarget(null);
    setActiveAction(null);
  };

  const openActiveConfirm = (row: CatDistrito) => {
    const isActivo = row.es_activo !== false;
    setActiveTarget(row);
    setActiveAction(isActivo ? 'deactivate' : 'reactivate');
  };

  const handleActiveConfirm = async () => {
    if (!activeTarget || !activeAction) return;
    setTogglingActive(true);
    try {
      if (activeAction === 'deactivate') {
        await catalogosGlobalService.deleteDistrito(activeTarget.distrito_id);
        toast.success('Distrito desactivado.');
      } else {
        await catalogosGlobalService.updateDistrito(activeTarget.distrito_id, { es_activo: true });
        toast.success('Distrito reactivado.');
      }
      closeActiveConfirm();
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setTogglingActive(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.provincia_id || !form.codigo.trim() || !form.nombre.trim() || !form.ubigeo.trim()) {
      toast.error('Provincia, código, nombre y ubigeo son requeridos.');
      return;
    }
    setSubmitting(true);
    setFieldErrors({});
    try {
      await catalogosGlobalService.createDistrito(form);
      toast.success('Distrito creado.');
      setCreateOpen(false);
      fetchList();
    } catch (err) {
      const { fieldErrors: nextErrors, message } = getValidationErrors(err);
      setFieldErrors(nextErrors);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    setEditFieldErrors({});
    try {
      await catalogosGlobalService.updateDistrito(editing.distrito_id, editForm);
      toast.success('Distrito actualizado.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      const { fieldErrors: nextErrors, message } = getValidationErrors(err);
      setEditFieldErrors(nextErrors);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const provinciaNombre = (id: string) => provincias.find((p) => p.provincia_id === id)?.nombre ?? id;

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LocateFixed className="mx-auto h-12 w-12 text-text-soft" />
          <h3 className="mt-2 text-sm font-medium text-text-base">Acceso restringido</h3>
          <p className="mt-1 text-sm text-text-soft">No tienes permisos para acceder a este catálogo.</p>
        </div>
      </div>
    );
  }

  const inputClass = (key: string, isEdit = false) =>
    `mt-1 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-sm ${
      (isEdit ? editFieldErrors : fieldErrors)[key] ? 'border-error' : 'border-border-base'
    }`;
  const selectClass = 'mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-sm';

  const q = searchTerm.trim().toLowerCase();
  const filteredList = q
    ? list.filter((d) => (d.codigo?.toLowerCase().includes(q) || d.nombre?.toLowerCase().includes(q) || d.ubigeo?.toLowerCase().includes(q)))
    : list;

  const soloActivos = !showInactivos;

  const selectToolbarClass = 'px-3 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-sm';

  return (
    <div className="w-full">
      <div className="mb-6 bg-surface rounded-lg shadow-sm border border-border-base p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
              <input
                type="text"
                placeholder="Buscar distritos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base"
              />
            </div>
            <select value={provinciaFilter} onChange={(e) => setProvinciaFilter(e.target.value)} className={selectToolbarClass}>
              <option value="">Todas las provincias</option>
              {provincias.map((p) => <option key={p.provincia_id} value={p.provincia_id}>{p.nombre}</option>)}
            </select>
            <label className="flex items-center gap-2 px-3 py-2 border border-border-base rounded-lg cursor-pointer hover:bg-overlay dark:hover:bg-overlay">
              <input
                type="checkbox"
                checked={showInactivos}
                onChange={(e) => setShowInactivos(e.target.checked)}
                className="rounded border-border-base text-brand-primary focus:ring-brand-primary"
                aria-label="Ver inactivos"
              />
              <span className="text-sm text-text-soft">Ver inactivos</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => fetchList()} disabled={loading} className="p-2 text-text-soft hover:text-text-base dark:hover:text-text-base hover:bg-overlay dark:hover:bg-overlay rounded-lg transition-colors" title="Actualizar">
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={openCreate} disabled={provincias.length === 0} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="h-4 w-4" />
              Nuevo Distrito
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border-base overflow-hidden">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="animate-spin h-6 w-6 text-brand-primary" />
            <span className="ml-2 text-text-soft">Cargando distritos...</span>
          </div>
        )}
        {error && !loading && (
          <div className="p-6">
            <p className="text-error bg-error/10 p-4 rounded-lg">{error}</p>
          </div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-base">
              <thead className="bg-subtle dark:bg-subtle">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Ubigeo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Provincia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Activo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border-base">
                {filteredList.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-text-soft"><LocateFixed className="h-10 w-10 mx-auto mb-2 opacity-50" />{list.length === 0 ? 'No hay distritos.' : 'No hay resultados para la búsqueda.'}</td></tr>
                ) : (
                  filteredList
                    .filter((row) => (soloActivos ? row.es_activo !== false : true))
                    .map((row) => (
                  <tr key={row.distrito_id} className="hover:bg-overlay dark:hover:bg-overlay">
                    <td className="px-4 py-3 text-sm font-medium text-text-base">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.ubigeo}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{provinciaNombre(row.provincia_id)}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.es_activo === false ? 'No' : 'Sí'}</td>
                    <td className="px-4 py-3 flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80"><Pencil className="h-4 w-4" /></Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openActiveConfirm(row)}
                        className={row.es_activo === false ? 'text-success hover:bg-success/10 dark:hover:bg-success/15' : 'text-error hover:bg-error/10 dark:hover:bg-error/15'}
                        title={row.es_activo === false ? 'Reactivar' : 'Desactivar'}
                      >
                        {row.es_activo === false ? <RefreshCw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
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
                <div><Label>Provincia *</Label><select value={form.provincia_id} onChange={(e) => setForm((p) => ({ ...p, provincia_id: e.target.value }))} className={inputClass('provincia_id')} required><option value="">Seleccionar</option>{provincias.map((p) => <option key={p.provincia_id} value={p.provincia_id}>{p.nombre}</option>)}</select></div>
                <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className={inputClass('codigo')} required /></div>
                <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass('nombre')} required /></div>
                <div><Label>Ubigeo *</Label><input type="text" value={form.ubigeo} onChange={(e) => setForm((p) => ({ ...p, ubigeo: e.target.value }))} className={inputClass('ubigeo')} required maxLength={6} placeholder="6 dígitos" /></div>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Editar distrito</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2">
              <div className="space-y-4">
                <div><Label>Provincia *</Label><select value={editForm.provincia_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, provincia_id: e.target.value }))} className={inputClass('provincia_id', true)} required><option value="">Seleccionar</option>{provincias.map((p) => <option key={p.provincia_id} value={p.provincia_id}>{p.nombre}</option>)}</select></div>
                <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className={inputClass('codigo', true)} required /></div>
                <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass('nombre', true)} required /></div>
                <div><Label>Ubigeo *</Label><input type="text" value={editForm.ubigeo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, ubigeo: e.target.value }))} className={inputClass('ubigeo', true)} required maxLength={6} /></div>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base"><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!activeTarget && !!activeAction}
        onClose={closeActiveConfirm}
        onConfirm={handleActiveConfirm}
        title={activeAction === 'reactivate' ? 'Reactivar distrito' : 'Desactivar distrito'}
        message={
          activeTarget
            ? activeAction === 'reactivate'
              ? `¿Reactivar el distrito "${activeTarget.nombre}"?`
              : `¿Desactivar el distrito "${activeTarget.nombre}"?`
            : ''
        }
        confirmText={activeAction === 'reactivate' ? 'Reactivar' : 'Desactivar'}
        cancelText="Cancelar"
        variant={activeAction === 'reactivate' ? 'info' : 'danger'}
        loading={togglingActive}
      />
    </div>
  );
};

export default DistritosPage;
