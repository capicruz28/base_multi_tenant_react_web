import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Folder,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import { seccionService } from '@/features/modulos/services/seccion.service';
import { moduloV2Service } from '@/features/modulos/services/modulo-v2.service';
import type { Seccion } from '@/features/modulos/types/seccion.types';
import type { ModuloV2 } from '@/features/modulos/types/modulo-v2.types';
import { useAuth } from '@/shared/context/AuthContext';
import { getErrorMessage } from '@/core/services/error.service';
import { getIcon } from '@/shared/lib/icon-utils';
import CreateSectionModal from '../components/CreateSectionModal';
import EditSectionModal from '../components/EditSectionModal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';

const SectionManagementPage: React.FC = () => {
  const { isSuperAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const [secciones, setSecciones] = useState<Seccion[]>([]);
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
  const [totalSecciones, setTotalSecciones] = useState<number>(0);
  const limitPerPage = 20;

  // Modales y Selección
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedSeccion, setSelectedSeccion] = useState<Seccion | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [seccionToDelete, setSeccionToDelete] = useState<Seccion | null>(null);

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
      // ✅ Validación defensiva
      const items = Array.isArray(data.items) ? data.items : [];
      setModulos(items);
    } catch (err) {
      console.error('Error cargando módulos:', err);
      setModulos([]);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchModulos();
    }
  }, [isAuthenticated, authLoading, fetchModulos]);

  // Cargar secciones
  const fetchSecciones = useCallback(async () => {
    if (!isAuthenticated || authLoading) {
      return;
    }

    // ✅ Validación: Requerir módulo seleccionado
    if (!selectedModuloId) {
      setSecciones([]);
      setTotalSecciones(0);
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

      const data = await seccionService.getSecciones(filters);

      // ✅ Validación robusta de la respuesta
      if (!data) {
        throw new Error('La respuesta del servidor está vacía');
      }
      
      // Validar que items sea un array
      const items = Array.isArray(data.items) ? data.items : [];
      
      if (import.meta.env.DEV) {
        console.log('📦 [SectionManagementPage] Secciones obtenidas:', {
          total: data.total,
          items: items.length,
          filters,
          secciones: items.map(s => ({ id: s.seccion_id, nombre: s.nombre, activa: s.es_activa }))
        });
      }
      
      setSecciones(items);
      setTotalSecciones(typeof data.total === 'number' ? data.total : items.length);
      setTotalPages(typeof data.pages === 'number' ? data.pages : 1);
      setError(null);
    } catch (err) {
      console.error('❌ Error cargando secciones:', err);
      const errorData = getErrorMessage(err);
      setError(errorData.message || 'Error al cargar las secciones');
      toast.error(errorData.message || 'Error al cargar las secciones');
    } finally {
      setLoading(false);
    }
  }, [selectedModuloId, debouncedSearchTerm, showOnlyActive, currentPage, isAuthenticated, authLoading]);

  useEffect(() => {
    fetchSecciones();
  }, [fetchSecciones]);

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
    fetchSecciones();
    toast.success('Sección creada exitosamente');
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedSeccion(null);
    fetchSecciones();
    toast.success('Sección actualizada exitosamente');
  };

  const handleToggleActivation = async (seccion: Seccion) => {
    try {
      // ✅ CORREGIDO: Usar endpoints específicos de activar/desactivar
      if (seccion.es_activa) {
        await seccionService.deactivateSeccion(seccion.seccion_id);
        toast.success('Sección desactivada exitosamente');
      } else {
        await seccionService.activateSeccion(seccion.seccion_id);
        toast.success('Sección activada exitosamente');
      }
      fetchSecciones();
    } catch (err) {
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || `Error al ${seccion.es_activa ? 'desactivar' : 'activar'} la sección`);
    }
  };

  const openEditModal = (seccion: Seccion) => {
    setSelectedSeccion(seccion);
    setIsEditModalOpen(true);
  };

  const openDeleteConfirm = (seccion: Seccion) => {
    setSeccionToDelete(seccion);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!seccionToDelete) return;

    try {
      await seccionService.deleteSeccion(seccionToDelete.seccion_id);
      toast.success('Sección eliminada exitosamente');
      setIsDeleteConfirmOpen(false);
      setSeccionToDelete(null);
      fetchSecciones();
    } catch (err) {
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al eliminar la sección');
    }
  };

  // Obtener módulo seleccionado con validación
  const selectedModulo = useMemo(() => {
    if (!modulos || !Array.isArray(modulos) || modulos.length === 0) {
      return undefined;
    }
    if (!selectedModuloId) {
      return undefined;
    }
    return modulos.find(m => m.modulo_id === selectedModuloId);
  }, [modulos, selectedModuloId]);

  // Si no es super admin
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Folder className="mx-auto h-12 w-12 text-text-soft" />
          <h3 className="mt-2 text-sm font-medium text-text-base">Acceso restringido</h3>
          <p className="mt-1 text-sm text-text-soft">
            No tienes permisos para acceder a la gestión de secciones.
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
        <h1 className="text-2xl font-bold text-text-base">
          Gestión de Secciones
        </h1>
        <p className="mt-1 text-sm text-text-soft">
          Administra las secciones de los módulos del sistema
        </p>
      </div>
      */}
      {/* Barra de herramientas */}
      <div className="mb-6 bg-surface rounded-lg shadow-sm border border-border-base p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Búsqueda y Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-start sm:items-center">
            {/* Selector de Módulo */}
            <select
              id="modulo-filter"
              value={selectedModuloId}
              onChange={handleModuloChange}
              className="w-full sm:w-48 px-3 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base"
              title="Filtrar por Módulo"
            >
              <option value="">Todos los módulos</option>
              {modulos.map((modulo) => (
                <option key={modulo.modulo_id} value={modulo.modulo_id}>
                  {modulo.nombre}
                </option>
              ))}
            </select>

            {/* Búsqueda */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
              <input
                type="text"
                id="search"
                placeholder="Buscar secciones..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base"
              />
            </div>

            {/* Checkbox Solo activas */}
            <label className="flex items-center gap-2 px-3 py-2 border border-border-base rounded-lg cursor-pointer hover:bg-overlay dark:hover:bg-overlay">
              <input
                type="checkbox"
                checked={showOnlyActive}
                onChange={(e) => {
                  setShowOnlyActive(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded border-border-base text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-text-soft">Solo activas</span>
            </label>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 items-center">
            <button
              onClick={fetchSecciones}
              disabled={loading}
              className="p-2 text-text-soft hover:text-text-base dark:hover:text-text-base hover:bg-overlay dark:hover:bg-overlay rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!selectedModuloId}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={!selectedModuloId ? 'Selecciona un módulo primero' : 'Crear nueva sección'}
            >
              <Plus className="h-4 w-4" />
              Nueva Sección
            </button>
          </div>
        </div>
      </div>

      {/* Información del módulo seleccionado */}
      {selectedModulo && (
        <div className="mb-6 bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: selectedModulo.color || '#6366f1', color: 'white' }}
            >
              {getIcon(selectedModulo.icono, Folder, { size: 24 })}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-base">
                {selectedModulo?.nombre}
              </h3>
              <p className="text-sm text-text-soft">
                {selectedModulo?.categoria} • {secciones?.length || 0} sección{(secciones?.length || 0) !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Folder className="h-8 w-8 text-brand-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">Total Secciones</p>
              <p className="text-2xl font-semibold text-text-base">{totalSecciones}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">Activas</p>
              <p className="text-2xl font-semibold text-text-base">
                {secciones?.filter(s => s.es_activa).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-error" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">Inactivas</p>
              <p className="text-2xl font-semibold text-text-base">
                {secciones?.filter(s => !s.es_activa).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="bg-surface rounded-lg shadow-sm border border-border-base overflow-hidden">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="animate-spin h-6 w-6 text-brand-primary" />
            <span className="ml-2 text-text-soft">Cargando secciones...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-6 text-center">
            <div className="text-error bg-error/10 p-4 rounded-lg">
              {error}
            </div>
            <button
              onClick={fetchSecciones}
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
                      Sección
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                      Módulo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                      Orden
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
                  {secciones && secciones.length > 0 ? (
                    secciones.map((seccion) => {
                      const modulo = modulos?.find(m => m.modulo_id === seccion.modulo_id);
                      return (
                        <tr key={seccion.seccion_id} className="hover:bg-overlay/50 dark:hover:bg-overlay/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-subtle rounded-lg flex items-center justify-center">
                                {getIcon(seccion.icono, Folder, { size: 20 })}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-text-base">
                                  {seccion.nombre}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <code className="text-sm font-mono bg-subtle px-2 py-1 rounded">
                              {seccion.codigo}
                            </code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {modulo ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-6 w-6 rounded flex items-center justify-center text-white text-xs"
                                  style={{ backgroundColor: modulo.color || '#6366f1' }}
                                >
                                  {getIcon(modulo.icono, Folder, { size: 16 })}
                                </div>
                                <span className="text-sm text-text-base">{modulo.nombre}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-text-soft">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-text-soft max-w-md truncate">
                              {seccion.descripcion || 'Sin descripción'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-text-base">{seccion.orden}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${seccion.es_activa
                              ? 'bg-success/10 text-success'
                              : 'bg-error/10 text-error'
                              }`}>
                              {seccion.es_activa ? (
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
                                onClick={() => openEditModal(seccion)}
                                className="text-brand-primary hover:text-brand-primary/80 dark:text-brand-primary dark:hover:text-brand-primary/80 p-1 rounded hover:bg-overlay dark:hover:bg-overlay"
                                title="Editar"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => handleToggleActivation(seccion)}
                                className={`p-1 rounded hover:bg-overlay dark:hover:bg-overlay ${seccion.es_activa
                                  ? 'text-error hover:bg-overlay dark:hover:bg-overlay'
                                  : 'text-success hover:bg-overlay dark:hover:bg-overlay'
                                  }`}
                                title={seccion.es_activa ? 'Desactivar' : 'Activar'}
                              >
                                {seccion.es_activa ? <Trash2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                              </button>

                              <button
                                onClick={() => openDeleteConfirm(seccion)}
                                className="text-error hover:bg-overlay dark:hover:bg-overlay p-1 rounded hover:bg-overlay dark:hover:bg-overlay"
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
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-text-soft">
                        <Folder className="mx-auto h-12 w-12 text-text-soft mb-4" />
                        <p>No se encontraron secciones</p>
                        {selectedModuloId ? (
                          <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
                          >
                            Crear primera sección
                          </button>
                        ) : (
                          <p className="mt-1">Selecciona un módulo para ver sus secciones</p>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalSecciones > limitPerPage && (
              <div className="px-6 py-4 border-t border-border-base bg-subtle">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-text-soft">
                    Mostrando <span className="font-medium">{(currentPage - 1) * limitPerPage + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(currentPage * limitPerPage, totalSecciones)}</span> de{' '}
                    <span className="font-medium">{totalSecciones}</span> secciones
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-border-base rounded-md bg-surface text-text-soft hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm text-text-soft">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-border-base rounded-md bg-surface text-text-soft hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
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
        <CreateSectionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
          moduloId={selectedModuloId}
          modulos={modulos}
        />
      )}

      {isEditModalOpen && selectedSeccion && (
        <EditSectionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedSeccion(null);
          }}
          onSuccess={handleEditSuccess}
          seccion={selectedSeccion}
          modulos={modulos}
        />
      )}

      {/* Confirmación de eliminación */}
      {isDeleteConfirmOpen && seccionToDelete && (
        <ConfirmDialog
          isOpen={isDeleteConfirmOpen}
          onClose={() => {
            setIsDeleteConfirmOpen(false);
            setSeccionToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Eliminar Sección"
          message={`¿Estás seguro de que deseas eliminar la sección "${seccionToDelete.nombre}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
        />
      )}
    </div>
  );
};

export default SectionManagementPage;

