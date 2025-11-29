
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';
import { 
  Search, 
  Plus, 
  Edit3, 
  Eye, 
  Trash2, 
  RefreshCw,
  Building,
} from 'lucide-react';

import { clienteService } from '../../services/cliente.service';
import { Cliente, ClienteListResponse, ClienteFilters } from '../../types/cliente.types';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/error.service';
import CreateClientModal from './CreateClientModal';
import EditClientModal from './EditClientModal';

// Componentes que crearemos después
// import CreateClientModal from '../../../components/super-admin/CreateClientModal';
// import EditClientModal from '../../../components/super-admin/EditClientModal';

const ClientManagementPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalClientes, setTotalClientes] = useState<number>(0);
  const limitPerPage = 10;

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [filters, setFilters] = useState<ClienteFilters>({});
  
  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  // Cargar clientes
  const fetchClientes = useCallback(async () => {
    if (!isSuperAdmin) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data: ClienteListResponse = await clienteService.getClientes(
        currentPage, 
        limitPerPage, 
        { ...filters, buscar: debouncedSearchTerm || undefined }
      );
      
      setClientes(data.clientes);
      setTotalPages(data.total_paginas);
      setTotalClientes(data.total_clientes);
    } catch (err) {
      console.error('Error fetching clients:', err);
      const errorData = getErrorMessage(err);
      setError(errorData.message || 'Error al cargar los clientes');
      toast.error(errorData.message || 'Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, debouncedSearchTerm, isSuperAdmin]);

  // Efecto para cargar clientes
  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

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

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchClientes();
    toast.success('Cliente creado exitosamente');
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedCliente(null);
    fetchClientes();
    toast.success('Cliente actualizado exitosamente');
  };

  const handleActivateCliente = async (cliente: Cliente) => {
    try {
      await clienteService.activateCliente(cliente.cliente_id);
      toast.success('Cliente activado exitosamente');
      fetchClientes();
    } catch (err) {
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al activar el cliente');
    }
  };

  const handleDeactivateCliente = async (cliente: Cliente) => {
    if (!window.confirm(`¿Estás seguro de desactivar al cliente ${cliente.nombre_comercial || cliente.razon_social}?`)) {
      return;
    }

    try {
      await clienteService.deactivateCliente(cliente.cliente_id);
      toast.success('Cliente desactivado exitosamente');
      fetchClientes();
    } catch (err) {
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al desactivar el cliente');
    }
  };

  const openEditModal = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsEditModalOpen(true);
  };

  // Si no es super admin
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acceso restringido</h3>
          <p className="mt-1 text-sm text-gray-500">
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Clientes
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Administra todos los clientes del sistema multi-tenant
        </p>
      </div>*/}

      {/* Barra de herramientas */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Búsqueda */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.plan_suscripcion || ''}
              onChange={(e) => handleFilterChange('plan_suscripcion', e.target.value || undefined)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white text-sm"
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
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="trial">Trial</option>
              <option value="suspendido">Suspendido</option>
            </select>

            <select
              value={filters.es_activo === undefined ? '' : filters.es_activo.toString()}
              onChange={(e) => handleFilterChange('es_activo', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <button
              onClick={fetchClientes}
              disabled={loading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo Cliente
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="animate-spin h-6 w-6 text-brand-primary" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando clientes...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-6 text-center">
            <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              {error}
            </div>
            <button
              onClick={fetchClientes}
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
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Plan/Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Configuración
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {clientes.length > 0 ? (
                    clientes.map((cliente) => (
                      <tr key={cliente.cliente_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building className="h-8 w-8 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {cliente.nombre_comercial || cliente.razon_social}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {cliente.codigo_cliente} • {cliente.subdominio}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {cliente.contacto_nombre || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {cliente.contacto_email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {cliente.plan_suscripcion}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                            cliente.estado_suscripcion === 'activo' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : cliente.estado_suscripcion === 'trial'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {cliente.estado_suscripcion}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-4">
                            <span className="capitalize">{cliente.tipo_instalacion}</span>
                            <span className="capitalize">{cliente.modo_autenticacion}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cliente.es_activo
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {cliente.es_activo ? 'Activo' : 'Inactivo'}
                          </span>
                          {cliente.es_demo && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              Demo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => openEditModal(cliente)}
                              className="text-brand-primary hover:text-brand-primary-dark dark:text-brand-primary dark:hover:text-brand-primary-hover p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => navigate(`/super-admin/clientes/${cliente.cliente_id}`)}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Ver detalle"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {cliente.es_activo ? (
                              <button
                                onClick={() => handleDeactivateCliente(cliente)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Desactivar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateCliente(cliente)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Activar"
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
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>No se encontraron clientes</p>
                        {searchTerm || Object.keys(filters).length > 0 ? (
                          <p className="mt-1">Intenta ajustar los filtros de búsqueda</p>
                        ) : (
                          <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
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
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando <span className="font-medium">{(currentPage - 1) * limitPerPage + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(currentPage * limitPerPage, totalClientes)}</span> de{' '}
                    <span className="font-medium">{totalClientes}</span> clientes
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {isEditModalOpen && selectedCliente && (
        <EditClientModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCliente(null);
          }}
          onSuccess={handleEditSuccess}
          cliente={selectedCliente}
        />
      )}
    
    </div>
  );
};

export default ClientManagementPage;