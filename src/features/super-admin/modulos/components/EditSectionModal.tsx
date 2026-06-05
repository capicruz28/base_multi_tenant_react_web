import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Folder, Loader } from 'lucide-react';
import { seccionService } from '@/features/modulos/services/seccion.service';
import type { Seccion, SeccionUpdate } from '@/features/modulos/types/seccion.types';
import type { ModuloV2 } from '@/features/modulos/types/modulo-v2.types';
import { getErrorMessage } from '@/core/services/error.service';
import IconSelector from '@/shared/components/ui/IconSelector';

interface EditSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  seccion: Seccion;
  modulos: ModuloV2[];
}

const EditSectionModal: React.FC<EditSectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  seccion,
  modulos
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<SeccionUpdate>({
    codigo: seccion.codigo,
    nombre: seccion.nombre,
    descripcion: seccion.descripcion,
    icono: seccion.icono,
    orden: seccion.orden,
    es_activa: seccion.es_activa
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Actualizar formulario cuando cambie la sección
  useEffect(() => {
    if (isOpen && seccion) {
      setFormData({
        codigo: seccion.codigo,
        nombre: seccion.nombre,
        descripcion: seccion.descripcion,
        icono: seccion.icono,
        orden: seccion.orden,
        es_activa: seccion.es_activa
      });
      setErrors({});
    }
  }, [isOpen, seccion]);

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
      newErrors.codigo = 'El código de la sección es requerido';
    } else if (!/^[A-Z0-9_]+$/.test(formData.codigo)) {
      newErrors.codigo = 'El código debe contener solo mayúsculas, números y guiones bajos';
    }

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre de la sección es requerido';
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
      await seccionService.updateSeccion(seccion.seccion_id, formData);
      toast.success('Sección actualizada exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating section:', error);
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al actualizar la sección');
    } finally {
      setLoading(false);
    }
  };

  const modulo = modulos.find(m => m.modulo_id === seccion.modulo_id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-base">
          <div className="flex items-center gap-3">
            <Folder className="h-6 w-6 text-brand-primary" />
            <div>
              <h2 className="text-xl font-semibold text-text-base">
                Editar Sección
              </h2>
              <p className="text-sm text-text-soft">
                {seccion.nombre}
              </p>
              {modulo && (
                <p className="text-xs text-text-soft">
                  Módulo: {modulo.nombre}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-overlay dark:hover:bg-overlay rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-text-soft" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Código de la Sección */}
          <div>
            <label htmlFor="codigo" className="block text-sm font-medium text-text-soft mb-1">
              Código de la Sección *
            </label>
            <input
              type="text"
              id="codigo"
              name="codigo"
              value={formData.codigo || ''}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${errors.codigo ? 'border-error' : 'border-border-base'
                }`}
              disabled={loading}
            />
            {errors.codigo && (
              <p className="mt-1 text-sm text-error">{errors.codigo}</p>
            )}
          </div>

          {/* Nombre de la Sección */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-text-soft mb-1">
              Nombre de la Sección *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre || ''}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${errors.nombre ? 'border-error' : 'border-border-base'
                }`}
              disabled={loading}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-error">{errors.nombre}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-text-soft mb-1">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion || ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base"
              disabled={loading}
            />
          </div>

          {/* Icono */}
          <div>
            <label htmlFor="icono" className="block text-sm font-medium text-text-soft mb-1">
              Icono *
            </label>
            <IconSelector
              value={formData.icono || 'Folder'}
              onChange={(icon) => setFormData(prev => ({ ...prev, icono: icon || 'Folder' }))}
            />
            {errors.icono && (
              <p className="mt-1 text-sm text-error">{errors.icono}</p>
            )}
          </div>

          {/* Orden */}
          <div>
            <label htmlFor="orden" className="block text-sm font-medium text-text-soft mb-1">
              Orden de Visualización
            </label>
            <input
              type="number"
              id="orden"
              name="orden"
              value={formData.orden || 0}
              onChange={handleInputChange}
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${errors.orden ? 'border-error' : 'border-border-base'
                }`}
              disabled={loading}
            />
            {errors.orden && (
              <p className="mt-1 text-sm text-error">{errors.orden}</p>
            )}
          </div>

          {/* Estado */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="es_activa"
              name="es_activa"
              checked={formData.es_activa || false}
              onChange={handleInputChange}
              className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-border-base rounded"
              disabled={loading}
            />
            <label htmlFor="es_activa" className="ml-2 block text-sm text-text-base">
              Sección Activa
            </label>
          </div>
          <p className="text-xs text-text-soft ml-6">
            Las secciones inactivas no estarán disponibles en el menú.
          </p>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border-base">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-secondary border border-transparent rounded-lg hover:bg-brand-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-brand-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-lg hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-brand-primary disabled:opacity-50"
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

export default EditSectionModal;

