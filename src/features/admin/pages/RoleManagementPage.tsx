// src/features/admin/pages/RoleManagementPage.tsx

import React, { useState, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Edit3, Plus, KeyRound, Trash2, RotateCcw, Shield } from 'lucide-react';

import { createRol, updateRol, deactivateRol, reactivateRol } from '../services/rol.service';
import { Rol, RolCreateData, RolUpdateData } from '../types/rol.types';

import { getErrorMessage } from '@/core/services/error.service';
import { useAuth } from '@/shared/context/AuthContext';
import { useDebouncedSearch } from '@/core/list';
import { ErpPagination } from '@/shared/components/erp-list';
import { OrgCompanyToolbar } from '@/features/org/components/OrgCompanyToolbar';
import { OrgToolbarSearch } from '@/features/org/components/OrgToolbarSearch';
import { InvPageLayout } from '@/features/inv/components/InvPageLayout';
import { InvTableSkeleton } from '@/features/inv/components/InvTableSkeleton';
import { Button } from '@/shared/components/ui/button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import RolePermissionsManager from '../components/RolePermissionsManager';
import {
  IamTableEmptyState,
  RoleCreateDialog,
  RoleEditDialog,
  RoleStatsCell,
} from '../components/iam';
import {
  buildEditRoleFormSnapshot,
  isCreateRoleFormDirty,
  isEditRoleFormDirty,
  type EditRoleFormSnapshot,
} from '../utils/iam-role-form.utils';
import { useRoleUserCounts } from '../hooks/useRoleUserCounts';
import {
  invalidateRolePermissionCountsCache,
  useRolePermissionCounts,
} from '../hooks/useRolePermissionCounts';
import { useRolesList, invalidateRolesListQueries } from '../hooks/useRolesList';
import { scheduleModalStackValidation } from '../utils/iam-modal-stack-validation';

type DiscardPending = 'create' | 'edit' | null;

type PermissionsTargetRol = {
  id: string;
  nombre: string;
} | null;

const TABLE_COLSPAN = 6;
const LIMIT_OPTIONS = [10, 25, 50] as const;

const initialCreateFormData: RolCreateData = {
  nombre: '',
  descripcion: '',
  es_activo: true,
};

const initialEditFormData: RolUpdateData = {
  nombre: '',
  descripcion: '',
  es_activo: true,
};

type FormErrors = Record<string, string | undefined>;

const RoleManagementPage: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const search = useDebouncedSearch();
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const listEnabled = !authLoading && isAuthenticated;
  const activeFilter = mostrarInactivos ? 'all' : 'active';

  const rolesList = useRolesList({
    debouncedSearch: search.debouncedValue || undefined,
    activeFilter,
    enabled: listEnabled,
  });

  const roles = rolesList.items;
  const listError = rolesList.isError
    ? getErrorMessage(rolesList.error).message || 'Ocurrió un error al cargar los perfiles.'
    : null;

  const showInitialSkeleton = (authLoading || rolesList.isLoading) && roles.length === 0;
  const listIsRefreshing = rolesList.isFetching && roles.length > 0;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRolFormData, setNewRolFormData] = useState<RolCreateData>(initialCreateFormData);
  const [createFormErrors, setCreateFormErrors] = useState<FormErrors>({});
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRol, setEditingRol] = useState<Rol | null>(null);
  const [editFormData, setEditFormData] = useState<RolUpdateData>(initialEditFormData);
  const [editFormErrors, setEditFormErrors] = useState<FormErrors>({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editFormSnapshot, setEditFormSnapshot] = useState<EditRoleFormSnapshot | null>(null);

  const [discardPending, setDiscardPending] = useState<DiscardPending>(null);

  const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState(false);
  const [deactivatingRol, setDeactivatingRol] = useState<Rol | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [reactivarTarget, setReactivarTarget] = useState<Rol | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [permissionsTargetRol, setPermissionsTargetRol] = useState<PermissionsTargetRol>(null);
  const [permissionCountsRefreshKey, setPermissionCountsRefreshKey] = useState(0);

  const pageActionsLocked = discardPending !== null;
  const metricsEnabled = listEnabled && !rolesList.isLoading && !listError;

  const visibleRolIds = useMemo(() => roles.map((r) => r.rol_id), [roles]);

  const { counts: userCountsByRol, loading: loadingUserCounts, unavailable: userCountsUnavailable } =
    useRoleUserCounts(metricsEnabled);

  const { counts: permissionCountsByRol, loading: loadingPermissionCounts } = useRolePermissionCounts(
    visibleRolIds,
    metricsEnabled,
    permissionCountsRefreshKey,
  );

  const isCreateDialogDirty = useMemo(
    () => isCreateRoleFormDirty(newRolFormData),
    [newRolFormData],
  );

  const isEditDialogDirty = useMemo(
    () => isEditRoleFormDirty(editFormData, editFormSnapshot),
    [editFormData, editFormSnapshot],
  );

  const handleOpenPermissionsModal = useCallback((rol: Rol) => {
    setPermissionsTargetRol({ id: rol.rol_id, nombre: rol.nombre });
    setIsPermissionsModalOpen(true);
  }, []);

  const refreshPermissionMetrics = useCallback((rolId: string) => {
    invalidateRolePermissionCountsCache(rolId);
    setPermissionCountsRefreshKey((key) => key + 1);
  }, []);

  const handleClosePermissionsModal = () => {
    if (permissionsTargetRol) {
      refreshPermissionMetrics(permissionsTargetRol.id);
    }
    setIsPermissionsModalOpen(false);
    setTimeout(() => {
      setPermissionsTargetRol(null);
    }, 150);
  };

  const handlePermissionsUpdate = () => {
    if (permissionsTargetRol) {
      refreshPermissionMetrics(permissionsTargetRol.id);
    }
  };

  const handleOpenCreateModal = () => {
    setDiscardPending(null);
    setNewRolFormData(initialCreateFormData);
    setCreateFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    if (!isSubmittingCreate) {
      setIsCreateModalOpen(false);
      setNewRolFormData(initialCreateFormData);
      setCreateFormErrors({});
      setDiscardPending((pending) => (pending === 'create' ? null : pending));
      scheduleModalStackValidation('role-create-modal-closed');
    }
  };

  const handleRequestCloseCreate = () => {
    if (isSubmittingCreate) return;
    if (isCreateDialogDirty) {
      setIsCreateModalOpen(false);
      setDiscardPending('create');
      scheduleModalStackValidation('role-create-request-close-dirty');
      return;
    }
    handleCloseCreateModal();
  };

  const handleOpenEditModal = (rol: Rol) => {
    setDiscardPending(null);
    const form: RolUpdateData = {
      nombre: rol.nombre || '',
      descripcion: rol.descripcion || '',
      es_activo: rol.es_activo,
    };
    setEditingRol(rol);
    setEditFormData(form);
    setEditFormSnapshot(buildEditRoleFormSnapshot(form));
    setEditFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    if (!isSubmittingEdit) {
      setIsEditModalOpen(false);
      setEditingRol(null);
      setEditFormSnapshot(null);
      setEditFormData(initialEditFormData);
      setEditFormErrors({});
      setDiscardPending((pending) => (pending === 'edit' ? null : pending));
      scheduleModalStackValidation('role-edit-modal-closed');
    }
  };

  const handleRequestCloseEdit = () => {
    if (isSubmittingEdit) return;
    if (isEditDialogDirty) {
      setIsEditModalOpen(false);
      setDiscardPending('edit');
      scheduleModalStackValidation('role-edit-request-close-dirty');
      return;
    }
    handleCloseEditModal();
  };

  const handleDiscardCancel = () => {
    const pending = discardPending;
    setDiscardPending(null);
    if (pending === 'create') {
      setIsCreateModalOpen(true);
    } else if (pending === 'edit') {
      setIsEditModalOpen(true);
    }
    scheduleModalStackValidation('role-discard-cancel-resume');
  };

  const handleDiscardConfirm = () => {
    const pending = discardPending;
    setDiscardPending(null);
    if (pending === 'create') {
      handleCloseCreateModal();
    } else if (pending === 'edit') {
      handleCloseEditModal();
    }
    scheduleModalStackValidation('role-discard-confirmed');
  };

  const handleNewRolChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setNewRolFormData((prev) => ({ ...prev, [name]: value }));
    if (createFormErrors[name]) {
      setCreateFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleEditRolChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    if (editFormErrors[name]) {
      setEditFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleEditActiveChange = (checked: boolean) => {
    setEditFormData((prev) => ({ ...prev, es_activo: checked }));
  };

  const validateCreateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;
    if (!newRolFormData.nombre.trim()) {
      errors.nombre = 'El nombre del perfil es requerido.';
      isValid = false;
    }
    setCreateFormErrors(errors);
    return isValid;
  };

  const validateEditForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;
    if (!editFormData.nombre?.trim()) {
      errors.nombre = 'El nombre del perfil es requerido.';
      isValid = false;
    }
    setEditFormErrors(errors);
    return isValid;
  };

  const handleCreateRolSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateCreateForm()) return;

    setIsSubmittingCreate(true);
    try {
      const dataToSend: RolCreateData = {
        nombre: newRolFormData.nombre.trim(),
        descripcion: newRolFormData.descripcion?.trim() || null,
        es_activo: true,
      };

      const created = await createRol(dataToSend);
      handleCloseCreateModal();
      search.clear();
      rolesList.setPage(1);
      await invalidateRolesListQueries(queryClient);

      toast.success('Perfil creado correctamente.');

      toast(
        (t) => (
          <div className="flex flex-col gap-2 max-w-sm">
            <p className="text-sm text-text-base">¿Desea configurar los permisos de este perfil ahora?</p>
            <button
              type="button"
              className="text-sm font-medium text-brand-primary hover:underline text-left"
              onClick={() => {
                toast.dismiss(t.id);
                handleOpenPermissionsModal(created);
              }}
            >
              Configurar permisos
            </button>
          </div>
        ),
        { duration: 8000 },
      );
    } catch (err) {
      console.error('Error creating rol:', err);
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al crear el perfil.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleEditRolSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingRol || !validateEditForm()) return;

    setIsSubmittingEdit(true);
    try {
      const dataToUpdate: RolUpdateData = {
        nombre: editFormData.nombre?.trim(),
        descripcion: editFormData.descripcion?.trim() || null,
        es_activo: editFormData.es_activo,
      };
      await updateRol(editingRol.rol_id, dataToUpdate);
      handleCloseEditModal();
      toast.success('Perfil actualizado correctamente.');
      await invalidateRolesListQueries(queryClient);
    } catch (err) {
      console.error('Error updating rol:', err);
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al actualizar el perfil.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenDeactivateConfirm = (rol: Rol) => {
    setDeactivatingRol(rol);
    setIsDeactivateConfirmOpen(true);
  };

  const handleCloseDeactivateConfirm = () => {
    if (!isDeactivating) {
      setIsDeactivateConfirmOpen(false);
      setDeactivatingRol(null);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingRol) return;
    setIsDeactivating(true);
    try {
      await deactivateRol(deactivatingRol.rol_id);
      handleCloseDeactivateConfirm();
      toast.success('Perfil desactivado correctamente.');
      await invalidateRolesListQueries(queryClient);
    } catch (err) {
      console.error('Error deactivating rol:', err);
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al desactivar el perfil.');
    } finally {
      setIsDeactivating(false);
    }
  };

  const confirmarReactivar = async () => {
    if (!reactivarTarget) return;
    setIsReactivating(true);
    try {
      await reactivateRol(reactivarTarget.rol_id);
      setReactivarTarget(null);
      toast.success('Perfil reactivado correctamente.');
      await invalidateRolesListQueries(queryClient);
    } catch (err) {
      console.error('Error reactivating rol:', err);
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al reactivar el perfil.');
    } finally {
      setIsReactivating(false);
    }
  };

  const hasSearch = search.hasSearch;

  const userCountTooltip = userCountsUnavailable
    ? 'Hay demasiados usuarios para calcular en el navegador. Use la lista de usuarios para revisar asignaciones.'
    : 'Usuarios con este perfil asignado';

  const emptyTitle = hasSearch
    ? 'No se encontraron perfiles que coincidan con la búsqueda.'
    : mostrarInactivos
      ? 'No hay perfiles registrados.'
      : 'No hay perfiles activos.';

  const emptyDescription = hasSearch
    ? 'Pruebe con otro término o limpie el filtro de búsqueda.'
    : mostrarInactivos
      ? undefined
      : 'Cree el primer perfil para asignarlo a los usuarios.';

  return (
    <InvPageLayout>
      <OrgCompanyToolbar
        actions={
          <Button
            type="button"
            onClick={handleOpenCreateModal}
            disabled={authLoading || !isAuthenticated || pageActionsLocked}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white gap-2"
          >
            <Plus className="h-5 w-5" />
            Crear perfil
          </Button>
        }
      >
        <OrgToolbarSearch
          value={search.inputValue}
          onChange={search.setInputValue}
          placeholder="Buscar por nombre o descripción…"
          aria-label="Buscar perfiles"
          disabled={pageActionsLocked}
        />
        <label className="flex shrink-0 items-center gap-1.5 text-sm text-text-soft cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mostrarInactivos}
            onChange={(e) => setMostrarInactivos(e.target.checked)}
            disabled={pageActionsLocked}
            className="rounded border border-border-base text-brand-primary focus:ring-brand-primary"
            aria-label="Ver inactivos"
          />
          Ver inactivos
        </label>
      </OrgCompanyToolbar>

      {listError && !rolesList.isLoading ? (
        <div className="mb-4 rounded-lg border border-border-base bg-surface p-6">
          <p className="text-error bg-error/10 p-4 rounded-lg mb-4">{listError}</p>
          <button
            type="button"
            onClick={() => void invalidateRolesListQueries(queryClient)}
            disabled={rolesList.isFetching}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {!listError ? (
        <div className="bg-surface rounded-lg shadow-sm border border-border-base overflow-hidden">
          <div
            className={`transition-opacity duration-150 ${listIsRefreshing ? 'opacity-70' : 'opacity-100'}`}
            aria-busy={listIsRefreshing}
          >
            {showInitialSkeleton ? (
              <InvTableSkeleton columns={TABLE_COLSPAN} />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border-base">
                    <thead className="bg-subtle">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                          Descripción
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-text-soft uppercase tracking-wider">
                          Usuarios
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-text-soft uppercase tracking-wider">
                          Permisos
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-text-soft uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-text-soft uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-surface divide-y divide-border-base">
                      {roles.length > 0 ? (
                        roles.map((rol) => {
                          const permStats = permissionCountsByRol[rol.rol_id];
                          const permTooltip =
                            permStats !== undefined
                              ? `${permStats.negocio} acciones · ${permStats.menu} pantallas`
                              : 'No se pudieron cargar los permisos';

                          return (
                            <tr key={rol.rol_id} className="hover:bg-overlay/50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-base">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>{rol.nombre}</span>
                                  {rol.codigo_rol ? (
                                    <span
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium rounded bg-subtle text-text-soft"
                                      title={`Código: ${rol.codigo_rol}`}
                                    >
                                      <Shield className="h-3 w-3" aria-hidden />
                                      Sistema
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-text-soft max-w-md">
                                <p className="line-clamp-2" title={rol.descripcion || undefined}>
                                  {rol.descripcion || '—'}
                                </p>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                <RoleStatsCell
                                  loading={loadingUserCounts}
                                  unavailable={userCountsUnavailable}
                                  value={userCountsUnavailable ? null : userCountsByRol[rol.rol_id] ?? 0}
                                  tooltip={userCountTooltip}
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                <RoleStatsCell
                                  loading={loadingPermissionCounts}
                                  value={permStats?.total}
                                  tooltip={permTooltip}
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    rol.es_activo ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                                  }`}
                                >
                                  {rol.es_activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <div className="inline-flex items-center justify-center gap-1">
                                  {rol.es_activo ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditModal(rol)}
                                        className="text-brand-primary hover:text-brand-primary/80 p-1 rounded hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Editar perfil"
                                        disabled={
                                          authLoading || !isAuthenticated || pageActionsLocked
                                        }
                                      >
                                        <Edit3 className="h-4 w-4" />
                                        <span className="sr-only">Editar perfil</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenPermissionsModal(rol)}
                                        className="text-info hover:text-info/80 p-1 rounded hover:bg-overlay inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Gestionar permisos"
                                        disabled={
                                          authLoading || !isAuthenticated || pageActionsLocked
                                        }
                                      >
                                        <KeyRound className="h-4 w-4 shrink-0" />
                                        <span className="hidden md:inline text-xs">Permisos</span>
                                        <span className="sr-only">Gestionar permisos</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenDeactivateConfirm(rol)}
                                        className="text-error hover:text-error/80 p-1 rounded hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Desactivar perfil"
                                        disabled={
                                          authLoading || !isAuthenticated || pageActionsLocked
                                        }
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Desactivar perfil</span>
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setReactivarTarget(rol)}
                                      className="text-success hover:text-success/80 p-1 rounded hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Reactivar perfil"
                                      disabled={
                                        authLoading || !isAuthenticated || pageActionsLocked
                                      }
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                      <span className="sr-only">Reactivar perfil</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <IamTableEmptyState
                          colSpan={TABLE_COLSPAN}
                          icon={Plus}
                          title={emptyTitle}
                          description={emptyDescription}
                          actionLabel={hasSearch || mostrarInactivos ? undefined : 'Crear perfil'}
                          onAction={
                            hasSearch || mostrarInactivos ? undefined : handleOpenCreateModal
                          }
                          actionDisabled={authLoading || !isAuthenticated || pageActionsLocked}
                        />
                      )}
                    </tbody>
                  </table>
                </div>

                {rolesList.pagination ? (
                  <ErpPagination
                    pagination={rolesList.pagination}
                    onPageChange={rolesList.setPage}
                    onLimitChange={rolesList.setLimit}
                    limitOptions={LIMIT_OPTIONS}
                    disabled={rolesList.isFetching || pageActionsLocked}
                  />
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}

      <RoleCreateDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onRequestClose={handleRequestCloseCreate}
        formData={newRolFormData}
        formErrors={createFormErrors}
        isSubmitting={isSubmittingCreate}
        onFieldChange={handleNewRolChange}
        onSubmit={handleCreateRolSubmit}
      />

      {editingRol ? (
        <RoleEditDialog
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onRequestClose={handleRequestCloseEdit}
          profileName={editingRol.nombre}
          formData={editFormData}
          formErrors={editFormErrors}
          isSubmitting={isSubmittingEdit}
          onFieldChange={handleEditRolChange}
          onActiveChange={handleEditActiveChange}
          onSubmit={handleEditRolSubmit}
        />
      ) : null}

      <ConfirmDialog
        isOpen={discardPending !== null}
        onClose={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
        title="Descartar cambios"
        message={
          discardPending === 'create'
            ? 'Hay cambios sin guardar. ¿Desea cerrar sin crear el perfil?'
            : discardPending === 'edit'
              ? 'Hay cambios sin guardar. ¿Desea cerrar sin guardar?'
              : ''
        }
        confirmText="Sí, descartar"
        cancelText="Seguir editando"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={isDeactivateConfirmOpen}
        onClose={handleCloseDeactivateConfirm}
        onConfirm={handleConfirmDeactivate}
        title="Desactivar perfil"
        message={
          deactivatingRol
            ? `¿Está seguro de que desea desactivar el perfil «${deactivatingRol.nombre}»? Los usuarios asignados pueden perder acceso según la configuración del sistema.`
            : ''
        }
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="danger"
        loading={isDeactivating}
      />

      <ConfirmDialog
        isOpen={!!reactivarTarget && discardPending === null}
        onClose={() => setReactivarTarget(null)}
        onConfirm={() => void confirmarReactivar()}
        title="Reactivar perfil"
        message={
          reactivarTarget
            ? `¿Reactivar perfil '${reactivarTarget.nombre}'? Volverá a estar disponible.`
            : ''
        }
        confirmText="Reactivar"
        cancelText="Cancelar"
        variant="info"
        loading={isReactivating}
      />

      {permissionsTargetRol ? (
        <RolePermissionsManager
          isOpen={isPermissionsModalOpen}
          rolId={permissionsTargetRol.id}
          rolName={permissionsTargetRol.nombre}
          onClose={handleClosePermissionsModal}
          onPermissionsUpdate={handlePermissionsUpdate}
        />
      ) : null}
    </InvPageLayout>
  );
};

export default RoleManagementPage;
