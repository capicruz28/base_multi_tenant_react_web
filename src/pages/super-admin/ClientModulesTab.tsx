/**
 * Componente para gestionar módulos activos de un cliente
 * Rediseñado con separación visual clara entre módulos activos y disponibles
 * Mejora UX según informe profesional de arquitectura
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  Package,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Settings,
  Loader,
  Search,
  Filter,
  Calendar,
  Users,
  Database,
  AlertCircle
} from 'lucide-react';
import { moduloService } from '../../services/modulo.service';
import { ModuloConInfoActivacion } from '../../types/modulo.types';
import { getErrorMessage } from '../../services/error.service';
import ActivateModuleModal from './ActivateModuleModal';
import EditModuleActivoModal from './EditModuleActivoModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

interface ClientModulesTabProps {
  clienteId: string;
}

const ClientModulesTab: React.FC<ClientModulesTabProps> = ({ clienteId }) => {
  const [modulos, setModulos] = useState<ModuloConInfoActivacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterActivos, setFilterActivos] = useState<boolean | null>(null);
  
  // Modales
  const [isActivateModalOpen, setIsActivateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedModulo, setSelectedModulo] = useState<ModuloConInfoActivacion | null>(null);
  const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState<boolean>(false);
  const [moduloToDeactivate, setModuloToDeactivate] = useState<ModuloConInfoActivacion | null>(null);

  const fetchModulos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await moduloService.getModulosByCliente(clienteId);
      setModulos(data);
    } catch (err) {
      console.error('Error fetching client modules:', err);
      const errorData = getErrorMessage(err);
      setError(errorData.message || 'Error al cargar los módulos');
      toast.error(errorData.message || 'Error al cargar los módulos');
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    fetchModulos();
  }, [fetchModulos]);

  const handleActivate = (modulo: ModuloConInfoActivacion) => {
    setSelectedModulo(modulo);
    setIsActivateModalOpen(true);
  };

  const handleEdit = (modulo: ModuloConInfoActivacion) => {
    setSelectedModulo(modulo);
    setIsEditModalOpen(true);
  };

  const handleDeactivateClick = (modulo: ModuloConInfoActivacion) => {
    setModuloToDeactivate(modulo);
    setIsDeactivateConfirmOpen(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!moduloToDeactivate) return;

    try {
      await moduloService.desactivarModuloCliente(clienteId, moduloToDeactivate.modulo_id);
      toast.success(`Módulo "${moduloToDeactivate.nombre}" desactivado exitosamente`);
      setIsDeactivateConfirmOpen(false);
      setModuloToDeactivate(null);
      fetchModulos();
    } catch (err) {
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al desactivar el módulo');
    }
  };

  const handleActivateSuccess = () => {
    setIsActivateModalOpen(false);
    setSelectedModulo(null);
    fetchModulos();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedModulo(null);
    fetchModulos();
  };

  // Separar módulos activos y disponibles
  const modulosActivos = modulos.filter(m => m.activo_en_cliente);
  const modulosDisponibles = modulos.filter(m => !m.activo_en_cliente);

  // Filtrar según búsqueda
  const filteredModulosActivos = modulosActivos.filter(modulo => {
    const matchesSearch = !searchTerm || 
      modulo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      modulo.codigo_modulo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredModulosDisponibles = modulosDisponibles.filter(modulo => {
    const matchesSearch = !searchTerm || 
      modulo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      modulo.codigo_modulo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Aplicar filtro adicional si está activo
  const showActivos = filterActivos === null || filterActivos === true;
  const showDisponibles = filterActivos === null || filterActivos === false;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin h-8 w-8 text-brand-primary" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando módulos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {error}
        </div>
        <button
          onClick={fetchModulos}
          className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-brand-primary" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Módulos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{modulos.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Activos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{modulosActivos.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-gray-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Disponibles</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{modulosDisponibles.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Búsqueda y filtros */}
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar módulos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterActivos === null ? 'all' : filterActivos ? 'active' : 'inactive'}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterActivos(value === 'all' ? null : value === 'active');
                }}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Todos</option>
                <option value="active">Solo activos</option>
                <option value="inactive">Solo disponibles</option>
              </select>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <button
              onClick={fetchModulos}
              disabled={loading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* MÓDULOS ACTIVOS - Vista de Cards */}
      {showActivos && filteredModulosActivos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Módulos Activos ({filteredModulosActivos.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModulosActivos.map((modulo) => (
              <div
                key={modulo.modulo_id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-green-200 dark:border-green-800 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0 h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                        {modulo.nombre}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <code>{modulo.codigo_modulo}</code>
                        {modulo.es_modulo_core && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Core
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información de configuración */}
                <div className="space-y-2 mb-4">
                  {modulo.fecha_vencimiento && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>Vence: {new Date(modulo.fecha_vencimiento).toLocaleDateString('es-ES')}</span>
                    </div>
                  )}
                  {modulo.limite_usuarios && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="h-4 w-4" />
                      <span>Límite usuarios: {modulo.limite_usuarios}</span>
                    </div>
                  )}
                  {modulo.limite_registros && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Database className="h-4 w-4" />
                      <span>Límite registros: {modulo.limite_registros}</span>
                    </div>
                  )}
                  {!modulo.fecha_vencimiento && !modulo.limite_usuarios && !modulo.limite_registros && (
                    <div className="text-sm text-gray-400 italic">Sin límites configurados</div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleEdit(modulo)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-brand-primary bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg hover:bg-brand-primary/20 dark:hover:bg-brand-primary/30 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Configurar
                  </button>
                  <button
                    onClick={() => handleDeactivateClick(modulo)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Desactivar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVAR NUEVO MÓDULO - Vista de Grid */}
      {showDisponibles && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-brand-primary" />
              Activar Nuevo Módulo ({filteredModulosDisponibles.length} disponibles)
            </h3>
          </div>

          {filteredModulosDisponibles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModulosDisponibles.map((modulo) => (
                <div
                  key={modulo.modulo_id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-brand-primary dark:hover:border-brand-primary transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0 h-12 w-12 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-brand-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {modulo.nombre}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <code>{modulo.codigo_modulo}</code>
                          {modulo.es_modulo_core && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              Core
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {modulo.descripcion && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {modulo.descripcion}
                    </p>
                  )}

                  <button
                    onClick={() => handleActivate(modulo)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary-hover transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Activar Módulo
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No se encontraron módulos disponibles con ese criterio' : 'No hay módulos disponibles para activar'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Estado vacío cuando no hay módulos activos ni disponibles */}
      {!showActivos && !showDisponibles && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No hay módulos para mostrar con los filtros seleccionados</p>
        </div>
      )}

      {/* Modales */}
      {isActivateModalOpen && selectedModulo && (
        <ActivateModuleModal
          isOpen={isActivateModalOpen}
          onClose={() => {
            setIsActivateModalOpen(false);
            setSelectedModulo(null);
          }}
          onSuccess={handleActivateSuccess}
          clienteId={clienteId}
          modulo={selectedModulo}
        />
      )}

      {isEditModalOpen && selectedModulo && selectedModulo.activo_en_cliente && (
        <EditModuleActivoModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedModulo(null);
          }}
          onSuccess={handleEditSuccess}
          clienteId={clienteId}
          modulo={selectedModulo}
        />
      )}

      {/* Modal de confirmación de desactivación */}
      <ConfirmDialog
        isOpen={isDeactivateConfirmOpen}
        onClose={() => {
          setIsDeactivateConfirmOpen(false);
          setModuloToDeactivate(null);
        }}
        onConfirm={handleDeactivateConfirm}
        title="Desactivar Módulo"
        message={moduloToDeactivate ? `¿Estás seguro de desactivar el módulo "${moduloToDeactivate.nombre}"?\n\nEsto desactivará todas las conexiones asociadas y el módulo dejará de estar disponible para este cliente.` : ''}
        confirmText="Sí, Desactivar"
        cancelText="Cancelar"
        variant="danger"
        confirmButtonClassName="bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
      />
    </div>
  );
};

export default ClientModulesTab;


