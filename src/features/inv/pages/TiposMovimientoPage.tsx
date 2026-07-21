/**
 * Tipos de Movimiento — Listado y gestión. GET/POST /api/v1/inv/tipos-movimiento
 * Consumidor Engine INV Wave 1 (patrón Golden Reference Categoría).
 */
import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { ArrowLeftRight, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { IamTableEmptyState } from '@/features/admin/components/iam';
import { useDebouncedSearch } from '@/core/list';
import { useCodigoFieldController } from '@/core/codigo';
import { CodigoField, CodigoFieldReadOnly } from '@/shared/components/codigo';
import { ErpPagination, ErpSortableHeader } from '@/shared/components/erp-list';
import { OrgCompanyToolbar } from '@/features/org/components/OrgCompanyToolbar';
import { OrgToolbarSearch } from '@/features/org/components/OrgToolbarSearch';
import type { TipoMovimiento, TipoMovimientoCreate, TipoMovimientoUpdate } from '../types/inv.types';
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
  TIPOS_MOVIMIENTO_LIST_CONFIG,
  useCreateTipoMovimiento,
  useDeleteTipoMovimiento,
  useReactivarTipoMovimiento,
  useTiposMovimientoErpList,
  useUpdateTipoMovimiento,
} from '../hooks/tipos-movimiento.hooks';
import { useInvSessionScope, useInvScopeEmpresaReset } from '../hooks/useInvSessionScope';
import { OrgSessionEmpresaField } from '@/features/org/components/OrgSessionEmpresaField';
import { OrgDiscardConfirmDialog } from '@/features/org/components/OrgDiscardConfirmDialog';
import type { OrgDiscardPending } from '@/features/org/types/org-discard.types';
import { createOrgDiscardHandlers } from '@/features/org/utils/org-discard-handlers';
import { orgDialogGuardProps } from '@/features/org/utils/org-dialog-guard-props';
import {
  buildEditTipoMovimientoFormSnapshot,
  isCreateTipoMovimientoDirty,
  isEditTipoMovimientoDirty,
  type EditTipoMovimientoFormSnapshot,
} from '../utils/form-dirty/tipo-movimiento-form-dirty';
import {
  buildTipoMovimientoCreateBasePayload,
  buildTipoMovimientoUpdatePayload,
  INV_CODIGO_SEQUENCE_KEYS,
  mutateInvCreateWithCodigo,
} from '../codigo';

const CLASES_MOVIMIENTO = ['ENTRADA', 'SALIDA', 'TRANSFERENCIA', 'AJUSTE'] as const;

/** CREATE sin `codigo` — el Motor lo aporta el Engine. */
const DEFAULT: TipoMovimientoCreate = {
  empresa_id: '',
  nombre: '',
  clase_movimiento: 'ENTRADA',
  afecta_costo: true,
  requiere_autorizacion: false,
  genera_asiento_contable: false,
  es_activo: true,
};

