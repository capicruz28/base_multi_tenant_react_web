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
  Server
} from 'lucide-react';
import { conexionService } from '../services/conexion.service';
import { Conexion } from '../types/conexion.types';
import { getErrorMessage } from '@/core/services/error.service';
import CreateConnectionModal from './CreateConnectionModal';
import EditConnectionModal from './EditConnectionModal';

interface ClientConnectionsTabProps {
  clienteId: string;
}

const ClientConnectionsTab: React.FC<ClientConnectionsTabProps> = ({ clienteId }) => {
  const [conexiones, setConexiones] = useState<Conexion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
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

  useEffect(() => {
    fetchConexiones();
  }, [fetchConexiones]);


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
    
    return matchesSearch;
  });

  const getEstadoConexion = (conexion: Conexion): { label: string; color: string; icon: any } => {
    if (!conexion.es_activo) {
      return {
        label: 'Inactiva',
        color: 'bg-subtle text-text-base',
        icon: XCircle
      };
    }
    
    if (conexion.ultimo_error) {
      return {
        label: 'Error',
        color: 'bg-error/10 text-error',
        icon: AlertTriangle
      };
    }
    
    if (conexion.ultima_conexion_exitosa) {
      return {
        label: 'Conectada',
        color: 'bg-success/10 text-success',
        icon: CheckCircle
      };
    }
    
    return {
      label: 'No probada',
      color: 'bg-warning/10 text-warning',
      icon: AlertTriangle
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin h-8 w-8 text-brand-primary" />
        <span className="ml-3 text-text-soft">Cargando conexiones...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-error bg-error/10 p-4 rounded-lg">
          {error}
        </div>
        <button
          onClick={fetchConexiones}
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
        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-brand-primary" />
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">Total Conexiones</p>
              <p className="text-2xl font-semibold text-text-base">{conexiones.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-success" />
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">Activas</p>
              <p className="text-2xl font-semibold text-text-base">
                {conexiones.filter(c => c.es_activo).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <Server className="h-8 w-8 text-info" />
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">Principales</p>
              <p className="text-2xl font-semibold text-text-base">
                {conexiones.filter(c => c.es_conexion_principal).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Búsqueda */}
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
              <input
                type="text"
                placeholder="Buscar conexiones por servidor o base de datos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base"
              />
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <button
              onClick={fetchConexiones}
              disabled={loading}
              className="p-2 text-text-soft hover:text-text-base hover:bg-overlay dark:hover:bg-overlay rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-surface transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nueva Conexión
            </button>
          </div>
        </div>
      </div>

      {/* Lista de conexiones */}
      <div className="bg-surface rounded-lg shadow-sm border border-border-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-subtle">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                  Conexión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                  Última Conexión
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-soft uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {filteredConexiones.length > 0 ? (
                filteredConexiones.map((conexion) => {
                  const estado = getEstadoConexion(conexion);
                  const EstadoIcon = estado.icon;
                  
                  return (
                    <tr key={conexion.conexion_id} className="hover:bg-overlay/50 dark:hover:bg-overlay/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                            <Database className="h-6 w-6 text-brand-primary dark:text-brand-primary" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-text-base">
                              {conexion.nombre_bd}
                            </div>
                            <div className="text-sm text-text-soft">
                              {conexion.servidor}:{conexion.puerto}
                            </div>
                            <div className="text-xs text-text-soft mt-1">
                              {conexion.tipo_bd.toUpperCase()}
                              {conexion.es_conexion_principal && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-info/10 text-info">
                                  Principal
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estado.color}`}>
                          <EstadoIcon className="h-3 w-3 mr-1" />
                          {estado.label}
                        </span>
                        {conexion.ultimo_error && (
                          <div className="text-xs text-error mt-1 max-w-xs truncate">
                            {conexion.ultimo_error}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                        {conexion.ultima_conexion_exitosa ? (
                          <div>
                            <div>{new Date(conexion.ultima_conexion_exitosa).toLocaleDateString()}</div>
                            <div className="text-xs">{new Date(conexion.ultima_conexion_exitosa).toLocaleTimeString()}</div>
                          </div>
                        ) : (
                          <span className="text-text-soft">Nunca</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleEdit(conexion)}
                            className="text-brand-primary hover:text-brand-primary/80 dark:text-brand-primary dark:hover:text-brand-primary/80 p-1 rounded hover:bg-overlay dark:hover:bg-overlay"
                            title="Editar"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(conexion)}
                            className="text-error hover:bg-overlay dark:hover:bg-overlay p-1 rounded hover:bg-overlay dark:hover:bg-overlay"
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
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-text-soft">
                    <Database className="mx-auto h-12 w-12 text-text-soft mb-4" />
                    <p>No se encontraron conexiones</p>
                    {searchTerm && (
                      <p className="mt-1">Intenta ajustar los términos de búsqueda</p>
                    )}
                    {!searchTerm && (
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
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


