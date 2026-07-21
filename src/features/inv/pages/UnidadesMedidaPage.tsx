/**
 * Unidades de Medida — Listado y gestión. GET/POST /api/v1/inv/unidades-medida
 * Consumidor Engine INV Wave 1 (patrón Golden Reference Categoría).
 */
import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Ruler, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { IamTableEmptyState } from '@/features/admin/components/iam';
import { useDebouncedSearch } from '@/core/list';
import { useCodigoFieldController } from '@/core/codigo';
import { CodigoField, CodigoFieldReadOnly } from '@/shared/components/codigo';
import { ErpPagination, ErpSortableHeader } from '@/shared/components/erp-list';
import { OrgCompanyToolbar } from '@/features/org/components/OrgCompanyToolbar';
import { OrgToolbarSearch } from '@/features/org/components/OrgToolbarSearch';
import type { UnidadMedida, UnidadMedidaCreate, UnidadMedidaUpdate } from '../types/inv.types';
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
  UNIDADES_MEDIDA_LIST_CONFIG,
  useCreateUnidadMedida,
  useDeleteUnidadMedida,
  useReactivarUnidadMedida,
  useUnidadesMedidaErpList,
  useUpdateUnidadMedida,
} from '../hooks/unidades-medida.hooks';
import { useInvSessionScope, useInvScopeEmpresaReset } from '../hooks/useInvSessionScope';
import { OrgSessionEmpresaField } from '@/features/org/components/OrgSessionEmpresaField';
import { OrgDiscardConfirmDialog } from '@/features/org/components/OrgDiscardConfirmDialog';
import type { OrgDiscardPending } from '@/features/org/types/org-discard.types';
import { createOrgDiscardHandlers } from '@/features/org/utils/org-discard-handlers';
import { orgDialogGuardProps } from '@/features/org/utils/org-dialog-guard-props';
import {
  buildEditUnidadMedidaFormSnapshot,
  isCreateUnidadMedidaDirty,
  isEditUnidadMedidaDirty,
  type EditUnidadMedidaFormSnapshot,
} from '../utils/form-dirty/unidad-medida-form-dirty';
import {
  buildUnidadMedidaCreateBasePayload,
  buildUnidadMedidaUpdatePayload,
  INV_CODIGO_SEQUENCE_KEYS,
  mutateInvCreateWithCodigo,
} from '../codigo';

const TIPOS_UNIDAD = ['cantidad', 'peso', 'volumen', 'longitud', 'area', 'tiempo'] as const;

/** CREATE sin `codigo` — el Motor lo aporta el Engine. */
const DEFAULT: UnidadMedidaCreate = {
  empresa_id: '',
  nombre: '',
  tipo_unidad: 'cantidad',
  es_unidad_base: false,
  decimales_permitidos: 2,
  es_activo: true,
};

