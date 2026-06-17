/**
 * Cargos — Listado y gestión. GET/POST /api/v1/org/cargos
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Briefcase, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { IamTableEmptyState } from '@/features/admin/components/iam';
import { useDebouncedSearch } from '@/core/list';
import { OrgToolbarSearch } from '../components/OrgToolbarSearch';
import { catalogosService } from '@/core/services/catalogos.service';
import type { Cargo, CargoCreate, CargoUpdate } from '../types/org.types';
import type { CatMoneda } from '@/types/catalogos.types';
import { OrgPageLayout } from '../components/OrgPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogBody, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { FormSection } from '../components/FormSection';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useDepartamentos } from '../hooks/departamento.hooks';
import { useOrgSessionScope, useOrgScopeEmpresaReset } from '../hooks/useOrgSessionScope';
import { OrgCompanyToolbar } from '../components/OrgCompanyToolbar';
import { OrgTableSkeleton } from '../components/OrgTableSkeleton';
import { OrgSessionEmpresaField } from '../components/OrgSessionEmpresaField';
import { assertBodyEmpresaMatchesSession } from '../utils/org-body-scope';
import {
  useCargos,
  useCreateCargo,
  useDeleteCargo,
  useReactivarCargo,
  useUpdateCargo,
} from '../hooks/cargo.hooks';
import { OrgDiscardConfirmDialog } from '../components/OrgDiscardConfirmDialog';
import type { OrgDiscardPending } from '../types/org-discard.types';
import { createOrgDiscardHandlers } from '../utils/org-discard-handlers';
import { orgDialogGuardProps } from '../utils/org-dialog-guard-props';
import {
  buildEditCargoFormSnapshot,
  isCreateCargoDirty,
  isEditCargoDirty,
  type EditCargoFormSnapshot,
} from '../utils/form-dirty/cargo-form-dirty';

const inputClass = 'mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm';
const DEFAULT: CargoCreate = {
  empresa_id: '',
  codigo: '',
  nombre: '',
  descripcion: undefined,
  departamento_id: undefined,
  nivel_jerarquico: undefined,
  categoria: undefined,
  area_funcional: undefined,
  cargo_jefe_id: undefined,
  rango_salarial_min: undefined,
  rango_salarial_max: undefined,
  moneda_salarial: '',
  nivel_educacion_minimo: undefined,
  experiencia_minima_meses: undefined,
  requisitos_especificos: undefined,
  es_activo: true,
};

export default function CargosPage() {
  const { scopeEmpresaId, canQueryCompanyScoped } = useOrgSessionScope();

  const [includeInactive, setIncludeInactive] = useState(false);
  const search = useDebouncedSearch();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Cargo | null>(null);
  const [form, setForm] = useState<CargoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<CargoUpdate>({});
  const [editFormSnapshot, setEditFormSnapshot] = useState<EditCargoFormSnapshot | null>(null);
  const [discardPending, setDiscardPending] = useState<OrgDiscardPending>(null);
  const [monedas, setMonedas] = useState<CatMoneda[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Cargo | null>(null);
  const [reactivarTarget, setReactivarTarget] = useState<Cargo | null>(null);
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

  const listQuery = useCargos({
    solo_activos: !includeInactive,
    buscar: search.debouncedValue,
    enabled: canQueryCompanyScoped,
  });
  const list: Cargo[] = listQuery.data ?? [];
  const loading = listQuery.isLoading;
  const error = listQuery.error ? getErrorMessage(listQuery.error).message : null;

  const depsTablaQuery = useDepartamentos({
    solo_activos: true,
    enabled: canQueryCompanyScoped,
  });
  const departamentosTabla = depsTablaQuery.data ?? [];
  const depsFormQuery = useDepartamentos({ solo_activos: true, enabled: !!scopeEmpresaId });
  const departamentos = depsFormQuery.data ?? [];

  const createCargo = useCreateCargo();
  const updateCargo = useUpdateCargo();
  const deleteCargo = useDeleteCargo();
  const reactivarCargo = useReactivarCargo();

  const submitting = createCargo.isPending || updateCargo.isPending;
  const deleting = deleteCargo.isPending;
  const hasSearch = search.hasSearch;
  const TABLE_COLSPAN = 6;

  useEffect(() => {
    catalogosService
      .listMonedas({ solo_activos: true })
      .then(setMonedas)
      .catch(() => setMonedas([]));
  }, []);

  const isCreateDialogDirty = useMemo(() => isCreateCargoDirty(form), [form]);
  const isEditDialogDirty = useMemo(
    () => isEditCargoDirty(editForm, editFormSnapshot),
    [editForm, editFormSnapshot],
  );

  const closeCreate = useCallback(() => {
    if (!submitting) {
      setCreateOpen(false);
      const defaultMonedaId = monedas[0]?.moneda_id ?? '';
      setForm({ ...DEFAULT, empresa_id: scopeEmpresaId ?? '', moneda_salarial: defaultMonedaId });
      setDiscardPending((pending) => (pending === 'create' ? null : pending));
    }
  }, [monedas, scopeEmpresaId, submitting]);

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
        contextPrefix: 'org-cargo',
      }),
    [discardPending, submitting, isCreateDialogDirty, isEditDialogDirty, closeCreate, closeEdit],
  );

  const openCreate = () => {
    setDiscardPending(null);
    const empId = scopeEmpresaId ?? '';
    const defaultMonedaId = monedas[0]?.moneda_id ?? '';
    setForm({ ...DEFAULT, empresa_id: empId, moneda_salarial: defaultMonedaId });
    setCreateOpen(true);
  };
  const cargosJefeCreate = list;
  const cargosJefeEdit = useMemo(
    () => list.filter((c) => c.cargo_id !== editing?.cargo_id),
    [list, editing?.cargo_id],
  );
  const openEdit = (row: Cargo) => {
    setDiscardPending(null);
    setEditing(row);
    const nextEditForm: CargoUpdate = {
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      departamento_id: row.departamento_id ?? undefined,
      nivel_jerarquico: row.nivel_jerarquico ?? undefined,
      categoria: row.categoria ?? undefined,
      area_funcional: row.area_funcional ?? undefined,
      cargo_jefe_id: row.cargo_jefe_id ?? undefined,
      rango_salarial_min: row.rango_salarial_min ?? undefined,
      rango_salarial_max: row.rango_salarial_max ?? undefined,
      moneda_salarial: row.moneda_salarial,
      nivel_educacion_minimo: row.nivel_educacion_minimo ?? undefined,
      experiencia_minima_meses: row.experiencia_minima_meses ?? undefined,
      requisitos_especificos: row.requisitos_especificos ?? undefined,
      es_activo: row.es_activo,
    };
    setEditForm(nextEditForm);
    setEditFormSnapshot(buildEditCargoFormSnapshot(nextEditForm));
    setEditOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCargo.mutateAsync({ cargoId: deleteTarget.cargo_id });
      setDeleteTarget(null);
    } catch {
      /* toast de error: onError en useDeleteCargo */
    }
  };

  const departamentoNombre = (id: string) =>
    departamentosTabla.find((d) => d.departamento_id === id)?.nombre ??
    departamentos.find((d) => d.departamento_id === id)?.nombre ??
    id;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scopeEmpresaId || !form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Código y nombre son requeridos.');
      return;
    }
    try {
      await createCargo.mutateAsync(assertBodyEmpresaMatchesSession({ ...form }, scopeEmpresaId));
      closeCreate();
    } catch {
      /* toast de error: onError en useCreateCargo */
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateCargo.mutateAsync({ cargoId: editing.cargo_id, payload: editForm });
      closeEdit();
    } catch {
      /* toast de error: onError en useUpdateCargo */
    }
  };

  const confirmarReactivar = async () => {
    if (!reactivarTarget) return;
    try {
      await reactivarCargo.mutateAsync({ cargoId: reactivarTarget.cargo_id });
      setReactivarTarget(null);
    } catch {
      /* toast de error: onError en useReactivarCargo */
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
              <Plus className="h-4 w-4 mr-2" /> Crear cargo
            </Button>
          ) : null
        }
      >
        <OrgToolbarSearch
          value={search.inputValue}
          onChange={search.setInputValue}
          placeholder="Código, nombre..."
          aria-label="Buscar cargos"
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
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Departamento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Nivel</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {list.length === 0 ? (
                <IamTableEmptyState
                  colSpan={TABLE_COLSPAN}
                  icon={Briefcase}
                  title={
                    hasSearch
                      ? 'No se encontraron cargos que coincidan con la búsqueda.'
                      : includeInactive
                        ? 'No hay cargos registrados.'
                        : 'No hay cargos activos.'
                  }
                  description={
                    hasSearch ? 'Pruebe con otro término o limpie el filtro de búsqueda.' : undefined
                  }
                  actionLabel={
                    !hasSearch && !includeInactive && canCrear && scopeEmpresaId ? 'Crear cargo' : undefined
                  }
                  onAction={
                    !hasSearch && !includeInactive && canCrear && scopeEmpresaId ? openCreate : undefined
                  }
                  actionDisabled={discardPending !== null}
                />
              ) : (
                list.map((row) => (
                  <tr key={row.cargo_id} className="hover:bg-overlay dark:hover:bg-overlay">
                    <td className="px-4 py-3 text-sm font-medium text-text-base">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-text-soft">{row.departamento_id ? departamentoNombre(row.departamento_id) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-text-soft">{row.nivel_jerarquico ?? '—'}</td>
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
                            disabled={reactivarCargo.isPending || discardPending !== null}
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
        entityLabel="el cargo"
        onClose={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
      <Dialog open={createOpen} onOpenChange={handleCreateDialogOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0" {...orgDialogGuardProps}>
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Crear cargo</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5 overflow-y-auto">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <OrgSessionEmpresaField />
                  <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className={`${inputClass} uppercase`} required /></div>
                  <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Descripción</Label><input type="text" value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Departamento</Label><select value={form.departamento_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, departamento_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno —</option>{departamentos.map((d) => <option key={d.departamento_id} value={d.departamento_id}>{d.codigo} — {d.nombre}</option>)}</select></div>
                </div>
              </FormSection>
              <FormSection title="Clasificación">
                <div className="space-y-3">
                  <div><Label>Nivel jerárquico</Label><input type="number" min={1} value={form.nivel_jerarquico ?? ''} onChange={(e) => setForm((p) => ({ ...p, nivel_jerarquico: e.target.value === '' ? undefined : parseInt(e.target.value, 10) }))} className={inputClass} placeholder="1" /></div>
                  <div><Label>Categoría</Label><input type="text" value={form.categoria ?? ''} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Área funcional</Label><input type="text" value={form.area_funcional ?? ''} onChange={(e) => setForm((p) => ({ ...p, area_funcional: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Cargo jefe</Label><select value={form.cargo_jefe_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, cargo_jefe_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno —</option>{cargosJefeCreate.map((c) => <option key={c.cargo_id} value={c.cargo_id}>{c.codigo} — {c.nombre}</option>)}</select></div>
                </div>
              </FormSection>
      <FormSection title="Compensación">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Rango salarial mín.</Label><input type="number" min={0} step={0.01} value={form.rango_salarial_min ?? ''} onChange={(e) => setForm((p) => ({ ...p, rango_salarial_min: e.target.value === '' ? undefined : parseFloat(e.target.value) }))} className={inputClass} /></div>
                    <div><Label>Rango salarial máx.</Label><input type="number" min={0} step={0.01} value={form.rango_salarial_max ?? ''} onChange={(e) => setForm((p) => ({ ...p, rango_salarial_max: e.target.value === '' ? undefined : parseFloat(e.target.value) }))} className={inputClass} /></div>
                  </div>
                  <div>
                    <Label>Moneda salarial *</Label>
                    <select
                      value={form.moneda_salarial}
                      onChange={(e) => setForm((p) => ({ ...p, moneda_salarial: e.target.value }))}
                      className={inputClass}
                      required
                    >
                      <option value="">— Seleccionar —</option>
                      {monedas.map((m) => (
                        <option key={m.moneda_id} value={m.moneda_id}>
                          {m.codigo} — {m.nombre} ({m.simbolo})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </FormSection>
              <FormSection title="Requisitos">
                <div className="space-y-3">
                  <div><Label>Nivel educación mínimo</Label><input type="text" value={form.nivel_educacion_minimo ?? ''} onChange={(e) => setForm((p) => ({ ...p, nivel_educacion_minimo: e.target.value || undefined }))} className={inputClass} placeholder="Ej. Secundaria, Universitario" /></div>
                  <div><Label>Experiencia mínima (meses)</Label><input type="number" min={0} value={form.experiencia_minima_meses ?? ''} onChange={(e) => setForm((p) => ({ ...p, experiencia_minima_meses: e.target.value === '' ? undefined : parseInt(e.target.value, 10) }))} className={inputClass} /></div>
                  <div><Label>Requisitos específicos</Label><textarea value={form.requisitos_especificos ?? ''} onChange={(e) => setForm((p) => ({ ...p, requisitos_especificos: e.target.value || undefined }))} className={inputClass} rows={2} /></div>
                </div>
              </FormSection>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base"><Button type="button" variant="outline" onClick={handleRequestCloseCreate}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0" {...orgDialogGuardProps}>
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Editar cargo</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5 overflow-y-auto">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className={`${inputClass} uppercase`} required /></div>
                  <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Descripción</Label><input type="text" value={editForm.descripcion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Departamento</Label><select value={editForm.departamento_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, departamento_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno —</option>{departamentos.map((d) => <option key={d.departamento_id} value={d.departamento_id}>{d.codigo} — {d.nombre}</option>)}</select></div>
                </div>
              </FormSection>
              <FormSection title="Clasificación">
                <div className="space-y-3">
                  <div><Label>Nivel jerárquico</Label><input type="number" min={1} value={editForm.nivel_jerarquico ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nivel_jerarquico: e.target.value === '' ? undefined : parseInt(e.target.value, 10) }))} className={inputClass} /></div>
                  <div><Label>Categoría</Label><input type="text" value={editForm.categoria ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, categoria: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Área funcional</Label><input type="text" value={editForm.area_funcional ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, area_funcional: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Cargo jefe</Label><select value={editForm.cargo_jefe_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cargo_jefe_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno —</option>{cargosJefeEdit.map((c) => <option key={c.cargo_id} value={c.cargo_id}>{c.codigo} — {c.nombre}</option>)}</select></div>
                </div>
              </FormSection>
              <FormSection title="Compensación">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Rango salarial mín.</Label><input type="number" min={0} step={0.01} value={editForm.rango_salarial_min ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, rango_salarial_min: e.target.value === '' ? undefined : parseFloat(e.target.value) }))} className={inputClass} /></div>
                    <div><Label>Rango salarial máx.</Label><input type="number" min={0} step={0.01} value={editForm.rango_salarial_max ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, rango_salarial_max: e.target.value === '' ? undefined : parseFloat(e.target.value) }))} className={inputClass} /></div>
                  </div>
          <div>
            <Label>Moneda salarial *</Label>
            <select
              value={editForm.moneda_salarial ?? ''}
              onChange={(e) => setEditForm((p) => ({ ...p, moneda_salarial: e.target.value || undefined }))}
              className={inputClass}
              required
            >
              <option value="">— Seleccionar —</option>
              {monedas.map((m) => (
                <option key={m.moneda_id} value={m.moneda_id}>
                  {m.codigo} — {m.nombre} ({m.simbolo})
                </option>
              ))}
            </select>
          </div>
                </div>
              </FormSection>
              <FormSection title="Requisitos">
                <div className="space-y-3">
                  <div><Label>Nivel educación mínimo</Label><input type="text" value={editForm.nivel_educacion_minimo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nivel_educacion_minimo: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Experiencia mínima (meses)</Label><input type="number" min={0} value={editForm.experiencia_minima_meses ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, experiencia_minima_meses: e.target.value === '' ? undefined : parseInt(e.target.value, 10) }))} className={inputClass} /></div>
                  <div><Label>Requisitos específicos</Label><textarea value={editForm.requisitos_especificos ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, requisitos_especificos: e.target.value || undefined }))} className={inputClass} rows={2} /></div>
                </div>
              </FormSection>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base"><Button type="button" variant="outline" onClick={handleRequestCloseEdit}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog isOpen={!!deleteTarget && discardPending === null} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} title="Desactivar cargo" message={deleteTarget ? `¿Desactivar cargo '${deleteTarget.nombre}'? Podrá reactivarlo después.` : ''} confirmText="Desactivar" cancelText="Cancelar" variant="danger" loading={deleting} />
      <ConfirmDialog
        isOpen={!!reactivarTarget && discardPending === null}
        onClose={() => setReactivarTarget(null)}
        onConfirm={() => void confirmarReactivar()}
        title="Reactivar cargo"
        message={reactivarTarget ? `¿Reactivar cargo '${reactivarTarget.nombre}'? Volverá a estar disponible.` : ''}
        confirmText="Reactivar"
        cancelText="Cancelar"
        variant="info"
        loading={reactivarCargo.isPending}
      />
    </OrgPageLayout>
  );
}
