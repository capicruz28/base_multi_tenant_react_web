/**
 * Centros de costo — Listado y gestión. GET/POST /api/v1/org/centros-costo
 */
import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { DollarSign, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { IamTableEmptyState } from '@/features/admin/components/iam';
import { useDebouncedSearch } from '@/core/list';
import { ErpPagination, ErpSortableHeader } from '@/shared/components/erp-list';
import { OrgToolbarSearch } from '../components/OrgToolbarSearch';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import type { CentroCosto, CentroCostoCreate, CentroCostoUpdate } from '../types/org.types';
import { OrgPageLayout } from '../components/OrgPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogBody, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { FormSection } from '../components/FormSection';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useOrgSessionScope, useOrgScopeEmpresaReset } from '../hooks/useOrgSessionScope';
import { OrgCompanyToolbar } from '../components/OrgCompanyToolbar';
import { OrgTableSkeleton } from '../components/OrgTableSkeleton';
import { OrgSessionEmpresaField } from '../components/OrgSessionEmpresaField';
import { assertBodyEmpresaMatchesSession } from '../utils/org-body-scope';
import {
  CENTROS_COSTO_LIST_CONFIG,
  useCentrosCosto,
  useCentrosCostoErpList,
  useCreateCentroCosto,
  useDeleteCentroCosto,
  useReactivarCentroCosto,
  useUpdateCentroCosto,
} from '../hooks/centro-costo.hooks';
import { OrgDiscardConfirmDialog } from '../components/OrgDiscardConfirmDialog';
import type { OrgDiscardPending } from '../types/org-discard.types';
import { createOrgDiscardHandlers } from '../utils/org-discard-handlers';
import { orgDialogGuardProps } from '../utils/org-dialog-guard-props';
import {
  buildEditCentroCostoFormSnapshot,
  isCreateCentroCostoDirty,
  isEditCentroCostoDirty,
  type EditCentroCostoFormSnapshot,
} from '../utils/form-dirty/centro-costo-form-dirty';

const inputClass = 'mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm';
const DEFAULT: CentroCostoCreate = {
  empresa_id: '',
  codigo: '',
  nombre: '',
  tipo_centro_costo: 'operativo',
  descripcion: '',
  centro_costo_padre_id: undefined,
  nivel: undefined,
  categoria: '',
  tiene_presupuesto: false,
  permite_imputacion_directa: true,
  responsable_nombre: '',
  fecha_inicio_vigencia: undefined,
  fecha_fin_vigencia: undefined,
  es_activo: true,
};

export default function CentrosCostoPage() {
  const { scopeEmpresaId, canQueryCompanyScoped } = useOrgSessionScope();

  const [includeInactive, setIncludeInactive] = useState(false);
  const search = useDebouncedSearch();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CentroCosto | null>(null);
  const [form, setForm] = useState<CentroCostoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<CentroCostoUpdate>({});
  const [editFormSnapshot, setEditFormSnapshot] = useState<EditCentroCostoFormSnapshot | null>(null);
  const [discardPending, setDiscardPending] = useState<OrgDiscardPending>(null);
  const [deleteTarget, setDeleteTarget] = useState<CentroCosto | null>(null);
  const [reactivarTarget, setReactivarTarget] = useState<CentroCosto | null>(null);

  const { can } = usePermissions();
  const canCrear = can('org', 'crear');
  const canEditar = can('org', 'editar');
  const canEliminar = can('org', 'eliminar');

  const centrosCostoList = useCentrosCostoErpList({
    solo_activos: !includeInactive,
    debouncedBuscar: search.debouncedValue || undefined,
    enabled: canQueryCompanyScoped,
  });

  const resetLocalFilters = useCallback(() => {
    search.clear();
    centrosCostoList.setPage(1);
    centrosCostoList.clearSort();
    setIncludeInactive(false);
    setCreateOpen(false);
    setEditOpen(false);
    setEditing(null);
    setEditFormSnapshot(null);
    setDiscardPending(null);
    setDeleteTarget(null);
    setReactivarTarget(null);
  }, [search.clear, centrosCostoList.setPage, centrosCostoList.clearSort]);
  useOrgScopeEmpresaReset(resetLocalFilters);

  const centrosPadreQuery = useCentrosCosto({
    solo_activos: true,
    enabled: (createOpen || editOpen) && canQueryCompanyScoped,
  });
  const centrosPadreOpciones = centrosPadreQuery.data ?? [];

  const list = centrosCostoList.items;
  const loading = centrosCostoList.isLoading;
  const error = centrosCostoList.isError
    ? getErrorMessage(centrosCostoList.error).message
    : null;

  const createCentroCosto = useCreateCentroCosto();
  const updateCentroCosto = useUpdateCentroCosto();
  const deleteCentroCosto = useDeleteCentroCosto();
  const reactivarCentroCosto = useReactivarCentroCosto();

  const submitting = createCentroCosto.isPending || updateCentroCosto.isPending;
  const deleting = deleteCentroCosto.isPending;
  const hasSearch = search.hasSearch;
  const TABLE_COLSPAN = 6;

  const isCreateDialogDirty = useMemo(() => isCreateCentroCostoDirty(form), [form]);
  const isEditDialogDirty = useMemo(
    () => isEditCentroCostoDirty(editForm, editFormSnapshot),
    [editForm, editFormSnapshot],
  );

  const closeCreate = useCallback(() => {
    if (!submitting) {
      setCreateOpen(false);
      setForm({ ...DEFAULT, empresa_id: scopeEmpresaId ?? '' });
      setDiscardPending((pending) => (pending === 'create' ? null : pending));
    }
  }, [scopeEmpresaId, submitting]);

  const closeEdit = useCallback(() => {
    if (!submitting) {
      setEditOpen(false);
      setEditing(null);
      setEditForm({});
      setEditFormSnapshot(null);
      setDiscardPending((pending) => (pending === 'edit' ? null : pending));
    }
  }, [submitting]);

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
        isSubmitting: submitting,
        isCreateDirty: isCreateDialogDirty,
        isEditDirty: isEditDialogDirty,
        setCreateOpen,
        setEditOpen,
        closeCreate,
        closeEdit,
        contextPrefix: 'org-centro-costo',
      }),
    [
      discardPending,
      submitting,
      isCreateDialogDirty,
      isEditDialogDirty,
      closeCreate,
      closeEdit,
    ],
  );

  const centrosPadreCreate = centrosPadreOpciones;
  const centrosPadreEdit = centrosPadreOpciones.filter(
    (c) => c.centro_costo_id !== editing?.centro_costo_id,
  );
  const openCreate = () => {
    setDiscardPending(null);
    setForm({ ...DEFAULT, empresa_id: scopeEmpresaId ?? '' });
    setCreateOpen(true);
  };
  const openEdit = (row: CentroCosto) => {
    setDiscardPending(null);
    setEditing(row);
    const nextEditForm: CentroCostoUpdate = {
      codigo: row.codigo,
      nombre: row.nombre,
      tipo_centro_costo: row.tipo_centro_costo,
      descripcion: row.descripcion ?? undefined,
      centro_costo_padre_id: row.centro_costo_padre_id ?? undefined,
      nivel: row.nivel ?? undefined,
      categoria: row.categoria ?? undefined,
      tiene_presupuesto: row.tiene_presupuesto ?? false,
      permite_imputacion_directa: row.permite_imputacion_directa ?? true,
      responsable_nombre: row.responsable_nombre ?? undefined,
      fecha_inicio_vigencia: row.fecha_inicio_vigencia ?? undefined,
      fecha_fin_vigencia: row.fecha_fin_vigencia ?? undefined,
      es_activo: row.es_activo,
    };
    setEditForm(nextEditForm);
    setEditFormSnapshot(buildEditCentroCostoFormSnapshot(nextEditForm));
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scopeEmpresaId || !form.codigo.trim() || !form.nombre.trim() || !form.tipo_centro_costo) {
      toast.error('Código, nombre y tipo son requeridos.');
      return;
    }
    try {
      const payload = assertBodyEmpresaMatchesSession({ ...form }, scopeEmpresaId);
      if (payload.fecha_inicio_vigencia === '') delete payload.fecha_inicio_vigencia;
      if (payload.fecha_fin_vigencia === '') delete payload.fecha_fin_vigencia;
      await createCentroCosto.mutateAsync(payload);
      closeCreate();
    } catch {
      /* toast de error: onError en useCreateCentroCosto */
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const payload = { ...editForm };
      if (payload.fecha_inicio_vigencia === '') delete payload.fecha_inicio_vigencia;
      if (payload.fecha_fin_vigencia === '') delete payload.fecha_fin_vigencia;
      await updateCentroCosto.mutateAsync({
        centroCostoId: editing.centro_costo_id,
        payload,
      });
      closeEdit();
    } catch {
      /* toast de error: onError en useUpdateCentroCosto */
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCentroCosto.mutateAsync({
        centroCostoId: deleteTarget.centro_costo_id,
      });
      setDeleteTarget(null);
    } catch {
      /* toast de error: onError en useDeleteCentroCosto */
    }
  };

  const confirmarReactivar = async () => {
    if (!reactivarTarget) return;
    try {
      await reactivarCentroCosto.mutateAsync({ centroCostoId: reactivarTarget.centro_costo_id });
      setReactivarTarget(null);
    } catch {
      /* toast de error: onError en useReactivarCentroCosto */
    }
  };

  return (
    <OrgPageLayout>
      <OrgCompanyToolbar
        actions={
          canCrear ? (
            <Button
              onClick={openCreate}
              disabled={!scopeEmpresaId || discardPending !== null}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Plus className="h-4 w-4 mr-2" /> Crear centro de costo
            </Button>
          ) : null
        }
      >
        <OrgToolbarSearch
          value={search.inputValue}
          onChange={search.setInputValue}
          placeholder="Código, nombre, tipo..."
          aria-label="Buscar centros de costo"
          disabled={discardPending !== null}
        />
        <label className="flex shrink-0 items-center gap-1.5 text-sm text-text-soft cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border border-border-base"
          />
          Ver inactivos
        </label>
      </OrgCompanyToolbar>
      {loading && <OrgTableSkeleton columns={TABLE_COLSPAN} />}
      {error && !loading && <p className="text-error bg-error/10 p-4 rounded-lg">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-border-base shadow">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-subtle">
              <tr>
                <ErpSortableHeader
                  column="codigo"
                  label="Código"
                  sortableColumns={CENTROS_COSTO_LIST_CONFIG.sortableColumns}
                  sort={centrosCostoList.sort}
                  onSort={centrosCostoList.toggleSort}
                />
                <ErpSortableHeader
                  column="nombre"
                  label="Nombre"
                  sortableColumns={CENTROS_COSTO_LIST_CONFIG.sortableColumns}
                  sort={centrosCostoList.sort}
                  onSort={centrosCostoList.toggleSort}
                />
                <ErpSortableHeader
                  column="tipo_centro_costo"
                  label="Tipo"
                  sortableColumns={CENTROS_COSTO_LIST_CONFIG.sortableColumns}
                  sort={centrosCostoList.sort}
                  onSort={centrosCostoList.toggleSort}
                />
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Responsable</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {list.length === 0 ? (
                <IamTableEmptyState
                  colSpan={TABLE_COLSPAN}
                  icon={DollarSign}
                  title={
                    hasSearch
                      ? 'No se encontraron centros de costo que coincidan con la búsqueda.'
                      : includeInactive
                        ? 'No hay centros de costo registrados.'
                        : 'No hay centros de costo activos.'
                  }
                  description={
                    hasSearch
                      ? 'Pruebe con otro término o limpie el filtro de búsqueda.'
                      : undefined
                  }
                  actionLabel={
                    !hasSearch && !includeInactive && canCrear && scopeEmpresaId
                      ? 'Crear centro de costo'
                      : undefined
                  }
                  onAction={
                    !hasSearch && !includeInactive && canCrear && scopeEmpresaId ? openCreate : undefined
                  }
                  actionDisabled={discardPending !== null}
                />
              ) : (
                list.map((row) => (
                  <tr key={row.centro_costo_id} className="hover:bg-overlay dark:hover:bg-overlay">
                    <td className="px-4 py-3 text-sm font-medium text-text-base">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.tipo_centro_costo}</td>
                    <td className="px-4 py-3 text-sm text-text-soft">{row.responsable_nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {row.es_activo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">Activo</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error">Inactivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex items-center justify-center gap-1">
                      {row.es_activo ? (
                        <>
                          {canEditar && (
                            <Button variant="ghost" size="icon" onClick={() => openEdit(row)} disabled={discardPending !== null} className="text-brand-primary hover:text-brand-primary/80" title="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canEliminar && (
                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)} disabled={discardPending !== null} className="text-error hover:text-error hover:bg-error/10" title="Desactivar">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      ) : (
                        canEditar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setReactivarTarget(row)}
                            disabled={reactivarCentroCosto.isPending || discardPending !== null}
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
          {centrosCostoList.pagination ? (
            <ErpPagination
              pagination={centrosCostoList.pagination}
              onPageChange={centrosCostoList.setPage}
              onLimitChange={centrosCostoList.setLimit}
              disabled={discardPending !== null || centrosCostoList.isFetching}
            />
          ) : null}
        </div>
      )}
      <OrgDiscardConfirmDialog
        discardPending={discardPending}
        entityLabel="el centro de costo"
        onClose={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget && discardPending === null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Desactivar centro de costo"
        message={deleteTarget ? `¿Desactivar centro de costo '${deleteTarget.nombre}'? Podrá reactivarlo después.` : ''}
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
      />
      <ConfirmDialog
        isOpen={!!reactivarTarget && discardPending === null}
        onClose={() => setReactivarTarget(null)}
        onConfirm={() => void confirmarReactivar()}
        title="Reactivar centro de costo"
        message={reactivarTarget ? `¿Reactivar centro de costo '${reactivarTarget.nombre}'? Volverá a estar disponible.` : ''}
        confirmText="Reactivar"
        cancelText="Cancelar"
        variant="info"
        loading={reactivarCentroCosto.isPending}
      />
      <Dialog open={createOpen} onOpenChange={handleCreateDialogOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0" {...orgDialogGuardProps}>
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Crear centro de costo</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <OrgSessionEmpresaField />
                  <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className={`${inputClass} uppercase`} required /></div>
                  <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Tipo *</Label><select value={form.tipo_centro_costo} onChange={(e) => setForm((p) => ({ ...p, tipo_centro_costo: e.target.value }))} className={inputClass}><option value="operativo">Operativo</option><option value="administrativo">Administrativo</option><option value="proyecto">Proyecto</option></select></div>
                  <div><Label>Descripción</Label><input type="text" value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Jerarquía">
                <div className="space-y-3">
                  <div><Label>Centro de costo padre</Label><select value={form.centro_costo_padre_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, centro_costo_padre_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno (raíz) —</option>{centrosPadreCreate.map((c) => <option key={c.centro_costo_id} value={c.centro_costo_id}>{c.codigo} — {c.nombre}</option>)}</select></div>
                  <div><Label>Nivel</Label><input type="number" min={1} value={form.nivel ?? ''} onChange={(e) => setForm((p) => ({ ...p, nivel: e.target.value === '' ? undefined : parseInt(e.target.value, 10) }))} className={inputClass} placeholder="1" /></div>
                </div>
              </FormSection>
              <FormSection title="Clasificación y presupuesto">
                <div className="space-y-3">
                  <div><Label>Categoría</Label><input type="text" value={form.categoria ?? ''} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2"><input type="checkbox" checked={form.tiene_presupuesto ?? false} onChange={(e) => setForm((p) => ({ ...p, tiene_presupuesto: e.target.checked }))} className="rounded border border-border-base" /><Label>Tiene presupuesto</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={form.permite_imputacion_directa ?? true} onChange={(e) => setForm((p) => ({ ...p, permite_imputacion_directa: e.target.checked }))} className="rounded border border-border-base" /><Label>Permite imputación directa</Label></div>
                  </div>
                </div>
              </FormSection>
              <FormSection title="Responsable y vigencia">
                <div className="space-y-3">
                  <div><Label>Responsable</Label><input type="text" value={form.responsable_nombre ?? ''} onChange={(e) => setForm((p) => ({ ...p, responsable_nombre: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Fecha inicio vigencia</Label><input type="date" value={form.fecha_inicio_vigencia ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio_vigencia: e.target.value || undefined }))} className={inputClass} /></div>
                    <div><Label>Fecha fin vigencia</Label><input type="date" value={form.fecha_fin_vigencia ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_fin_vigencia: e.target.value || undefined }))} className={inputClass} /></div>
                  </div>
                </div>
              </FormSection>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base"><Button type="button" variant="outline" onClick={handleRequestCloseCreate}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0" {...orgDialogGuardProps}>
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Editar centro de costo</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className={`${inputClass} uppercase`} required /></div>
                  <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Tipo *</Label><select value={editForm.tipo_centro_costo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_centro_costo: e.target.value }))} className={inputClass}><option value="operativo">Operativo</option><option value="administrativo">Administrativo</option><option value="proyecto">Proyecto</option></select></div>
                  <div><Label>Descripción</Label><input type="text" value={editForm.descripcion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Jerarquía">
                <div className="space-y-3">
                  <div><Label>Centro de costo padre</Label><select value={editForm.centro_costo_padre_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, centro_costo_padre_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno (raíz) —</option>{centrosPadreEdit.map((c) => <option key={c.centro_costo_id} value={c.centro_costo_id}>{c.codigo} — {c.nombre}</option>)}</select></div>
                  <div><Label>Nivel</Label><input type="number" min={1} value={editForm.nivel ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nivel: e.target.value === '' ? undefined : parseInt(e.target.value, 10) }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Clasificación y presupuesto">
                <div className="space-y-3">
                  <div><Label>Categoría</Label><input type="text" value={editForm.categoria ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, categoria: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.tiene_presupuesto ?? false} onChange={(e) => setEditForm((p) => ({ ...p, tiene_presupuesto: e.target.checked }))} className="rounded border border-border-base" /><Label>Tiene presupuesto</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.permite_imputacion_directa ?? true} onChange={(e) => setEditForm((p) => ({ ...p, permite_imputacion_directa: e.target.checked }))} className="rounded border border-border-base" /><Label>Permite imputación directa</Label></div>
                  </div>
                </div>
              </FormSection>
              <FormSection title="Responsable y vigencia">
                <div className="space-y-3">
                  <div><Label>Responsable</Label><input type="text" value={editForm.responsable_nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, responsable_nombre: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Fecha inicio vigencia</Label><input type="date" value={editForm.fecha_inicio_vigencia ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_inicio_vigencia: e.target.value || undefined }))} className={inputClass} /></div>
                    <div><Label>Fecha fin vigencia</Label><input type="date" value={editForm.fecha_fin_vigencia ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_fin_vigencia: e.target.value || undefined }))} className={inputClass} /></div>
                  </div>
                </div>
              </FormSection>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base"><Button type="button" variant="outline" onClick={handleRequestCloseEdit}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrgPageLayout>
  );
}
