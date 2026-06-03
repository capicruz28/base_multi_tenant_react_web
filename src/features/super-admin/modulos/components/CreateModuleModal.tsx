import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { X, Package, Loader } from 'lucide-react';
import { moduloV2Service } from '@/features/modulos/services/modulo-v2.service';
import type { ModuloV2Create } from '@/features/modulos/types/modulo-v2.types';
import { getErrorMessage } from '@/core/services/error.service';
import IconSelector from '@/shared/components/ui/IconSelector';
import { OrgDiscardConfirmDialog } from '@/features/org/components/OrgDiscardConfirmDialog';
import type { OrgDiscardPending } from '@/features/org/types/org-discard.types';
import {
  CREATE_MODULO_DEFAULT,
  isCreateModuloDirty,
} from '../utils/form-dirty/modulo-form-dirty';
import { useModuloModalDiscard } from '../hooks/useModuloModalDiscard';

interface CreateModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onDiscardPendingChange?: (pending: OrgDiscardPending) => void;
}

const CreateModuleModal: React.FC<CreateModuleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onDiscardPendingChange,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<ModuloV2Create>({ ...CREATE_MODULO_DEFAULT });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDirty = useMemo(() => isCreateModuloDirty(formData), [formData]);

  const {
    discardPending,
    shellVisible,
    handleRequestClose,
    handleDiscardCancel,
    handleDiscardConfirm,
    handleBackdropClick,
  } = useModuloModalDiscard({
    isOpen,
    isDirty,
    isSubmitting: loading,
    mode: 'create',
    onClose,
    onDiscardPendingChange,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...CREATE_MODULO_DEFAULT });
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

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código del módulo es requerido';
    } else if (!/^[A-Z0-9_]+$/.test(formData.codigo)) {
      newErrors.codigo = 'El código debe contener solo mayúsculas, números y guiones bajos';
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del módulo es requerido';
    }

    if (!formData.categoria.trim()) {
      newErrors.categoria = 'La categoría es requerida';
    }

    if (!formData.color || !/^#[0-9A-F]{6}$/i.test(formData.color)) {
      newErrors.color = 'El color debe ser un código hexadecimal válido (ej: #6366f1)';
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
      await moduloV2Service.createModulo(formData);
      toast.success('Módulo creado exitosamente');
      onSuccess();
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
    <>
    {shellVisible && (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="bg-surface rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-module-modal-title"
      >
        <div className="flex items-center justify-between p-6 border-b border-border-base">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-brand-primary" />
            <h2 id="create-module-modal-title" className="text-xl font-semibold text-text-base">
              Crear Nuevo Módulo
            </h2>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="p-2 hover:bg-overlay dark:hover:bg-overlay rounded-lg transition-colors"
            disabled={loading}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-text-soft" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="codigo" className="block text-sm font-medium text-text-soft mb-1">
              Código del Módulo *
            </label>
            <input
              type="text"
              id="codigo"
              name="codigo"
              value={formData.codigo}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${errors.codigo ? 'border-error' : 'border-border-base'
                }`}
              placeholder="Ej: PLANILLAS, CONTABILIDAD"
              disabled={loading}
            />
            {errors.codigo && (
              <p className="mt-1 text-sm text-error">{errors.codigo}</p>
            )}
            <p className="mt-1 text-xs text-text-soft">
              Solo mayúsculas, números y guiones bajos. Usado para referencia en código.
            </p>
          </div>

          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-text-soft mb-1">
              Nombre del Módulo *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${errors.nombre ? 'border-error' : 'border-border-base'
                }`}
              placeholder="Ej: Planillas y RRHH"
              disabled={loading}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-error">{errors.nombre}</p>
            )}
          </div>

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
              placeholder="Descripción detallada del módulo..."
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="icono" className="block text-sm font-medium text-text-soft mb-1">
              Icono *
            </label>
            <IconSelector
              value={formData.icono}
              onChange={(icon) => setFormData(prev => ({ ...prev, icono: icon || 'Package' }))}
            />
            {errors.icono && (
              <p className="mt-1 text-sm text-error">{errors.icono}</p>
            )}
          </div>

          <div>
            <label htmlFor="color" className="block text-sm font-medium text-text-soft mb-1">
              Color *
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="h-10 w-20 border border-border-base rounded-lg cursor-pointer"
                disabled={loading}
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-F]{6}$/i.test(value) || value === '') {
                    setFormData(prev => ({ ...prev, color: value || '#6366f1' }));
                  }
                }}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${errors.color ? 'border-error' : 'border-border-base'
                  }`}
                placeholder="#6366f1"
                disabled={loading}
              />
            </div>
            {errors.color && (
              <p className="mt-1 text-sm text-error">{errors.color}</p>
            )}
          </div>

          <div>
            <label htmlFor="categoria" className="block text-sm font-medium text-text-soft mb-1">
              Categoría *
            </label>
            <input
              type="text"
              id="categoria"
              name="categoria"
              value={formData.categoria}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${errors.categoria ? 'border-error' : 'border-border-base'
                }`}
              placeholder="Ej: Finanzas, RRHH, Operaciones"
              disabled={loading}
            />
            {errors.categoria && (
              <p className="mt-1 text-sm text-error">{errors.categoria}</p>
            )}
          </div>

          <div>
            <label htmlFor="orden" className="block text-sm font-medium text-text-soft mb-1">
              Orden de Visualización
            </label>
            <input
              type="number"
              id="orden"
              name="orden"
              value={formData.orden}
              onChange={handleInputChange}
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${errors.orden ? 'border-error' : 'border-border-base'
                }`}
              disabled={loading}
            />
            {errors.orden && (
              <p className="mt-1 text-sm text-error">{errors.orden}</p>
            )}
            <p className="mt-1 text-xs text-text-soft">
              Menor número = aparece primero en la lista.
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="es_activo"
              name="es_activo"
              checked={formData.es_activo || false}
              onChange={handleInputChange}
              className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-border-base rounded"
              disabled={loading}
            />
            <label htmlFor="es_activo" className="ml-2 block text-sm text-text-base">
              Módulo Activo
            </label>
          </div>
          <p className="text-xs text-text-soft ml-6">
            Los módulos inactivos no estarán disponibles para los clientes.
          </p>

          <div className="flex justify-end gap-3 pt-6 border-t border-border-base">
            <button
              type="button"
              onClick={handleRequestClose}
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
              {loading ? 'Creando...' : 'Crear Módulo'}
            </button>
          </div>
        </form>
      </div>
    </div>
    )}
    <OrgDiscardConfirmDialog
      discardPending={discardPending}
      entityLabel="el módulo"
      onClose={handleDiscardCancel}
      onConfirm={handleDiscardConfirm}
    />
    </>
  );
};

export default CreateModuleModal;