export default function TiposMovimientoPage() {
  const { can } = usePermissions();
  const { scopeEmpresaId, canQueryCompanyScoped } = useInvSessionScope();
  const search = useDebouncedSearch();
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<TipoMovimiento | null>(null);
  const [form, setForm] = useState<TipoMovimientoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<TipoMovimientoUpdate>({});
  const [editFormSnapshot, setEditFormSnapshot] = useState<EditTipoMovimientoFormSnapshot | null>(null);
  const [discardPending, setDiscardPending] = useState<OrgDiscardPending>(null);
  const [bajaTarget, setBajaTarget] = useState<TipoMovimiento | null>(null);
  const [reactivarTarget, setReactivarTarget] = useState<TipoMovimiento | null>(null);

  const tiposList = useTiposMovimientoErpList({
    solo_activos: !mostrarInactivos,
    debouncedBuscar: search.debouncedValue || undefined,
  });

  const resetPageFilters = useCallback(() => {
    search.clear();
    tiposList.setPage(1);
    tiposList.clearSort();
    setMostrarInactivos(false);
    setCreateOpen(false);
    setEditOpen(false);
    setEditing(null);
    setEditFormSnapshot(null);
    setDiscardPending(null);
  }, [search.clear, tiposList.setPage, tiposList.clearSort]);
  useInvScopeEmpresaReset(resetPageFilters);

  const list = tiposList.items;
  const hasSearch = search.hasSearch;

  const createMutation = useCreateTipoMovimiento();
  const updateMutation = useUpdateTipoMovimiento();
  const deleteMutation = useDeleteTipoMovimiento();
  const reactivarMutation = useReactivarTipoMovimiento();

  const submitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || reactivarMutation.isPending;
  const formSubmitting = createMutation.isPending || updateMutation.isPending;

  const codigo = useCodigoFieldController({
    sequenceKey: INV_CODIGO_SEQUENCE_KEYS.tipoMovimiento,
    mode: 'create',
    disabled: formSubmitting,
  });

  const isCreateDialogDirty = useMemo(
    () => isCreateTipoMovimientoDirty(form) || codigo.isDirty,
    [form, codigo.isDirty],
  );
  const isEditDialogDirty = useMemo(
    () => isEditTipoMovimientoDirty(editForm, editFormSnapshot),
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
        contextPrefix: 'inv-tipo-movimiento',
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
  const openEdit = (row: TipoMovimiento) => {
    setDiscardPending(null);
    setEditing(row);
    const nextEditForm: TipoMovimientoUpdate = {
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      clase_movimiento: row.clase_movimiento,
      afecta_costo: row.afecta_costo ?? true,
      requiere_autorizacion: row.requiere_autorizacion ?? false,
      genera_asiento_contable: row.genera_asiento_contable ?? false,
      cuenta_contable_debito: row.cuenta_contable_debito ?? undefined,
      cuenta_contable_credito: row.cuenta_contable_credito ?? undefined,
      requiere_documento_referencia: row.requiere_documento_referencia ?? undefined,
      tipo_documento_referencia: row.tipo_documento_referencia ?? undefined,
      es_activo: row.es_activo,
    };
    setEditForm(nextEditForm);
    setEditFormSnapshot(buildEditTipoMovimientoFormSnapshot(nextEditForm));
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scopeEmpresaId || !form.nombre.trim() || !form.clase_movimiento) {
      toast.error('El nombre y la clase son requeridos.');
      return;
    }
    try {
      const basePayload = buildTipoMovimientoCreateBasePayload(form, scopeEmpresaId);
      await mutateInvCreateWithCodigo(
        codigo,
        basePayload as TipoMovimientoCreate & Record<string, unknown>,
        createMutation.mutateAsync,
      );
      closeCreate();
    } catch {
      /* error vía useCreateTipoMovimiento.onError / Engine applyApiError */
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const payload = buildTipoMovimientoUpdatePayload(editForm);
      await updateMutation.mutateAsync({ tipoMovimientoId: editing.tipo_movimiento_id, payload });
      closeEdit();
    } catch {
      /* error vía useUpdateTipoMovimiento.onError */
    }
  };

  const canCrear = can('inv', 'crear');
  const canEditar = can('inv', 'editar');
  const canEliminar = can('inv', 'eliminar');
  const TABLE_COLSPAN = 8;

  const eliminar = (row: TipoMovimiento) => {
    if (!canEliminar) return;
    setBajaTarget(row);
  };

  const reactivar = (row: TipoMovimiento) => {
    if (!canEditar) return;
    setReactivarTarget(row);
  };

  const confirmarBaja = async () => {
    if (!bajaTarget) return;
    try {
      await deleteMutation.mutateAsync({ tipoMovimientoId: bajaTarget.tipo_movimiento_id });
      setBajaTarget(null);
    } catch {
      /* error vía useDeleteTipoMovimiento.onError */
    }
  };

  const confirmarReactivar = async () => {
    if (!reactivarTarget) return;
    try {
      await reactivarMutation.mutateAsync({ tipoMovimientoId: reactivarTarget.tipo_movimiento_id });
      setReactivarTarget(null);
    } catch {
      /* error vía useReactivarTipoMovimiento.onError */
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
              <Plus className="h-4 w-4 mr-2" /> Crear tipo
            </Button>
          ) : null
        }
      >
        <OrgToolbarSearch
          value={search.inputValue}
          onChange={search.setInputValue}
          placeholder="Código, nombre, clase..."
          aria-label="Buscar tipos de movimiento"
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

      {tiposList.isLoading && <InvTableSkeleton columns={TABLE_COLSPAN} />}
      {tiposList.isError && !tiposList.isLoading && (
        <p className="text-error bg-error/10 p-4 rounded-lg">
          {getErrorMessage(tiposList.error).message}
        </p>
      )}
      {!tiposList.isLoading && !tiposList.isError && (
        <div className="overflow-x-auto rounded-lg border border-border-base shadow">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-subtle">
              <tr>
                <ErpSortableHeader
                  column="codigo"
                  label="Código"
                  sortableColumns={TIPOS_MOVIMIENTO_LIST_CONFIG.sortableColumns}
                  sort={tiposList.sort}
                  onSort={tiposList.toggleSort}
                />
                <ErpSortableHeader
                  column="nombre"
                  label="Nombre"
                  sortableColumns={TIPOS_MOVIMIENTO_LIST_CONFIG.sortableColumns}
                  sort={tiposList.sort}
                  onSort={tiposList.toggleSort}
                />
                <ErpSortableHeader
                  column="clase_movimiento"
                  label="Clase"
                  sortableColumns={TIPOS_MOVIMIENTO_LIST_CONFIG.sortableColumns}
                  sort={tiposList.sort}
                  onSort={tiposList.toggleSort}
                />
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Afecta Costo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Cuenta Débito</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Cuenta Crédito</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {list.length === 0 ? (
                <IamTableEmptyState
                  colSpan={TABLE_COLSPAN}
                  icon={ArrowLeftRight}
                  title={
                    hasSearch
                      ? 'No se encontraron tipos que coincidan con la búsqueda.'
                      : mostrarInactivos
                        ? 'No hay tipos registrados.'
                        : 'No hay tipos activos.'
                  }
                  description={
                    hasSearch ? 'Pruebe con otro término o limpie el filtro de búsqueda.' : undefined
                  }
                  actionLabel={
                    !hasSearch && !mostrarInactivos && canCrear && scopeEmpresaId ? 'Crear tipo' : undefined
                  }
                  onAction={
                    !hasSearch && !mostrarInactivos && canCrear && scopeEmpresaId ? openCreate : undefined
                  }
                  actionDisabled={discardPending !== null}
                />
              ) : (
                list.map((row) => (
                  <tr key={row.tipo_movimiento_id} className="hover:bg-overlay dark:hover:bg-overlay">
                    <td className="px-4 py-3 text-sm font-medium text-text-base">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.clase_movimiento}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.afecta_costo ? 'Sí' : 'No'}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.cuenta_contable_debito ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.cuenta_contable_credito ?? '-'}</td>
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
          {tiposList.pagination ? (
            <ErpPagination
              pagination={tiposList.pagination}
              onPageChange={tiposList.setPage}
              onLimitChange={tiposList.setLimit}
              disabled={discardPending !== null || tiposList.isFetching}
            />
          ) : null}
        </div>
      )}
      <OrgDiscardConfirmDialog
        discardPending={discardPending}
        entityLabel="el tipo de movimiento"
        onClose={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
      <Dialog open={createOpen} onOpenChange={handleCreateDialogOpenChange}>
        <DialogContent className="max-w-lg" {...orgDialogGuardProps}>
          <DialogHeader><DialogTitle>Crear tipo de movimiento</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <OrgSessionEmpresaField />
            <CodigoField
              sequenceKey={INV_CODIGO_SEQUENCE_KEYS.tipoMovimiento}
              mode="create"
              controller={codigo}
            />
            <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm" required /></div>
            <div><Label>Clase *</Label><select value={form.clase_movimiento} onChange={(e) => setForm((p) => ({ ...p, clase_movimiento: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm">{CLASES_MOVIMIENTO.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.afecta_costo ?? true} onChange={(e) => setForm((p) => ({ ...p, afecta_costo: e.target.checked }))} /><Label>Afecta costo</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.requiere_autorizacion ?? false} onChange={(e) => setForm((p) => ({ ...p, requiere_autorizacion: e.target.checked }))} /><Label>Requiere autorización</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.genera_asiento_contable ?? false} onChange={(e) => setForm((p) => ({ ...p, genera_asiento_contable: e.target.checked }))} /><Label>Genera asiento contable</Label></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cuenta contable débito</Label>
                <input
                  type="text"
                  value={form.cuenta_contable_debito ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      cuenta_contable_debito: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
                />
              </div>
              <div>
                <Label>Cuenta contable crédito</Label>
                <input
                  type="text"
                  value={form.cuenta_contable_credito ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      cuenta_contable_credito: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.requiere_documento_referencia ?? false}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      requiere_documento_referencia: e.target.checked,
                    }))
                  }
                />
                <Label>Requiere documento referencia</Label>
              </div>
              <div>
                <Label>Tipo documento referencia</Label>
                <input
                  type="text"
                  value={form.tipo_documento_referencia ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      tipo_documento_referencia: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
                />
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={handleRequestCloseCreate}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="max-w-lg" {...orgDialogGuardProps}>
          <DialogHeader><DialogTitle>Editar tipo de movimiento</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <CodigoFieldReadOnly
              label="Código"
              value={editing?.codigo ?? ''}
              inputId="edit-tipo-movimiento-codigo"
            />
            <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm" required /></div>
            <div><Label>Clase *</Label><select value={editForm.clase_movimiento ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, clase_movimiento: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm">{CLASES_MOVIMIENTO.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.afecta_costo ?? true} onChange={(e) => setEditForm((p) => ({ ...p, afecta_costo: e.target.checked }))} /><Label>Afecta costo</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.requiere_autorizacion ?? false} onChange={(e) => setEditForm((p) => ({ ...p, requiere_autorizacion: e.target.checked }))} /><Label>Requiere autorización</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.genera_asiento_contable ?? false} onChange={(e) => setEditForm((p) => ({ ...p, genera_asiento_contable: e.target.checked }))} /><Label>Genera asiento contable</Label></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cuenta contable débito</Label>
                <input
                  type="text"
                  value={editForm.cuenta_contable_debito ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      cuenta_contable_debito: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
                />
              </div>
              <div>
                <Label>Cuenta contable crédito</Label>
                <input
                  type="text"
                  value={editForm.cuenta_contable_credito ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      cuenta_contable_credito: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.requiere_documento_referencia ?? false}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      requiere_documento_referencia: e.target.checked,
                    }))
                  }
                />
                <Label>Requiere documento referencia</Label>
              </div>
              <div>
                <Label>Tipo documento referencia</Label>
                <input
                  type="text"
                  value={editForm.tipo_documento_referencia ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      tipo_documento_referencia: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
                />
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={handleRequestCloseEdit}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!bajaTarget && discardPending === null}
        onClose={() => setBajaTarget(null)}
        onConfirm={() => void confirmarBaja()}
        title="Desactivar tipo de movimiento"
        message={bajaTarget ? `¿Desactivar tipo de movimiento '${bajaTarget.nombre}'? Podrá reactivarlo después.` : ''}
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!reactivarTarget && discardPending === null}
        onClose={() => setReactivarTarget(null)}
        onConfirm={() => void confirmarReactivar()}
        title="Reactivar tipo de movimiento"
        message={reactivarTarget ? `¿Reactivar tipo de movimiento '${reactivarTarget.nombre}'? Volverá a estar disponible.` : ''}
        confirmText="Reactivar"
        cancelText="Cancelar"
        variant="info"
        loading={reactivarMutation.isPending}
      />
    </InvPageLayout>
  );
}
