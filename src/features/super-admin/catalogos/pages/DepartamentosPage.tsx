/**
 * Departamentos (catálogo global) — Super Admin. CRUD vía catalogosGlobalService.
 * FK: pais_id → cat_pais
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Map, Plus, Pencil, Trash2, Search, RefreshCw } from 'lucide-react';
import { catalogosGlobalService } from '@/core/services/catalogos.service';
import type { CatPais, CatDepartamento, CatDepartamentoCreate, CatDepartamentoUpdate } from '@/types/catalogos.types';
import { useAuth } from '@/shared/context/AuthContext';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogBody, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';

const DEFAULT: CatDepartamentoCreate = { pais_id: '', codigo: '', nombre: '' };

const DepartamentosPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [paises, setPaises] = useState<CatPais[]>([]);
  const [list, setList] = useState<CatDepartamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paisFilter, setPaisFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CatDepartamento | null>(null);
  const [form, setForm] = useState<CatDepartamentoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<CatDepartamentoUpdate>({});
  const [submitting, setSubmitting] = useState(false);
  const [showInactivos, setShowInactivos] = useState(false);
  const [activeTarget, setActiveTarget] = useState<CatDepartamento | null>(null);
  const [activeAction, setActiveAction] = useState<'deactivate' | 'reactivate' | null>(null);
  const [togglingActive, setTogglingActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPaises = useCallback(async () => {
    try {
      const data = await catalogosGlobalService.listPaises();
      setPaises(Array.isArray(data) ? data : []);
    } catch {
      setPaises([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...(paisFilter ? { pais_id: paisFilter } : {}),
        solo_activos: !showInactivos,
      };
      const data = await catalogosGlobalService.listDepartamentos(params);
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [paisFilter, showInactivos]);

  useEffect(() => {
    if (isSuperAdmin) fetchPaises();
  }, [isSuperAdmin, fetchPaises]);

  useEffect(() => {
    if (isSuperAdmin) fetchList();
  }, [isSuperAdmin, paisFilter, fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, pais_id: paisFilter || (paises[0]?.pais_id ?? '') });
    setCreateOpen(true);
  };

  const openEdit = (row: CatDepartamento) => {
    setEditing(row);
    setEditForm({ pais_id: row.pais_id, codigo: row.codigo, nombre: row.nombre });
    setEditOpen(true);
  };

  const closeActiveConfirm = () => {
    setActiveTarget(null);
    setActiveAction(null);
  };

  const openActiveConfirm = (row: CatDepartamento) => {
    const isActivo = row.es_activo !== false;
    setActiveTarget(row);
    setActiveAction(isActivo ? 'deactivate' : 'reactivate');
  };

  const handleActiveConfirm = async () => {
    if (!activeTarget || !activeAction) return;
    setTogglingActive(true);
    try {
      if (activeAction === 'deactivate') {
        await catalogosGlobalService.deleteDepartamento(activeTarget.departamento_id);
        toast.success('Departamento desactivado.');
      } else {
        await catalogosGlobalService.updateDepartamento(activeTarget.departamento_id, { es_activo: true });
        toast.success('Departamento reactivado.');
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
    if (!form.pais_id || !form.codigo.trim() || !form.nombre.trim()) {
      toast.error('País, código y nombre son requeridos.');
      return;
    }
    setSubmitting(true);
    try {
      await catalogosGlobalService.createDepartamento(form);
      toast.success('Departamento creado.');
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
      await catalogosGlobalService.updateDepartamento(editing.departamento_id, editForm);
      toast.success('Departamento actualizado.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const paisNombre = (id: string) => paises.find((p) => p.pais_id === id)?.nombre ?? id;

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Map className="mx-auto h-12 w-12 text-text-soft" />
          <h3 className="mt-2 text-sm font-medium text-text-base">Acceso restringido</h3>
          <p className="mt-1 text-sm text-text-soft">No tienes permisos para acceder a este catálogo.</p>
        </div>
      </div>
    );
  }

  const inputClass = 'mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-sm';
  const selectClass = 'mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-sm';

  const q = searchTerm.trim().toLowerCase();
  const filteredList = q
    ? list.filter((d) => (d.codigo?.toLowerCase().includes(q) || d.nombre?.toLowerCase().includes(q)))
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
                placeholder="Buscar departamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base"
              />
            </div>
            <select value={paisFilter} onChange={(e) => setPaisFilter(e.target.value)} className={selectToolbarClass}>
              <option value="">Todos los países</option>
              {paises.map((p) => <option key={p.pais_id} value={p.pais_id}>{p.nombre}</option>)}
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
            <button type="button" onClick={openCreate} disabled={paises.length === 0} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="h-4 w-4" />
              Nuevo Departamento
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border-base overflow-hidden">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="animate-spin h-6 w-6 text-brand-primary" />
            <span className="ml-2 text-text-soft">Cargando departamentos...</span>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">País</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Activo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border-base">
                {filteredList.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-text-soft"><Map className="h-10 w-10 mx-auto mb-2 opacity-50" />{list.length === 0 ? 'No hay departamentos.' : 'No hay resultados para la búsqueda.'}</td></tr>
                ) : (
                  filteredList
                    .filter((row) => (soloActivos ? row.es_activo !== false : true))
                    .map((row) => (
                  <tr key={row.departamento_id} className="hover:bg-overlay dark:hover:bg-overlay">
                    <td className="px-4 py-3 text-sm font-medium text-text-base">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{paisNombre(row.pais_id)}</td>
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
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Crear departamento</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2">
              <div className="space-y-4">
                <div><Label>País *</Label><select value={form.pais_id} onChange={(e) => setForm((p) => ({ ...p, pais_id: e.target.value }))} className={selectClass} required><option value="">Seleccionar</option>{paises.map((p) => <option key={p.pais_id} value={p.pais_id}>{p.nombre}</option>)}</select></div>
                <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className={inputClass} required /></div>
                <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Editar departamento</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2">
              <div className="space-y-4">
                <div><Label>País *</Label><select value={editForm.pais_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, pais_id: e.target.value }))} className={selectClass} required><option value="">Seleccionar</option>{paises.map((p) => <option key={p.pais_id} value={p.pais_id}>{p.nombre}</option>)}</select></div>
                <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className={inputClass} required /></div>
                <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
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
        title={activeAction === 'reactivate' ? 'Reactivar departamento' : 'Desactivar departamento'}
        message={
          activeTarget
            ? activeAction === 'reactivate'
              ? `¿Reactivar el departamento "${activeTarget.nombre}"?`
              : `¿Desactivar el departamento "${activeTarget.nombre}"?`
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

export default DepartamentosPage;
