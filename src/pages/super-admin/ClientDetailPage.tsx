import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft,
  Building,
  Users,
  Package,
  Database,
  Activity,
  Edit3,
  RefreshCw,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  Phone,
  Globe
} from 'lucide-react';

import { clienteService } from '../../services/cliente.service';
import { Cliente, ClienteStats } from '../../types/cliente.types';
import ClientModulesTab from './ClientModulesTab';
import ClientConnectionsTab from './ClientConnectionsTab';
import ClientUsersTab from './ClientUsersTab';
import ClientAuditTab from './ClientAuditTab';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/error.service';

const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [stats, setStats] = useState<ClienteStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'modulos' | 'conexiones' | 'usuarios' | 'auditoria'>('info');

  // Cargar datos del cliente
  const fetchClienteData = useCallback(async () => {
    if (!isSuperAdmin || !id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Usar id directamente como string (UUID)
      const clienteId = id!;
      
      // Cargar datos en paralelo
      const [clienteData, statsData] = await Promise.all([
        clienteService.getClienteById(clienteId),
        clienteService.getClienteStats(clienteId)
      ]);
      
      setCliente(clienteData);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching client details:', err);
      const errorData = getErrorMessage(err);
      setError(errorData.message || 'Error al cargar los datos del cliente');
      toast.error(errorData.message || 'Error al cargar los datos del cliente');
    } finally {
      setLoading(false);
    }
  }, [id, isSuperAdmin]);

  // Efecto para cargar datos
  useEffect(() => {
    fetchClienteData();
  }, [fetchClienteData]);

  // Handlers
  const handleRefresh = () => {
    fetchClienteData();
  };

  const handleBack = () => {
    navigate('/super-admin/clientes');
  };

  // Si no es super admin
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acceso restringido</h3>
          <p className="mt-1 text-sm text-gray-500">
            No tienes permisos para acceder a los detalles del cliente.
          </p>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8 text-brand-primary" />
        <span className="ml-2 text-gray-600">Cargando información del cliente...</span>
      </div>
    );
  }

  // Error
  if (error || !cliente) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg max-w-md mx-auto">
          {error || 'Cliente no encontrado'}
        </div>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {cliente.nombre_comercial || cliente.razon_social}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {cliente.codigo_cliente} • {cliente.subdominio}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors">
              <Edit3 className="h-4 w-4" />
              Editar
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-brand-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuarios</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.total_usuarios - stats.total_usuarios_inactivos}/{stats.total_usuarios}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Módulos</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.modulos_activos}/{stats.modulos_contratados}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Database className="h-8 w-8 text-brand-secondary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conexiones</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.conexiones_bd}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Último Acceso</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.ultimo_acceso 
                    ? new Date(stats.ultimo_acceso).toLocaleDateString()
                    : 'Nunca'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navegación por pestañas */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'info', name: 'Información General', icon: Building },
            { id: 'modulos', name: 'Módulos', icon: Package },
            { id: 'conexiones', name: 'Conexiones', icon: Database },
            { id: 'usuarios', name: 'Usuarios', icon: Users },
            { id: 'auditoria', name: 'Auditoría', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-brand-primary text-brand-primary dark:text-brand-primary'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido de pestañas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Información General */}
        {activeTab === 'info' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información básica */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Información Básica
                </h3>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Razón Social</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{cliente.razon_social}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre Comercial</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {cliente.nombre_comercial || 'No especificado'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">RUC</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {cliente.ruc || 'No especificado'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Subdominio</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {cliente.subdominio}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Configuración y estado */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Configuración y Estado
                </h3>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan de Suscripción</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        cliente.plan_suscripcion === 'enterprise' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : cliente.plan_suscripcion === 'profesional'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : cliente.plan_suscripcion === 'basico'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {cliente.plan_suscripcion}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado de Suscripción</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cliente.estado_suscripcion === 'activo'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : cliente.estado_suscripcion === 'trial'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {cliente.estado_suscripcion}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Instalación</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                      {cliente.tipo_instalacion}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Modo de Autenticación</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                      {cliente.modo_autenticacion}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Información de contacto */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Contacto
                </h3>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Contacto Principal</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {cliente.contacto_nombre || 'No especificado'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {cliente.contacto_email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Teléfono</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {cliente.contacto_telefono || 'No especificado'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Fechas y estados */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Fechas y Estados
                </h3>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Creación</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(cliente.fecha_creacion).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Última Actualización</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {cliente.fecha_actualizacion 
                        ? new Date(cliente.fecha_actualizacion).toLocaleDateString()
                        : 'Nunca'
                      }
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Último Acceso</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {cliente.fecha_ultimo_acceso
                        ? new Date(cliente.fecha_ultimo_acceso).toLocaleDateString()
                        : 'Nunca'
                      }
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado del Cliente</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cliente.es_activo
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {cliente.es_activo ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactivo
                          </>
                        )}
                      </span>
                      {cliente.es_demo && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Demo
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* Módulos */}
        {activeTab === 'modulos' && cliente && (
          <div className="p-6">
            <ClientModulesTab clienteId={cliente.cliente_id} />
          </div>
        )}

        {/* Conexiones */}
        {activeTab === 'conexiones' && cliente && (
          <div className="p-6">
            <ClientConnectionsTab clienteId={cliente.cliente_id} />
          </div>
        )}

        {/* Usuarios */}
        {activeTab === 'usuarios' && cliente && (
          <div className="p-6">
            <ClientUsersTab clienteId={cliente.cliente_id} />
          </div>
        )}

        {/* Auditoría */}
        {activeTab === 'auditoria' && cliente && (
          <div className="p-6">
            <ClientAuditTab clienteId={cliente.cliente_id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetailPage;