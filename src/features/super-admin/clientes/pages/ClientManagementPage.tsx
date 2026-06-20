
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit3,
  Eye,
  Trash2,
  RefreshCw,
  Building,
} from 'lucide-react';

import { Cliente, ClienteActiveFilter, ClienteFilters } from '../types/cliente.types';
import { useAuth } from '@/shared/context/AuthContext';
import { SubscriptionStatus } from '@/core/constants';
import { useClientes } from '@/core/hooks/useClientes';
import {
  useActivateCliente,
  useDeactivateCliente,
} from '@/core/hooks/useClienteMutations';
import CreateClientModal from '../components/CreateClientModal';
import EditClientModal from '../components/EditClientModal';
import type { OrgDiscardPending } from '@/features/org/types/org-discard.types';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { getErrorMessage } from '@/core/services/error.service';
import { useDebouncedSearch } from '@/core/list';
import { ErpPagination } from '@/shared/components/erp-list';
import { OrgToolbarSearch } from '@/features/org/components/OrgToolbarSearch';
import { InvTableSkeleton } from '@/features/inv/components/InvTableSkeleton';
import { IamTableEmptyState } from '@/features/admin/components/iam';

type ClienteActiveAction = 'deactivate' | 'reactivate';

const TABLE_COLSPAN = 6;
const LIMIT_OPTIONS = [10, 25, 50] as const;
const DEFAULT_LIMIT = 25;

const clienteDisplayName = (cliente: Cliente) =>
  cliente.nombre_comercial || cliente.razon_social;

// Componentes que crearemos después
// import CreateClientModal from '../../../components/super-admin/CreateClientModal';
// import EditClientModal from '../../../components/super-admin/EditClientModal';

const ClientManagementPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limitPerPage, setLimitPerPage] = useState<number>(DEFAULT_LIMIT);

  const search = useDebouncedSearch();
  const [activeFilter, setActiveFilter] = useState<ClienteActiveFilter>('active');
  const [filters] = useState<ClienteFilters>({});

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clienteDiscardPending, setClienteDiscardPending] = useState<OrgDiscardPending>(null);
  const [activeTarget, setActiveTarget] = useState<Cliente | null>(null);
  const [activeAction, setActiveAction] = useState<ClienteActiveAction | null>(null);

  const pageActionsLocked = clienteDiscardPending !== null || activeTarget !== null;

  useEffect(() => {
    setCurrentPage(1);
  }, [search.debouncedValue, activeFilter]);

  const {
    data: clientesData,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useClientes({
    pagina: currentPage,
    limite: limitPerPage,
    filtros: { ...filters, activeFilter, buscar: search.debouncedValue || undefined },
    enabled: isSuperAdmin,
  });

  const clientes = clientesData?.clientes ?? [];
  const error = queryError ? getErrorMessage(queryError).message : null;

  const pagination = clientesData
    ? {
        total: clientesData.total_clientes,
        pagina_actual: clientesData.pagina_actual,
        total_paginas: clientesData.total_paginas,
        limit: clientesData.items_por_pagina,
      }
    : undefined;

  const showInitialSkeleton = isLoading && clientes.length === 0;
  const listIsRefreshing = isFetching && clientes.length > 0;

  const activateMutation = useActivateCliente();
  const deactivateMutation = useDeactivateCliente();

  const handleCreateSuccess = () => {
    setClienteDiscardPending(null);
    setIsCreateModalOpen(false);
  };

  const handleEditSuccess = () => {
    setClienteDiscardPending(null);
    setIsEditModalOpen(false);
    setSelectedCliente(null);
  };

  const handleCreateModalClose = () => {
    setClienteDiscardPending(null);
    setIsCreateModalOpen(false);
  };

  const handleEditModalClose = () => {
    setClienteDiscardPending(null);
    setIsEditModalOpen(false);
    setSelectedCliente(null);
  };

  const closeActiveConfirm = () => {
    setActiveTarget(null);
    setActiveAction(null);
  };

  const openActiveConfirm = (cliente: Cliente) => {
    if (clienteDiscardPending !== null) return;
    setActiveTarget(cliente);
    setActiveAction(cliente.es_activo ? 'deactivate' : 'reactivate');
  };

  const handleActiveFilterChange = (value: ClienteActiveFilter) => {
    setActiveFilter(value);
    setCurrentPage(1);
  };

  const handleLimitChange = (nextLimit: number) => {
    setLimitPerPage(nextLimit);
    setCurrentPage(1);
  };

  const handleActiveConfirm = () => {
    if (!activeTarget || !activeAction) return;
    const onSuccess = async () => {
      closeActiveConfirm();
      await refetch();
    };
    if (activeAction === 'deactivate') {
      deactivateMutation.mutate(activeTarget.cliente_id, { onSuccess });
    } else {
      activateMutation.mutate(activeTarget.cliente_id, { onSuccess });
    }
  };

  const togglingActive =
    activeAction === 'deactivate'
      ? deactivateMutation.isPending
      : activeAction === 'reactivate'
        ? activateMutation.isPending
        : false;

  const openEditModal = (cliente: Cliente) => {
    if (pageActionsLocked) return;
    setSelectedCliente(cliente);
    setIsEditModalOpen(true);
  };

  const openCreateModal = () => {
    if (pageActionsLocked) return;
    setIsCreateModalOpen(true);
  };

  const hasFilterContext =
    search.hasSearch || activeFilter !== 'active' || Object.keys(filters).length > 0;

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building className="mx-auto h-12 w-12 text-text-soft" />
          <h3 className="mt-2 text-sm font-medium text-text-base">Acceso restringido</h3>
          <p className="mt-1 text-sm text-text-soft">
            No tienes permisos para acceder a la gestión de clientes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      {/*<div className="mb-6">
        <h1 className="text-2xl font-bold text-text-base">
          Gestión de Clientes
        </h1>
        <p className="mt-1 text-sm text-text-soft">
          Administra todos los clientes del sistema multi-tenant
        </p>
      </div>*/}

      <div className="mb-6 bg-surface rounded-lg shadow-sm border border-border-base p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-wrap items-center">
            <OrgToolbarSearch
              value={search.inputValue}
              onChange={search.setInputValue}
              placeholder="Buscar clientes..."
              disabled={pageActionsLocked}
              aria-label="Buscar clientes"
            />
            <select
              value={activeFilter}
              onChange={(e) => handleActiveFilterChange(e.target.value as ClienteActiveFilter)}
              disabled={pageActionsLocked}
              className="px-3 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching || pageActionsLocked}
              className="p-2 text-text-soft hover:text-text-base hover:bg-overlay dark:hover:bg-overlay rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar"
              aria-label="Actualizar listado"
            >
              <RefreshCw className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={pageActionsLocked}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Nuevo Cliente
            </button>
          </div>
        </div>
      </div>

      {error && !isLoading ? (
        <div className="mb-6 rounded-lg border border-border-base bg-surface p-6">
          <p className="text-error bg-error/10 p-4 rounded-lg mb-4">{error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {!error ? (
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
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                          Contacto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                          Plan/Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                          Configuración
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-text-soft uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-surface divide-y divide-border-base">
                      {clientes.length > 0 ? (
                        clientes.map((cliente) => (
                          <tr key={cliente.cliente_id} className="hover:bg-overlay/80 dark:hover:bg-overlay/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Building className="h-8 w-8 text-text-soft mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-text-base">
                                    {cliente.nombre_comercial || cliente.razon_social}
                                  </div>
                                  <div className="text-sm text-text-soft">
                                    {cliente.codigo_cliente} • {cliente.subdominio}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-text-base">
                                {cliente.contacto_nombre || 'N/A'}
                              </div>
                              <div className="text-sm text-text-soft">
                                {cliente.contacto_email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-text-base capitalize">
                                {cliente.plan_suscripcion}
                              </div>
                              <div
                                className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                                  cliente.estado_suscripcion === SubscriptionStatus.ACTIVE
                                    ? 'bg-success/10 text-success'
                                    : cliente.estado_suscripcion === SubscriptionStatus.TRIAL
                                      ? 'bg-info/10 text-info'
                                      : 'bg-error/10 text-error'
                                }`}
                              >
                                {cliente.estado_suscripcion}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                              <div className="flex items-center gap-4">
                                <span className="capitalize">{cliente.tipo_instalacion}</span>
                                <span className="capitalize">{cliente.modo_autenticacion}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  cliente.es_activo
                                    ? 'bg-success/10 text-success'
                                    : 'bg-error/10 text-error'
                                }`}
                              >
                                {cliente.es_activo ? 'Activo' : 'Inactivo'}
                              </span>
                              {cliente.es_demo && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                                  Demo
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(cliente)}
                                  disabled={pageActionsLocked}
                                  className="text-brand-primary hover:text-brand-primary/80 dark:text-brand-primary dark:hover:text-brand-primary/80 p-1 rounded hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Editar"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    !pageActionsLocked &&
                                    navigate(`/super-admin/clientes/${cliente.cliente_id}`)
                                  }
                                  disabled={pageActionsLocked}
                                  className="text-text-soft hover:text-text-base p-1 rounded hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Ver detalle"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>

                                {cliente.es_activo ? (
                                  <button
                                    type="button"
                                    onClick={() => openActiveConfirm(cliente)}
                                    disabled={pageActionsLocked}
                                    className="text-error hover:bg-overlay dark:hover:bg-overlay p-1 rounded hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Desactivar"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openActiveConfirm(cliente)}
                                    disabled={pageActionsLocked}
                                    className="text-success hover:bg-overlay dark:hover:bg-overlay p-1 rounded hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Reactivar"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <IamTableEmptyState
                          colSpan={TABLE_COLSPAN}
                          icon={Building}
                          title={
                            search.hasSearch
                              ? 'No se encontraron clientes que coincidan con la búsqueda.'
                              : 'No se encontraron clientes'
                          }
                          description={
                            hasFilterContext
                              ? 'Intenta ajustar los filtros de búsqueda'
                              : undefined
                          }
                          actionLabel={
                            !hasFilterContext ? 'Crear primer cliente' : undefined
                          }
                          onAction={!hasFilterContext ? openCreateModal : undefined}
                          actionDisabled={pageActionsLocked}
                        />
                      )}
                    </tbody>
                  </table>
                </div>

                {pagination ? (
                  <ErpPagination
                    pagination={pagination}
                    onPageChange={setCurrentPage}
                    onLimitChange={handleLimitChange}
                    limitOptions={LIMIT_OPTIONS}
                    disabled={isFetching || pageActionsLocked}
                  />
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}

      {isCreateModalOpen && (
        <CreateClientModal
          isOpen={isCreateModalOpen}
          onClose={handleCreateModalClose}
          onSuccess={handleCreateSuccess}
          onDiscardPendingChange={setClienteDiscardPending}
        />
      )}

      {isEditModalOpen && selectedCliente && (
        <EditClientModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          onSuccess={handleEditSuccess}
          cliente={selectedCliente}
          onDiscardPendingChange={setClienteDiscardPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!activeTarget && !!activeAction && clienteDiscardPending === null}
        onClose={closeActiveConfirm}
        onConfirm={handleActiveConfirm}
        title={activeAction === 'reactivate' ? 'Reactivar cliente' : 'Desactivar cliente'}
        message={
          activeTarget
            ? activeAction === 'reactivate'
              ? `¿Reactivar el cliente "${clienteDisplayName(activeTarget)}"?`
              : `¿Desactivar el cliente "${clienteDisplayName(activeTarget)}"?`
            : ''
        }
        confirmText={activeAction === 'reactivate' ? 'Reactivar' : 'Desactivar'}
        cancelText="Cancelar"
        variant={activeAction === 'reactivate' ? 'info' : 'danger'}
        loading={togglingActive}
      />
    </div>
  );
};

export default ClientManagementPage;
