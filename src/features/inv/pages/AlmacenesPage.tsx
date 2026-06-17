/**
 * Almacenes — Listado y gestión. GET/POST /api/v1/inv/almacenes
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Warehouse, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { IamTableEmptyState } from '@/features/admin/components/iam';
import { useDebouncedSearch } from '@/core/list';
import { ErpPagination, ErpSortableHeader } from '@/shared/components/erp-list';
import { OrgCompanyToolbar } from '@/features/org/components/OrgCompanyToolbar';
import { OrgToolbarSearch } from '@/features/org/components/OrgToolbarSearch';
import { sucursalService } from '@/features/org/services/org.service';
import type { Sucursal } from '@/features/org/types/org.types';
import type { Almacen, AlmacenCreate, AlmacenUpdate } from '../types/inv.types';
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
  ALMACENES_LIST_CONFIG,
  useAlmacenesErpList,
  useCreateAlmacen,
  useDeleteAlmacen,
  useReactivarAlmacen,
  useUpdateAlmacen,
} from '../hooks/almacenes.hooks';
import { useInvSessionScope, useInvScopeEmpresaReset } from '../hooks/useInvSessionScope';
import { OrgSessionEmpresaField } from '@/features/org/components/OrgSessionEmpresaField';
import { assertBodyEmpresaMatchesSession } from '@/features/org/utils/org-body-scope';
import { OrgDiscardConfirmDialog } from '@/features/org/components/OrgDiscardConfirmDialog';
import type { OrgDiscardPending } from '@/features/org/types/org-discard.types';
import { createOrgDiscardHandlers } from '@/features/org/utils/org-discard-handlers';
import { orgDialogGuardProps } from '@/features/org/utils/org-dialog-guard-props';
import {
  buildEditAlmacenFormSnapshot,
  isCreateAlmacenDirty,
  isEditAlmacenDirty,
  type EditAlmacenFormSnapshot,
} from '../utils/form-dirty/almacen-form-dirty';

const TIPOS_ALMACEN = ['general', 'materia_prima', 'producto_terminado', 'transito', 'consignacion', 'cuarentena'] as const;

const DEFAULT: AlmacenCreate = {
  empresa_id: '',
  codigo: '',
  nombre: '',
  tipo_almacen: 'general',
  permite_compras: true,
  es_activo: true,
};

export default function AlmacenesPage() {
  const { can } = usePermissions();
  const { scopeEmpresaId, canQueryCompanyScoped } = useInvSessionScope();
  const search = useDebouncedSearch();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Almacen | null>(null);
  const [form, setForm] = useState<AlmacenCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<AlmacenUpdate>({});
  const [editFormSnapshot, setEditFormSnapshot] = useState<EditAlmacenFormSnapshot | null>(null);
  const [discardPending, setDiscardPending] = useState<OrgDiscardPending>(null);
  const [bajaTarget, setBajaTarget] = useState<Almacen | null>(null);
  const [reactivarTarget, setReactivarTarget] = useState<Almacen | null>(null);

  const almacenesList = useAlmacenesErpList({
    solo_activos: !mostrarInactivos,
    debouncedBuscar: search.debouncedValue || undefined,
  });

  const resetPageFilters = useCallback(() => {
    search.clear();
    almacenesList.setPage(1);
    almacenesList.clearSort();
    setMostrarInactivos(false);
    setCreateOpen(false);
    setEditOpen(false);
    setEditing(null);
    setEditFormSnapshot(null);
    setDiscardPending(null);
  }, [search.clear, almacenesList.setPage, almacenesList.clearSort]);
  useInvScopeEmpresaReset(resetPageFilters);

  const loadSucursales = useCallback(async () => {
    if (!scopeEmpresaId) {
      setSucursales([]);
      return;
    }
    try {
      const data = await sucursalService.list({ empresa_id: scopeEmpresaId, solo_activos: true });
      setSucursales(data);
    } catch {
      setSucursales([]);
    }
  }, [scopeEmpresaId]);

  useEffect(() => {
    void loadSucursales();
  }, [loadSucursales]);

  const list = almacenesList.items;
  const hasSearch = search.hasSearch;

  const sucursalNombre = (id: string | null | undefined) =>
    id ? sucursales.find((s) => s.sucursal_id === id)?.nombre ?? '—' : '—';

  const createMutation = useCreateAlmacen();
  const updateMutation = useUpdateAlmacen();
  const deleteMutation = useDeleteAlmacen();
  const reactivarMutation = useReactivarAlmacen();

  const submitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || reactivarMutation.isPending;
  const formSubmitting = createMutation.isPending || updateMutation.isPending;

  const isCreateDialogDirty = useMemo(() => isCreateAlmacenDirty(form), [form]);
  const isEditDialogDirty = useMemo(
    () => isEditAlmacenDirty(editForm, editFormSnapshot),
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
        contextPrefix: 'inv-almacen',
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
  const openEdit = (row: Almacen) => {
    setDiscardPending(null);
    setEditing(row);
    const nextEditForm: AlmacenUpdate = {
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      tipo_almacen: row.tipo_almacen,
      direccion: row.direccion ?? undefined,
      responsable_nombre: row.responsable_nombre ?? undefined,
      es_almacen_principal: row.es_almacen_principal ?? false,
      permite_ventas: row.permite_ventas ?? false,
      permite_compras: row.permite_compras ?? true,
      permite_produccion: row.permite_produccion ?? false,
      capacidad_m3: row.capacidad_m3 ?? undefined,
      capacidad_kg: row.capacidad_kg ?? undefined,
      capacidad_unidades: row.capacidad_unidades ?? undefined,
      centro_costo_id: row.centro_costo_id ?? undefined,
      es_activo: row.es_activo,
    };
    setEditForm(nextEditForm);
    setEditFormSnapshot(buildEditAlmacenFormSnapshot(nextEditForm));
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scopeEmpresaId || !form.codigo.trim() || !form.nombre.trim() || !form.tipo_almacen) {
      toast.error('Empresa activa, código, nombre y tipo son requeridos.');
      return;
    }
    try {
      await createMutation.mutateAsync(
        assertBodyEmpresaMatchesSession({ ...form }, scopeEmpresaId),
      );
      closeCreate();
    } catch {
      /* error vía useCreateAlmacen.onError */
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({ almacenId: editing.almacen_id, payload: editForm });
      closeEdit();
    } catch {
      /* error vía useUpdateAlmacen.onError */
    }
  };

  const canCrear = can('inv', 'crear');
  const canEditar = can('inv', 'editar');
  const canEliminar = can('inv', 'eliminar');
  const TABLE_COLSPAN = 7;

  const eliminar = (row: Almacen) => {
    if (!canEliminar) return;
    setBajaTarget(row);
  };

  const reactivar = (row: Almacen) => {
    if (!canEditar) return;
    setReactivarTarget(row);
  };

  const confirmarBaja = async () => {
    if (!bajaTarget) return;
    try {
      await deleteMutation.mutateAsync({ almacenId: bajaTarget.almacen_id });
      setBajaTarget(null);
    } catch {
      /* error vía useDeleteAlmacen.onError */
    }
  };

  const confirmarReactivar = async () => {
    if (!reactivarTarget) return;
    try {
      await reactivarMutation.mutateAsync({ almacenId: reactivarTarget.almacen_id });
      setReactivarTarget(null);
    } catch {
      /* error vía useReactivarAlmacen.onError */
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
              <Plus className="h-4 w-4 mr-2" /> Crear almacén
            </Button>
          ) : null
        }
      >
        <OrgToolbarSearch
          value={search.inputValue}
          onChange={search.setInputValue}
          placeholder="Código, nombre..."
          aria-label="Buscar almacenes"
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

      {almacenesList.isLoading && <InvTableSkeleton columns={TABLE_COLSPAN} />}
      {almacenesList.isError && !almacenesList.isLoading && (
        <p className="text-error bg-error/10 p-4 rounded-lg">
          {getErrorMessage(almacenesList.error).message}
        </p>
      )}
      {!almacenesList.isLoading && !almacenesList.isError && (
        <div className="overflow-x-auto rounded-lg border border-border-base shadow">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-subtle">
              <tr>
                <ErpSortableHeader
                  column="codigo"
                  label="Código"
                  sortableColumns={ALMACENES_LIST_CONFIG.sortableColumns}
                  sort={almacenesList.sort}
                  onSort={almacenesList.toggleSort}
                />
                <ErpSortableHeader
                  column="nombre"
                  label="Nombre"
                  sortableColumns={ALMACENES_LIST_CONFIG.sortableColumns}
                  sort={almacenesList.sort}
                  onSort={almacenesList.toggleSort}
                />
                <ErpSortableHeader
                  column="tipo_almacen"
                  label="Tipo"
                  sortableColumns={ALMACENES_LIST_CONFIG.sortableColumns}
                  sort={almacenesList.sort}
                  onSort={almacenesList.toggleSort}
                />
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Principal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Sucursal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {list.length === 0 ? (
                <IamTableEmptyState
                  colSpan={TABLE_COLSPAN}
                  icon={Warehouse}
                  title={
                    hasSearch
                      ? 'No se encontraron almacenes que coincidan con la búsqueda.'
                      : mostrarInactivos
                        ? 'No hay almacenes registrados.'
                        : 'No hay almacenes activos.'
                  }
                  description={
                    hasSearch ? 'Pruebe con otro término o limpie el filtro de búsqueda.' : undefined
                  }
                  actionLabel={
                    !hasSearch && !mostrarInactivos && canCrear && scopeEmpresaId ? 'Crear almacén' : undefined
                  }
                  onAction={
                    !hasSearch && !mostrarInactivos && canCrear && scopeEmpresaId ? openCreate : undefined
                  }
                  actionDisabled={discardPending !== null}
                />
              ) : (
                list.map((row) => (
                  <tr key={row.almacen_id} className="hover:bg-overlay dark:hover:bg-overlay">
                    <td className="px-4 py-3 text-sm font-medium text-text-base">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.tipo_almacen}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.es_almacen_principal ? 'Sí' : 'No'}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{sucursalNombre(row.sucursal_id)}</td>
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
          {almacenesList.pagination ? (
            <ErpPagination
              pagination={almacenesList.pagination}
              onPageChange={almacenesList.setPage}
              onLimitChange={almacenesList.setLimit}
              disabled={discardPending !== null || almacenesList.isFetching}
            />
          ) : null}
        </div>
      )}
      <OrgDiscardConfirmDialog
        discardPending={discardPending}
        entityLabel="el almacén"
        onClose={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
      <Dialog open={createOpen} onOpenChange={handleCreateDialogOpenChange}>
        <DialogContent className="max-w-lg" {...orgDialogGuardProps}>
          <DialogHeader><DialogTitle>Crear almacén</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <OrgSessionEmpresaField />
            <div><Label>Sucursal</Label><select value={form.sucursal_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, sucursal_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"><option value="">Ninguna</option>{sucursales.map((s) => <option key={s.sucursal_id} value={s.sucursal_id}>{s.nombre}</option>)}</select></div>
            <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase" required /></div>
            <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm" required /></div>
            <div><Label>Tipo *</Label><select value={form.tipo_almacen} onChange={(e) => setForm((p) => ({ ...p, tipo_almacen: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm">{TIPOS_ALMACEN.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</select></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_almacen_principal ?? false} onChange={(e) => setForm((p) => ({ ...p, es_almacen_principal: e.target.checked }))} /><Label>Almacén principal</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.permite_ventas ?? false} onChange={(e) => setForm((p) => ({ ...p, permite_ventas: e.target.checked }))} /><Label>Permite ventas</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.permite_compras ?? true} onChange={(e) => setForm((p) => ({ ...p, permite_compras: e.target.checked }))} /><Label>Permite compras</Label></div>
            <DialogFooter><Button type="button" variant="outline" onClick={handleRequestCloseCreate}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="max-w-lg" {...orgDialogGuardProps}>
          <DialogHeader><DialogTitle>Editar almacén</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase" required /></div>
            <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm" required /></div>
            <div><Label>Tipo *</Label><select value={editForm.tipo_almacen ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_almacen: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm">{TIPOS_ALMACEN.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</select></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_almacen_principal ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_almacen_principal: e.target.checked }))} /><Label>Almacén principal</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.permite_ventas ?? false} onChange={(e) => setEditForm((p) => ({ ...p, permite_ventas: e.target.checked }))} /><Label>Permite ventas</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.permite_compras ?? true} onChange={(e) => setEditForm((p) => ({ ...p, permite_compras: e.target.checked }))} /><Label>Permite compras</Label></div>
            <DialogFooter><Button type="button" variant="outline" onClick={handleRequestCloseEdit}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!bajaTarget && discardPending === null}
        onClose={() => setBajaTarget(null)}
        onConfirm={() => void confirmarBaja()}
        title="Desactivar almacén"
        message={bajaTarget ? `¿Desactivar almacén '${bajaTarget.nombre}'? Podrá reactivarlo después.` : ''}
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!reactivarTarget && discardPending === null}
        onClose={() => setReactivarTarget(null)}
        onConfirm={() => void confirmarReactivar()}
        title="Reactivar almacén"
        message={reactivarTarget ? `¿Reactivar almacén '${reactivarTarget.nombre}'? Volverá a estar disponible.` : ''}
        confirmText="Reactivar"
        cancelText="Cancelar"
        variant="info"
        loading={reactivarMutation.isPending}
      />
    </InvPageLayout>
  );
}
