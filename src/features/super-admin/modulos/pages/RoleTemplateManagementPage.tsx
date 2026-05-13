import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Shield,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import { plantillaRolService } from '@/features/modulos/services/plantilla-rol.service';
import { moduloV2Service } from '@/features/modulos/services/modulo-v2.service';
import type { PlantillaRol } from '@/features/modulos/types/plantilla-rol.types';
import type { ModuloV2 } from '@/features/modulos/types/modulo-v2.types';
import { useAuth } from '@/shared/context/AuthContext';
import { getErrorMessage } from '@/core/services/error.service';
import { getIcon } from '@/shared/lib/icon-utils';
import CreateRoleTemplateModal from '../components/CreateRoleTemplateModal';
import EditRoleTemplateModal from '../components/EditRoleTemplateModal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';

const RoleTemplateManagementPage: React.FC = () => {
  const { isSuperAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const [plantillas, setPlantillas] = useState<PlantillaRol[]>([]);
  const [modulos, setModulos] = useState<ModuloV2[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [selectedModuloId, setSelectedModuloId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(true);

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalPlantillas, setTotalPlantillas] = useState<number>(0);
  const limitPerPage = 20;

  // Modales y Selección
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedPlantilla, setSelectedPlantilla] = useState<PlantillaRol | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [plantillaToDelete, setPlantillaToDelete] = useState<PlantillaRol | null>(null);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cargar módulos
  const fetchModulos = useCallback(async () => {
    try {
      const data = await moduloV2Service.getModulos({ es_activo: true });
      setModulos(data.items);
    } catch (err) {
      console.error('Error cargando módulos:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchModulos();
    }
  }, [isAuthenticated, authLoading, fetchModulos]);

  // Cargar plantillas
  const fetchPlantillas = useCallback(async () => {
    if (!isAuthenticated || authLoading) {
      return;
    }

    // ✅ Validación: Requerir módulo seleccionado
    if (!selectedModuloId) {
      setPlantillas([]);
      setTotalPlantillas(0);
      setTotalPages(0);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const skip = (currentPage - 1) * limitPerPage;
      const filters: any = {
        modulo_id: selectedModuloId, // ✅ Siempre requerido
        skip,
        limit: limitPerPage,
      };

      if (showOnlyActive) {
        filters.es_activa = true;
      }

      if (debouncedSearchTerm) {
        filters.nombre = debouncedSearchTerm;
      }

      const data = await plantillaRolService.getPlantillas(filters);

      // ✅ Validación robusta de la respuesta
      if (!data) {
        throw new Error('La respuesta del servidor está vacía');
      }
      
      // Validar que items sea un array
      const items = Array.isArray(data.items) ? data.items : [];
      setPlantillas(items);
      setTotalPlantillas(typeof data.total === 'number' ? data.total : items.length);
      setTotalPages(typeof data.pages === 'number' ? data.pages : 1);
      setError(null);
    } catch (err) {
      console.error('❌ Error cargando plantillas:', err);
      const errorData = getErrorMessage(err);
      setError(errorData.message || 'Error al cargar las plantillas');
      toast.error(errorData.message || 'Error al cargar las plantillas');
    } finally {
      setLoading(false);
    }
  }, [selectedModuloId, debouncedSearchTerm, showOnlyActive, currentPage, isAuthenticated, authLoading]);

  useEffect(() => {
    fetchPlantillas();
  }, [fetchPlantillas]);

  // Handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleModuloChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModuloId(event.target.value);
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
    fetchPlantillas();
    toast.success('Plantilla creada exitosamente');
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedPlantilla(null);
    fetchPlantillas();
    toast.success('Plantilla actualizada exitosamente');
  };

  const handleToggleActivation = async (plantilla: PlantillaRol) => {
    try {
      // ✅ CORREGIDO: Usar endpoints específicos de activar/desactivar
      if (plantilla.es_activa) {
        await plantillaRolService.deactivatePlantilla(plantilla.plantilla_rol_id);
        toast.success('Plantilla desactivada exitosamente');
      } else {
        await plantillaRolService.activatePlantilla(plantilla.plantilla_rol_id);
        toast.success('Plantilla activada exitosamente');
      }
      fetchPlantillas();
    } catch (err) {
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || `Error al ${plantilla.es_activa ? 'desactivar' : 'activar'} la plantilla`);
    }
  };

  const openEditModal = (plantilla: PlantillaRol) => {
    setSelectedPlantilla(plantilla);
    setIsEditModalOpen(true);
  };

  const openDeleteConfirm = (plantilla: PlantillaRol) => {
    setPlantillaToDelete(plantilla);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!plantillaToDelete) return;

    try {
      await plantillaRolService.deletePlantilla(plantillaToDelete.plantilla_rol_id);
      toast.success('Plantilla eliminada exitosamente');
      setIsDeleteConfirmOpen(false);
      setPlantillaToDelete(null);
      fetchPlantillas();
    } catch (err) {
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al eliminar la plantilla');
    }
  };

  // Obtener módulo seleccionado con validación
  const selectedModulo = useMemo(() => {
    if (!modulos || !Array.isArray(modulos)) {
      return undefined;
    }
    return modulos.find(m => m.modulo_id === selectedModuloId);
  }, [modulos, selectedModuloId]);

  // Contar permisos en una plantilla
  const countPermissions = (permisosJson: Record<string, any>): number => {
    if (!permisosJson || typeof permisosJson !== 'object') return 0;
    return Object.keys(permisosJson).length;
  };

  // Si no es super admin
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Acceso restringido</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No tienes permisos para acceder a la gestión de plantillas de roles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      {/*
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Plantillas de Roles
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Administra las plantillas de permisos para roles por módulo
        </p>
      </div>
      */}
      {/* Barra de herramientas */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Búsqueda y Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-start sm:items-center">
            {/* Selector de Módulo */}
            <select
              id="modulo-filter"
              value={selectedModuloId}
              onChange={handleModuloChange}
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white"
              title="Filtrar por Módulo"
            >
              <option value="">Todos los módulos</option>
              {modulos && modulos.length > 0 && modulos.map((modulo) => (
                <option key={modulo.modulo_id} value={modulo.modulo_id}>
                  {modulo.nombre}
                </option>
              ))}
            </select>

            {/* Búsqueda */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="search"
                placeholder="Buscar plantillas..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Checkbox Solo activas */}
            <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={showOnlyActive}
                onChange={(e) => {
                  setShowOnlyActive(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Solo activas</span>
            </label>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 items-center">
            <button
              onClick={fetchPlantillas}
              disabled={loading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!selectedModuloId}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={!selectedModuloId ? 'Selecciona un módulo primero' : 'Crear nueva plantilla'}
            >
              <Plus className="h-4 w-4" />
              Nueva Plantilla
            </button>
          </div>
        </div>
      </div>

      {/* Información del módulo seleccionado */}
      {selectedModulo && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: selectedModulo.color || '#6366f1', color: 'white' }}
            >
              {getIcon(selectedModulo.icono, Shield)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedModulo.nombre}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedModulo?.categoria} • {plantillas?.length || 0} plantilla{(plantillas?.length || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-brand-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Plantillas</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalPlantillas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Activas</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {plantillas?.filter(p => p.es_activa).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inactivas</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {plantillas?.filter(p => !p.es_activa).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="animate-spin h-6 w-6 text-brand-primary" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando plantillas...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-6 text-center">
            <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              {error}
            </div>
            <button
              onClick={fetchPlantillas}
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
                      Plantilla
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Módulo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Permisos
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
                  {plantillas && plantillas.length > 0 ? (
                    plantillas.map((plantilla) => {
                      const modulo = modulos?.find(m => m.modulo_id === plantilla.modulo_id);
                      const permisosCount = countPermissions(plantilla.permisos_json);
                      return (
                        <tr key={plantilla.plantilla_rol_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                                <Shield className="h-6 w-6 text-brand-primary" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {plantilla.nombre}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {modulo ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-6 w-6 rounded flex items-center justify-center text-white text-xs"
                                  style={{ backgroundColor: modulo.color || '#6366f1' }}
                                >
                                  {getIcon(modulo.icono, Shield)}
                                </div>
                                <span className="text-sm text-gray-900 dark:text-white">{modulo.nombre}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">
                              {plantilla.descripcion || 'Sin descripción'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {permisosCount} menú{permisosCount !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plantilla.es_activa
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                              {plantilla.es_activa ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Activa
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactiva
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end items-center gap-2">
                              <button
                                onClick={() => openEditModal(plantilla)}
                                className="text-brand-primary hover:text-brand-primary/80 dark:text-brand-primary dark:hover:text-brand-primary/80 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Editar"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => handleToggleActivation(plantilla)}
                                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${plantilla.es_activa
                                  ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                                  : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                                  }`}
                                title={plantilla.es_activa ? 'Desactivar' : 'Activar'}
                              >
                                {plantilla.es_activa ? <Trash2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                              </button>

                              <button
                                onClick={() => openDeleteConfirm(plantilla)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>No se encontraron plantillas</p>
                        {selectedModuloId ? (
                          <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
                          >
                            Crear primera plantilla
                          </button>
                        ) : (
                          <p className="mt-1">Selecciona un módulo para ver sus plantillas</p>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPlantillas > limitPerPage && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando <span className="font-medium">{(currentPage - 1) * limitPerPage + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(currentPage * limitPerPage, totalPlantillas)}</span> de{' '}
                    <span className="font-medium">{totalPlantillas}</span> plantillas
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

      {/* Modales */}
      {isCreateModalOpen && (
        <CreateRoleTemplateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
          moduloId={selectedModuloId}
          modulos={modulos}
        />
      )}

      {isEditModalOpen && selectedPlantilla && (
        <EditRoleTemplateModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPlantilla(null);
          }}
          onSuccess={handleEditSuccess}
          plantilla={selectedPlantilla}
          modulos={modulos}
        />
      )}

      {/* Confirmación de eliminación */}
      {isDeleteConfirmOpen && plantillaToDelete && (
        <ConfirmDialog
          isOpen={isDeleteConfirmOpen}
          onClose={() => {
            setIsDeleteConfirmOpen(false);
            setPlantillaToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Eliminar Plantilla"
          message={`¿Estás seguro de que deseas eliminar la plantilla "${plantillaToDelete.nombre}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
        />
      )}
    </div>
  );
};

export default RoleTemplateManagementPage;

