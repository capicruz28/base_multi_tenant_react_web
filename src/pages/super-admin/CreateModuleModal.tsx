import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, Package, Loader } from 'lucide-react';
import { moduloService } from '../../services/modulo.service';
import { ModuloCreate } from '../../types/modulo.types';
import { getErrorMessage } from '../../services/error.service';

interface CreateModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateModuleModal: React.FC<CreateModuleModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  const [formData, setFormData] = useState<ModuloCreate>({
    codigo_modulo: '',
    nombre: '',
    descripcion: '',
    icono: '',
    es_modulo_core: false,
    requiere_licencia: false,
    orden: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Resetear formulario cuando se abra/cierre
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        codigo_modulo: '',
        nombre: '',
        descripcion: '',
        icono: '',
        es_modulo_core: false,
        requiere_licencia: false,
        orden: 0
      });
      setErrors({});
    }
  }, [isOpen]);

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.codigo_modulo.trim()) {
      newErrors.codigo_modulo = 'El código del módulo es requerido';
    } else if (!/^[A-Z0-9_]+$/.test(formData.codigo_modulo)) {
      newErrors.codigo_modulo = 'El código debe contener solo mayúsculas, números y guiones bajos';
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del módulo es requerido';
    }

    if ((formData.orden ?? 0) < 0) {
      newErrors.orden = 'El orden no puede ser negativo';
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
      await moduloService.createModulo(formData);
      toast.success('Módulo creado exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating module:', error);
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al crear el módulo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Crear Nuevo Módulo
            </h2>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Código del Módulo */}
          <div>
            <label htmlFor="codigo_modulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código del Módulo *
            </label>
            <input
              type="text"
              id="codigo_modulo"
              name="codigo_modulo"
              value={formData.codigo_modulo}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${errors.codigo_modulo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="Ej: PLANILLAS, CONTABILIDAD"
              disabled={loading}
            />
            {errors.codigo_modulo && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.codigo_modulo}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Solo mayúsculas, números y guiones bajos. Usado para referencia en código.
            </p>
          </div>

          {/* Nombre del Módulo */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del Módulo *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${errors.nombre ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="Ej: Planillas y RRHH"
              disabled={loading}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion || ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Descripción detallada del módulo..."
              disabled={loading}
            />
          </div>

          {/* Icono */}
          <div>
            <label htmlFor="icono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Icono
            </label>
            <input
              type="text"
              id="icono"
              name="icono"
              value={formData.icono || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ej: receipt_long, people, inventory_2"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Nombre del icono según la librería de iconos usada.
            </p>
          </div>

          {/* Orden */}
          <div>
            <label htmlFor="orden" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Orden de Visualización
            </label>
            <input
              type="number"
              id="orden"
              name="orden"
              value={formData.orden}
              onChange={handleInputChange}
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${errors.orden ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              disabled={loading}
            />
            {errors.orden && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.orden}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Menor número = aparece primero en la lista.
            </p>
          </div>

          {/* Opciones del Módulo */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="es_modulo_core"
                name="es_modulo_core"
                checked={formData.es_modulo_core}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="es_modulo_core" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Módulo Core del Sistema
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
              Los módulos core son esenciales y siempre disponibles para todos los clientes.
            </p>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="requiere_licencia"
                name="requiere_licencia"
                checked={formData.requiere_licencia}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="requiere_licencia" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Requiere Licencia
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
              Los módulos con licencia requieren activación y pago adicional.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
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
              {loading ? 'Creando...' : 'Crear Módulo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateModuleModal;