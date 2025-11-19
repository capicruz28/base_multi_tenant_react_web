import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw,
  Database,
  Server,
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

import { conexionService } from '../../services/conexion.service';
import { clienteService } from '../../services/cliente.service';
import { moduloService } from '../../services/modulo.service';
import { Conexion } from '../../types/conexion.types';
import { Cliente } from '../../types/cliente.types';
import { Modulo } from '../../types/modulo.types';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/error.service';
import CreateConnectionModal from './CreateConnectionModal';
import EditConnectionModal from './EditConnectionModal';

/**
 * Página de gestión de conexiones de base de datos (Super Admin)
 * 
 * Permite a los super administradores gestionar las conexiones a bases de datos
 * por cliente y módulo, incluyendo creación, edición, prueba y eliminación.
 * 
 * @component
 * @returns {JSX.Element} Componente de gestión de conexiones
 */
const ConnectionManagementPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  
  const [conexiones, setConexiones] = useState<Conexion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]); // ✅ NUEVO: Estado para módulos
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingModulos, setLoadingModulos] = useState<boolean>(false); // ✅ NUEVO
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros y búsqueda
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Estados para modales y acciones
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedConexion, setSelectedConexion] = useState<Conexion | null>(null);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);

  /**
   * Carga la lista de clientes disponibles
   */
  const fetchClientes = useCallback(async () => {
    if (!isSuperAdmin) return;
    
    try {
      console.log('🔄 Cargando lista de clientes...');
      const data = await clienteService.getClientes(1, 100);
      setClientes(data.clientes || []);
      
      if (data.clientes?.length > 0 && !selectedClienteId) {
        setSelectedClienteId(data.clientes[0].cliente_id);
        console.log('✅ Cliente seleccionado por defecto:', data.clientes[0].cliente_id);
      }
    } catch (err) {
      console.error('❌ Error cargando clientes:', err);
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al cargar los clientes');
    }
  }, [isSuperAdmin, selectedClienteId]);

  /**
   * Carga la lista de módulos disponibles
   */
  const fetchModulos = useCallback(async () => {
    if (!isSuperAdmin) return;
    
    setLoadingModulos(true);
    try {
      console.log('🔄 Cargando información de módulos...');
      const data = await moduloService.getModulos(1, 100);
      setModulos(data.modulos || []);
      console.log(`✅ ${data.modulos?.length || 0} módulos cargados`);
    } catch (err) {
      console.error('❌ Error cargando módulos:', err);
      toast.error('Error al cargar información de módulos');
    } finally {
      setLoadingModulos(false);
    }
  }, [isSuperAdmin]);

  /**
   * Obtiene la información del módulo basado en modulo_id
   */
  const getModuloInfo = (moduloId: number) => {
    const modulo = modulos.find(m => m.modulo_id === moduloId);
    return {
      nombre: modulo?.nombre || `Módulo ID: ${moduloId}`,
      codigo: modulo?.codigo_modulo || 'N/A'
    };
  };

  /**
   * Carga las conexiones del cliente seleccionado
   */
  const fetchConexiones = useCallback(async () => {
    if (!isSuperAdmin || !selectedClienteId) {
      setLoading(false);
      setConexiones([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Cargando conexiones para cliente: ${selectedClienteId}`);
      
      const conexionesData: Conexion[] = await conexionService.getConexiones(selectedClienteId);
      console.log(`✅ ${conexionesData?.length || 0} conexiones cargadas`);
      
      const conexionesArray = conexionesData || [];
      
      // Aplicar filtro de búsqueda localmente
      let filteredConexiones = conexionesArray;
      if (searchTerm) {
        filteredConexiones = conexionesArray.filter(conexion => {
          const moduloInfo = getModuloInfo(conexion.modulo_id);
          return (
            conexion.servidor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conexion.nombre_bd.toLowerCase().includes(searchTerm.toLowerCase()) ||
            moduloInfo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            moduloInfo.codigo.toLowerCase().includes(searchTerm.toLowerCase())
          );
        });
        console.log(`🔍 ${filteredConexiones.length} conexiones después de filtrar`);
      }
      
      setConexiones(filteredConexiones);
    } catch (err) {
      console.error('❌ Error cargando conexiones:', err);
      const errorData = getErrorMessage(err);
      setError(errorData.message || 'Error al cargar las conexiones');
      toast.error(errorData.message || 'Error al cargar las conexiones');
      setConexiones([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClienteId, searchTerm, isSuperAdmin, modulos]); // ✅ AGREGAR modulos a las dependencias

  /**
   * Efectos para cargar datos
   */
  useEffect(() => {
    fetchClientes();
    fetchModulos(); // ✅ CARGAR MÓDULOS AL INICIO
  }, [fetchClientes, fetchModulos]);

  useEffect(() => {
    if (selectedClienteId) {
      fetchConexiones();
    } else {
      setConexiones([]);
      setLoading(false);
    }
  }, [fetchConexiones, selectedClienteId]);

  /**
   * Maneja el cambio de cliente seleccionado
   */
  const handleClienteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const clienteId = event.target.value ? parseInt(event.target.value) : null;
    setSelectedClienteId(clienteId);
    setSearchTerm(''); // Limpiar búsqueda al cambiar cliente
    console.log(`👤 Cliente seleccionado: ${clienteId}`);
  };

  /**
   * Maneja el cambio en el campo de búsqueda
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  /**
   * Prueba la conectividad de una conexión existente
   */
  const handleTestConnection = async (conexion: Conexion) => {
    setTestingConnection(conexion.conexion_id);
    console.log(`🧪 Probando conexión: ${conexion.conexion_id}`);
    
    try {
      const result = await conexionService.testConexionExistente(conexion.conexion_id);
      
      if (result.exito) {
        console.log('✅ Conexión probada exitosamente');
        toast.success(`Conexión probada exitosamente: ${result.mensaje}`);
      } else {
        console.warn('⚠️ Error en prueba de conexión:', result.mensaje);
        toast.error(`Error en conexión: ${result.mensaje}`);
      }
    } catch (err) {
      console.error('❌ Error probando conexión:', err);
      const errorData = getErrorMessage(err);
      toast.error(`Error al probar conexión: ${errorData.message}`);
    } finally {
      setTestingConnection(null);
    }
  };

  /**
   * Maneja el éxito en la creación de conexión
   */
  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchConexiones();
    toast.success('Conexión creada exitosamente');
    console.log('✅ Conexión creada exitosamente');
  };

  /**
   * Maneja el éxito en la edición de conexión
   */
  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedConexion(null);
    fetchConexiones();
    toast.success('Conexión actualizada exitosamente');
    console.log('✅ Conexión actualizada exitosamente');
  };

  /**
   * Maneja la eliminación de una conexión
   */
  const handleDeleteConnection = async (conexion: Conexion) => {
    const confirmMessage = `¿Estás seguro de eliminar la conexión a ${conexion.nombre_bd}?`;
    
    if (!window.confirm(confirmMessage)) {
      console.log('❌ Eliminación cancelada por el usuario');
      return;
    }

    try {
      console.log(`🗑️ Eliminando conexión: ${conexion.conexion_id}`);
      await conexionService.deleteConexion(conexion.conexion_id);
      toast.success('Conexión eliminada exitosamente');
      console.log('✅ Conexión eliminada exitosamente');
      fetchConexiones();
    } catch (err) {
      console.error('❌ Error eliminando conexión:', err);
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al eliminar la conexión');
    }
  };

  /**
   * Abre el modal de edición para una conexión específica
   */
  const openEditModal = (conexion: Conexion) => {
    setSelectedConexion(conexion);
    setIsEditModalOpen(true);
    console.log(`✏️ Abriendo edición para conexión: ${conexion.conexion_id}`);
  };

  // Obtener información del cliente seleccionado
  const selectedCliente = clientes.find(c => c.cliente_id === selectedClienteId);

  // Calcular estadísticas de manera segura
  const conexionesActivas = conexiones.filter(c => c.es_activo).length;
  const totalConexiones = conexiones.length;

  /**
   * Renderizado de acceso denegado para usuarios no super administradores
   */
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Acceso restringido
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No tienes permisos para acceder a la gestión de conexiones.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header de la página */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Conexiones
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Administra las conexiones a bases de datos por cliente y módulo
        </p>
      </div>

      {/* Barra de herramientas con filtros y acciones */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Selector de cliente y búsqueda */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <select
              value={selectedClienteId || ''}
              onChange={handleClienteChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white min-w-[200px]"
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map(cliente => (
                <option key={cliente.cliente_id} value={cliente.cliente_id}>
                  {cliente.nombre_comercial || cliente.razon_social}
                </option>
              ))}
            </select>

            {selectedClienteId && (
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar conexiones..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <button
              onClick={fetchConexiones}
              disabled={loading || !selectedClienteId}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!selectedClienteId}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Nueva Conexión
            </button>
          </div>
        </div>
      </div>

      {/* Información del cliente seleccionado */}
      {selectedCliente && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                {selectedCliente.nombre_comercial || selectedCliente.razon_social}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {selectedCliente.codigo_cliente} • {selectedCliente.subdominio} • {selectedCliente.tipo_instalacion}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {totalConexiones} conexiones configuradas
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {conexionesActivas} activas
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal - Tabla de conexiones */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Estado de carga */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="animate-spin h-6 w-6 text-indigo-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Cargando conexiones...
              {loadingModulos && ' (y información de módulos)'}
            </span>
          </div>
        )}

        {/* Estado de error */}
        {error && !loading && (
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
        )}

        {/* Sin cliente seleccionado */}
        {!selectedClienteId && !loading && (
          <div className="p-8 text-center">
            <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Selecciona un cliente
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Elige un cliente de la lista para ver y gestionar sus conexiones.
            </p>
          </div>
        )}

        {/* Tabla de conexiones */}
        {selectedClienteId && !loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Módulo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Servidor y BD
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Configuración
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
                  {conexiones && conexiones.length > 0 ? (
                    conexiones.map((conexion) => {
                      // ✅ OBTENER INFORMACIÓN DEL MÓDULO
                      const moduloInfo = getModuloInfo(conexion.modulo_id);
                      
                      return (
                        <tr key={conexion.conexion_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          {/* Columna Módulo - ✅ CORREGIDA */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                <Server className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {moduloInfo.nombre}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {moduloInfo.codigo}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          {/* Columna Servidor y Base de Datos */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {conexion.servidor}:{conexion.puerto}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {conexion.nombre_bd}
                            </div>
                          </td>
                          
                          {/* Columna Configuración */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1 text-sm">
                              <span className="capitalize">{conexion.tipo_bd}</span>
                              {conexion.es_conexion_principal && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  Principal
                                </span>
                              )}
                              {conexion.es_solo_lectura && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                  Solo lectura
                                </span>
                              )}
                            </div>
                          </td>
                          
                          {/* Columna Estado */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                conexion.es_activo
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {conexion.es_activo ? (
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
                              {conexion.ultimo_error && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Error
                                </span>
                              )}
                            </div>
                          </td>
                          
                          {/* Columna Última Conexión */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {conexion.ultima_conexion_exitosa ? (
                              <div>
                                <div>Última: {new Date(conexion.ultima_conexion_exitosa).toLocaleDateString()}</div>
                                <div className="text-xs">{new Date(conexion.ultima_conexion_exitosa).toLocaleTimeString()}</div>
                              </div>
                            ) : (
                              'Nunca'
                            )}
                          </td>
                          
                          {/* Columna Acciones */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end items-center gap-2">
                              <button
                                onClick={() => handleTestConnection(conexion)}
                                disabled={testingConnection === conexion.conexion_id}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                                title="Probar conexión"
                              >
                                <TestTube className={`h-4 w-4 ${testingConnection === conexion.conexion_id ? 'animate-pulse' : ''}`} />
                              </button>

                              <button
                                onClick={() => openEditModal(conexion)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Editar"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteConnection(conexion)}
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
                    // Estado sin conexiones
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>No se encontraron conexiones</p>
                        {searchTerm ? (
                          <p className="mt-1">Intenta ajustar los términos de búsqueda</p>
                        ) : (
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
          </>
        )}
      </div>

      {/* Modales */}
      {isCreateModalOpen && selectedClienteId && (
        <CreateConnectionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
          clienteId={selectedClienteId}
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

export default ConnectionManagementPage;