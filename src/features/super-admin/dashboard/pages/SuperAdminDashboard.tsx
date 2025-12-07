import React from 'react';
import { 
  Building, 
  Users, 
  Package, 
  Database, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';

const SuperAdminDashboard: React.FC = () => {
  const { isSuperAdmin } = useAuth();

  // Datos de ejemplo para el dashboard
  const stats = {
    totalClientes: 5,
    clientesActivos: 4,
    totalUsuarios: 25,
    usuariosActivos: 22,
    totalModulos: 8,
    modulosActivos: 6,
    conexionesActivas: 12,
    alertas: 2
  };

  const actividadReciente = [
    { id: 1, cliente: 'ACME Corp', accion: 'Nuevo usuario creado', fecha: '2024-01-15 14:30' },
    { id: 2, cliente: 'Tech Corp', accion: 'Módulo activado', fecha: '2024-01-15 13:15' },
    { id: 3, cliente: 'Innova Tech', accion: 'Conexión probada', fecha: '2024-01-15 12:45' },
    { id: 4, cliente: 'Global Solutions', accion: 'Usuario desactivado', fecha: '2024-01-15 11:20' }
  ];

  const alertas = [
    { id: 1, tipo: 'warning', mensaje: 'Licencia próxima a vencer en ACME Corp', fecha: '2024-01-20' },
    { id: 2, tipo: 'error', mensaje: 'Error de conexión en Tech Corp - Módulo Planillas', fecha: '2024-01-15' }
  ];

  // Si no es super admin
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acceso restringido</h3>
          <p className="mt-1 text-sm text-gray-500">
            No tienes permisos para acceder al dashboard de super administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard de Super Administrador
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Visión general del sistema multi-tenant
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building className="h-8 w-8 text-brand-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Clientes</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalClientes}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {stats.clientesActivos} activos
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Usuarios</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalUsuarios}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {stats.usuariosActivos} activos
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Módulos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalModulos}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {stats.modulosActivos} activos
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Database className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conexiones</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.conexionesActivas}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Todas activas
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Alertas y notificaciones */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Alertas del Sistema
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                stats.alertas > 0 
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}>
                {stats.alertas > 0 ? `${stats.alertas} alertas` : 'Todo en orden'}
              </span>
            </div>
          </div>
          <div className="p-6">
            {alertas.length > 0 ? (
              <div className="space-y-4">
                {alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      alerta.tipo === 'error' ? 'text-red-500' : 'text-yellow-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {alerta.mensaje}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Vence: {alerta.fecha}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay alertas activas en el sistema
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Actividad Reciente
            </h3>
          </div>
          <div className="p-6">
            {actividadReciente.length > 0 ? (
              <div className="space-y-4">
                {actividadReciente.map((actividad) => (
                  <div key={actividad.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Activity className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {actividad.cliente}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {actividad.accion}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {actividad.fecha.split(' ')[1]}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Activity className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay actividad reciente
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Building className="h-6 w-6 text-brand-primary mr-3" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Gestionar Clientes
            </span>
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Package className="h-6 w-6 text-green-600 mr-3" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Gestionar Módulos
            </span>
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Database className="h-6 w-6 text-purple-600 mr-3" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Gestionar Conexiones
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;