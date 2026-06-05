import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Shield, Loader } from 'lucide-react';
import { plantillaRolService } from '@/features/modulos/services/plantilla-rol.service';
import type { PlantillaRolCreate } from '@/features/modulos/types/plantilla-rol.types';
import type { ModuloV2 } from '@/features/modulos/types/modulo-v2.types';
import { getErrorMessage } from '@/core/services/error.service';

interface CreateRoleTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduloId: string;
  modulos: ModuloV2[];
}

const CreateRoleTemplateModal: React.FC<CreateRoleTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  moduloId,
  modulos
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<PlantillaRolCreate>({
    modulo_id: moduloId,
    nombre: '',
    descripcion: '',
    permisos_json: {},
    es_activa: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Resetear formulario cuando se abra/cierre
  useEffect(() => {
    if (isOpen) {
      setFormData({
        modulo_id: moduloId,
        nombre: '',
        descripcion: '',
        permisos_json: {},
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
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpiar error del campo cuando se modifique
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre de la plantilla es requerido';
    }

    if (!formData.modulo_id) {
      newErrors.modulo_id = 'Debe seleccionar un módulo';
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
      await plantillaRolService.createPlantilla(formData);
      toast.success('Plantilla creada exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating role template:', error);
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al crear la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const selectedModulo = modulos.find(m => m.modulo_id === moduloId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-base">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-brand-primary" />
            <div>
              <h2 className="text-xl font-semibold text-text-base">
                Crear Nueva Plantilla de Rol
              </h2>
              {selectedModulo && (
                <p className="text-sm text-text-soft">
                  Módulo: {selectedModulo.nombre}
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
          {/* Módulo (si no está pre-seleccionado) */}
          {!moduloId && (
            <div>
              <label htmlFor="modulo_id" className="block text-sm font-medium text-text-soft mb-1">
                Módulo *
              </label>
              <select
                id="modulo_id"
                name="modulo_id"
                value={formData.modulo_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${errors.modulo_id ? 'border-error' : 'border-border-base'
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
                <p className="mt-1 text-sm text-error">{errors.modulo_id}</p>
              )}
            </div>
          )}

          {/* Nombre de la Plantilla */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-text-soft mb-1">
              Nombre de la Plantilla *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${errors.nombre ? 'border-error' : 'border-border-base'
                }`}
              placeholder="Ej: Administrador Completo, Usuario Básico"
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
              placeholder="Descripción detallada de la plantilla de permisos..."
              disabled={loading}
            />
          </div>

          {/* Permisos JSON - Editor básico */}
          <div>
            <label htmlFor="permisos_json" className="block text-sm font-medium text-text-soft mb-1">
              Permisos (JSON)
            </label>
            <textarea
              id="permisos_json"
              name="permisos_json"
              value={JSON.stringify(formData.permisos_json, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setFormData(prev => ({ ...prev, permisos_json: parsed }));
                  if (errors.permisos_json) {
                    setErrors(prev => ({ ...prev, permisos_json: '' }));
                  }
                } catch (err) {
                  setErrors(prev => ({ ...prev, permisos_json: 'JSON inválido' }));
                }
              }}
              rows={8}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base font-mono text-sm ${errors.permisos_json ? 'border-error' : 'border-border-base'
                }`}
              placeholder='{"menu_id_1": {"ver": true, "crear": false, "editar": true, "eliminar": false}}'
              disabled={loading}
            />
            {errors.permisos_json && (
              <p className="mt-1 text-sm text-error">{errors.permisos_json}</p>
            )}
            <p className="mt-1 text-xs text-text-soft">
              Estructura JSON con permisos por menú. Puedes editarlo después desde la edición de la plantilla.
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
              className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-border-base rounded"
              disabled={loading}
            />
            <label htmlFor="es_activa" className="ml-2 block text-sm text-text-base">
              Plantilla Activa
            </label>
          </div>
          <p className="text-xs text-text-soft ml-6">
            Las plantillas inactivas no estarán disponibles para asignar a roles.
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
              {loading ? 'Creando...' : 'Crear Plantilla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoleTemplateModal;

