import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Package, Loader } from 'lucide-react';
// ✅ NUEVO: Usar servicios y tipos V2
import { moduloV2Service } from '@/features/modulos/services/modulo-v2.service';
import type { ModuloV2, ModuloV2Update } from '@/features/modulos/types/modulo-v2.types';
import { getErrorMessage } from '@/core/services/error.service';
import IconSelector from '@/shared/components/ui/IconSelector';

interface EditModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  modulo: ModuloV2;
}

const EditModuleModal: React.FC<EditModuleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  modulo
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  // ✅ NUEVO: Usar tipos ModuloV2Update
  const [formData, setFormData] = useState<ModuloV2Update>({
    codigo: modulo.codigo,
    nombre: modulo.nombre,
    descripcion: modulo.descripcion,
    icono: modulo.icono,
    color: modulo.color,
    categoria: modulo.categoria,
    orden: modulo.orden,
    es_activo: modulo.es_activo
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Actualizar formulario cuando cambie el módulo
  useEffect(() => {
    if (isOpen && modulo) {
      setFormData({
        codigo: modulo.codigo,
        nombre: modulo.nombre,
        descripcion: modulo.descripcion,
        icono: modulo.icono,
        color: modulo.color,
        categoria: modulo.categoria,
        orden: modulo.orden,
        es_activo: modulo.es_activo
      });
      setErrors({});
    }
  }, [isOpen, modulo]);

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

    if (!formData.codigo?.trim()) {
      newErrors.codigo = 'El código del módulo es requerido';
    } else if (!/^[A-Z0-9_]+$/.test(formData.codigo)) {
      newErrors.codigo = 'El código debe contener solo mayúsculas, números y guiones bajos';
    }

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre del módulo es requerido';
    }

    if (!formData.categoria?.trim()) {
      newErrors.categoria = 'La categoría es requerida';
    }

    if (formData.color && !/^#[0-9A-F]{6}$/i.test(formData.color)) {
      newErrors.color = 'El color debe ser un código hexadecimal válido (ej: #6366f1)';
    }

    if ((formData.orden || 0) < 0) {
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
      // ✅ NUEVO: Usar moduloV2Service
      await moduloV2Service.updateModulo(modulo.modulo_id, formData);
      toast.success('Módulo actualizado exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating module:', error);
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al actualizar el módulo');
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
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Editar Módulo
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Código del Módulo */}
          <div>
            <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código del Módulo *
            </label>
            <input
              type="text"
              id="codigo"
              name="codigo"
              value={formData.codigo || ''}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${errors.codigo ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                }`}
              disabled={loading}
            />
            {errors.codigo && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.codigo}</p>
            )}
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
              value={formData.nombre || ''}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${errors.nombre ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                }`}
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
              className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
              disabled={loading}
            />
          </div>

          {/* Icono */}
          <div>
            <label htmlFor="icono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Icono *
            </label>
            <IconSelector
              value={formData.icono || 'Package'}
              onChange={(icon) => setFormData(prev => ({ ...prev, icono: icon || 'Package' }))}
            />
            {errors.icono && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.icono}</p>
            )}
          </div>

          {/* ✅ NUEVO: Color */}
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color *
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                id="color"
                name="color"
                value={formData.color || '#6366f1'}
                onChange={handleInputChange}
                className="h-10 w-20 border border-brand-input-border dark:border-brand-input-border rounded-lg cursor-pointer"
                disabled={loading}
              />
              <input
                type="text"
                value={formData.color || '#6366f1'}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-F]{6}$/i.test(value) || value === '') {
                    setFormData(prev => ({ ...prev, color: value || '#6366f1' }));
                  }
                }}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${errors.color ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                  }`}
                placeholder="#6366f1"
                disabled={loading}
              />
            </div>
            {errors.color && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.color}</p>
            )}
          </div>

          {/* ✅ NUEVO: Categoría */}
          <div>
            <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoría *
            </label>
            <input
              type="text"
              id="categoria"
              name="categoria"
              value={formData.categoria || ''}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${errors.categoria ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                }`}
              placeholder="Ej: Finanzas, RRHH, Operaciones"
              disabled={loading}
            />
            {errors.categoria && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.categoria}</p>
            )}
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
              value={formData.orden || 0}
              onChange={handleInputChange}
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${errors.orden ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                }`}
              disabled={loading}
            />
            {errors.orden && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.orden}</p>
            )}
          </div>

          {/* ✅ NUEVO: Estado del Módulo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="es_activo"
              name="es_activo"
              checked={formData.es_activo || false}
              onChange={handleInputChange}
              className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="es_activo" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Módulo Activo
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
            Los módulos inactivos no estarán disponibles para los clientes.
          </p>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-secondary border border-transparent rounded-lg hover:bg-brand-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-lg hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50"
            >
              {loading && <Loader className="h-4 w-4 animate-spin" />}
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModuleModal;