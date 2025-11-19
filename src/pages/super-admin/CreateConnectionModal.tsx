import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Database, Loader, TestTube } from 'lucide-react';
import { conexionService } from '../../services/conexion.service';
import { moduloService } from '../../services/modulo.service';
import { ConexionCreate } from '../../types/conexion.types';
import { Modulo } from '../../types/modulo.types';
import { getErrorMessage } from '../../services/error.service';

interface CreateConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clienteId: number;
}

/**
 * Modal para crear nueva conexión de base de datos
 * 
 * Permite configurar y probar conexiones a bases de datos para clientes específicos
 * 
 * @component
 * @param {CreateConnectionModalProps} props - Propiedades del modal
 * @returns {JSX.Element | null} Modal de creación de conexión
 */
const CreateConnectionModal: React.FC<CreateConnectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clienteId
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loadingModulos, setLoadingModulos] = useState<boolean>(true);
  
  const [formData, setFormData] = useState<ConexionCreate>({
    cliente_id: clienteId,
    modulo_id: 0,
    servidor: '',
    puerto: 1433,
    nombre_bd: '',
    usuario: '',
    contrasena: '',
    tipo_bd: 'sqlserver',
    usa_ssl: false,
    timeout_segundos: 30,
    max_pool_size: 100,
    es_solo_lectura: false,
    es_conexion_principal: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Carga los módulos disponibles cuando se abre el modal
   */
  useEffect(() => {
    const fetchModulos = async () => {
      if (!isOpen) return;
      
      setLoadingModulos(true);
      try {
        console.log('🔄 Cargando módulos disponibles...');
        const data = await moduloService.getModulos(1, 100);
        const modulosActivos = data.modulos.filter(m => m.es_activo);
        setModulos(modulosActivos);
        console.log(`✅ ${modulosActivos.length} módulos cargados`);
      } catch (error) {
        console.error('❌ Error cargando módulos:', error);
        toast.error('Error al cargar los módulos disponibles');
      } finally {
        setLoadingModulos(false);
      }
    };

    fetchModulos();
  }, [isOpen]);

  /**
   * Resetea el formulario cuando se abre/cierra el modal
   */
  useEffect(() => {
    if (isOpen) {
      setFormData({
        cliente_id: clienteId,
        modulo_id: 0,
        servidor: '',
        puerto: 1433,
        nombre_bd: '',
        usuario: '',
        contrasena: '',
        tipo_bd: 'sqlserver',
        usa_ssl: false,
        timeout_segundos: 30,
        max_pool_size: 100,
        es_solo_lectura: false,
        es_conexion_principal: false
      });
      setErrors({});
      console.log('🔄 Formulario de creación reseteado');
    }
  }, [isOpen, clienteId]);

  /**
   * Maneja cambios en los campos del formulario
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
               type === 'number' ? parseInt(value) || 0 : value
    }));

    // Limpiar error del campo cuando se modifique
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Valida el formulario antes de enviar
   * 
   * @returns {boolean} True si el formulario es válido
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.modulo_id) {
      newErrors.modulo_id = 'Debe seleccionar un módulo';
    }

    if (!formData.servidor.trim()) {
      newErrors.servidor = 'El servidor es requerido';
    }

    if (!formData.puerto || formData.puerto < 1 || formData.puerto > 65535) {
      newErrors.puerto = 'El puerto debe estar entre 1 y 65535';
    }

    if (!formData.nombre_bd.trim()) {
      newErrors.nombre_bd = 'El nombre de la base de datos es requerido';
    }

    if (!formData.usuario.trim()) {
      newErrors.usuario = 'El usuario es requerido';
    }

    if (!formData.contrasena.trim()) {
      newErrors.contrasena = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Prueba la conexión con los datos actuales del formulario
   */
  const handleTestConnection = async () => {
    if (!validateForm()) {
      toast.error('Por favor, completa todos los campos requeridos para probar la conexión');
      return;
    }

    setTesting(true);
    try {
      console.log('🧪 Probando conexión con datos:', {
        servidor: formData.servidor,
        nombre_bd: formData.nombre_bd,
        modulo_id: formData.modulo_id
      });
      
      // ✅ CORREGIDO: Servicio actualizado
      const result = await conexionService.testConexion(formData);
      
      if (result.exito) {
        console.log('✅ Prueba de conexión exitosa');
        toast.success(`✅ Conexión exitosa: ${result.mensaje}`);
      } else {
        console.warn('⚠️ Prueba de conexión fallida:', result.mensaje);
        toast.error(`❌ Error de conexión: ${result.mensaje}`);
      }
    } catch (error) {
      console.error('❌ Error probando conexión:', error);
      const errorData = getErrorMessage(error);
      toast.error(`❌ Error al probar conexión: ${errorData.message}`);
    } finally {
      setTesting(false);
    }
  };

  /**
   * Envía el formulario para crear la conexión
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Creando conexión con datos:', {
        cliente_id: formData.cliente_id,
        modulo_id: formData.modulo_id,
        servidor: formData.servidor,
        nombre_bd: formData.nombre_bd
      });
      
      // ✅ CORREGIDO: Servicio actualizado
      await conexionService.createConexion(clienteId, formData);
      
      console.log('✅ Conexión creada exitosamente');
      toast.success('Conexión creada exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Error creando conexión:', error);
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al crear la conexión');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header del Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Crear Nueva Conexión
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={loading || testing}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Selección de Módulo */}
            <div className="md:col-span-2">
              <label htmlFor="modulo_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Módulo *
              </label>
              <select
                id="modulo_id"
                name="modulo_id"
                value={formData.modulo_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                  errors.modulo_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={loading || testing || loadingModulos}
              >
                <option value={0}>Seleccionar módulo...</option>
                {modulos.map(modulo => (
                  <option key={modulo.modulo_id} value={modulo.modulo_id}>
                    {modulo.nombre} ({modulo.codigo_modulo})
                  </option>
                ))}
              </select>
              {errors.modulo_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.modulo_id}</p>
              )}
              {loadingModulos && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Cargando módulos...</p>
              )}
            </div>

            {/* Información del Servidor */}
            <div>
              <label htmlFor="servidor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Servidor *
              </label>
              <input
                type="text"
                id="servidor"
                name="servidor"
                value={formData.servidor}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                  errors.servidor ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="localhost, 192.168.1.100, sql.server.com"
                disabled={loading || testing}
              />
              {errors.servidor && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.servidor}</p>
              )}
            </div>

            <div>
              <label htmlFor="puerto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Puerto *
              </label>
              <input
                type="number"
                id="puerto"
                name="puerto"
                value={formData.puerto}
                onChange={handleInputChange}
                min="1"
                max="65535"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                  errors.puerto ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={loading || testing}
              />
              {errors.puerto && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.puerto}</p>
              )}
            </div>

            <div>
              <label htmlFor="nombre_bd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Base de Datos *
              </label>
              <input
                type="text"
                id="nombre_bd"
                name="nombre_bd"
                value={formData.nombre_bd}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                  errors.nombre_bd ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="nombre_base_datos"
                disabled={loading || testing}
              />
              {errors.nombre_bd && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre_bd}</p>
              )}
            </div>

            <div>
              <label htmlFor="tipo_bd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Base de Datos
              </label>
              <select
                id="tipo_bd"
                name="tipo_bd"
                value={formData.tipo_bd}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                disabled={loading || testing}
              >
                <option value="sqlserver">SQL Server</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="oracle">Oracle</option>
              </select>
            </div>

            {/* Credenciales */}
            <div>
              <label htmlFor="usuario" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Usuario *
              </label>
              <input
                type="text"
                id="usuario"
                name="usuario"
                value={formData.usuario}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                  errors.usuario ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="usuario_bd"
                disabled={loading || testing}
              />
              {errors.usuario && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.usuario}</p>
              )}
            </div>

            <div>
              <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña *
              </label>
              <input
                type="password"
                id="contrasena"
                name="contrasena"
                value={formData.contrasena}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                  errors.contrasena ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="••••••••"
                disabled={loading || testing}
              />
              {errors.contrasena && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contrasena}</p>
              )}
            </div>

            {/* Configuración Avanzada */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Configuración Avanzada
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="timeout_segundos" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Timeout (segundos)
                  </label>
                  <input
                    type="number"
                    id="timeout_segundos"
                    name="timeout_segundos"
                    value={formData.timeout_segundos}
                    onChange={handleInputChange}
                    min="1"
                    max="300"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading || testing}
                  />
                </div>

                <div>
                  <label htmlFor="max_pool_size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Pool Size
                  </label>
                  <input
                    type="number"
                    id="max_pool_size"
                    name="max_pool_size"
                    value={formData.max_pool_size}
                    onChange={handleInputChange}
                    min="1"
                    max="1000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading || testing}
                  />
                </div>
              </div>
            </div>

            {/* Opciones de Configuración */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="usa_ssl"
                  name="usa_ssl"
                  checked={formData.usa_ssl}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={loading || testing}
                />
                <label htmlFor="usa_ssl" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Usar SSL/TLS
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="es_solo_lectura"
                  name="es_solo_lectura"
                  checked={formData.es_solo_lectura}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={loading || testing}
                />
                <label htmlFor="es_solo_lectura" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Conexión solo lectura
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="es_conexion_principal"
                  name="es_conexion_principal"
                  checked={formData.es_conexion_principal}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={loading || testing}
                />
                <label htmlFor="es_conexion_principal" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Conexión principal del módulo
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                Solo puede haber una conexión principal por módulo.
              </p>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={loading || testing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {testing && <Loader className="h-4 w-4 animate-spin" />}
              <TestTube className="h-4 w-4" />
              {testing ? 'Probando...' : 'Probar Conexión'}
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || testing}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || testing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading && <Loader className="h-4 w-4 animate-spin" />}
                {loading ? 'Creando...' : 'Crear Conexión'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateConnectionModal;