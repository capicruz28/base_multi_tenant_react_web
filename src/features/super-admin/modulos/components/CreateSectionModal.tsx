import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Folder, Loader } from 'lucide-react';
import { seccionService } from '@/features/modulos/services/seccion.service';
import type { SeccionCreate } from '@/features/modulos/types/seccion.types';
import type { ModuloV2 } from '@/features/modulos/types/modulo-v2.types';
import { getErrorMessage } from '@/core/services/error.service';
import IconSelector from '@/shared/components/ui/IconSelector';

interface CreateSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduloId: string;
  modulos: ModuloV2[];
}

const CreateSectionModal: React.FC<CreateSectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduloId,
  modulos
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<SeccionCreate>({
    modulo_id: moduloId,
    codigo: '',
    nombre: '',
    descripcion: '',
    icono: 'Folder',
    orden: 0,
    es_activa: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Resetear formulario cuando se abra/cierre
  useEffect(() => {
    if (isOpen) {
      setFormData({
        modulo_id: moduloId,
        codigo: '',
        nombre: '',
        descripcion: '',
        icono: 'Folder',
        orden: 0,
        es_activa: true
      });
      setErrors({});
    }
  }, [isOpen, moduloId]);

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

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código de la sección es requerido';
    } else if (!/^[A-Z0-9_]+$/.test(formData.codigo)) {
      newErrors.codigo = 'El código debe contener solo mayúsculas, números y guiones bajos';
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre de la sección es requerido';
    }

    if (!formData.modulo_id) {
      newErrors.modulo_id = 'Debe seleccionar un módulo';
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
      await seccionService.createSeccion(formData);
      toast.success('Sección creada exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating section:', error);
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al crear la sección');
    } finally {
      setLoading(false);
    }
  };

  const selectedModulo = modulos.find(m => m.modulo_id === moduloId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Folder className="h-6 w-6 text-brand-primary" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Crear Nueva Sección
              </h2>
              {selectedModulo && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Módulo: {selectedModulo.nombre}
                </p>
              )}
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
          {/* Módulo (si no está pre-seleccionado) */}
          {!moduloId && (
            <div>
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
                disabled={loading}
              >
                <option value="">Seleccione un módulo</option>
                {modulos.map((modulo) => (
                  <option key={modulo.modulo_id} value={modulo.modulo_id}>
                    {modulo.nombre}
                  </option>
                ))}
              </select>
              {errors.modulo_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.modulo_id}</p>
              )}
            </div>
          )}

          {/* Código de la Sección */}
          <div>
            <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código de la Sección *
            </label>
            <input
              type="text"
              id="codigo"
              name="codigo"
              value={formData.codigo}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${errors.codigo ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                }`}
              placeholder="Ej: CONTABILIDAD, PRESUPUESTO"
              disabled={loading}
            />
            {errors.codigo && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.codigo}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Solo mayúsculas, números y guiones bajos. Usado para referencia en código.
            </p>
          </div>

          {/* Nombre de la Sección */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre de la Sección *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${errors.nombre ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                }`}
              placeholder="Ej: Contabilidad General"
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
              placeholder="Descripción detallada de la sección..."
              disabled={loading}
            />
          </div>

          {/* Icono */}
          <div>
            <label htmlFor="icono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Icono *
            </label>
            <IconSelector
              value={formData.icono}
              onChange={(icon) => setFormData(prev => ({ ...prev, icono: icon || 'Folder' }))}
            />
            {errors.icono && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.icono}</p>
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
              value={formData.orden}
              onChange={handleInputChange}
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${errors.orden ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
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

          {/* Estado */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="es_activa"
              name="es_activa"
              checked={formData.es_activa || false}
              onChange={handleInputChange}
              className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="es_activa" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Sección Activa
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
            Las secciones inactivas no estarán disponibles en el menú.
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
              {loading ? 'Creando...' : 'Crear Sección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSectionModal;

