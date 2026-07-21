/**
 * Departamentos — Listado y gestión. GET/POST /api/v1/org/departamentos
 */
import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Layers, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { IamTableEmptyState } from '@/features/admin/components/iam';
import { useDebouncedSearch } from '@/core/list';
import { useCodigoFieldController } from '@/core/codigo';
import { CodigoField } from '@/shared/components/codigo';
import { OrgToolbarSearch } from '../components/OrgToolbarSearch';
import type { Departamento, DepartamentoCreate, DepartamentoUpdate } from '../types/org.types';
import { OrgPageLayout } from '../components/OrgPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogBody, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { FormSection } from '../components/FormSection';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useSucursales } from '../hooks/sucursal.hooks';
import { useOrgSessionScope, useOrgScopeEmpresaReset } from '../hooks/useOrgSessionScope';
import { OrgCompanyToolbar } from '../components/OrgCompanyToolbar';
import { OrgTableSkeleton } from '../components/OrgTableSkeleton';
import { OrgSessionEmpresaField } from '../components/OrgSessionEmpresaField';
import { assertBodyEmpresaMatchesSession } from '../utils/org-body-scope';
import { useCentrosCosto } from '../hooks/centro-costo.hooks';
import {
  useCreateDepartamento,
  useDeleteDepartamento,
  useDepartamentos,
  useReactivarDepartamento,
  useUpdateDepartamento,
} from '../hooks/departamento.hooks';
import { OrgDiscardConfirmDialog } from '../components/OrgDiscardConfirmDialog';
import type { OrgDiscardPending } from '../types/org-discard.types';
import { createOrgDiscardHandlers } from '../utils/org-discard-handlers';
import { orgDialogGuardProps } from '../utils/org-dialog-guard-props';
import {
  buildEditDepartamentoFormSnapshot,
  isCreateDepartamentoDirty,
  isEditDepartamentoDirty,
  type EditDepartamentoFormSnapshot,
} from '../utils/form-dirty/departamento-form-dirty';
import { mutateOrgCreateWithCodigo, ORG_CODIGO_SEQUENCE_KEYS } from '../codigo';

const inputClass = 'mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm';
const DEFAULT: DepartamentoCreate = {
  empresa_id: '',
  codigo: '',
  nombre: '',
  descripcion: undefined,
  departamento_padre_id: undefined,
  tipo_departamento: undefined,
  jefe_nombre: undefined,
  centro_costo_id: undefined,
  sucursal_id: undefined,
  es_activo: true,
};

export default function DepartamentosPage() {
  const { scopeEmpresaId, canQueryCompanyScoped } = useOrgSessionScope();

  const [includeInactive, setIncludeInactive] = useState(false);
  const search = useDebouncedSearch();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Departamento | null>(null);
  const [form, setForm] = useState<DepartamentoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<DepartamentoUpdate>({});
  const [editFormSnapshot, setEditFormSnapshot] = useState<EditDepartamentoFormSnapshot | null>(null);
  const [discardPending, setDiscardPending] = useState<OrgDiscardPending>(null);
  const [deleteTarget, setDeleteTarget] = useState<Departamento | null>(null);
  const [reactivarTarget, setReactivarTarget] = useState<Departamento | null>(null);
  const { can } = usePermissions();
  const canCrear = can('org', 'crear');
  const canEditar = can('org', 'editar');
  const canEliminar = can('org', 'eliminar');

  const resetLocalFilters = useCallback(() => {
    search.clear();
    setIncludeInactive(false);
    setCreateOpen(false);
    setEditOpen(false);
    setEditing(null);
    setEditFormSnapshot(null);
    setDiscardPending(null);
    setDeleteTarget(null);
    setReactivarTarget(null);
  }, [search.clear]);
  useOrgScopeEmpresaReset(resetLocalFilters);

  const listQuery = useDepartamentos({
    solo_activos: !includeInactive,
    buscar: search.debouncedValue,
    enabled: canQueryCompanyScoped,
  });
  const list: Departamento[] = listQuery.data ?? [];
  const loading = listQuery.isLoading;
  const error = listQuery.error ? getErrorMessage(listQuery.error).message : null;

  const sucursalesQuery = useSucursales({ solo_activos: true, enabled: !!scopeEmpresaId });
  const sucursales = sucursalesQuery.data ?? [];
  const centrosCostoQuery = useCentrosCosto({ solo_activos: true, enabled: !!scopeEmpresaId });
  const centrosCosto = centrosCostoQuery.data ?? [];

  const createDepartamento = useCreateDepartamento();
  const updateDepartamento = useUpdateDepartamento();
  const deleteDepartamento = useDeleteDepartamento();
  const reactivarDepartamento = useReactivarDepartamento();

  const submitting = createDepartamento.isPending || updateDepartamento.isPending;
  const deleting = deleteDepartamento.isPending;
  const codigo = useCodigoFieldController({
    sequenceKey: ORG_CODIGO_SEQUENCE_KEYS.departamento,
    mode: 'create',
    disabled: submitting,
  });
  const hasSearch = search.hasSearch;
  const TABLE_COLSPAN = 6;

  const isCreateDialogDirty = useMemo(
    () => isCreateDepartamentoDirty(form) || codigo.isDirty,
    [form, codigo.isDirty],
  );
  const isEditDialogDirty = useMemo(
    () => isEditDepartamentoDirty(editForm, editFormSnapshot),
    [editForm, editFormSnapshot],
  );

  const closeCreate = useCallback(() => {
    if (!submitting) {
      codigo.actions.reset();
      setCreateOpen(false);
      setForm({ ...DEFAULT, empresa_id: scopeEmpresaId ?? '' });
      setDiscardPending((pending) => (pending === 'create' ? null : pending));
    }
  }, [scopeEmpresaId, submitting, codigo.actions]);

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
        contextPrefix: 'org-departamento',
      }),
    [discardPending, submitting, isCreateDialogDirty, isEditDialogDirty, closeCreate, closeEdit],
  );

  const openCreate = () => {
    setDiscardPending(null);
    codigo.actions.reset();
    const empId = scopeEmpresaId ?? '';
    setForm({ ...DEFAULT, empresa_id: empId });
    setCreateOpen(true);
  };

  const departamentosPadreCreate = list;
  const departamentosPadreEdit = list.filter(
    (d) => d.departamento_id !== editing?.departamento_id,
  );
  const openEdit = (row: Departamento) => {
    setDiscardPending(null);
    setEditing(row);
    const nextEditForm: DepartamentoUpdate = {
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      departamento_padre_id: row.departamento_padre_id ?? undefined,
      tipo_departamento: row.tipo_departamento ?? undefined,
      jefe_nombre: row.jefe_nombre ?? undefined,
      centro_costo_id: row.centro_costo_id ?? undefined,
      sucursal_id: row.sucursal_id ?? undefined,
      es_activo: row.es_activo,
    };
    setEditForm(nextEditForm);
    setEditFormSnapshot(buildEditDepartamentoFormSnapshot(nextEditForm));
    setEditOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDepartamento.mutateAsync({
        departamentoId: deleteTarget.departamento_id,
      });
      setDeleteTarget(null);
    } catch {
      /* toast de error: onError en useDeleteDepartamento */
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scopeEmpresaId || !form.nombre.trim()) {
      toast.error('El nombre es requerido.');
      return;
    }
    try {
      const basePayload = assertBodyEmpresaMatchesSession({ ...form }, scopeEmpresaId);
      await mutateOrgCreateWithCodigo(codigo, basePayload, createDepartamento.mutateAsync);
      closeCreate();
    } catch {
      /* toast de error: onError en useCreateDepartamento */
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateDepartamento.mutateAsync({
        departamentoId: editing.departamento_id,
        payload: editForm,
      });
      closeEdit();
    } catch {
      /* toast de error: onError en useUpdateDepartamento */
    }
  };

  const confirmarReactivar = async () => {
    if (!reactivarTarget) return;
    try {
      await reactivarDepartamento.mutateAsync({ departamentoId: reactivarTarget.departamento_id });
      setReactivarTarget(null);
    } catch {
      /* toast de error: onError en useReactivarDepartamento */
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
              <Plus className="h-4 w-4 mr-2" /> Crear departamento
            </Button>
          ) : null
        }
      >
        <OrgToolbarSearch
          value={search.inputValue}
          onChange={search.setInputValue}
          placeholder="Código, nombre..."
          aria-label="Buscar departamentos"
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
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Jefe</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {list.length === 0 ? (
                <IamTableEmptyState
                  colSpan={TABLE_COLSPAN}
                  icon={Layers}
                  title={
                    hasSearch
                      ? 'No se encontraron departamentos que coincidan con la búsqueda.'
                      : includeInactive
                        ? 'No hay departamentos registrados.'
                        : 'No hay departamentos activos.'
                  }
                  description={
                    hasSearch ? 'Pruebe con otro término o limpie el filtro de búsqueda.' : undefined
                  }
                  actionLabel={
                    !hasSearch && !includeInactive && canCrear && scopeEmpresaId
                      ? 'Crear departamento'
                      : undefined
                  }
                  onAction={
                    !hasSearch && !includeInactive && canCrear && scopeEmpresaId ? openCreate : undefined
                  }
                  actionDisabled={discardPending !== null}
                />
              ) : (
                list.map((row) => (
                  <tr key={row.departamento_id} className="hover:bg-overlay dark:hover:bg-overlay">
                    <td className="px-4 py-3 text-sm font-medium text-text-base">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-text-soft">{row.tipo_departamento ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-text-soft">{row.jefe_nombre ?? '—'}</td>
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
                            disabled={reactivarDepartamento.isPending || discardPending !== null}
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
        </div>
      )}
      <OrgDiscardConfirmDialog
        discardPending={discardPending}
        entityLabel="el departamento"
        onClose={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
      <Dialog open={createOpen} onOpenChange={handleCreateDialogOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0" {...orgDialogGuardProps}>
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Crear departamento</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <OrgSessionEmpresaField />
                  <CodigoField
                    sequenceKey={ORG_CODIGO_SEQUENCE_KEYS.departamento}
                    mode="create"
                    controller={codigo}
                  />
                  <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Descripción</Label><input type="text" value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Organización">
                <div className="space-y-3">
                  <div><Label>Departamento padre</Label><select value={form.departamento_padre_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, departamento_padre_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno (raíz) —</option>{departamentosPadreCreate.map((d) => <option key={d.departamento_id} value={d.departamento_id}>{d.codigo} — {d.nombre}</option>)}</select></div>
                  <div><Label>Tipo de departamento</Label><input type="text" value={form.tipo_departamento ?? ''} onChange={(e) => setForm((p) => ({ ...p, tipo_departamento: e.target.value || undefined }))} className={inputClass} placeholder="Ej. operativo, soporte" /></div>
                  <div><Label>Centro de costo</Label><select value={form.centro_costo_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, centro_costo_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno —</option>{centrosCosto.map((c) => <option key={c.centro_costo_id} value={c.centro_costo_id}>{c.codigo} — {c.nombre}</option>)}</select></div>
                  <div><Label>Sucursal</Label><select value={form.sucursal_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, sucursal_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguna —</option>{sucursales.map((s) => <option key={s.sucursal_id} value={s.sucursal_id}>{s.codigo} — {s.nombre}</option>)}</select></div>
                </div>
              </FormSection>
              <FormSection title="Responsable">
                <div><Label>Jefe / responsable</Label><input type="text" value={form.jefe_nombre ?? ''} onChange={(e) => setForm((p) => ({ ...p, jefe_nombre: e.target.value || undefined }))} className={inputClass} /></div>
              </FormSection>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base"><Button type="button" variant="outline" onClick={handleRequestCloseCreate}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0" {...orgDialogGuardProps}>
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Editar departamento</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className={`${inputClass} uppercase`} required /></div>
                  <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Descripción</Label><input type="text" value={editForm.descripcion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Organización">
                <div className="space-y-3">
                  <div><Label>Departamento padre</Label><select value={editForm.departamento_padre_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, departamento_padre_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno (raíz) —</option>{departamentosPadreEdit.map((d) => <option key={d.departamento_id} value={d.departamento_id}>{d.codigo} — {d.nombre}</option>)}</select></div>
                  <div><Label>Tipo de departamento</Label><input type="text" value={editForm.tipo_departamento ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_departamento: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Centro de costo</Label><select value={editForm.centro_costo_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, centro_costo_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno —</option>{centrosCosto.map((c) => <option key={c.centro_costo_id} value={c.centro_costo_id}>{c.codigo} — {c.nombre}</option>)}</select></div>
                  <div><Label>Sucursal</Label><select value={editForm.sucursal_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, sucursal_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguna —</option>{sucursales.map((s) => <option key={s.sucursal_id} value={s.sucursal_id}>{s.codigo} — {s.nombre}</option>)}</select></div>
                </div>
              </FormSection>
              <FormSection title="Responsable">
                <div><Label>Jefe / responsable</Label><input type="text" value={editForm.jefe_nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, jefe_nombre: e.target.value || undefined }))} className={inputClass} /></div>
              </FormSection>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base"><Button type="button" variant="outline" onClick={handleRequestCloseEdit}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog isOpen={!!deleteTarget && discardPending === null} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} title="Desactivar departamento" message={deleteTarget ? `¿Desactivar departamento '${deleteTarget.nombre}'? Podrá reactivarlo después.` : ''} confirmText="Desactivar" cancelText="Cancelar" variant="danger" loading={deleting} />
      <ConfirmDialog
        isOpen={!!reactivarTarget && discardPending === null}
        onClose={() => setReactivarTarget(null)}
        onConfirm={() => void confirmarReactivar()}
        title="Reactivar departamento"
        message={reactivarTarget ? `¿Reactivar departamento '${reactivarTarget.nombre}'? Volverá a estar disponible.` : ''}
        confirmText="Reactivar"
        cancelText="Cancelar"
        variant="info"
        loading={reactivarDepartamento.isPending}
      />
    </OrgPageLayout>
  );
}
