/**
 * Países — Catálogo global (Super Admin). CRUD vía catalogosGlobalService.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Flag, Plus, Pencil, Trash2, Search, RefreshCw } from 'lucide-react';
import { catalogosGlobalService } from '@/core/services/catalogos.service';
import type { CatPais, CatPaisCreate, CatPaisUpdate } from '@/types/catalogos.types';
import { useAuth } from '@/shared/context/AuthContext';
import { getErrorMessage, getValidationErrors } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogBody, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';

const DEFAULT: CatPaisCreate = { codigo_iso2: '', codigo_iso3: '', nombre: '', es_activo: true };

const PaisesPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [list, setList] = useState<CatPais[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CatPais | null>(null);
  const [form, setForm] = useState<CatPaisCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<CatPaisUpdate>({});
  const [submitting, setSubmitting] = useState(false);
  const [showInactivos, setShowInactivos] = useState(false);
  const [activeTarget, setActiveTarget] = useState<CatPais | null>(null);
  const [activeAction, setActiveAction] = useState<'deactivate' | 'reactivate' | null>(null);
  const [togglingActive, setTogglingActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogosGlobalService.listPaises({ solo_activos: !showInactivos });
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [showInactivos]);

  useEffect(() => {
    if (isSuperAdmin) fetchList();
  }, [isSuperAdmin, fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT });
    setFieldErrors({});
    setCreateOpen(true);
  };

  const openEdit = (row: CatPais) => {
    setEditing(row);
    setEditFieldErrors({});
    setEditForm({
      codigo_iso2: row.codigo_iso2,
      codigo_iso3: row.codigo_iso3,
      nombre: row.nombre,
      es_activo: row.es_activo ?? undefined,
    });
    setEditOpen(true);
  };

  const closeActiveConfirm = () => {
    setActiveTarget(null);
    setActiveAction(null);
  };

  const openActiveConfirm = (row: CatPais) => {
    const isActivo = row.es_activo !== false;
    setActiveTarget(row);
    setActiveAction(isActivo ? 'deactivate' : 'reactivate');
  };

  const handleActiveConfirm = async () => {
    if (!activeTarget || !activeAction) return;
    setTogglingActive(true);
    try {
      if (activeAction === 'deactivate') {
        await catalogosGlobalService.deletePais(activeTarget.pais_id);
        toast.success('País desactivado.');
      } else {
        await catalogosGlobalService.updatePais(activeTarget.pais_id, { es_activo: true });
        toast.success('País reactivado.');
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
    if (!form.codigo_iso2.trim() || !form.codigo_iso3.trim() || !form.nombre.trim()) {
      toast.error('Código ISO2, ISO3 y nombre son requeridos.');
      return;
    }
    setSubmitting(true);
    setFieldErrors({});
    try {
      await catalogosGlobalService.createPais(form);
      toast.success('País creado.');
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
      await catalogosGlobalService.updatePais(editing.pais_id, editForm);
      toast.success('País actualizado.');
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

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Flag className="mx-auto h-12 w-12 text-text-soft" />
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

  const q = searchTerm.trim().toLowerCase();
  const filteredList = q
    ? list.filter((p) => (p.codigo_iso2?.toLowerCase().includes(q) || p.codigo_iso3?.toLowerCase().includes(q) || p.nombre?.toLowerCase().includes(q)))
    : list;

  const soloActivos = !showInactivos;

  return (
    <div className="w-full">
      <div className="mb-6 bg-surface rounded-lg shadow-sm border border-border-base p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
            <input
              type="text"
              placeholder="Buscar países..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base"
            />
          </div>
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
          <div className="flex gap-2">
            <button type="button" onClick={() => fetchList()} disabled={loading} className="p-2 text-text-soft hover:text-text-base dark:hover:text-text-base hover:bg-overlay dark:hover:bg-overlay rounded-lg transition-colors" title="Actualizar">
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-surface transition-colors">
              <Plus className="h-4 w-4" />
              Nuevo País
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border-base overflow-hidden">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="animate-spin h-6 w-6 text-brand-primary" />
            <span className="ml-2 text-text-soft">Cargando países...</span>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">ISO2</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">ISO3</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Activo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border-base">
                {filteredList.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-text-soft"><Flag className="h-10 w-10 mx-auto mb-2 opacity-50" />{list.length === 0 ? 'No hay países.' : 'No hay resultados para la búsqueda.'}</td></tr>
                ) : (
                  filteredList
                    .filter((row) => (soloActivos ? row.es_activo !== false : true))
                    .map((row) => (
                  <tr key={row.pais_id} className="hover:bg-overlay dark:hover:bg-overlay">
                    <td className="px-4 py-3 text-sm font-medium text-text-base">{row.codigo_iso2}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.codigo_iso3}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.nombre}</td>
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
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Crear país</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2">
              <div className="space-y-4">
                <div><Label>Código ISO2 *</Label><input type="text" value={form.codigo_iso2} onChange={(e) => setForm((p) => ({ ...p, codigo_iso2: e.target.value.toUpperCase().slice(0, 2) }))} className={inputClass('codigo_iso2')} required maxLength={2} placeholder="PE" /></div>
                <div><Label>Código ISO3 *</Label><input type="text" value={form.codigo_iso3} onChange={(e) => setForm((p) => ({ ...p, codigo_iso3: e.target.value.toUpperCase().slice(0, 3) }))} className={inputClass('codigo_iso3')} required maxLength={3} placeholder="PER" /></div>
                <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass('nombre')} required /></div>
                <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_activo ?? true} onChange={(e) => setForm((p) => ({ ...p, es_activo: e.target.checked }))} /><Label>Activo</Label></div>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Editar país</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2">
              <div className="space-y-4">
                <div><Label>Código ISO2 *</Label><input type="text" value={editForm.codigo_iso2 ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_iso2: e.target.value.toUpperCase().slice(0, 2) }))} className={inputClass('codigo_iso2', true)} required maxLength={2} /></div>
                <div><Label>Código ISO3 *</Label><input type="text" value={editForm.codigo_iso3 ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_iso3: e.target.value.toUpperCase().slice(0, 3) }))} className={inputClass('codigo_iso3', true)} required maxLength={3} /></div>
                <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass('nombre', true)} required /></div>
                <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_activo ?? true} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} /><Label>Activo</Label></div>
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
        title={activeAction === 'reactivate' ? 'Reactivar país' : 'Desactivar país'}
        message={
          activeTarget
            ? activeAction === 'reactivate'
              ? `¿Reactivar el país "${activeTarget.nombre}"?`
              : `¿Desactivar el país "${activeTarget.nombre}"?`
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

export default PaisesPage;
