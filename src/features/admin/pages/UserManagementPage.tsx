// src/features/admin/pages/UserManagementPage.tsx

import React, { useState, useEffect, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Edit3, Trash2, RotateCcw, UserPlus, Users, KeyRound } from 'lucide-react';

import {
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  assignRoleToUser,
  revokeRoleFromUser,
} from '../services/usuario.service';
import { getAllActiveRoles } from '../services/rol.service';

import { UserWithRoles, UserFormData, UserUpdateData, AdminPasswordResetResponse } from '../types/usuario.types';
import { Rol } from '../types/rol.types';

import { getErrorMessage } from '@/core/services/error.service';
import { usePermission } from '@/core/auth/PermissionContext';
import { useAuth } from '@/shared/context/AuthContext';
import { useDebouncedSearch } from '@/core/list';
import { ErpPagination } from '@/shared/components/erp-list';
import { OrgCompanyToolbar } from '@/features/org/components/OrgCompanyToolbar';
import { OrgToolbarSearch } from '@/features/org/components/OrgToolbarSearch';
import { InvPageLayout } from '@/features/inv/components/InvPageLayout';
import { InvTableSkeleton } from '@/features/inv/components/InvTableSkeleton';
import { Button } from '@/shared/components/ui/button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import {
  IamTableEmptyState,
  UserCreateDialog,
  UserEditDialog,
  UserPasswordResetRevealDialog,
} from '../components/iam';
import { ADMIN_USUARIO_PERMISSIONS } from '../constants/admin-usuario.permissions';
import {
  buildResetConfirmMessage,
  canShowAdminPasswordReset,
  redactPasswordResetResponseForLog,
} from '../utils/iam-user-password-reset.utils';
import { useResetUserPassword } from '../hooks/useResetUserPassword';
import {
  buildEditUserFormSnapshot,
  isCreateUserFormDirty,
  isEditUserFormDirty,
  type EditUserFormSnapshot,
} from '../utils/iam-user-form.utils';
import {
  extractAxiosOperationEvidence,
  logIamUserOperation,
} from '../utils/iam-user-operation-log';
import { useUsersList, invalidateUsersListQueries } from '../hooks/useUsersList';
import { scheduleModalStackValidation } from '../utils/iam-modal-stack-validation';

type DiscardPending = 'create' | 'edit' | null;

const TABLE_COLSPAN = 6;
const LIMIT_OPTIONS = [10, 25, 50] as const;

const initialCreateFormData: UserFormData = {
  nombre_usuario: '',
  correo: '',
  contrasena: '',
  nombre: '',
  apellido: '',
};

const initialEditFormData: UserUpdateData = {
  correo: '',
  nombre: '',
  apellido: '',
  es_activo: true,
};

type FormErrors = Record<string, string | undefined>;

interface ResetRevealState {
  result: AdminPasswordResetResponse;
  targetDisplayName: string;
  isInactiveUser: boolean;
}

function formatUserDisplayName(user: UserWithRoles): string {
  const full = `${user.nombre || ''} ${user.apellido || ''}`.trim();
  return full || user.nombre_usuario;
}

function resolveSessionClienteId(
  clienteInfo: { cliente_id?: string } | null,
  user: { cliente_id?: string } | null,
): string | null {
  const fromClienteInfo = clienteInfo?.cliente_id?.trim();
  if (fromClienteInfo) return fromClienteInfo;
  const fromUser = user?.cliente_id?.trim();
  return fromUser || null;
}

const UserManagementPage: React.FC = () => {
  const { isAuthenticated, loading: authLoading, clienteInfo, auth } = useAuth();
  const { hasPermission } = usePermission();
  const queryClient = useQueryClient();

  const [selfResetHintVisible, setSelfResetHintVisible] = useState(false);

  const { resetPassword, isResetPending } = useResetUserPassword({
    onSelfResetBlocked: () => setSelfResetHintVisible(true),
  });

  useEffect(() => {
    if (!selfResetHintVisible) return;
    const timer = window.setTimeout(() => setSelfResetHintVisible(false), 8000);
    return () => window.clearTimeout(timer);
  }, [selfResetHintVisible]);

  const search = useDebouncedSearch();
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const listEnabled = !authLoading && isAuthenticated;
  const activeFilter = mostrarInactivos ? 'all' : 'active';

  const usersList = useUsersList({
    debouncedSearch: search.debouncedValue || undefined,
    activeFilter,
    enabled: listEnabled,
  });

  const users = usersList.items;
  const listError = usersList.isError
    ? getErrorMessage(usersList.error).message || 'Ocurrió un error al cargar los usuarios.'
    : null;

  const showInitialSkeleton = (authLoading || usersList.isLoading) && users.length === 0;
  const listIsRefreshing = usersList.isFetching && users.length > 0;

  const [availableRoles, setAvailableRoles] = useState<Rol[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserFormData, setNewUserFormData] = useState<UserFormData>(initialCreateFormData);
  const [createFormErrors, setCreateFormErrors] = useState<FormErrors>({});
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [selectedCreateRoleIds, setSelectedCreateRoleIds] = useState<string[]>([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [editFormData, setEditFormData] = useState<UserUpdateData>(initialEditFormData);
  const [editFormErrors, setEditFormErrors] = useState<FormErrors>({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [selectedEditRoleIds, setSelectedEditRoleIds] = useState<string[]>([]);
  const [editFormSnapshot, setEditFormSnapshot] = useState<EditUserFormSnapshot | null>(null);

  const [discardPending, setDiscardPending] = useState<DiscardPending>(null);

  const [bajaTarget, setBajaTarget] = useState<UserWithRoles | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [reactivarTarget, setReactivarTarget] = useState<UserWithRoles | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);

  const [resetTarget, setResetTarget] = useState<UserWithRoles | null>(null);
  const [resetReveal, setResetReveal] = useState<ResetRevealState | null>(null);

  const pageActionsLocked = discardPending !== null || isResetPending;

  const hasResetPermission = hasPermission(ADMIN_USUARIO_PERMISSIONS.RESET_PASSWORD);
  const currentUsuarioId = auth.user?.usuario_id ?? null;

  const resetVisibilityCtx = useMemo(
    () => ({
      currentUsuarioId,
      hasResetPermission,
      pageActionsLocked,
    }),
    [currentUsuarioId, hasResetPermission, pageActionsLocked],
  );

  const fetchAvailableRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    try {
      const roles = await getAllActiveRoles();
      setAvailableRoles(roles);
    } catch (err) {
      console.error('Error fetching available roles:', err);
      toast.error(getErrorMessage(err).message || 'Error al cargar perfiles disponibles.');
      setAvailableRoles([]);
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    void fetchAvailableRoles();
  }, [fetchAvailableRoles, authLoading, isAuthenticated]);

  const isCreateDialogDirty = useMemo(
    () => isCreateUserFormDirty(newUserFormData, selectedCreateRoleIds),
    [newUserFormData, selectedCreateRoleIds],
  );

  const isEditDialogDirty = useMemo(
    () => isEditUserFormDirty(editFormData, selectedEditRoleIds, editFormSnapshot),
    [editFormData, selectedEditRoleIds, editFormSnapshot],
  );

  const handleOpenCreateModal = () => {
    setDiscardPending(null);
    setNewUserFormData(initialCreateFormData);
    setSelectedCreateRoleIds([]);
    setCreateFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    if (!isSubmittingCreate) {
      setIsCreateModalOpen(false);
      setSelectedCreateRoleIds([]);
      setNewUserFormData(initialCreateFormData);
      setCreateFormErrors({});
      setDiscardPending((pending) => (pending === 'create' ? null : pending));
      scheduleModalStackValidation('create-modal-closed');
    }
  };

  const handleRequestCloseCreate = () => {
    if (isSubmittingCreate) return;
    if (isCreateDialogDirty) {
      setIsCreateModalOpen(false);
      setDiscardPending('create');
      scheduleModalStackValidation('create-request-close-dirty');
      return;
    }
    handleCloseCreateModal();
  };

  const handleDiscardCancel = () => {
    const pending = discardPending;
    setDiscardPending(null);
    if (pending === 'create') {
      setIsCreateModalOpen(true);
    } else if (pending === 'edit') {
      setIsEditModalOpen(true);
    }
    scheduleModalStackValidation('discard-cancel-resume');
  };

  const handleDiscardConfirm = () => {
    const pending = discardPending;
    setDiscardPending(null);
    if (pending === 'create') {
      handleCloseCreateModal();
    } else if (pending === 'edit') {
      handleCloseEditModal();
    }
    scheduleModalStackValidation('discard-confirmed');
  };

  const handleNewUserChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setNewUserFormData((prev) => ({ ...prev, [name]: value }));
    if (createFormErrors[name]) {
      setCreateFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setNewUserFormData((prev) => ({ ...prev, contrasena: value }));
    if (createFormErrors.contrasena) {
      setCreateFormErrors((prev) => ({ ...prev, contrasena: undefined }));
    }
  };

  const handleClearCreateFieldError = (field: string) => {
    setCreateFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateCreateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    const username = newUserFormData.nombre_usuario.trim();
    if (!username) {
      errors.nombre_usuario = 'El usuario de acceso es requerido.';
      isValid = false;
    } else if (username.length < 3) {
      errors.nombre_usuario = 'El usuario de acceso debe tener al menos 3 caracteres.';
      isValid = false;
    }

    if (!newUserFormData.correo.trim()) {
      errors.correo = 'El correo es requerido.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(newUserFormData.correo)) {
      errors.correo = 'Formato de correo inválido.';
      isValid = false;
    }

    if (!newUserFormData.contrasena) {
      errors.contrasena = 'La contraseña es requerida.';
      isValid = false;
    } else if (newUserFormData.contrasena.length < 8) {
      errors.contrasena = 'La contraseña debe tener al menos 8 caracteres.';
      isValid = false;
    }

    setCreateFormErrors(errors);
    return isValid;
  };

  const handleCreateUserSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateCreateForm()) return;

    const clienteId = resolveSessionClienteId(clienteInfo, auth.user);
    if (!clienteId) {
      toast.error('No se pudo obtener el tenant de la sesión. Vuelva a iniciar sesión.');
      return;
    }

    setIsSubmittingCreate(true);
    let userCreated = false;

    const dataToSend: UserFormData = {
      cliente_id: clienteId,
      nombre_usuario: newUserFormData.nombre_usuario.trim(),
      correo: newUserFormData.correo.trim(),
      contrasena: newUserFormData.contrasena,
      nombre: newUserFormData.nombre?.trim() || undefined,
      apellido: newUserFormData.apellido?.trim() || undefined,
    };

    try {
      const createdUser = await createUser(dataToSend);
      logIamUserOperation({
        operation: 'CREATE_USER',
        usuario_id: createdUser.usuario_id,
        requestBody: dataToSend,
        statusCode: 200,
        responseBody: createdUser,
      });
      userCreated = true;
      toast.success('Usuario creado correctamente.');

      if (selectedCreateRoleIds.length > 0) {
        await Promise.all(
          selectedCreateRoleIds.map((roleId) => assignRoleToUser(createdUser.usuario_id, roleId)),
        );
        toast.success('Perfiles asignados correctamente.');
      }

      handleCloseCreateModal();
      search.clear();
      usersList.setPage(1);
      await invalidateUsersListQueries(queryClient);
    } catch (err) {
      console.error('Error creating user or assigning roles:', err);
      const evidence = extractAxiosOperationEvidence(err);
      logIamUserOperation({
        operation: 'CREATE_USER',
        usuario_id: '—',
        requestBody: dataToSend,
        statusCode: evidence.statusCode,
        responseBody: evidence.responseBody,
      });
      const errorData = getErrorMessage(err);
      if (userCreated) {
        toast.error(
          'El usuario se creó, pero no se pudieron asignar todos los perfiles. Edite el usuario para completar la asignación.',
        );
        if (errorData.message) {
          toast.error(errorData.message);
        }
      } else {
        toast.error(errorData.message || 'Error al crear usuario.');
      }
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleOpenEditModal = (userItem: UserWithRoles) => {
    setDiscardPending(null);
    const formData: UserUpdateData = {
      correo: userItem.correo || '',
      nombre: userItem.nombre || '',
      apellido: userItem.apellido || '',
      es_activo: userItem.es_activo,
    };
    const roleIds = userItem.roles.map((role) => role.rol_id);

    setEditingUser(userItem);
    setEditFormData(formData);
    setSelectedEditRoleIds(roleIds);
    setEditFormSnapshot(buildEditUserFormSnapshot(formData, roleIds));
    setEditFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    if (!isSubmittingEdit) {
      setIsEditModalOpen(false);
      setEditingUser(null);
      setSelectedEditRoleIds([]);
      setEditFormSnapshot(null);
      setEditFormData(initialEditFormData);
      setEditFormErrors({});
      setDiscardPending((pending) => (pending === 'edit' ? null : pending));
      scheduleModalStackValidation('edit-modal-closed');
    }
  };

  const handleRequestCloseEdit = () => {
    if (isSubmittingEdit) return;
    if (isEditDialogDirty) {
      setIsEditModalOpen(false);
      setDiscardPending('edit');
      scheduleModalStackValidation('edit-request-close-dirty');
      return;
    }
    handleCloseEditModal();
  };

  const handleEditUserChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    if (editFormErrors[name]) {
      setEditFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleEditActiveChange = (checked: boolean) => {
    setEditFormData((prev) => ({ ...prev, es_activo: checked }));
  };

  const validateEditForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    if (!editFormData.correo?.trim()) {
      errors.correo = 'El correo es requerido.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(editFormData.correo)) {
      errors.correo = 'Formato de correo inválido.';
      isValid = false;
    }

    setEditFormErrors(errors);
    return isValid;
  };

  const handleEditUserSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser || !validateEditForm()) return;

    setIsSubmittingEdit(true);
    const userId = editingUser.usuario_id;
    const initialRoleIds = editingUser.roles.map((r) => r.rol_id);

    try {
      const dataToUpdate: UserUpdateData = {
        correo: editFormData.correo.trim(),
        nombre: editFormData.nombre?.trim() || null,
        apellido: editFormData.apellido?.trim() || null,
        es_activo: editFormData.es_activo,
      };

      try {
        await updateUser(userId, dataToUpdate);
        logIamUserOperation({
          operation: 'UPDATE_USER',
          usuario_id: userId,
          requestBody: dataToUpdate,
          statusCode: 200,
          responseBody: { success: true },
        });
      } catch (updateErr) {
        const evidence = extractAxiosOperationEvidence(updateErr);
        logIamUserOperation({
          operation: 'UPDATE_USER',
          usuario_id: userId,
          requestBody: dataToUpdate,
          statusCode: evidence.statusCode,
          responseBody: evidence.responseBody,
        });
        throw updateErr;
      }

      const rolesToAdd = selectedEditRoleIds.filter((id) => !initialRoleIds.includes(id));
      const rolesToRemove = initialRoleIds.filter((id) => !selectedEditRoleIds.includes(id));

      for (const roleId of rolesToAdd) {
        try {
          const response = await assignRoleToUser(userId, roleId);
          logIamUserOperation({
            operation: 'ASSIGN_ROLE',
            usuario_id: userId,
            requestBody: { rol_id: roleId },
            statusCode: 200,
            responseBody: response,
          });
        } catch (assignErr) {
          const evidence = extractAxiosOperationEvidence(assignErr);
          logIamUserOperation({
            operation: 'ASSIGN_ROLE',
            usuario_id: userId,
            requestBody: { rol_id: roleId },
            statusCode: evidence.statusCode,
            responseBody: evidence.responseBody,
          });
          throw assignErr;
        }
      }

      for (const roleId of rolesToRemove) {
        try {
          const response = await revokeRoleFromUser(userId, roleId);
          logIamUserOperation({
            operation: 'REVOKE_ROLE',
            usuario_id: userId,
            requestBody: { rol_id: roleId },
            statusCode: 200,
            responseBody: response,
          });
        } catch (revokeErr) {
          const evidence = extractAxiosOperationEvidence(revokeErr);
          logIamUserOperation({
            operation: 'REVOKE_ROLE',
            usuario_id: userId,
            requestBody: { rol_id: roleId },
            statusCode: evidence.statusCode,
            responseBody: evidence.responseBody,
          });
          throw revokeErr;
        }
      }

      toast.success('Usuario actualizado correctamente.');
      handleCloseEditModal();
      await invalidateUsersListQueries(queryClient);
    } catch (err) {
      console.error('Error updating user or roles:', err);
      const evidence = extractAxiosOperationEvidence(err);
      console.error('[IAM UserManagement] Evidencia agregada edit:', evidence);
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al actualizar usuario o sus perfiles.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenDeactivateConfirm = (user: UserWithRoles) => {
    setBajaTarget(user);
  };

  const confirmarDesactivar = async () => {
    if (!bajaTarget) return;
    setIsDeactivating(true);
    try {
      const updated = await deactivateUser(bajaTarget.usuario_id);
      logIamUserOperation({
        operation: 'UPDATE_USER',
        usuario_id: bajaTarget.usuario_id,
        requestBody: { es_activo: false },
        statusCode: 200,
        responseBody: updated,
      });
      setBajaTarget(null);
      toast.success('Usuario desactivado correctamente.');
      await invalidateUsersListQueries(queryClient);
    } catch (err) {
      console.error('Error deactivating user:', err);
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al desactivar usuario.');
    } finally {
      setIsDeactivating(false);
    }
  };

  const confirmarReactivar = async () => {
    if (!reactivarTarget) return;
    setIsReactivating(true);
    try {
      await reactivateUser(reactivarTarget.usuario_id);
      setReactivarTarget(null);
      toast.success('Usuario reactivado correctamente.');
      await invalidateUsersListQueries(queryClient);
    } catch (err) {
      console.error('Error reactivating user:', err);
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al reactivar usuario.');
    } finally {
      setIsReactivating(false);
    }
  };

  const handleOpenResetConfirm = (user: UserWithRoles) => {
    setResetTarget(user);
  };

  const handleResetRevealComplete = () => {
    setResetReveal(null);
  };

  const ejecutarReset = async () => {
    if (!resetTarget) return;
    const displayName = formatUserDisplayName(resetTarget);
    const isInactive = !resetTarget.es_activo;
    const usuarioId = resetTarget.usuario_id;

    try {
      const result = await resetPassword(usuarioId);
      logIamUserOperation({
        operation: 'RESET_PASSWORD',
        usuario_id: usuarioId,
        requestBody: null,
        statusCode: 200,
        responseBody: redactPasswordResetResponseForLog(result),
      });
      setResetTarget(null);
      setResetReveal({
        result,
        targetDisplayName: displayName,
        isInactiveUser: isInactive,
      });
    } catch (err) {
      const evidence = extractAxiosOperationEvidence(err);
      logIamUserOperation({
        operation: 'RESET_PASSWORD',
        usuario_id: usuarioId,
        requestBody: null,
        statusCode: evidence.statusCode,
        responseBody: { redacted: true },
      });
      setResetTarget(null);
    }
  };

  const renderResetPasswordButton = (user: UserWithRoles) => {
    if (!canShowAdminPasswordReset(user, resetVisibilityCtx)) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={() => handleOpenResetConfirm(user)}
        className="text-warning hover:text-warning/80 p-1 rounded hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
        title="Restablecer contraseña"
        disabled={authLoading || !isAuthenticated || pageActionsLocked || isResetPending}
      >
        <KeyRound className="h-4 w-4" />
        <span className="sr-only">Restablecer contraseña</span>
      </button>
    );
  };

  const hasSearch = search.hasSearch;

  const emptyTitle = hasSearch
    ? 'No se encontraron usuarios que coincidan con la búsqueda.'
    : mostrarInactivos
      ? 'No hay usuarios registrados.'
      : 'No hay usuarios activos.';

  const emptyDescription = hasSearch
    ? 'Pruebe con otro término o limpie el filtro de búsqueda.'
    : mostrarInactivos
      ? undefined
      : 'Cree el primer usuario para que pueda acceder al sistema.';

  return (
    <InvPageLayout>
      <OrgCompanyToolbar
        actions={
          <Button
            type="button"
            onClick={handleOpenCreateModal}
            disabled={
              isLoadingRoles || authLoading || !isAuthenticated || pageActionsLocked
            }
            title={!isAuthenticated ? 'Debe iniciar sesión' : undefined}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white gap-2"
          >
            <UserPlus className="h-5 w-5" />
            Crear usuario
          </Button>
        }
      >
        <OrgToolbarSearch
          value={search.inputValue}
          onChange={search.setInputValue}
          placeholder="Buscar por nombre, apellido, correo…"
          aria-label="Buscar usuarios"
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

      {selfResetHintVisible ? (
        <p className="text-sm text-info mb-4">
          Para cambiar su propia contraseña, vaya a{' '}
          <Link to="/app/cuenta/seguridad" className="underline hover:text-brand-primary">
            Mi cuenta → Seguridad
          </Link>
          .
        </p>
      ) : null}

      {listError && !usersList.isLoading ? (
        <div className="mb-4 rounded-lg border border-border-base bg-surface p-6">
          <p className="text-error bg-error/10 p-4 rounded-lg mb-4">{listError}</p>
          <button
            type="button"
            onClick={() => void invalidateUsersListQueries(queryClient)}
            disabled={usersList.isFetching}
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
                          Usuario de acceso
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                          Correo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                          Perfiles
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
                      {users.length > 0 ? (
                        users.map((user) => (
                          <tr key={user.usuario_id} className="hover:bg-overlay/50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-base">
                              {formatUserDisplayName(user)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                              {user.nombre_usuario}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                              {user.correo}
                            </td>
                            <td className="px-6 py-4 text-sm text-text-soft">
                              {user.roles.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {user.roles.map((role) => (
                                    <span
                                      key={role.rol_id}
                                      className="px-2 py-1 text-xs font-semibold bg-info/10 text-info rounded-full"
                                    >
                                      {role.nombre}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="italic text-text-soft">Sin perfiles</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.es_activo ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                                }`}
                              >
                                {user.es_activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                              <div className="inline-flex items-center gap-1">
                                {user.es_activo ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditModal(user)}
                                      className="text-brand-primary hover:text-brand-primary/80 p-1 rounded hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Editar usuario y perfiles"
                                      disabled={
                                        isLoadingRoles ||
                                        authLoading ||
                                        !isAuthenticated ||
                                        pageActionsLocked
                                      }
                                    >
                                      <Edit3 className="h-4 w-4" />
                                      <span className="sr-only">Editar usuario</span>
                                    </button>
                                    {renderResetPasswordButton(user)}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDeactivateConfirm(user)}
                                      className="text-error hover:text-error/80 p-1 rounded hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Desactivar usuario"
                                      disabled={authLoading || !isAuthenticated || pageActionsLocked}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Desactivar usuario</span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setReactivarTarget(user)}
                                      className="text-success hover:text-success/80 p-1 rounded hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Reactivar usuario"
                                      disabled={authLoading || !isAuthenticated || pageActionsLocked}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                      <span className="sr-only">Reactivar usuario</span>
                                    </button>
                                    {renderResetPasswordButton(user)}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <IamTableEmptyState
                          colSpan={TABLE_COLSPAN}
                          icon={Users}
                          title={emptyTitle}
                          description={emptyDescription}
                          actionLabel={
                            hasSearch || mostrarInactivos ? undefined : 'Crear usuario'
                          }
                          onAction={
                            hasSearch || mostrarInactivos ? undefined : handleOpenCreateModal
                          }
                          actionDisabled={
                            isLoadingRoles || authLoading || !isAuthenticated || pageActionsLocked
                          }
                        />
                      )}
                    </tbody>
                  </table>
                </div>

                {usersList.pagination ? (
                  <ErpPagination
                    pagination={usersList.pagination}
                    onPageChange={usersList.setPage}
                    onLimitChange={usersList.setLimit}
                    limitOptions={LIMIT_OPTIONS}
                    disabled={usersList.isFetching || pageActionsLocked}
                  />
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}

      <UserCreateDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onRequestClose={handleRequestCloseCreate}
        formData={newUserFormData}
        formErrors={createFormErrors}
        selectedRoleIds={selectedCreateRoleIds}
        availableRoles={availableRoles}
        isSubmitting={isSubmittingCreate}
        isLoadingRoles={isLoadingRoles}
        onFieldChange={handleNewUserChange}
        onPasswordChange={handlePasswordChange}
        onRolesChange={setSelectedCreateRoleIds}
        onClearFieldError={handleClearCreateFieldError}
        onSubmit={handleCreateUserSubmit}
      />

      {editingUser ? (
        <UserEditDialog
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onRequestClose={handleRequestCloseEdit}
          loginUsername={editingUser.nombre_usuario}
          formData={editFormData}
          formErrors={editFormErrors}
          selectedRoleIds={selectedEditRoleIds}
          availableRoles={availableRoles}
          isSubmitting={isSubmittingEdit}
          isLoadingRoles={isLoadingRoles}
          onFieldChange={handleEditUserChange}
          onActiveChange={handleEditActiveChange}
          onRolesChange={setSelectedEditRoleIds}
          onSubmit={handleEditUserSubmit}
        />
      ) : null}

      <ConfirmDialog
        isOpen={discardPending !== null}
        onClose={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
        title="Descartar cambios"
        message={
          discardPending === 'create'
            ? 'Hay cambios sin guardar. ¿Desea cerrar sin crear el usuario?'
            : discardPending === 'edit'
              ? 'Hay cambios sin guardar. ¿Desea cerrar sin guardar?'
              : ''
        }
        confirmText="Sí, descartar"
        cancelText="Seguir editando"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={!!bajaTarget && discardPending === null}
        onClose={() => !isDeactivating && setBajaTarget(null)}
        onConfirm={() => void confirmarDesactivar()}
        title="Desactivar usuario"
        message={
          bajaTarget
            ? `¿Desactivar usuario '${formatUserDisplayName(bajaTarget)}'? Podrá reactivarlo después.`
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
        title="Reactivar usuario"
        message={
          reactivarTarget
            ? `¿Reactivar usuario '${formatUserDisplayName(reactivarTarget)}'? Volverá a estar disponible.`
            : ''
        }
        confirmText="Reactivar"
        cancelText="Cancelar"
        variant="info"
        loading={isReactivating}
      />

      <ConfirmDialog
        isOpen={!!resetTarget && discardPending === null}
        onClose={() => !isResetPending && setResetTarget(null)}
        onConfirm={() => void ejecutarReset()}
        title="Restablecer contraseña"
        message={
          resetTarget
            ? buildResetConfirmMessage(
                formatUserDisplayName(resetTarget),
                !resetTarget.es_activo,
              )
            : ''
        }
        confirmText="Restablecer contraseña"
        cancelText="Cancelar"
        variant="warning"
        loading={isResetPending}
        panelClassName="max-w-lg"
      />

      {resetReveal ? (
        <UserPasswordResetRevealDialog
          isOpen
          result={resetReveal.result}
          targetDisplayName={resetReveal.targetDisplayName}
          isInactiveUser={resetReveal.isInactiveUser}
          onComplete={handleResetRevealComplete}
        />
      ) : null}
    </InvPageLayout>
  );
};

export default UserManagementPage;