export default function UnidadesMedidaPage() {
  const { can } = usePermissions();
  const { scopeEmpresaId, canQueryCompanyScoped } = useInvSessionScope();
  const search = useDebouncedSearch();
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<UnidadMedida | null>(null);
  const [form, setForm] = useState<UnidadMedidaCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<UnidadMedidaUpdate>({});
  const [editFormSnapshot, setEditFormSnapshot] = useState<EditUnidadMedidaFormSnapshot | null>(null);
  const [discardPending, setDiscardPending] = useState<OrgDiscardPending>(null);
  const [bajaTarget, setBajaTarget] = useState<UnidadMedida | null>(null);
  const [reactivarTarget, setReactivarTarget] = useState<UnidadMedida | null>(null);

  const unidadesList = useUnidadesMedidaErpList({
    solo_activos: !mostrarInactivos,
    debouncedBuscar: search.debouncedValue || undefined,
  });

  const resetPageFilters = useCallback(() => {
    search.clear();
    unidadesList.setPage(1);
    unidadesList.clearSort();
    setMostrarInactivos(false);
    setCreateOpen(false);
    setEditOpen(false);
    setEditing(null);
    setEditFormSnapshot(null);
    setDiscardPending(null);
  }, [search.clear, unidadesList.setPage, unidadesList.clearSort]);
  useInvScopeEmpresaReset(resetPageFilters);

  const list = unidadesList.items;
  const hasSearch = search.hasSearch;

  const createMutation = useCreateUnidadMedida();
  const updateMutation = useUpdateUnidadMedida();
  const deleteMutation = useDeleteUnidadMedida();
  const reactivarMutation = useReactivarUnidadMedida();

  const submitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || reactivarMutation.isPending;
  const formSubmitting = createMutation.isPending || updateMutation.isPending;

  const codigo = useCodigoFieldController({
    sequenceKey: INV_CODIGO_SEQUENCE_KEYS.unidadMedida,
    mode: 'create',
    disabled: formSubmitting,
  });

  const isCreateDialogDirty = useMemo(
    () => isCreateUnidadMedidaDirty(form) || codigo.isDirty,
    [form, codigo.isDirty],
  );
  const isEditDialogDirty = useMemo(
    () => isEditUnidadMedidaDirty(editForm, editFormSnapshot),
    [editForm, editFormSnapshot],
  );

  const closeCreate = useCallback(() => {
    if (!formSubmitting) {
      codigo.actions.reset();
      setCreateOpen(false);
      setForm({ ...DEFAULT, empresa_id: scopeEmpresaId ?? '' });
      setDiscardPending((pending) => (pending === 'create' ? null : pending));
    }
  }, [formSubmitting, scopeEmpresaId, codigo.actions]);

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
        contextPrefix: 'inv-unidad-medida',
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
    codigo.actions.reset();
    setForm({ ...DEFAULT, empresa_id: scopeEmpresaId ?? '' });
    setCreateOpen(true);
  };
  const openEdit = (row: UnidadMedida) => {
    setDiscardPending(null);
    setEditing(row);
    const nextEditForm: UnidadMedidaUpdate = {
      nombre: row.nombre,
      simbolo: row.simbolo ?? undefined,
      tipo_unidad: row.tipo_unidad,
      es_unidad_base: row.es_unidad_base ?? false,
      factor_conversion_base: row.factor_conversion_base ?? undefined,
      decimales_permitidos: row.decimales_permitidos ?? undefined,
      es_activo: row.es_activo,
    };
    setEditForm(nextEditForm);
    setEditFormSnapshot(buildEditUnidadMedidaFormSnapshot(nextEditForm));
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scopeEmpresaId || !form.nombre.trim() || !form.tipo_unidad) {
      toast.error('El nombre y el tipo son requeridos.');
      return;
    }
    try {
      const basePayload = buildUnidadMedidaCreateBasePayload(form, scopeEmpresaId);
      await mutateInvCreateWithCodigo(
        codigo,
        basePayload as UnidadMedidaCreate & Record<string, unknown>,
        createMutation.mutateAsync,
      );
      closeCreate();
    } catch {
      /* error vía useCreateUnidadMedida.onError / Engine applyApiError */
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const payload = buildUnidadMedidaUpdatePayload(editForm);
      await updateMutation.mutateAsync({ unidadMedidaId: editing.unidad_medida_id, payload });
      closeEdit();
    } catch {
      /* error vía useUpdateUnidadMedida.onError */
    }
  };

  const canCrear = can('inv', 'crear');
  const canEditar = can('inv', 'editar');
  const canEliminar = can('inv', 'eliminar');
  const TABLE_COLSPAN = 7;

  const eliminar = (row: UnidadMedida) => {
    if (!canEliminar) return;
    setBajaTarget(row);
  };

  const reactivar = (row: UnidadMedida) => {
    if (!canEditar) return;
    setReactivarTarget(row);
  };

  const confirmarBaja = async () => {
    if (!bajaTarget) return;
    try {
      await deleteMutation.mutateAsync({ unidadMedidaId: bajaTarget.unidad_medida_id });
      setBajaTarget(null);
    } catch {
      /* error vía useDeleteUnidadMedida.onError */
    }
  };

  const confirmarReactivar = async () => {
    if (!reactivarTarget) return;
    try {
      await reactivarMutation.mutateAsync({ unidadMedidaId: reactivarTarget.unidad_medida_id });
      setReactivarTarget(null);
    } catch {
      /* error vía useReactivarUnidadMedida.onError */
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
              <Plus className="h-4 w-4 mr-2" /> Crear unidad
            </Button>
          ) : null
        }
      >
        <OrgToolbarSearch
          value={search.inputValue}
          onChange={search.setInputValue}
          placeholder="Código, nombre, símbolo..."
          aria-label="Buscar unidades de medida"
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

      {unidadesList.isLoading && <InvTableSkeleton columns={TABLE_COLSPAN} />}
      {unidadesList.isError && !unidadesList.isLoading && (
        <p className="text-error bg-error/10 p-4 rounded-lg">
          {getErrorMessage(unidadesList.error).message}
        </p>
      )}
      {!unidadesList.isLoading && !unidadesList.isError && (
        <div className="overflow-x-auto rounded-lg border border-border-base shadow">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-subtle">
              <tr>
                <ErpSortableHeader
                  column="codigo"
                  label="Código"
                  sortableColumns={UNIDADES_MEDIDA_LIST_CONFIG.sortableColumns}
                  sort={unidadesList.sort}
                  onSort={unidadesList.toggleSort}
                />
                <ErpSortableHeader
                  column="nombre"
                  label="Nombre"
                  sortableColumns={UNIDADES_MEDIDA_LIST_CONFIG.sortableColumns}
                  sort={unidadesList.sort}
                  onSort={unidadesList.toggleSort}
                />
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Símbolo</th>
                <ErpSortableHeader
                  column="tipo_unidad"
                  label="Tipo"
                  sortableColumns={UNIDADES_MEDIDA_LIST_CONFIG.sortableColumns}
                  sort={unidadesList.sort}
                  onSort={unidadesList.toggleSort}
                />
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Base</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {list.length === 0 ? (
                <IamTableEmptyState
                  colSpan={TABLE_COLSPAN}
                  icon={Ruler}
                  title={
                    hasSearch
                      ? 'No se encontraron unidades que coincidan con la búsqueda.'
                      : mostrarInactivos
                        ? 'No hay unidades registradas.'
                        : 'No hay unidades activas.'
                  }
                  description={
                    hasSearch ? 'Pruebe con otro término o limpie el filtro de búsqueda.' : undefined
                  }
                  actionLabel={
                    !hasSearch && !mostrarInactivos && canCrear && scopeEmpresaId ? 'Crear unidad' : undefined
                  }
                  onAction={
                    !hasSearch && !mostrarInactivos && canCrear && scopeEmpresaId ? openCreate : undefined
                  }
                  actionDisabled={discardPending !== null}
                />
              ) : (
                list.map((row) => (
                  <tr key={row.unidad_medida_id} className="hover:bg-overlay dark:hover:bg-overlay">
                    <td className="px-4 py-3 text-sm font-medium text-text-base">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.simbolo ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.tipo_unidad}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.es_unidad_base ? 'Sí' : 'No'}</td>
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
          {unidadesList.pagination ? (
            <ErpPagination
              pagination={unidadesList.pagination}
              onPageChange={unidadesList.setPage}
              onLimitChange={unidadesList.setLimit}
              disabled={discardPending !== null || unidadesList.isFetching}
            />
          ) : null}
        </div>
      )}
      <OrgDiscardConfirmDialog
        discardPending={discardPending}
        entityLabel="la unidad de medida"
        onClose={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
      <Dialog open={createOpen} onOpenChange={handleCreateDialogOpenChange}>
        <DialogContent className="max-w-lg" {...orgDialogGuardProps}>
          <DialogHeader><DialogTitle>Crear unidad de medida</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <OrgSessionEmpresaField />
            <CodigoField
              sequenceKey={INV_CODIGO_SEQUENCE_KEYS.unidadMedida}
              mode="create"
              controller={codigo}
            />
            <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm" required /></div>
            <div><Label>Símbolo</Label><input type="text" value={form.simbolo ?? ''} onChange={(e) => setForm((p) => ({ ...p, simbolo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm" /></div>
            <div><Label>Tipo *</Label><select value={form.tipo_unidad} onChange={(e) => setForm((p) => ({ ...p, tipo_unidad: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm">{TIPOS_UNIDAD.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_unidad_base ?? false} onChange={(e) => setForm((p) => ({ ...p, es_unidad_base: e.target.checked }))} /><Label>Es unidad base</Label></div>
            <DialogFooter><Button type="button" variant="outline" onClick={handleRequestCloseCreate}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="max-w-lg" {...orgDialogGuardProps}>
          <DialogHeader><DialogTitle>Editar unidad de medida</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <CodigoFieldReadOnly
              label="Código"
              value={editing?.codigo ?? ''}
              inputId="edit-unidad-medida-codigo"
            />
            <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm" required /></div>
            <div><Label>Símbolo</Label><input type="text" value={editForm.simbolo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, simbolo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm" /></div>
            <div><Label>Tipo *</Label><select value={editForm.tipo_unidad ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_unidad: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm">{TIPOS_UNIDAD.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_unidad_base ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_unidad_base: e.target.checked }))} /><Label>Es unidad base</Label></div>
            <DialogFooter><Button type="button" variant="outline" onClick={handleRequestCloseEdit}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!bajaTarget && discardPending === null}
        onClose={() => setBajaTarget(null)}
        onConfirm={() => void confirmarBaja()}
        title="Desactivar unidad de medida"
        message={bajaTarget ? `¿Desactivar unidad de medida '${bajaTarget.nombre}'? Podrá reactivarlo después.` : ''}
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!reactivarTarget && discardPending === null}
        onClose={() => setReactivarTarget(null)}
        onConfirm={() => void confirmarReactivar()}
        title="Reactivar unidad de medida"
        message={reactivarTarget ? `¿Reactivar unidad de medida '${reactivarTarget.nombre}'? Volverá a estar disponible.` : ''}
        confirmText="Reactivar"
        cancelText="Cancelar"
        variant="info"
        loading={reactivarMutation.isPending}
      />
    </InvPageLayout>
  );
}
