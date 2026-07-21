import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Database, Loader, TestTube, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { conexionService } from '../services/conexion.service';
import { ConexionCreate } from '../types/conexion.types';
import type { Cliente } from '../types/cliente.types';
import {
  FORM_VALIDATION_TOAST_MESSAGE,
  getApiErrorCode,
  getErrorMessage,
  getValidationErrors,
} from '@/core/services/error.service';
import { TooltipLabel, Tooltip } from '@/shared/components/ui/Tooltip';
import {
  DEDICATED_CONNECTION_REPAIR_WARNING,
  type ConnectionCreateMode,
} from '../utils/cliente-connection-governance.utils';

const SERVIDOR_MAX_LENGTH = 255;
const NOMBRE_BD_MAX_LENGTH = 100;
const NOMBRE_BD_PATTERN = /^[a-zA-Z0-9_][a-zA-Z0-9_\-.]*$/;
const IPV4_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;
const HOSTNAME_PATTERN =
  /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const IPV6_PATTERN =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(([0-9a-fA-F]{1,4}:){1,7}:)|(([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2})|(([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3})|(([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4})|(([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5})|([0-9a-fA-F]{1,4}:)(:[0-9a-fA-F]{1,4}){1,6}|:(:[0-9a-fA-F]{1,4}){1,7}|::)$/;

function isValidServidor(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return IPV6_PATTERN.test(trimmed.slice(1, -1));
  }
  return (
    IPV4_PATTERN.test(trimmed) ||
    IPV6_PATTERN.test(trimmed) ||
    HOSTNAME_PATTERN.test(trimmed)
  );
}

function createInitialFormState(
  clienteId: string,
  tipoInstalacion: Cliente['tipo_instalacion'],
): ConexionCreate {
  return {
    cliente_id: clienteId,
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
    es_conexion_principal: tipoInstalacion === 'dedicated',
  };
}

function buildConexionCreatePayload(
  formData: ConexionCreate,
  clienteId: string,
): ConexionCreate {
  return {
    cliente_id: clienteId,
    servidor: formData.servidor.trim(),
    puerto: formData.puerto,
    nombre_bd: formData.nombre_bd.trim(),
    usuario: formData.usuario,
    password: formData.password,
    tipo_bd: formData.tipo_bd,
    usa_ssl: formData.usa_ssl,
    timeout_segundos: formData.timeout_segundos,
    max_pool_size: formData.max_pool_size,
    es_solo_lectura: formData.es_solo_lectura,
    es_conexion_principal: formData.es_conexion_principal,
  };
}

interface CreateConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clienteId: string;
  tipoInstalacion: Cliente['tipo_instalacion'];
  mode?: ConnectionCreateMode;
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
  clienteId,
  tipoInstalacion,
  mode = 'standard',
}) => {
  const isRepairMode = mode === 'repair';
  const [loading, setLoading] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);

  const [formData, setFormData] = useState<ConexionCreate>(() =>
    createInitialFormState(clienteId, tipoInstalacion),
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Resetea el formulario cuando se abre/cierra el modal
   */
  useEffect(() => {
    if (isOpen) {
      setFormData(createInitialFormState(clienteId, tipoInstalacion));
      setErrors({});
      console.log('🔄 Formulario de creación reseteado');
    }
  }, [isOpen, clienteId, tipoInstalacion]);

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

    const servidorTrimmed = formData.servidor.trim();
    if (!servidorTrimmed) {
      newErrors.servidor = 'El servidor es requerido';
    } else if (servidorTrimmed.length > SERVIDOR_MAX_LENGTH) {
      newErrors.servidor = `El servidor no puede superar ${SERVIDOR_MAX_LENGTH} caracteres`;
    } else if (!isValidServidor(servidorTrimmed)) {
      newErrors.servidor = 'Ingresa un hostname, IPv4 o IPv6 válido';
    }

    if (!formData.puerto || formData.puerto < 1 || formData.puerto > 65535) {
      newErrors.puerto = 'El puerto debe estar entre 1 y 65535';
    }

    const nombreBdTrimmed = formData.nombre_bd.trim();
    if (!nombreBdTrimmed) {
      newErrors.nombre_bd = 'El nombre de la base de datos es requerido';
    } else if (nombreBdTrimmed.length > NOMBRE_BD_MAX_LENGTH) {
      newErrors.nombre_bd = `El nombre no puede superar ${NOMBRE_BD_MAX_LENGTH} caracteres`;
    } else if (!NOMBRE_BD_PATTERN.test(nombreBdTrimmed)) {
      newErrors.nombre_bd =
        'Use solo letras, números, guiones, puntos o guiones bajos; debe comenzar con letra, número o _';
    }

    if (
      formData.timeout_segundos !== undefined &&
      (formData.timeout_segundos < 5 || formData.timeout_segundos > 300)
    ) {
      newErrors.timeout_segundos = 'El timeout debe estar entre 5 y 300 segundos';
    }

    if (
      formData.max_pool_size !== undefined &&
      (formData.max_pool_size < 1 || formData.max_pool_size > 1000)
    ) {
      newErrors.max_pool_size = 'Max pool size debe estar entre 1 y 1000';
    }

    if (!formData.usuario.trim()) {
      newErrors.usuario = 'El usuario es requerido';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    }

    if (tipoInstalacion === 'dedicated' && !formData.es_conexion_principal) {
      newErrors.es_conexion_principal =
        'Para clientes dedicated, la conexión debe marcarse como principal';
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
      const payload = buildConexionCreatePayload(formData, clienteId);

      console.log('🔄 Creando conexión con datos:', {
        cliente_id: payload.cliente_id,
        servidor: payload.servidor,
        nombre_bd: payload.nombre_bd,
        es_conexion_principal: payload.es_conexion_principal,
      });

      await conexionService.createConexion(clienteId, payload);

      console.log('✅ Conexión creada exitosamente');
      toast.success('Conexión creada exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Error creando conexión:', error);

      if (getApiErrorCode(error) === 'PRIMARY_CONNECTION_CONFLICT') {
        toast.error(
          getErrorMessage(error).message ||
            'Ya existe una conexión principal activa para este cliente.',
        );
        return;
      }

      const validation = getValidationErrors(error);
      if (Object.keys(validation.fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...validation.fieldErrors }));
        toast.error(FORM_VALIDATION_TOAST_MESSAGE);
        return;
      }

      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al crear la conexión');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header del Modal */}
        <div className="flex items-center justify-between p-6 border-b border-border-base">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-brand-primary" />
            <h2 className="text-xl font-semibold text-text-base">
              {isRepairMode ? 'Reparar conexión principal' : 'Crear Nueva Conexión'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-overlay dark:hover:bg-overlay rounded-lg transition-colors"
            disabled={loading || testing}
          >
            <X className="h-5 w-5 text-text-soft" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {isRepairMode ? (
            <div
              className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-text-base"
              role="alert"
            >
              {DEDICATED_CONNECTION_REPAIR_WARNING}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información del Servidor */}
            <div>
              <label htmlFor="servidor" className="block text-sm font-medium text-text-soft mb-1">
                Servidor *
              </label>
              <input
                type="text"
                id="servidor"
                name="servidor"
                value={formData.servidor}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${errors.servidor ? 'border-error' : 'border-border-base'
                  }`}
                placeholder="localhost, 192.168.1.100, sql.server.com"
                disabled={loading || testing}
              />
              {errors.servidor && (
                <p className="mt-1 text-sm text-error">{errors.servidor}</p>
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${errors.puerto ? 'border-error' : 'border-border-base'
                  }`}
                disabled={loading || testing}
              />
              {errors.puerto && (
                <p className="mt-1 text-sm text-error">{errors.puerto}</p>
              )}
            </div>

            <div>
              <label htmlFor="nombre_bd" className="block text-sm font-medium text-text-soft mb-1">
                Base de Datos *
              </label>
              <input
                type="text"
                id="nombre_bd"
                name="nombre_bd"
                value={formData.nombre_bd}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${errors.nombre_bd ? 'border-error' : 'border-border-base'
                  }`}
                placeholder="nombre_base_datos"
                disabled={loading || testing}
              />
              {errors.nombre_bd && (
                <p className="mt-1 text-sm text-error">{errors.nombre_bd}</p>
              )}
            </div>

            <div>
              <label htmlFor="tipo_bd" className="block text-sm font-medium text-text-soft mb-1">
                Tipo de Base de Datos
              </label>
              <select
                id="tipo_bd"
                name="tipo_bd"
                value={formData.tipo_bd}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base"
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
              <label htmlFor="usuario" className="block text-sm font-medium text-text-soft mb-1">
                Usuario *
              </label>
              <input
                type="text"
                id="usuario"
                name="usuario"
                value={formData.usuario}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${errors.usuario ? 'border-error' : 'border-border-base'
                  }`}
                placeholder="usuario_bd"
                disabled={loading || testing}
              />
              {errors.usuario && (
                <p className="mt-1 text-sm text-error">{errors.usuario}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-soft mb-1">
                Contraseña *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${errors.password ? 'border-error' : 'border-border-base'
                  }`}
                placeholder="••••••••"
                disabled={loading || testing}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-error">{errors.password}</p>
              )}
            </div>

            {/* Toggle Modo Simple/Avanzado */}
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                className="flex items-center justify-between w-full p-3 text-left bg-subtle rounded-lg hover:bg-overlay/80 dark:hover:bg-overlay transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-text-soft" />
                  <span className="text-sm font-medium text-text-soft">
                    {isAdvancedMode ? 'Modo Avanzado' : 'Modo Simple'}
                  </span>
                </div>
                {isAdvancedMode ? (
                  <ChevronUp className="h-4 w-4 text-text-soft" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-soft" />
                )}
              </button>
              <p className="mt-2 text-xs text-text-soft">
                {isAdvancedMode 
                  ? 'Mostrando todas las opciones de configuración avanzada'
                  : 'Mostrando solo campos esenciales. Activa el modo avanzado para más opciones.'}
              </p>
            </div>

            {/* Configuración Avanzada */}
            {isAdvancedMode && (
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-text-base mb-4">
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
                    min="5"
                    max="300"
                    className="w-full px-3 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base"
                    disabled={loading || testing}
                  />
                  {errors.timeout_segundos && (
                    <p className="mt-1 text-sm text-error">{errors.timeout_segundos}</p>
                  )}
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
                    className="w-full px-3 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base"
                    disabled={loading || testing}
                  />
                  {errors.max_pool_size && (
                    <p className="mt-1 text-sm text-error">{errors.max_pool_size}</p>
                  )}
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
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-border-base rounded"
                  disabled={loading || testing}
                />
                <label htmlFor="usa_ssl" className="ml-2 flex text-sm text-text-base items-center gap-2">
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
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-border-base rounded"
                  disabled={loading || testing}
                />
                <label htmlFor="es_solo_lectura" className="ml-2 flex text-sm text-text-base items-center gap-2">
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
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-border-base rounded"
                  disabled={loading || testing}
                />
                <label htmlFor="es_conexion_principal" className="ml-2 block text-sm text-text-base">
                  Conexión principal del módulo
                </label>
              </div>
              <p className="text-xs text-text-soft ml-6">
                Solo puede haber una conexión principal por módulo.
              </p>
              {errors.es_conexion_principal && (
                <p className="text-sm text-error ml-6">{errors.es_conexion_principal}</p>
              )}
            </div>
            )}
          </div>

          {/* Footer del Modal */}
          <div className="flex justify-between pt-6 border-t border-border-base">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={loading || testing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-info bg-info/10 border border-info/30 rounded-lg hover:bg-info/15 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-info disabled:opacity-50"
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
                className="px-4 py-2 text-sm font-medium text-white bg-brand-secondary border border-transparent rounded-lg hover:bg-brand-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-brand-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || testing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-lg hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-brand-primary disabled:opacity-50"
              >
                {loading && <Loader className="h-4 w-4 animate-spin" />}
                {loading ? 'Creando...' : isRepairMode ? 'Registrar conexión (repair)' : 'Crear Conexión'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateConnectionModal;