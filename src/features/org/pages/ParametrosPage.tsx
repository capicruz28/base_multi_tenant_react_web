/**
 * Parámetros del sistema — Listado y gestión. GET/POST/PUT/DELETE /api/v1/org/parametros
 * Edición de valor según tipo_dato (texto, numerico, booleano, fecha, json).
 */
import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Settings, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { IamTableEmptyState } from '@/features/admin/components/iam';
import { OrgToolbarSearch } from '../components/OrgToolbarSearch';
import type { Parametro, ParametroCreate, ParametroEfectivo, ParametroUpdate } from '../types/org.types';
import { OrgPageLayout } from '../components/OrgPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogBody, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { FormSection } from '../components/FormSection';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useOrgSessionScope, useOrgScopeEmpresaReset } from '../hooks/useOrgSessionScope';
import { OrgCompanyToolbar } from '../components/OrgCompanyToolbar';
import { OrgTableSkeleton } from '../components/OrgTableSkeleton';
import { OrgHybridPrecedenceHint } from '../components/OrgHybridPrecedenceHint';
import { OrgParametroHybridTabs } from '../components/OrgParametroHybridTabs';
import { OrgParametroAlcanceBadge } from '../components/OrgParametroAlcanceBadge';
import {
  OrgParametroAlcanceField,
  type ParametroAlcanceKind,
} from '../components/OrgParametroAlcanceField';
import {
  buildParametroCreatePayload,
  canMutateParametroRow,
  canOpenCreateOnTab,
  defaultCreateAlcanceForTab,
} from '../utils/org-parametro-scope';
import { useOrgCanManageGlobalParametros } from '../hooks/useOrgCanManageGlobalParametros';
import type { ParametroHybridTab } from '../hooks/parametro-query-keys';
import {
  useCreateParametro,
  useDeleteParametro,
  useParametrosForTab,
  useReactivarParametro,
  useUpdateParametro,
} from '../hooks/parametro.hooks';
import { OrgDiscardConfirmDialog } from '../components/OrgDiscardConfirmDialog';
import type { OrgDiscardPending } from '../types/org-discard.types';
import { createOrgDiscardHandlers } from '../utils/org-discard-handlers';
import { orgDialogGuardProps } from '../utils/org-dialog-guard-props';
import {
  buildEditParametroFormSnapshot,
  isCreateParametroDirty,
  isEditParametroDirty,
  type EditParametroFormSnapshot,
} from '../utils/form-dirty/parametro-form-dirty';

const MODULO_ORG = 'ORG';
const TIPOS_DATO = ['texto', 'numerico', 'booleano', 'fecha', 'json'] as const;
const inputClass = 'mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm';

const DEFAULT: ParametroCreate = {
  modulo_codigo: MODULO_ORG,
  codigo_parametro: '',
  nombre_parametro: '',
  tipo_dato: 'texto',
  descripcion: undefined,
  empresa_id: undefined,
  valor_defecto: undefined,
  es_editable: true,
  es_obligatorio: false,
  es_activo: true,
};

export default function ParametrosPage() {
  const { scopeEmpresaId, canQueryHybridScoped } = useOrgSessionScope();
  const canManageGlobal = useOrgCanManageGlobalParametros();

  const [activeTab, setActiveTab] = useState<ParametroHybridTab>('effective');
  const [moduloFilter, setModuloFilter] = useState<string>(MODULO_ORG);
  const [createAlcance, setCreateAlcance] = useState<ParametroAlcanceKind>('override');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Parametro | null>(null);
  const [form, setForm] = useState<ParametroCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ParametroUpdate>({});
  const [deleteTarget, setDeleteTarget] = useState<Parametro | null>(null);
  const [valorJsonStr, setValorJsonStr] = useState<string>('');
  const [editFormSnapshot, setEditFormSnapshot] = useState<EditParametroFormSnapshot | null>(null);
  const [discardPending, setDiscardPending] = useState<OrgDiscardPending>(null);

  const { can } = usePermissions();
  const canCrear = can('org', 'crear');
  const canEditar = can('org', 'editar');
  const canEliminar = can('org', 'eliminar');

  const resetLocalFilters = useCallback(() => {
    setBuscar('');
    setIncludeInactive(false);
    setModuloFilter(MODULO_ORG);
    setActiveTab('effective');
    setCreateAlcance('override');
    setCreateOpen(false);
    setEditOpen(false);
    setEditing(null);
    setEditFormSnapshot(null);
    setDiscardPending(null);
    setDeleteTarget(null);
  }, []);
  useOrgScopeEmpresaReset(resetLocalFilters);

  const listQuery = useParametrosForTab(activeTab, {
    solo_activos: !includeInactive,
    modulo_codigo: moduloFilter || undefined,
    buscar,
    enabled: canQueryHybridScoped,
  });
  const list = (listQuery.data ?? []) as (Parametro | ParametroEfectivo)[];
  const loading = listQuery.isLoading;
  const error = listQuery.error ? getErrorMessage(listQuery.error).message : null;

  const canCreateOnTab = canCrear && canOpenCreateOnTab(activeTab, canManageGlobal, scopeEmpresaId);
  const createForceAlcance: ParametroAlcanceKind | undefined =
    activeTab === 'global' ? 'global' : activeTab === 'override' ? 'override' : undefined;

  const createParametro = useCreateParametro();
  const updateParametro = useUpdateParametro();
  const deleteParametro = useDeleteParametro();
  const reactivarParametro = useReactivarParametro();

  const submitting = createParametro.isPending || updateParametro.isPending;
  const deleting = deleteParametro.isPending;
  const reactivatingId = reactivarParametro.variables?.parametroId ?? null;
  const hasSearch = buscar.trim().length > 0;
  const TABLE_COLSPAN = 8;

  const isCreateDialogDirty = useMemo(
    () => isCreateParametroDirty({ form, createAlcance }),
    [form, createAlcance],
  );
  const isEditDialogDirty = useMemo(() => {
    if (!editing) return false;
    return isEditParametroDirty(
      { form: editForm, valorJsonStr, tipoDato: editing.tipo_dato },
      editFormSnapshot,
    );
  }, [editForm, editFormSnapshot, editing, valorJsonStr]);

  const closeCreate = useCallback(() => {
    if (!submitting) {
      setCreateOpen(false);
      setForm({ ...DEFAULT, modulo_codigo: moduloFilter || MODULO_ORG, empresa_id: undefined });
      setCreateAlcance(defaultCreateAlcanceForTab(activeTab, canManageGlobal));
      setDiscardPending((pending) => (pending === 'create' ? null : pending));
    }
  }, [activeTab, canManageGlobal, moduloFilter, submitting]);

  const closeEdit = useCallback(() => {
    if (!submitting) {
      setEditOpen(false);
      setEditing(null);
      setEditForm({});
      setValorJsonStr('');
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
        contextPrefix: 'org-parametro',
      }),
    [discardPending, submitting, isCreateDialogDirty, isEditDialogDirty, closeCreate, closeEdit],
  );

  const openCreate = () => {
    setDiscardPending(null);
    const alcance = defaultCreateAlcanceForTab(activeTab, canManageGlobal);
    setForm({ ...DEFAULT, modulo_codigo: moduloFilter || MODULO_ORG, empresa_id: undefined });
    setCreateAlcance(alcance);
    setCreateOpen(true);
  };
  const openEdit = (row: Parametro) => {
    setDiscardPending(null);
    setEditing(row);
    const nextEditForm: ParametroUpdate = {
      codigo_parametro: row.codigo_parametro,
      nombre_parametro: row.nombre_parametro,
      tipo_dato: row.tipo_dato,
      descripcion: row.descripcion ?? undefined,
      valor_texto: row.valor_texto ?? undefined,
      valor_numerico: row.valor_numerico ?? undefined,
      valor_booleano: row.valor_booleano ?? undefined,
      valor_fecha: row.valor_fecha ?? undefined,
      valor_json: row.valor_json,
      valor_defecto: row.valor_defecto ?? undefined,
      es_editable: row.es_editable ?? true,
      es_obligatorio: row.es_obligatorio ?? false,
      es_activo: row.es_activo,
    };
    const jsonStr =
      typeof row.valor_json === 'string' ? row.valor_json : JSON.stringify(row.valor_json ?? '', null, 2);
    setEditForm(nextEditForm);
    setValorJsonStr(jsonStr);
    setEditFormSnapshot(
      buildEditParametroFormSnapshot({
        form: nextEditForm,
        valorJsonStr: jsonStr,
        tipoDato: row.tipo_dato,
      }),
    );
    setEditOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteParametro.mutateAsync({ parametroId: deleteTarget.parametro_id });
      setDeleteTarget(null);
    } catch {
      /* toast de error: onError en useDeleteParametro */
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo_parametro.trim() || !form.nombre_parametro.trim()) {
      toast.error('Código y nombre del parámetro son requeridos.');
      return;
    }
    if (createAlcance === 'global' && !canManageGlobal) {
      toast.error('Solo administradores de tenant pueden crear parámetros globales.');
      return;
    }
    if (createAlcance === 'override' && !scopeEmpresaId) {
      toast.error('Seleccione una empresa activa para crear un override.');
      return;
    }
    try {
      const payload = buildParametroCreatePayload(form, createAlcance, scopeEmpresaId);
      await createParametro.mutateAsync(payload);
      closeCreate();
    } catch {
      /* toast de error: onError en useCreateParametro */
    }
  };

  /** Campo de valor inicial en creación según tipo_dato */
  const renderCreateValor = () => {
    const t = form.tipo_dato;
    switch (t) {
      case 'numerico':
        return (
          <div>
            <Label>Valor inicial (numérico)</Label>
            <input type="number" value={form.valor_numerico ?? ''} onChange={(e) => setForm((p) => ({ ...p, valor_numerico: e.target.value === '' ? undefined : Number(e.target.value) }))} className={inputClass} />
          </div>
        );
      case 'booleano':
        return (
          <div className="flex items-center gap-2">
            <input type="checkbox" id="create_valor_booleano" checked={form.valor_booleano ?? false} onChange={(e) => setForm((p) => ({ ...p, valor_booleano: e.target.checked }))} className="rounded border border-border-base" />
            <Label htmlFor="create_valor_booleano">Valor inicial (sí/no)</Label>
          </div>
        );
      case 'fecha':
        return (
          <div>
            <Label>Valor inicial (fecha)</Label>
            <input type="date" value={form.valor_fecha?.slice(0, 10) ?? ''} onChange={(e) => setForm((p) => ({ ...p, valor_fecha: e.target.value ? `${e.target.value}T00:00:00` : undefined }))} className={inputClass} />
          </div>
        );
      case 'json':
        return (
          <div>
            <Label>Valor inicial (JSON)</Label>
            <textarea value={typeof form.valor_json === 'string' ? form.valor_json : JSON.stringify(form.valor_json ?? {}, null, 2)} onChange={(e) => { try { setForm((p) => ({ ...p, valor_json: e.target.value.trim() ? JSON.parse(e.target.value) : undefined })); } catch { setForm((p) => ({ ...p, valor_json: undefined })); } }} rows={3} className={`${inputClass} font-mono text-xs`} placeholder='{"clave": "valor"}' />
          </div>
        );
      default:
        return (
          <div>
            <Label>Valor inicial (texto)</Label>
            <input type="text" value={form.valor_texto ?? ''} onChange={(e) => setForm((p) => ({ ...p, valor_texto: e.target.value || undefined }))} className={inputClass} />
          </div>
        );
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const payload = { ...editForm };
    if (editing.tipo_dato === 'json') {
      try {
        payload.valor_json = valorJsonStr.trim() ? JSON.parse(valorJsonStr) : undefined;
      } catch {
        toast.error('El valor JSON no es válido.');
        return;
      }
    }
    try {
      await updateParametro.mutateAsync({
        parametroId: editing.parametro_id,
        payload,
      });
      closeEdit();
    } catch {
      /* toast de error: onError en useUpdateParametro */
    }
  };

  const handleReactivar = async (row: Parametro) => {
    try {
      await reactivarParametro.mutateAsync({ parametroId: row.parametro_id });
    } catch {
      /* toast de error: onError en useReactivarParametro */
    }
  };

  /** Renderiza el campo de valor según tipo_dato en edición */
  const renderEditValor = () => {
    const tipo = editing?.tipo_dato ?? 'texto';
    switch (tipo) {
      case 'numerico':
        return (
          <div>
            <Label>Valor (numérico)</Label>
            <input
              type="number"
              value={editForm.valor_numerico ?? ''}
              onChange={(e) => setEditForm((p) => ({ ...p, valor_numerico: e.target.value === '' ? undefined : Number(e.target.value) }))}
              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
            />
          </div>
        );
      case 'booleano':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit_valor_booleano"
              checked={editForm.valor_booleano ?? false}
              onChange={(e) => setEditForm((p) => ({ ...p, valor_booleano: e.target.checked }))}
              className="rounded border border-border-base"
            />
            <Label htmlFor="edit_valor_booleano">Valor (sí/no)</Label>
          </div>
        );
      case 'fecha':
        return (
          <div>
            <Label>Valor (fecha)</Label>
            <input
              type="date"
              value={editForm.valor_fecha?.slice(0, 10) ?? ''}
              onChange={(e) => setEditForm((p) => ({ ...p, valor_fecha: e.target.value ? `${e.target.value}T00:00:00` : undefined }))}
              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
            />
          </div>
        );
      case 'json':
        return (
          <div>
            <Label>Valor (JSON)</Label>
            <textarea
              value={valorJsonStr}
              onChange={(e) => setValorJsonStr(e.target.value)}
              rows={4}
              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base font-mono text-xs"
              placeholder='{"clave": "valor"}'
            />
          </div>
        );
      default:
        return (
          <div>
            <Label>Valor (texto)</Label>
            <input
              type="text"
              value={editForm.valor_texto ?? ''}
              onChange={(e) => setEditForm((p) => ({ ...p, valor_texto: e.target.value || undefined }))}
              className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
            />
          </div>
        );
    }
  };

  const valorDisplay = (p: Parametro) => {
    if (p.valor_booleano !== undefined && p.valor_booleano !== null) return p.valor_booleano ? 'Sí' : 'No';
    if (p.valor_numerico !== undefined && p.valor_numerico !== null) return String(p.valor_numerico);
    if (p.valor_fecha) return p.valor_fecha;
    if (p.valor_texto) return p.valor_texto;
    if (p.valor_json != null) return JSON.stringify(p.valor_json);
    return '-';
  };

  const rowCanMutate = (row: Parametro) => canMutateParametroRow(row, canManageGlobal);

  return (
    <OrgPageLayout>
      <OrgHybridPrecedenceHint />
      <OrgParametroHybridTabs activeTab={activeTab} onChange={setActiveTab} />
      <OrgCompanyToolbar
        actions={
          canCreateOnTab ? (
            <Button
              onClick={openCreate}
              disabled={!canQueryHybridScoped || discardPending !== null}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Plus className="h-4 w-4 mr-2" /> Crear parámetro
            </Button>
          ) : null
        }
      >
        <select
          value={moduloFilter}
          onChange={(e) => setModuloFilter(e.target.value)}
          className="shrink-0 px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
        >
          <option value="">Todos los módulos</option>
          <option value={MODULO_ORG}>ORG</option>
          <option value="INV">INV</option>
          <option value="SLS">SLS</option>
        </select>
        <OrgToolbarSearch
          value={buscar}
          onChange={setBuscar}
          placeholder="Código, nombre..."
          aria-label="Buscar parámetros"
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
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Módulo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Alcance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Valor</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {list.length === 0 ? (
                <IamTableEmptyState
                  colSpan={TABLE_COLSPAN}
                  icon={Settings}
                  title={
                    hasSearch
                      ? 'No se encontraron parámetros que coincidan con la búsqueda.'
                      : includeInactive
                        ? 'No hay parámetros registrados.'
                        : 'No hay parámetros activos para este filtro.'
                  }
                  description={
                    hasSearch ? 'Pruebe con otro término o limpie el filtro de búsqueda.' : undefined
                  }
                  actionLabel={
                    !hasSearch && !includeInactive && canCreateOnTab ? 'Crear parámetro' : undefined
                  }
                  onAction={!hasSearch && !includeInactive && canCreateOnTab ? openCreate : undefined}
                  actionDisabled={discardPending !== null}
                />
              ) : (
                list.map((row) => (
                  <tr key={row.parametro_id} className="hover:bg-overlay dark:hover:bg-overlay">
                    <td className="px-4 py-3 text-sm font-medium text-text-base">{row.modulo_codigo}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.codigo_parametro}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.nombre_parametro}</td>
                    <td className="px-4 py-3 text-sm">
                      <OrgParametroAlcanceBadge row={row} tab={activeTab} />
                    </td>
                    <td className="px-4 py-3 text-sm text-text-soft">{row.tipo_dato}</td>
                    <td className="px-4 py-3 text-sm text-text-base max-w-xs truncate">{valorDisplay(row)}</td>
                    <td className="px-4 py-3 text-center">
                      {row.es_activo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">Activo</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error">Inactivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex items-center justify-center gap-1">
                      {canEditar && rowCanMutate(row) && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)} disabled={discardPending !== null} className="text-brand-primary hover:text-brand-primary/80" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canEditar && rowCanMutate(row) && !row.es_activo && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReactivar(row)}
                          disabled={!!reactivatingId}
                          className="text-success hover:text-success/80"
                          title="Reactivar"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {canEliminar && rowCanMutate(row) && (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)} disabled={discardPending !== null} className="text-error hover:text-error hover:bg-error/10" title="Desactivar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
        entityLabel="el parámetro"
        onClose={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget && discardPending === null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Desactivar parámetro"
        message={deleteTarget ? `¿Desactivar parámetro '${deleteTarget.nombre_parametro}'? Podrá reactivarlo después.` : ''}
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
      />

      <Dialog open={createOpen} onOpenChange={handleCreateDialogOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0" {...orgDialogGuardProps}>
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Crear parámetro</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5 overflow-y-auto">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <div><Label>Módulo *</Label><input type="text" value={form.modulo_codigo} onChange={(e) => setForm((p) => ({ ...p, modulo_codigo: e.target.value }))} className={`${inputClass} uppercase`} required /></div>
                  <div><Label>Código parámetro *</Label><input type="text" value={form.codigo_parametro} onChange={(e) => setForm((p) => ({ ...p, codigo_parametro: e.target.value }))} className={`${inputClass} uppercase`} required /></div>
                  <div><Label>Nombre parámetro *</Label><input type="text" value={form.nombre_parametro} onChange={(e) => setForm((p) => ({ ...p, nombre_parametro: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Tipo dato *</Label><select value={form.tipo_dato} onChange={(e) => setForm((p) => ({ ...p, tipo_dato: e.target.value as Parametro['tipo_dato'] }))} className={inputClass}>{TIPOS_DATO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                  {renderCreateValor()}
                </div>
              </FormSection>
              <FormSection title="Alcance y descripción">
                <div className="space-y-3">
                  <OrgParametroAlcanceField
                    mode="create"
                    value={createAlcance}
                    onChange={setCreateAlcance}
                    forceAlcance={createForceAlcance}
                  />
                  <div><Label>Descripción</Label><input type="text" value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} placeholder="Uso del parámetro" /></div>
                </div>
              </FormSection>
              <FormSection title="Opciones avanzadas">
                <div className="space-y-3">
                  <div><Label>Valor por defecto (texto)</Label><input type="text" value={form.valor_defecto ?? ''} onChange={(e) => setForm((p) => ({ ...p, valor_defecto: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2"><input type="checkbox" id="param_create_editable" checked={form.es_editable ?? true} onChange={(e) => setForm((p) => ({ ...p, es_editable: e.target.checked }))} className="rounded border border-border-base" /><Label htmlFor="param_create_editable">Editable</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" id="param_create_obligatorio" checked={form.es_obligatorio ?? false} onChange={(e) => setForm((p) => ({ ...p, es_obligatorio: e.target.checked }))} className="rounded border border-border-base" /><Label htmlFor="param_create_obligatorio">Obligatorio</Label></div>
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
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Editar parámetro</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5 overflow-y-auto">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <div><Label>Código</Label><input type="text" value={editForm.codigo_parametro ?? ''} readOnly className="mt-1 w-full px-3 py-2 border border-border-base rounded-md bg-subtle text-text-base text-sm uppercase" /></div>
                  <div><Label>Nombre *</Label><input type="text" value={editForm.nombre_parametro ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre_parametro: e.target.value }))} className={inputClass} required /></div>
                  {renderEditValor()}
                </div>
              </FormSection>
              <FormSection title="Alcance y descripción">
                <div className="space-y-3">
                  <OrgParametroAlcanceField mode="edit" value={null} row={editing} />
                  <div><Label>Descripción</Label><input type="text" value={editForm.descripcion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Opciones avanzadas">
                <div className="space-y-3">
                  <div><Label>Valor por defecto (texto)</Label><input type="text" value={editForm.valor_defecto ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, valor_defecto: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2"><input type="checkbox" id="param_edit_editable" checked={editForm.es_editable ?? true} onChange={(e) => setEditForm((p) => ({ ...p, es_editable: e.target.checked }))} className="rounded border border-border-base" /><Label htmlFor="param_edit_editable">Editable</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" id="param_edit_obligatorio" checked={editForm.es_obligatorio ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_obligatorio: e.target.checked }))} className="rounded border border-border-base" /><Label htmlFor="param_edit_obligatorio">Obligatorio</Label></div>
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
