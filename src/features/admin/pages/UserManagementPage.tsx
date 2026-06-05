// src/features/admin/pages/UserManagementPage.tsx

import React, { useState, useEffect, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Edit3, Trash2, UserPlus, Users, Search as SearchIcon } from 'lucide-react';

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  assignRoleToUser,
  revokeRoleFromUser,
} from '../services/usuario.service';
import { getAllActiveRoles } from '../services/rol.service';

import { UserWithRoles, PaginatedUsersResponse, UserFormData, UserUpdateData } from '../types/usuario.types';
import { Rol } from '../types/rol.types';

import { getErrorMessage } from '@/core/services/error.service';
import { useAuth } from '@/shared/context/AuthContext';
import { useDebounce } from '@/core/utils/debounce';
import { Button } from '@/shared/components/ui/button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import {
  IamSearchInput,
  IamTableEmptyState,
  UserCreateDialog,
  UserEditDialog,
} from '../components/iam';
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
import { scheduleModalStackValidation } from '../utils/iam-modal-stack-validation';

type DiscardPending = 'create' | 'edit' | null;

const TABLE_COLSPAN = 6;
const LIMIT_PER_PAGE = 10;

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

  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

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

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserWithRoles | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async (page: number, search: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data: PaginatedUsersResponse = await getUsers(page, LIMIT_PER_PAGE, search || undefined);
      setUsers(data.usuarios);
      setTotalPages(data.total_paginas);
      setTotalUsers(data.total_usuarios);
      setCurrentPage(data.pagina_actual);
    } catch (err) {
      console.error('Error in fetchUsers:', err);
      const errorData = getErrorMessage(err);
      setError(errorData.message || 'Ocurrió un error al cargar los usuarios.');
      setUsers([]);
      setTotalPages(1);
      setTotalUsers(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    const pageToFetch = debouncedSearchTerm !== searchTerm ? 1 : currentPage;
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1);
    }
    fetchUsers(pageToFetch, debouncedSearchTerm);
  }, [debouncedSearchTerm, currentPage, fetchUsers, searchTerm, authLoading, isAuthenticated]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    fetchAvailableRoles();
  }, [fetchAvailableRoles, authLoading, isAuthenticated]);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

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
      setSearchTerm('');
      fetchUsers(1, '');
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
      fetchUsers(currentPage, debouncedSearchTerm);
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

  const handleOpenDeleteConfirm = (user: UserWithRoles) => {
    setDeletingUser(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    if (!isDeleting) {
      setIsDeleteConfirmOpen(false);
      setDeletingUser(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await deleteUser(deletingUser.usuario_id);
      handleCloseDeleteConfirm();
      toast.success('Usuario desactivado correctamente.');
      fetchUsers(currentPage, debouncedSearchTerm);
    } catch (err) {
      console.error('Error deactivating user:', err);
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al desactivar usuario.');
    } finally {
      setIsDeleting(false);
    }
  };

  const showTableSpinner = authLoading || isLoading;
  const hasSearch = searchTerm.trim().length > 0;

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <IamSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por nombre, apellido, correo…"
          className="sm:w-1/3"
          aria-label="Buscar usuarios"
        />
        <Button
          type="button"
          onClick={handleOpenCreateModal}
          disabled={
            isLoadingRoles || authLoading || !isAuthenticated || discardPending !== null
          }
          title={!isAuthenticated ? 'Debe iniciar sesión' : undefined}
          className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary-hover text-white gap-2"
        >
          <UserPlus className="h-5 w-5" />
          Crear usuario
        </Button>
      </div>

      {showTableSpinner && (
        <div className="flex justify-center items-center py-10">
          <Loader className="animate-spin h-8 w-8 text-brand-primary" />
          <p className="ml-3 text-text-soft">
            {authLoading ? 'Verificando sesión…' : 'Cargando usuarios…'}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">{user.correo}</td>
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
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(user)}
                          className="text-brand-primary hover:text-brand-primary/80 p-1 rounded hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Editar usuario y perfiles"
                          disabled={
                            isLoadingRoles ||
                            authLoading ||
                            !isAuthenticated ||
                            discardPending !== null
                          }
                        >
                          <Edit3 className="h-4 w-4" />
                          <span className="sr-only">Editar usuario</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteConfirm(user)}
                          className={`p-1 rounded hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed ${
                            !user.es_activo
                              ? 'text-text-soft cursor-not-allowed'
                              : 'text-error hover:text-error'
                          }`}
                          title={user.es_activo ? 'Desactivar usuario' : 'Usuario ya inactivo'}
                          disabled={!user.es_activo || authLoading || !isAuthenticated}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Desactivar usuario</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <IamTableEmptyState
                  colSpan={TABLE_COLSPAN}
                  icon={hasSearch ? SearchIcon : Users}
                  title={
                    hasSearch
                      ? 'No se encontraron usuarios que coincidan con la búsqueda.'
                      : 'No hay usuarios registrados.'
                  }
                  description={
                    hasSearch
                      ? 'Pruebe con otro término o limpie el filtro de búsqueda.'
                      : 'Cree el primer usuario para que pueda acceder al sistema.'
                  }
                  actionLabel={hasSearch ? undefined : 'Crear usuario'}
                  onAction={hasSearch ? undefined : handleOpenCreateModal}
                  actionDisabled={isLoadingRoles || authLoading || !isAuthenticated}
                />
              )}
            </tbody>
          </table>
        </div>
      )}

      {!showTableSpinner && !error && totalUsers > LIMIT_PER_PAGE && (
        <div className="py-4 flex items-center justify-between border-t border-border-base mt-4">
          <p className="text-sm text-text-soft">
            Mostrando <span className="font-medium">{(currentPage - 1) * LIMIT_PER_PAGE + 1}</span>
            {' a '}
            <span className="font-medium">{Math.min(currentPage * LIMIT_PER_PAGE, totalUsers)}</span>
            {' de '}
            <span className="font-medium">{totalUsers}</span> resultados
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
        isOpen={isDeleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Desactivar usuario"
        message={
          deletingUser
            ? `¿Está seguro de que desea desactivar el acceso de ${formatUserDisplayName(deletingUser)} (${deletingUser.nombre_usuario})?`
            : ''
        }
        confirmText="Sí, desactivar"
        cancelText="Cancelar"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default UserManagementPage;
