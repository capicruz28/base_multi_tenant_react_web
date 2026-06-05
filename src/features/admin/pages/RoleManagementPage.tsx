// src/features/admin/pages/RoleManagementPage.tsx

import React, { useState, useEffect, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Edit3, Plus, KeyRound, EyeOff, Eye, Shield } from 'lucide-react';

import { getRoles, createRol, updateRol, deactivateRol, reactivateRol } from '../services/rol.service';
import { Rol, PaginatedRolResponse, RolCreateData, RolUpdateData } from '../types/rol.types';

import { getErrorMessage } from '@/core/services/error.service';
import { useAuth } from '@/shared/context/AuthContext';
import { useDebounce } from '@/core/utils/debounce';
import { Button } from '@/shared/components/ui/button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import RolePermissionsManager from '../components/RolePermissionsManager';
import {
  IamSearchInput,
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
import { scheduleModalStackValidation } from '../utils/iam-modal-stack-validation';

type DiscardPending = 'create' | 'edit' | null;

type PermissionsTargetRol = {
  id: string;
  nombre: string;
} | null;

const TABLE_COLSPAN = 6;
const LIMIT_PER_PAGE = 10;

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

  const [roles, setRoles] = useState<Rol[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRoles, setTotalRoles] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

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

  const [isReactivateConfirmOpen, setIsReactivateConfirmOpen] = useState(false);
  const [reactivatingRol, setReactivatingRol] = useState<Rol | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [permissionsTargetRol, setPermissionsTargetRol] = useState<PermissionsTargetRol>(null);
  const [permissionCountsRefreshKey, setPermissionCountsRefreshKey] = useState(0);

  const metricsEnabled = !authLoading && isAuthenticated && !isLoading && !error;

  const visibleRolIds = useMemo(() => roles.map((r) => r.rol_id), [roles]);

  const { counts: userCountsByRol, loading: loadingUserCounts, unavailable: userCountsUnavailable } =
    useRoleUserCounts(metricsEnabled);

  const { counts: permissionCountsByRol, loading: loadingPermissionCounts } = useRolePermissionCounts(
    visibleRolIds,
    metricsEnabled,
    permissionCountsRefreshKey,
  );

  const fetchRoles = useCallback(async (page: number, search: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data: PaginatedRolResponse = await getRoles(page, LIMIT_PER_PAGE, search || undefined);
      setRoles(data.roles);
      setTotalPages(data.total_paginas);
      setTotalRoles(data.total_roles);
      setCurrentPage(data.pagina_actual);
    } catch (err) {
      console.error('Error in fetchRoles:', err);
      const errorData = getErrorMessage(err);
      const message = errorData.message || 'Ocurrió un error al cargar los perfiles.';
      setError(message);
      setRoles([]);
      setTotalPages(1);
      setTotalRoles(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const pageToFetch = debouncedSearchTerm !== searchTerm ? 1 : currentPage;
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1);
    }
    fetchRoles(pageToFetch, debouncedSearchTerm);
  }, [debouncedSearchTerm, currentPage, fetchRoles, searchTerm, authLoading, isAuthenticated]);

  const isCreateDialogDirty = useMemo(
    () => isCreateRoleFormDirty(newRolFormData),
    [newRolFormData],
  );

  const isEditDialogDirty = useMemo(
    () => isEditRoleFormDirty(editFormData, editFormSnapshot),
    [editFormData, editFormSnapshot],
  );

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

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
      setSearchTerm('');
      fetchRoles(1, '');

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
      fetchRoles(currentPage, debouncedSearchTerm);
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
      fetchRoles(currentPage, debouncedSearchTerm);
    } catch (err) {
      console.error('Error deactivating rol:', err);
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al desactivar el perfil.');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleOpenReactivateConfirm = (rol: Rol) => {
    setReactivatingRol(rol);
    setIsReactivateConfirmOpen(true);
  };

  const handleCloseReactivateConfirm = () => {
    if (!isReactivating) {
      setIsReactivateConfirmOpen(false);
      setReactivatingRol(null);
    }
  };

  const handleConfirmReactivate = async () => {
    if (!reactivatingRol) return;
    setIsReactivating(true);
    try {
      await reactivateRol(reactivatingRol.rol_id);
      handleCloseReactivateConfirm();
      toast.success('Perfil reactivado correctamente.');
      fetchRoles(currentPage, debouncedSearchTerm);
    } catch (err) {
      console.error('Error reactivating rol:', err);
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al reactivar el perfil.');
    } finally {
      setIsReactivating(false);
    }
  };

  const showTableSpinner = authLoading || isLoading;
  const hasSearch = searchTerm.trim().length > 0;

  const userCountTooltip = userCountsUnavailable
    ? 'Hay demasiados usuarios para calcular en el navegador. Use la lista de usuarios para revisar asignaciones.'
    : 'Usuarios con este perfil asignado';

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <IamSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por nombre o descripción…"
          className="sm:w-1/3"
          aria-label="Buscar perfiles"
        />
        <Button
          type="button"
          onClick={handleOpenCreateModal}
          disabled={authLoading || !isAuthenticated || discardPending !== null}
          className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary-hover text-white gap-2"
        >
          <Plus className="h-5 w-5" />
          Crear perfil
        </Button>
      </div>

      {showTableSpinner && (
        <div className="flex justify-center items-center py-10">
          <Loader className="animate-spin h-8 w-8 text-brand-primary" />
          <p className="ml-3 text-text-soft">
            {authLoading ? 'Verificando sesión…' : 'Cargando perfiles…'}
          </p>
        </div>
      )}

      {error && !showTableSpinner && (
        <p className="text-center text-error bg-error/10 p-3 rounded-md">{error}</p>
      )}

      {!showTableSpinner && !error && (
        <div className="overflow-x-auto shadow-md rounded-lg border border-border-base">
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
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(rol)}
                            className="text-brand-primary hover:text-brand-primary/80 p-1 rounded hover:bg-overlay"
                            title="Editar perfil"
                            disabled={authLoading || !isAuthenticated || discardPending !== null}
                          >
                            <Edit3 className="h-4 w-4" />
                            <span className="sr-only">Editar perfil</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenPermissionsModal(rol)}
                            className="text-info hover:text-info/80 p-1 rounded hover:bg-overlay inline-flex items-center gap-1"
                            title="Gestionar permisos"
                            disabled={authLoading || !isAuthenticated || discardPending !== null}
                          >
                            <KeyRound className="h-4 w-4 shrink-0" />
                            <span className="hidden md:inline text-xs">Permisos</span>
                            <span className="sr-only">Gestionar permisos</span>
                          </button>
                          {rol.es_activo ? (
                            <button
                              type="button"
                              onClick={() => handleOpenDeactivateConfirm(rol)}
                              className="text-error hover:text-error/80 p-1 rounded hover:bg-overlay"
                              title="Desactivar perfil"
                              disabled={authLoading || !isAuthenticated || discardPending !== null}
                            >
                              <EyeOff className="h-4 w-4" />
                              <span className="sr-only">Desactivar perfil</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenReactivateConfirm(rol)}
                              className="text-success hover:text-success/80 p-1 rounded hover:bg-overlay"
                              title="Reactivar perfil"
                              disabled={authLoading || !isAuthenticated || discardPending !== null}
                            >
                              <Eye className="h-4 w-4" />
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
                  title={
                    hasSearch
                      ? 'No se encontraron perfiles que coincidan con la búsqueda.'
                      : 'No hay perfiles de acceso registrados.'
                  }
                  description={
                    hasSearch
                      ? 'Pruebe con otro término o limpie el filtro de búsqueda.'
                      : 'Cree el primer perfil para asignarlo a los usuarios.'
                  }
                  actionLabel={hasSearch ? undefined : 'Crear perfil'}
                  onAction={hasSearch ? undefined : handleOpenCreateModal}
                  actionDisabled={authLoading || !isAuthenticated || discardPending !== null}
                />
              )}
            </tbody>
          </table>
        </div>
      )}

      {!showTableSpinner && !error && totalRoles > LIMIT_PER_PAGE && (
        <div className="py-4 flex items-center justify-between border-t border-border-base mt-4">
          <p className="text-sm text-text-soft">
            Mostrando <span className="font-medium">{(currentPage - 1) * LIMIT_PER_PAGE + 1}</span>
            {' a '}
            <span className="font-medium">{Math.min(currentPage * LIMIT_PER_PAGE, totalRoles)}</span>
            {' de '}
            <span className="font-medium">{totalRoles}</span> resultados
          </p>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginación">
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border-base bg-surface text-sm font-medium text-text-soft hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Anterior</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <span className="relative inline-flex items-center px-4 py-2 border border-border-base bg-surface text-sm font-medium text-text-base">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border-base bg-surface text-sm font-medium text-text-soft hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Siguiente</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      )}

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
        confirmText="Sí, desactivar"
        cancelText="Cancelar"
        variant="danger"
        loading={isDeactivating}
      />

      <ConfirmDialog
        isOpen={isReactivateConfirmOpen}
        onClose={handleCloseReactivateConfirm}
        onConfirm={handleConfirmReactivate}
        title="Reactivar perfil"
        message={
          reactivatingRol
            ? `¿Está seguro de que desea reactivar el perfil «${reactivatingRol.nombre}»?`
            : ''
        }
        confirmText="Sí, reactivar"
        cancelText="Cancelar"
        variant="warning"
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
    </div>
  );
};

export default RoleManagementPage;
