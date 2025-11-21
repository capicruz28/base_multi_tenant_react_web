/**
 * Componente para gestionar módulos activos de un cliente
 * Muestra todos los módulos disponibles y permite activar/desactivar con configuración
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
  Filter
} from 'lucide-react';
import { moduloService } from '../../services/modulo.service';
import { ModuloConInfoActivacion } from '../../types/modulo.types';
import { getErrorMessage } from '../../services/error.service';
import ActivateModuleModal from './ActivateModuleModal';
import EditModuleActivoModal from './EditModuleActivoModal';

interface ClientModulesTabProps {
  clienteId: number;
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

  const handleDeactivate = async (modulo: ModuloConInfoActivacion) => {
    if (!window.confirm(`¿Estás seguro de desactivar el módulo "${modulo.nombre}"?`)) {
      return;
    }

    try {
      await moduloService.desactivarModuloCliente(clienteId, modulo.modulo_id);
      toast.success('Módulo desactivado exitosamente');
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

  // Filtrar módulos
  const filteredModulos = modulos.filter(modulo => {
    const matchesSearch = !searchTerm || 
      modulo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      modulo.codigo_modulo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActivos === null || 
      (filterActivos ? modulo.activo_en_cliente : !modulo.activo_en_cliente);
    
    return matchesSearch && matchesFilter;
  });

  const modulosActivos = modulos.filter(m => m.activo_en_cliente).length;
  const modulosInactivos = modulos.filter(m => !m.activo_en_cliente).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin h-8 w-8 text-indigo-600" />
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
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
            <Package className="h-8 w-8 text-indigo-600" />
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
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{modulosActivos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-gray-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Disponibles</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{modulosInactivos}</p>
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
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
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
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
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

      {/* Lista de módulos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Módulo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Configuración
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredModulos.length > 0 ? (
                filteredModulos.map((modulo) => (
                  <tr key={modulo.modulo_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {modulo.nombre}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <code className="text-xs">{modulo.codigo_modulo}</code>
                            {modulo.es_modulo_core && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                Core
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {modulo.activo_en_cliente ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          <XCircle className="h-3 w-3 mr-1" />
                          Disponible
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {modulo.activo_en_cliente ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {modulo.limite_usuarios && (
                            <div>Límite usuarios: {modulo.limite_usuarios}</div>
                          )}
                          {modulo.limite_registros && (
                            <div>Límite registros: {modulo.limite_registros}</div>
                          )}
                          {!modulo.limite_usuarios && !modulo.limite_registros && (
                            <div className="text-gray-400">Sin límites configurados</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">No activado</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center gap-2">
                        {modulo.activo_en_cliente ? (
                          <>
                            <button
                              onClick={() => handleEdit(modulo)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Editar configuración"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeactivate(modulo)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Desactivar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleActivate(modulo)}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            title="Activar módulo"
                          >
                            <Plus className="h-4 w-4" />
                            Activar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No se encontraron módulos</p>
                    {searchTerm && (
                      <p className="mt-1">Intenta ajustar los términos de búsqueda</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
};

export default ClientModulesTab;


