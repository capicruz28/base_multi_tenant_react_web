import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Database, Loader, TestTube, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { conexionService } from '../../services/conexion.service';
import { moduloService } from '../../services/modulo.service';
import { ConexionCreate } from '../../types/conexion.types';
import { Modulo } from '../../types/modulo.types';
import { getErrorMessage } from '../../services/error.service';
import { TooltipLabel, Tooltip } from '../../components/ui/Tooltip';

interface CreateConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clienteId: string;
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
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);

  const [formData, setFormData] = useState<ConexionCreate>({
    cliente_id: clienteId,
    modulo_id: 0,
    servidor: '',
    puerto: 1433,
    nombre_bd: '',
    usuario: '',
    password: '',
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
        const data = await moduloService.getModulos(1, 100, true);
        const modulosActivos = data.data.filter((m: Modulo) => m.es_activo);
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
        password: '',
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

    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
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

      // Preparar datos para test
      const testData = {
        servidor: formData.servidor,
        puerto: formData.puerto,
        nombre_bd: formData.nombre_bd,
        usuario: formData.usuario,
        password: formData.password,
        tipo_bd: formData.tipo_bd,
        usa_ssl: formData.usa_ssl,
        timeout_segundos: formData.timeout_segundos
      };

      const result = await conexionService.testConexion(testData);

      if (result.success) {
        console.log('✅ Prueba de conexión exitosa');
        toast.success(`✅ Conexión exitosa: ${result.message || 'La conexión se estableció correctamente'}`);
      } else {
        console.warn('⚠️ Prueba de conexión fallida:', result.message);
        // Mensajes específicos según el tipo de error
        let errorMessage = result.message || 'Error desconocido al probar la conexión';
        
        // Mejorar mensajes comunes de error de conexión
        if (errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('timed out')) {
          errorMessage = `⏱️ Timeout de conexión: El servidor no respondió en ${formData.timeout_segundos} segundos. Verifica que el servidor esté accesible y el firewall permita conexiones en el puerto ${formData.puerto}.`;
        } else if (errorMessage.toLowerCase().includes('login failed') || errorMessage.toLowerCase().includes('authentication')) {
          errorMessage = `🔐 Error de autenticación: Usuario o contraseña incorrectos. Verifica las credenciales y que el usuario tenga permisos en la base de datos "${formData.nombre_bd}".`;
        } else if (errorMessage.toLowerCase().includes('cannot open database') || errorMessage.toLowerCase().includes('database') && errorMessage.toLowerCase().includes('not found')) {
          errorMessage = `📊 Base de datos no encontrada: La base de datos "${formData.nombre_bd}" no existe en el servidor. Verifica el nombre o créala primero.`;
        } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection refused')) {
          errorMessage = `🌐 Error de red: No se pudo conectar al servidor "${formData.servidor}:${formData.puerto}". Verifica que el servidor esté en ejecución y accesible desde esta red.`;
        } else if (errorMessage.toLowerCase().includes('ssl') || errorMessage.toLowerCase().includes('certificate')) {
          errorMessage = `🔒 Error SSL/TLS: Problema con el certificado SSL. Si no usas SSL, desactiva la opción "Usar SSL/TLS". Si lo usas, verifica que el certificado sea válido.`;
        }
        
        toast.error(`❌ ${errorMessage}`, { duration: 6000 });
      }
    } catch (error) {
      console.error('❌ Error probando conexión:', error);
      const errorData = getErrorMessage(error);
      
      // Mensajes específicos según el código de error HTTP
      let errorMessage = errorData.message;
      if (errorData.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet y que el backend esté disponible.';
      } else if (errorData.status === 500) {
        errorMessage = 'Error interno del servidor al probar la conexión. Verifica los logs del servidor o contacta al soporte técnico.';
      }
      
      toast.error(`❌ ${errorMessage}`, { duration: 5000 });
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${errors.modulo_id ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${errors.servidor ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                  }`}
                placeholder="localhost, 192.168.1.100, sql.server.com"
                disabled={loading || testing}
              />
              {errors.servidor && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.servidor}</p>
              )}
            </div>

            <div>
              <TooltipLabel
                htmlFor="puerto"
                label="Puerto"
                tooltip="Puerto de conexión de la base de datos. Valores comunes: SQL Server (1433), PostgreSQL (5432), MySQL (3306), Oracle (1521)"
                required
              />
              <input
                type="number"
                id="puerto"
                name="puerto"
                value={formData.puerto}
                onChange={handleInputChange}
                min="1"
                max="65535"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${errors.puerto ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${errors.nombre_bd ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
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
                className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${errors.usuario ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                  }`}
                placeholder="usuario_bd"
                disabled={loading || testing}
              />
              {errors.usuario && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.usuario}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${errors.password ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                  }`}
                placeholder="••••••••"
                disabled={loading || testing}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Toggle Modo Simple/Avanzado */}
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                className="flex items-center justify-between w-full p-3 text-left bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isAdvancedMode ? 'Modo Avanzado' : 'Modo Simple'}
                  </span>
                </div>
                {isAdvancedMode ? (
                  <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {isAdvancedMode 
                  ? 'Mostrando todas las opciones de configuración avanzada'
                  : 'Mostrando solo campos esenciales. Activa el modo avanzado para más opciones.'}
              </p>
            </div>

            {/* Configuración Avanzada */}
            {isAdvancedMode && (
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Configuración Avanzada
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <TooltipLabel
                    htmlFor="timeout_segundos"
                    label="Timeout (segundos)"
                    tooltip="Tiempo máximo de espera para establecer la conexión. Recomendado: 30-60 segundos para conexiones locales, 60-120 para remotas."
                  />
                  <input
                    type="number"
                    id="timeout_segundos"
                    name="timeout_segundos"
                    value={formData.timeout_segundos}
                    onChange={handleInputChange}
                    min="1"
                    max="300"
                    className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
                    disabled={loading || testing}
                  />
                </div>

                <div>
                  <TooltipLabel
                    htmlFor="max_pool_size"
                    label="Max Pool Size"
                    tooltip="Número máximo de conexiones simultáneas en el pool. Valores comunes: 10-50 para aplicaciones pequeñas, 50-100 para medianas, 100+ para grandes. Mayor valor = más recursos consumidos."
                  />
                  <input
                    type="number"
                    id="max_pool_size"
                    name="max_pool_size"
                    value={formData.max_pool_size}
                    onChange={handleInputChange}
                    min="1"
                    max="1000"
                    className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
                    disabled={loading || testing}
                  />
                </div>
              </div>
            </div>
            )}

            {/* Opciones de Configuración */}
            {isAdvancedMode && (
              <div className="md:col-span-2 space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="usa_ssl"
                  name="usa_ssl"
                  checked={formData.usa_ssl}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                  disabled={loading || testing}
                />
                <label htmlFor="usa_ssl" className="ml-2 block text-sm text-gray-900 dark:text-gray-300 flex items-center gap-2">
                  <span>Usar SSL/TLS</span>
                  <Tooltip content="Habilita conexión cifrada SSL/TLS. Obligatorio para conexiones remotas o en la nube. Requiere certificado válido en el servidor." />
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="es_solo_lectura"
                  name="es_solo_lectura"
                  checked={formData.es_solo_lectura}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                  disabled={loading || testing}
                />
                <label htmlFor="es_solo_lectura" className="ml-2 block text-sm text-gray-900 dark:text-gray-300 flex items-center gap-2">
                  <span>Conexión solo lectura</span>
                  <Tooltip content="Restringe la conexión a operaciones de solo lectura (SELECT). Útil para réplicas de lectura o reportes. Previene modificaciones accidentales." />
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="es_conexion_principal"
                  name="es_conexion_principal"
                  checked={formData.es_conexion_principal}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
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
            )}
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
                className="px-4 py-2 text-sm font-medium text-white bg-brand-secondary border border-transparent rounded-lg hover:bg-brand-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || testing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-lg hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50"
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