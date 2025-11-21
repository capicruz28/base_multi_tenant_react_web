/**
 * Modal para activar un módulo para un cliente
 * Permite configurar límites y configuración JSON personalizada
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Package, Loader, AlertCircle } from 'lucide-react';
import { moduloService } from '../../services/modulo.service';
import { ModuloConInfoActivacion, ModuloActivoCreate } from '../../types/modulo.types';
import { getErrorMessage } from '../../services/error.service';

interface ActivateModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clienteId: number;
  modulo: ModuloConInfoActivacion;
}

const ActivateModuleModal: React.FC<ActivateModuleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clienteId,
  modulo
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<ModuloActivoCreate>({
    cliente_id: clienteId,
    modulo_id: modulo.modulo_id,
    configuracion_json: null,
    limite_usuarios: null,
    limite_registros: null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [configJson, setConfigJson] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        cliente_id: clienteId,
        modulo_id: modulo.modulo_id,
        configuracion_json: null,
        limite_usuarios: null,
        limite_registros: null
      });
      setConfigJson('');
      setErrors({});
    }
  }, [isOpen, clienteId, modulo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'limite_usuarios' || name === 'limite_registros') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? null : parseInt(value, 10)
      }));
    } else if (name === 'configuracion_json') {
      setConfigJson(value);
      try {
        const parsed = value.trim() === '' ? null : JSON.parse(value);
        setFormData(prev => ({
          ...prev,
          configuracion_json: parsed
        }));
        if (errors.configuracion_json) {
          setErrors(prev => ({ ...prev, configuracion_json: '' }));
        }
      } catch {
        // JSON inválido, pero no mostramos error hasta que se intente guardar
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.limite_usuarios !== null && formData.limite_usuarios !== undefined && formData.limite_usuarios < 1) {
      newErrors.limite_usuarios = 'El límite de usuarios debe ser al menos 1';
    }

    if (formData.limite_registros !== null && formData.limite_registros !== undefined && formData.limite_registros < 0) {
      newErrors.limite_registros = 'El límite de registros debe ser al menos 0';
    }

    if (configJson.trim() !== '') {
      try {
        JSON.parse(configJson);
      } catch {
        newErrors.configuracion_json = 'El JSON de configuración no es válido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      await moduloService.activarModuloCliente(clienteId, modulo.modulo_id, formData);
      toast.success(`Módulo "${modulo.nombre}" activado exitosamente`);
      onSuccess();
    } catch (error) {
      console.error('Error activating module:', error);
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al activar el módulo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Activar Módulo
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {modulo.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Información del módulo */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                    Información del Módulo
                  </p>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                    {modulo.descripcion || 'Sin descripción'}
                  </p>
                  {modulo.es_modulo_core && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                      ⚠️ Este es un módulo core del sistema
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Límites */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="limite_usuarios" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Límite de Usuarios
                </label>
                <input
                  type="number"
                  id="limite_usuarios"
                  name="limite_usuarios"
                  value={formData.limite_usuarios || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                    errors.limite_usuarios ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Ilimitado (dejar vacío)"
                  min="1"
                  disabled={loading}
                />
                {errors.limite_usuarios && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.limite_usuarios}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Dejar vacío para ilimitado
                </p>
              </div>

              <div>
                <label htmlFor="limite_registros" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Límite de Registros
                </label>
                <input
                  type="number"
                  id="limite_registros"
                  name="limite_registros"
                  value={formData.limite_registros || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                    errors.limite_registros ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Ilimitado (dejar vacío)"
                  min="0"
                  disabled={loading}
                />
                {errors.limite_registros && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.limite_registros}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Dejar vacío para ilimitado
                </p>
              </div>
            </div>

            {/* Configuración JSON */}
            <div>
              <label htmlFor="configuracion_json" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Configuración Personalizada (JSON)
              </label>
              <textarea
                id="configuracion_json"
                name="configuracion_json"
                value={configJson}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white font-mono text-sm ${
                  errors.configuracion_json ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder='{"clave": "valor"}'
                rows={6}
                disabled={loading}
              />
              {errors.configuracion_json && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.configuracion_json}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Configuración opcional en formato JSON. Dejar vacío si no se requiere.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading && <Loader className="h-4 w-4 animate-spin" />}
              {loading ? 'Activando...' : 'Activar Módulo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivateModuleModal;


