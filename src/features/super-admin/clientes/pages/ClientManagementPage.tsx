
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/core/utils/debounce';
import { 
  Search, 
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
  useDeactivateCliente 
} from '@/core/hooks/useClienteMutations';
import CreateClientModal from '../components/CreateClientModal';
import EditClientModal from '../components/EditClientModal';
import type { OrgDiscardPending } from '@/features/org/types/org-discard.types';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { getErrorMessage } from '@/core/services/error.service';

type ClienteActiveAction = 'deactivate' | 'reactivate';

const clienteDisplayName = (cliente: Cliente) =>
  cliente.nombre_comercial || cliente.razon_social;

// Componentes que crearemos después
// import CreateClientModal from '../../../components/super-admin/CreateClientModal';
// import EditClientModal from '../../../components/super-admin/EditClientModal';

const ClientManagementPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const limitPerPage = 10;

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [activeFilter, setActiveFilter] = useState<ClienteActiveFilter>('active');
  const [filters, setFilters] = useState<ClienteFilters>({});
  
  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clienteDiscardPending, setClienteDiscardPending] = useState<OrgDiscardPending>(null);
  const [activeTarget, setActiveTarget] = useState<Cliente | null>(null);
  const [activeAction, setActiveAction] = useState<ClienteActiveAction | null>(null);

  const pageActionsLocked = clienteDiscardPending !== null || activeTarget !== null;

  // ✅ MIGRADO A REACT QUERY: Usar hook useClientes
  const { 
    data: clientesData, 
    isLoading: loading, 
    error: queryError,
    refetch 
  } = useClientes({
    pagina: currentPage,
    limite: limitPerPage,
    filtros: { ...filters, activeFilter, buscar: debouncedSearchTerm || undefined },
    enabled: isSuperAdmin,
  });

  // Extraer datos de la respuesta
  const clientes = clientesData?.clientes || [];
  const totalPages = clientesData?.total_paginas || 1;
  const totalClientes = clientesData?.total_clientes || 0;
  const error = queryError ? getErrorMessage(queryError).message : null;

  // Mutaciones
  const activateMutation = useActivateCliente();
  const deactivateMutation = useDeactivateCliente();

  // Handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Resetear a primera página al buscar
  };


  const handleFilterChange = (key: keyof ClienteFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  // ✅ MIGRADO: Los toasts ahora se manejan en las mutaciones
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

  // Si no es super admin
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

      {/* Barra de herramientas */}
      <div className="mb-6 bg-surface rounded-lg shadow-sm border border-border-base p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Búsqueda */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={handleSearchChange}
              disabled={pageActionsLocked}
              className="pl-10 pr-4 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.plan_suscripcion || ''}
              onChange={(e) => handleFilterChange('plan_suscripcion', e.target.value || undefined)}
              disabled={pageActionsLocked}
              className="px-3 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Todos los planes</option>
              <option value="trial">Trial</option>
              <option value="basico">Básico</option>
              <option value="profesional">Profesional</option>
              <option value="enterprise">Enterprise</option>
            </select>

            <select
              value={filters.estado_suscripcion || ''}
              onChange={(e) => handleFilterChange('estado_suscripcion', e.target.value || undefined)}
              disabled={pageActionsLocked}
              className="px-3 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="trial">Trial</option>
              <option value="suspendido">Suspendido</option>
            </select>

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

          {/* Acciones */}
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              disabled={loading || pageActionsLocked}
              className="p-2 text-text-soft hover:text-text-base hover:bg-overlay dark:hover:bg-overlay rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
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

      {/* Contenido */}
      <div className="bg-surface rounded-lg shadow-sm border border-border-base overflow-hidden">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="animate-spin h-6 w-6 text-brand-primary" />
            <span className="ml-2 text-text-soft">Cargando clientes...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-6 text-center">
            <div className="text-error bg-error/10 p-4 rounded-lg">
              {error}
            </div>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Tabla */}
        {!loading && !error && (
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
                          <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                            cliente.estado_suscripcion === SubscriptionStatus.ACTIVE 
                              ? 'bg-success/10 text-success'
                              : cliente.estado_suscripcion === SubscriptionStatus.TRIAL
                              ? 'bg-info/10 text-info'
                              : 'bg-error/10 text-error'
                          }`}>
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cliente.es_activo
                              ? 'bg-success/10 text-success'
                              : 'bg-error/10 text-error'
                          }`}>
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
                              onClick={() => openEditModal(cliente)}
                              disabled={pageActionsLocked}
                              className="text-brand-primary hover:text-brand-primary/80 dark:text-brand-primary dark:hover:text-brand-primary/80 p-1 rounded hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => !pageActionsLocked && navigate(`/super-admin/clientes/${cliente.cliente_id}`)}
                              disabled={pageActionsLocked}
                              className="text-text-soft hover:text-text-base p-1 rounded hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Ver detalle"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {cliente.es_activo ? (
                              <button
                                onClick={() => openActiveConfirm(cliente)}
                                disabled={pageActionsLocked}
                                className="text-error hover:bg-overlay dark:hover:bg-overlay p-1 rounded hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Desactivar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
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
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-text-soft">
                        <Building className="mx-auto h-12 w-12 text-text-soft mb-4" />
                        <p>No se encontraron clientes</p>
                        {searchTerm || activeFilter !== 'active' || Object.keys(filters).length > 0 ? (
                          <p className="mt-1">Intenta ajustar los filtros de búsqueda</p>
                        ) : (
                          <button
                            onClick={openCreateModal}
                            disabled={pageActionsLocked}
                            className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Crear primer cliente
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalClientes > limitPerPage && (
              <div className="px-6 py-4 border-t border-border-base bg-subtle">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-text-base">
                    Mostrando <span className="font-medium">{(currentPage - 1) * limitPerPage + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(currentPage * limitPerPage, totalClientes)}</span> de{' '}
                    <span className="font-medium">{totalClientes}</span> clientes
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || pageActionsLocked}
                      className="px-3 py-1 text-sm border border-border-base rounded-md bg-surface text-text-base hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm text-text-base">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || pageActionsLocked}
                      className="px-3 py-1 text-sm border border-border-base rounded-md bg-surface text-text-base hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales (se implementarán después) */}
    
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