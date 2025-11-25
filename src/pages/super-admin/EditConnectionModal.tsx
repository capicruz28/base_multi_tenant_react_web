import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Database, Loader, TestTube } from 'lucide-react';
import { conexionService } from '../../services/conexion.service';
import { Conexion, ConexionUpdate } from '../../types/conexion.types';
import { getErrorMessage } from '../../services/error.service';

interface EditConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  conexion: Conexion;
}

/**
 * Modal para editar conexión de base de datos existente
 * 
 * Permite modificar y probar conexiones a bases de datos existentes
 * 
 * @component
 * @param {EditConnectionModalProps} props - Propiedades del modal
 * @returns {JSX.Element | null} Modal de edición de conexión
 */
const EditConnectionModal: React.FC<EditConnectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  conexion
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<ConexionUpdate>({
    servidor: conexion.servidor,
    puerto: conexion.puerto,
    nombre_bd: conexion.nombre_bd,
    usuario: '',
    password: '',
    tipo_bd: conexion.tipo_bd,
    usa_ssl: conexion.usa_ssl,
    timeout_segundos: conexion.timeout_segundos,
    max_pool_size: conexion.max_pool_size,
    es_solo_lectura: conexion.es_solo_lectura,
    es_conexion_principal: conexion.es_conexion_principal,
    es_activo: conexion.es_activo
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Actualiza el formulario cuando cambia la conexión o se abre el modal
   */
  useEffect(() => {
    if (isOpen && conexion) {
      setFormData({
        servidor: conexion.servidor,
        puerto: conexion.puerto,
        nombre_bd: conexion.nombre_bd,
        usuario: '', // No mostramos el usuario actual por seguridad
        password: '', // No mostramos la contraseña actual por seguridad
        tipo_bd: conexion.tipo_bd,
        usa_ssl: conexion.usa_ssl,
        timeout_segundos: conexion.timeout_segundos,
        max_pool_size: conexion.max_pool_size,
        es_solo_lectura: conexion.es_solo_lectura,
        es_conexion_principal: conexion.es_conexion_principal,
        es_activo: conexion.es_activo
      });
      setErrors({});
      console.log('🔄 Formulario de edición actualizado para conexión:', conexion.conexion_id);
    }
  }, [isOpen, conexion]);

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

    if (formData.servidor !== undefined && !formData.servidor.trim()) {
      newErrors.servidor = 'El servidor es requerido';
    }

    if (formData.puerto !== undefined && (formData.puerto < 1 || formData.puerto > 65535)) {
      newErrors.puerto = 'El puerto debe estar entre 1 y 65535';
    }

    if (formData.nombre_bd !== undefined && !formData.nombre_bd.trim()) {
      newErrors.nombre_bd = 'El nombre de la base de datos es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Prueba la conexión con los datos actuales del formulario
   */
  const handleTestConnection = async () => {
    // Para probar, necesitamos usuario y contraseña
    if (!formData.usuario || !formData.password) {
      toast.error('Para probar la conexión, debe ingresar usuario y contraseña');
      return;
    }

    if (!validateForm()) {
      toast.error('Por favor, completa todos los campos requeridos para probar la conexión');
      return;
    }

    setTesting(true);
    try {
      console.log('🧪 Probando conexión con datos actualizados');
      
      // Preparar datos para test
      const testData = {
        servidor: formData.servidor || conexion.servidor,
        puerto: formData.puerto || conexion.puerto,
        nombre_bd: formData.nombre_bd || conexion.nombre_bd,
        usuario: formData.usuario,
        password: formData.password,
        tipo_bd: formData.tipo_bd || conexion.tipo_bd,
        usa_ssl: formData.usa_ssl !== undefined ? formData.usa_ssl : conexion.usa_ssl,
        timeout_segundos: formData.timeout_segundos || conexion.timeout_segundos
      };
      
      const result = await conexionService.testConexion(testData);
      
      if (result.success) {
        console.log('✅ Prueba de conexión exitosa');
        toast.success(`✅ Conexión exitosa: ${result.message}`);
      } else {
        console.warn('⚠️ Prueba de conexión fallida:', result.message);
        toast.error(`❌ Error de conexión: ${result.message}`);
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
   * Envía el formulario para actualizar la conexión
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Actualizando conexión:', conexion.conexion_id, formData);
      
      // Solo enviar campos que han cambiado o son necesarios
      const updateData: ConexionUpdate = {
        servidor: formData.servidor,
        puerto: formData.puerto,
        nombre_bd: formData.nombre_bd,
        tipo_bd: formData.tipo_bd,
        usa_ssl: formData.usa_ssl,
        timeout_segundos: formData.timeout_segundos,
        max_pool_size: formData.max_pool_size,
        es_solo_lectura: formData.es_solo_lectura,
        es_conexion_principal: formData.es_conexion_principal,
        es_activo: formData.es_activo
      };

      // Solo incluir credenciales si se proporcionaron
      if (formData.usuario) {
        updateData.usuario = formData.usuario;
      }
      if (formData.password) {
        updateData.password = formData.password;
      }

      // ✅ CORREGIDO: Servicio actualizado
      await conexionService.updateConexion(conexion.conexion_id, updateData);
      
      console.log('✅ Conexión actualizada exitosamente:', conexion.conexion_id);
      toast.success('Conexión actualizada exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Error actualizando conexión:', error);
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al actualizar la conexión');
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
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Editar Conexión
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {conexion.servidor}:{conexion.puerto} - {conexion.nombre_bd}
              </p>
            </div>
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
            {/* Información del Servidor */}
            <div>
              <label htmlFor="servidor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Servidor *
              </label>
              <input
                type="text"
                id="servidor"
                name="servidor"
                value={formData.servidor || ''}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${
                  errors.servidor ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                }`}
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
                value={formData.puerto || 1433}
                onChange={handleInputChange}
                min="1"
                max="65535"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${
                  errors.puerto ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
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
                value={formData.nombre_bd || ''}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${
                  errors.nombre_bd ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                }`}
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
                value={formData.tipo_bd || 'sqlserver'}
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

            {/* Credenciales (solo para actualizar) */}
            <div>
              <label htmlFor="usuario" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Usuario
              </label>
              <input
                type="text"
                id="usuario"
                name="usuario"
                value={formData.usuario || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
                placeholder="Dejar vacío para mantener actual"
                disabled={loading || testing}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Solo completar si desea cambiar el usuario
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña (dejar vacío para mantener la actual)
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
                placeholder="••••••••"
                disabled={loading || testing}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Solo completar si desea cambiar la contraseña
              </p>
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
                    value={formData.timeout_segundos || 30}
                    onChange={handleInputChange}
                    min="1"
                    max="300"
                    className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
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
                    value={formData.max_pool_size || 100}
                    onChange={handleInputChange}
                    min="1"
                    max="1000"
                    className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
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
                  checked={formData.usa_ssl || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
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
                  checked={formData.es_solo_lectura || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
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
                  checked={formData.es_conexion_principal || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                  disabled={loading || testing}
                />
                <label htmlFor="es_conexion_principal" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Conexión principal del módulo
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="es_activo"
                  name="es_activo"
                  checked={formData.es_activo || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                  disabled={loading || testing}
                />
                <label htmlFor="es_activo" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Conexión activa
                </label>
              </div>
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
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditConnectionModal;