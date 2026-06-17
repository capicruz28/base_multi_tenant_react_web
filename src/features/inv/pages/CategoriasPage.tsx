/**
 * Categorías de Producto — Listado y gestión. GET/POST /api/v1/inv/categorias
 */
import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { FolderTree, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { IamTableEmptyState } from '@/features/admin/components/iam';
import { useDebouncedSearch } from '@/core/list';
import { ErpPagination, ErpSortableHeader } from '@/shared/components/erp-list';
import { OrgCompanyToolbar } from '@/features/org/components/OrgCompanyToolbar';
import { OrgToolbarSearch } from '@/features/org/components/OrgToolbarSearch';
import type { Categoria, CategoriaCreate, CategoriaUpdate } from '../types/inv.types';
import { InvPageLayout } from '../components/InvPageLayout';
import { InvTableSkeleton } from '../components/InvTableSkeleton';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import {
  CATEGORIAS_LIST_CONFIG,
  useCategorias,
  useCategoriasErpList,
  useCreateCategoria,
  useDeleteCategoria,
  useReactivarCategoria,
  useUpdateCategoria,
} from '../hooks/categorias.hooks';
import { useInvSessionScope, useInvScopeEmpresaReset } from '../hooks/useInvSessionScope';
import { OrgSessionEmpresaField } from '@/features/org/components/OrgSessionEmpresaField';
import { assertBodyEmpresaMatchesSession } from '@/features/org/utils/org-body-scope';
import { OrgDiscardConfirmDialog } from '@/features/org/components/OrgDiscardConfirmDialog';
import type { OrgDiscardPending } from '@/features/org/types/org-discard.types';
import { createOrgDiscardHandlers } from '@/features/org/utils/org-discard-handlers';
import { orgDialogGuardProps } from '@/features/org/utils/org-dialog-guard-props';
import {
  buildEditCategoriaFormSnapshot,
  isCreateCategoriaDirty,
  isEditCategoriaDirty,
  type EditCategoriaFormSnapshot,
} from '../utils/form-dirty/categoria-form-dirty';

const DEFAULT: CategoriaCreate = {
  empresa_id: '',
  codigo: '',
  nombre: '',
  metodo_costeo_defecto: 'promedio',
  es_activo: true,
};

export default function CategoriasPage() {
  const { can } = usePermissions();
  const { scopeEmpresaId, canQueryCompanyScoped, activeEmpresaLabel } = useInvSessionScope();
  const search = useDebouncedSearch();
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [form, setForm] = useState<CategoriaCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<CategoriaUpdate>({});
  const [editFormSnapshot, setEditFormSnapshot] = useState<EditCategoriaFormSnapshot | null>(null);
  const [discardPending, setDiscardPending] = useState<OrgDiscardPending>(null);
  const [bajaTarget, setBajaTarget] = useState<Categoria | null>(null);
  const [reactivarTarget, setReactivarTarget] = useState<Categoria | null>(null);

  const categoriasList = useCategoriasErpList({
    solo_activos: !mostrarInactivos,
    debouncedBuscar: search.debouncedValue || undefined,
  });

  const resetPageFilters = useCallback(() => {
    search.clear();
    categoriasList.setPage(1);
    categoriasList.clearSort();
    setMostrarInactivos(false);
    setCreateOpen(false);
    setEditOpen(false);
    setEditing(null);
    setEditFormSnapshot(null);
    setDiscardPending(null);
  }, [search.clear, categoriasList.setPage, categoriasList.clearSort]);
  useInvScopeEmpresaReset(resetPageFilters);

  const categoriasPadreQuery = useCategorias({
    solo_activos: true,
    enabled: createOpen || editOpen,
  });
  const categoriasPadreOpciones = categoriasPadreQuery.data ?? [];
  const list = categoriasList.items;
  const hasSearch = search.hasSearch;

  const createMutation = useCreateCategoria();
  const updateMutation = useUpdateCategoria();
  const deleteMutation = useDeleteCategoria();
  const reactivarMutation = useReactivarCategoria();

  const submitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || reactivarMutation.isPending;
  const formSubmitting = createMutation.isPending || updateMutation.isPending;

  const isCreateDialogDirty = useMemo(() => isCreateCategoriaDirty(form), [form]);
  const isEditDialogDirty = useMemo(
    () => isEditCategoriaDirty(editForm, editFormSnapshot),
    [editForm, editFormSnapshot],
  );

  const closeCreate = useCallback(() => {
    if (!formSubmitting) {
      setCreateOpen(false);
      setForm({ ...DEFAULT, empresa_id: scopeEmpresaId ?? '' });
      setDiscardPending((pending) => (pending === 'create' ? null : pending));
    }
  }, [formSubmitting, scopeEmpresaId]);

  const closeEdit = useCallback(() => {
    if (!formSubmitting) {
      setEditOpen(false);
      setEditing(null);
      setEditForm({});
      setEditFormSnapshot(null);
      setDiscardPending((pending) => (pending === 'edit' ? null : pending));
    }
  }, [formSubmitting]);

  const {
    handleRequestCloseCreate,
    handleRequestCloseEdit,
    handleDiscardCancel,
    handleDiscardConfirm,
    handleCreateDialogOpenChange,
    handleEditDialogOpenChange,
  } = useMemo(
    () =>
      createOrgDiscardHandlers({
        discardPending,
        setDiscardPending,
        isSubmitting: formSubmitting,
        isCreateDirty: isCreateDialogDirty,
        isEditDirty: isEditDialogDirty,
        setCreateOpen,
        setEditOpen,
        closeCreate,
        closeEdit,
        contextPrefix: 'inv-categoria',
      }),
    [
      discardPending,
      formSubmitting,
      isCreateDialogDirty,
      isEditDialogDirty,
      closeCreate,
      closeEdit,
    ],
  );

  const openCreate = () => {
    setDiscardPending(null);
    setForm({ ...DEFAULT, empresa_id: scopeEmpresaId ?? '' });
    setCreateOpen(true);
  };
  const openEdit = (row: Categoria) => {
    setDiscardPending(null);
    setEditing(row);
    const nextEditForm: CategoriaUpdate = {
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      metodo_costeo_defecto: row.metodo_costeo_defecto ?? undefined,
      categoria_padre_id: row.categoria_padre_id ?? undefined,
      cuenta_contable_inventario: row.cuenta_contable_inventario ?? undefined,
      cuenta_contable_costo_venta: row.cuenta_contable_costo_venta ?? undefined,
      es_activo: row.es_activo,
    };
    setEditForm(nextEditForm);
    setEditFormSnapshot(buildEditCategoriaFormSnapshot(nextEditForm));
    setEditOpen(true);
  };

  const categoriasById = useMemo(() => {
    const map = new Map<string, Categoria>();
    list.forEach((c) => map.set(c.categoria_id, c));
    return map;
  }, [list]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scopeEmpresaId || !form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Empresa activa, código y nombre son requeridos.');
      return;
    }
    try {
      await createMutation.mutateAsync(
        assertBodyEmpresaMatchesSession({ ...form }, scopeEmpresaId),
      );
      closeCreate();
    } catch {
      /* error vía useCreateCategoria.onError */
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({ categoriaId: editing.categoria_id, payload: editForm });
      closeEdit();
    } catch {
      /* error vía useUpdateCategoria.onError */
    }
  };

  const canCrear = can('inv', 'crear');
  const canEditar = can('inv', 'editar');
  const canEliminar = can('inv', 'eliminar');
  const TABLE_COLSPAN = 7;

  const categoriaPadreNombre = (categoriaPadreId?: string | null) => {
    if (!categoriaPadreId) return '—';
    return categoriasById.get(categoriaPadreId)?.nombre ?? '—';
  };

  const eliminar = (row: Categoria) => {
    if (!canEliminar) return;
    setBajaTarget(row);
  };

  const reactivar = (row: Categoria) => {
    if (!canEditar) return;
    setReactivarTarget(row);
  };

  const confirmarBaja = async () => {
    if (!bajaTarget) return;
    try {
      await deleteMutation.mutateAsync({ categoriaId: bajaTarget.categoria_id });
      setBajaTarget(null);
    } catch {
      /* error vía useDeleteCategoria.onError */
    }
  };

  const confirmarReactivar = async () => {
    if (!reactivarTarget) return;
    try {
      await reactivarMutation.mutateAsync({ categoriaId: reactivarTarget.categoria_id });
      setReactivarTarget(null);
    } catch {
      /* error vía useReactivarCategoria.onError */
    }
  };

  return (
    <InvPageLayout>
      <OrgCompanyToolbar
        actions={
          canCrear ? (
            <Button
              onClick={openCreate}
              disabled={!scopeEmpresaId || !canQueryCompanyScoped || discardPending !== null}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Plus className="h-4 w-4 mr-2" /> Crear categoría
            </Button>
          ) : null
        }
      >
        <OrgToolbarSearch
          value={search.inputValue}
          onChange={search.setInputValue}
          placeholder="Código, nombre..."
          aria-label="Buscar categorías"
          disabled={discardPending !== null}
        />
        <label className="flex shrink-0 items-center gap-1.5 text-sm text-text-soft cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mostrarInactivos}
            onChange={(e) => setMostrarInactivos(e.target.checked)}
            className="rounded border border-border-base"
          />
          Ver inactivos
        </label>
      </OrgCompanyToolbar>

      {categoriasList.isLoading && <InvTableSkeleton columns={TABLE_COLSPAN} />}
      {categoriasList.isError && !categoriasList.isLoading && (
        <p className="text-error bg-error/10 p-4 rounded-lg">
          {getErrorMessage(categoriasList.error).message}
        </p>
      )}
      {!categoriasList.isLoading && !categoriasList.isError && (
        <div className="overflow-x-auto rounded-lg border border-border-base shadow">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-subtle">
              <tr>
                <ErpSortableHeader
                  column="codigo"
                  label="Código"
                  sortableColumns={CATEGORIAS_LIST_CONFIG.sortableColumns}
                  sort={categoriasList.sort}
                  onSort={categoriasList.toggleSort}
                />
                <ErpSortableHeader
                  column="nombre"
                  label="Nombre"
                  sortableColumns={CATEGORIAS_LIST_CONFIG.sortableColumns}
                  sort={categoriasList.sort}
                  onSort={categoriasList.toggleSort}
                />
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Padre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Método Costeo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {list.length === 0 ? (
                <IamTableEmptyState
                  colSpan={TABLE_COLSPAN}
                  icon={FolderTree}
                  title={
                    hasSearch
                      ? 'No se encontraron categorías que coincidan con la búsqueda.'
                      : mostrarInactivos
                        ? 'No hay categorías registradas.'
                        : 'No hay categorías activas.'
                  }
                  description={
                    hasSearch ? 'Pruebe con otro término o limpie el filtro de búsqueda.' : undefined
                  }
                  actionLabel={
                    !hasSearch && !mostrarInactivos && canCrear && scopeEmpresaId
                      ? 'Crear categoría'
                      : undefined
                  }
                  onAction={
                    !hasSearch && !mostrarInactivos && canCrear && scopeEmpresaId ? openCreate : undefined
                  }
                  actionDisabled={discardPending !== null}
                />
              ) : (
                list.map((row) => (
                  <tr key={row.categoria_id} className="hover:bg-overlay dark:hover:bg-overlay">
                    <td className="px-4 py-3 text-sm font-medium text-text-base">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-text-base">
                      {categoriaPadreNombre(row.categoria_padre_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.metodo_costeo_defecto ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{activeEmpresaLabel ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {row.es_activo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex items-center justify-center gap-1">
                      {row.es_activo ? (
                        <>
                          {canEditar && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(row)}
                              disabled={discardPending !== null}
                              className="text-brand-primary hover:text-brand-primary/80"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canEliminar && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => eliminar(row)}
                              disabled={submitting || discardPending !== null}
                              className="text-error hover:text-error hover:bg-error/10"
                              title="Desactivar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      ) : (
                        canEditar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => reactivar(row)}
                            disabled={submitting || discardPending !== null}
                            className="text-success hover:text-success/80"
                            title="Reactivar"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {categoriasList.pagination ? (
            <ErpPagination
              pagination={categoriasList.pagination}
              onPageChange={categoriasList.setPage}
              onLimitChange={categoriasList.setLimit}
              disabled={discardPending !== null || categoriasList.isFetching}
            />
          ) : null}
        </div>
      )}
      <OrgDiscardConfirmDialog
        discardPending={discardPending}
        entityLabel="la categoría"
        onClose={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
      <Dialog open={createOpen} onOpenChange={handleCreateDialogOpenChange}>
        <DialogContent className="max-w-lg" {...orgDialogGuardProps}>
          <DialogHeader><DialogTitle>Crear categoría</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <OrgSessionEmpresaField />
            <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase" required /></div>
            <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm" required /></div>
            <div>
              <Label>Categoría padre</Label>
              <select
                value={form.categoria_padre_id ?? ''}
                onChange={(e) =>
                  setForm((p) => ({ ...p, categoria_padre_id: e.target.value || undefined }))
                }
                className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
              >
                <option value="">Ninguna</option>
                {categoriasPadreOpciones.map((c) => (
                  <option key={c.categoria_id} value={c.categoria_id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div><Label>Método Costeo</Label><select value={form.metodo_costeo_defecto ?? 'promedio'} onChange={(e) => setForm((p) => ({ ...p, metodo_costeo_defecto: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"><option value="promedio">Promedio</option><option value="fifo">FIFO</option><option value="lifo">LIFO</option><option value="estandar">Estándar</option></select></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cuenta contable inventario</Label>
                <input
                  type="text"
                  value={form.cuenta_contable_inventario ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      cuenta_contable_inventario: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
                />
              </div>
              <div>
                <Label>Cuenta contable costo venta</Label>
                <input
                  type="text"
                  value={form.cuenta_contable_costo_venta ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      cuenta_contable_costo_venta: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleRequestCloseCreate}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="max-w-lg" {...orgDialogGuardProps}>
          <DialogHeader><DialogTitle>Editar categoría</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase" required /></div>
            <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm" required /></div>
            <div>
              <Label>Categoría padre</Label>
              <select
                value={editForm.categoria_padre_id ?? ''}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, categoria_padre_id: e.target.value || undefined }))
                }
                className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
              >
                <option value="">Ninguna</option>
                {categoriasPadreOpciones.map((c) => (
                  <option key={c.categoria_id} value={c.categoria_id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div><Label>Método Costeo</Label><select value={editForm.metodo_costeo_defecto ?? 'promedio'} onChange={(e) => setEditForm((p) => ({ ...p, metodo_costeo_defecto: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"><option value="promedio">Promedio</option><option value="fifo">FIFO</option><option value="lifo">LIFO</option><option value="estandar">Estándar</option></select></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cuenta contable inventario</Label>
                <input
                  type="text"
                  value={editForm.cuenta_contable_inventario ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      cuenta_contable_inventario: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
                />
              </div>
              <div>
                <Label>Cuenta contable costo venta</Label>
                <input
                  type="text"
                  value={editForm.cuenta_contable_costo_venta ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      cuenta_contable_costo_venta: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleRequestCloseEdit}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!bajaTarget && discardPending === null}
        onClose={() => setBajaTarget(null)}
        onConfirm={() => void confirmarBaja()}
        title="Desactivar categoría"
        message={bajaTarget ? `¿Desactivar categoría '${bajaTarget.nombre}'? Podrá reactivarlo después.` : ''}
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!reactivarTarget && discardPending === null}
        onClose={() => setReactivarTarget(null)}
        onConfirm={() => void confirmarReactivar()}
        title="Reactivar categoría"
        message={reactivarTarget ? `¿Reactivar categoría '${reactivarTarget.nombre}'? Volverá a estar disponible.` : ''}
        confirmText="Reactivar"
        cancelText="Cancelar"
        variant="info"
        loading={reactivarMutation.isPending}
      />
    </InvPageLayout>
  );
}
