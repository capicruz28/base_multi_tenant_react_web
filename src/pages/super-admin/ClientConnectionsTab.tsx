/**
 * Componente para gestionar conexiones de base de datos de un cliente
 * Muestra todas las conexiones configuradas y permite crear, editar y probar conexiones
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  Database,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  Search,
  Server,
  Package
} from 'lucide-react';
import { conexionService } from '../../services/conexion.service';
import { moduloService } from '../../services/modulo.service';
import { Conexion } from '../../types/conexion.types';
import { Modulo } from '../../types/modulo.types';
import { getErrorMessage } from '../../services/error.service';
import CreateConnectionModal from './CreateConnectionModal';
import EditConnectionModal from './EditConnectionModal';

interface ClientConnectionsTabProps {
  clienteId: number;
}

const ClientConnectionsTab: React.FC<ClientConnectionsTabProps> = ({ clienteId }) => {
  const [conexiones, setConexiones] = useState<Conexion[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterModulo, setFilterModulo] = useState<number | null>(null);
  
  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedConexion, setSelectedConexion] = useState<Conexion | null>(null);

  const fetchConexiones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await conexionService.getConexiones(clienteId);
      setConexiones(data);
    } catch (err) {
      console.error('Error fetching client connections:', err);
      const errorData = getErrorMessage(err);
      setError(errorData.message || 'Error al cargar las conexiones');
      toast.error(errorData.message || 'Error al cargar las conexiones');
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  const fetchModulos = useCallback(async () => {
    try {
      const data = await moduloService.getModulos(1, 100, true);
      setModulos(data.data);
    } catch (err) {
      console.error('Error fetching modules:', err);
    }
  }, []);

  useEffect(() => {
    fetchConexiones();
    fetchModulos();
  }, [fetchConexiones, fetchModulos]);


  const handleEdit = (conexion: Conexion) => {
    setSelectedConexion(conexion);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (conexion: Conexion) => {
    if (!window.confirm(`¿Estás seguro de desactivar la conexión a "${conexion.nombre_bd}"?`)) {
      return;
    }

    try {
      await conexionService.deleteConexion(conexion.conexion_id);
      toast.success('Conexión desactivada exitosamente');
      fetchConexiones();
    } catch (err) {
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al desactivar la conexión');
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchConexiones();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedConexion(null);
    fetchConexiones();
  };

  // Filtrar conexiones
  const filteredConexiones = conexiones.filter(conexion => {
    const matchesSearch = !searchTerm || 
      conexion.servidor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conexion.nombre_bd.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModulo = filterModulo === null || conexion.modulo_id === filterModulo;
    
    return matchesSearch && matchesModulo;
  });

  const getModuloNombre = (moduloId: number): string => {
    const modulo = modulos.find(m => m.modulo_id === moduloId);
    return modulo ? modulo.nombre : `Módulo ${moduloId}`;
  };

  const getEstadoConexion = (conexion: Conexion): { label: string; color: string; icon: any } => {
    if (!conexion.es_activo) {
      return {
        label: 'Inactiva',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        icon: XCircle
      };
    }
    
    if (conexion.ultimo_error) {
      return {
        label: 'Error',
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: AlertTriangle
      };
    }
    
    if (conexion.ultima_conexion_exitosa) {
      return {
        label: 'Conectada',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: CheckCircle
      };
    }
    
    return {
      label: 'No probada',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      icon: AlertTriangle
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin h-8 w-8 text-indigo-600" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando conexiones...</span>
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
          onClick={fetchConexiones}
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
            <Database className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Conexiones</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{conexiones.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Activas</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {conexiones.filter(c => c.es_activo).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <Server className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Principales</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {conexiones.filter(c => c.es_conexion_principal).length}
              </p>
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
                placeholder="Buscar conexiones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterModulo || ''}
                onChange={(e) => setFilterModulo(e.target.value ? parseInt(e.target.value) : null)}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos los módulos</option>
                {modulos.map(modulo => (
                  <option key={modulo.modulo_id} value={modulo.modulo_id}>
                    {modulo.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <button
              onClick={fetchConexiones}
              disabled={loading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nueva Conexión
            </button>
          </div>
        </div>
      </div>

      {/* Lista de conexiones */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Conexión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Módulo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Última Conexión
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredConexiones.length > 0 ? (
                filteredConexiones.map((conexion) => {
                  const estado = getEstadoConexion(conexion);
                  const EstadoIcon = estado.icon;
                  
                  return (
                    <tr key={conexion.conexion_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                            <Database className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {conexion.nombre_bd}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {conexion.servidor}:{conexion.puerto}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {conexion.tipo_bd.toUpperCase()}
                              {conexion.es_conexion_principal && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  Principal
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {getModuloNombre(conexion.modulo_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estado.color}`}>
                          <EstadoIcon className="h-3 w-3 mr-1" />
                          {estado.label}
                        </span>
                        {conexion.ultimo_error && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1 max-w-xs truncate">
                            {conexion.ultimo_error}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {conexion.ultima_conexion_exitosa ? (
                          <div>
                            <div>{new Date(conexion.ultima_conexion_exitosa).toLocaleDateString()}</div>
                            <div className="text-xs">{new Date(conexion.ultima_conexion_exitosa).toLocaleTimeString()}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Nunca</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleEdit(conexion)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Editar"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(conexion)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Desactivar"
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
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No se encontraron conexiones</p>
                    {searchTerm && (
                      <p className="mt-1">Intenta ajustar los términos de búsqueda</p>
                    )}
                    {!searchTerm && (
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Crear primera conexión
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {isCreateModalOpen && (
        <CreateConnectionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
          clienteId={clienteId}
        />
      )}

      {isEditModalOpen && selectedConexion && (
        <EditConnectionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedConexion(null);
          }}
          onSuccess={handleEditSuccess}
          conexion={selectedConexion}
        />
      )}
    </div>
  );
};

export default ClientConnectionsTab;


