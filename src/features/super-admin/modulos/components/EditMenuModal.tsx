import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Menu, Loader } from 'lucide-react';
import { menuService } from '@/features/admin/services/menu.service';
import type { MenuUpdateData } from '@/features/admin/types/menu.types';
import { getErrorMessage } from '@/core/services/error.service';
import IconSelector from '@/shared/components/ui/IconSelector';

interface MenuNodeData {
  menu_id: string;
  nombre: string;
  icono?: string | null;
  ruta?: string | null;
  padre_menu_id?: string | null;
  orden?: number | null;
  es_activo: boolean;
  seccion_id?: string | null;
}

interface EditMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  menu: MenuNodeData;
}

const EditMenuModal: React.FC<EditMenuModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  menu
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<MenuUpdateData & { seccion_id?: string | null }>({
    nombre: menu.nombre,
    icono: menu.icono || 'Menu',
    ruta: menu.ruta || '',
    es_activo: menu.es_activo,
    seccion_id: menu.seccion_id || null // ✅ NUEVO: Incluir seccion_id para el backend
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Actualizar formulario cuando cambie el menú
  useEffect(() => {
    if (isOpen && menu) {
      setFormData({
        nombre: menu.nombre,
        icono: menu.icono || 'Menu',
        ruta: menu.ruta || '',
        es_activo: menu.es_activo,
        seccion_id: menu.seccion_id || null // ✅ NUEVO: Incluir seccion_id para el backend
      });
      setErrors({});
    }
  }, [isOpen, menu]);

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

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre del menú es requerido';
    }

    if (formData.ruta && !formData.ruta.startsWith('/')) {
      newErrors.ruta = 'La ruta debe comenzar con /';
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
      await menuService.updateMenuItem(menu.menu_id, formData);
      toast.success('Menú actualizado exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating menu:', error);
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al actualizar el menú');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-base">
          <div className="flex items-center gap-3">
            <Menu className="h-6 w-6 text-brand-primary" />
            <div>
              <h2 className="text-xl font-semibold text-text-base">
                Editar Menú
              </h2>
              <p className="text-sm text-text-soft">
                {menu.nombre}
              </p>
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
          {/* Nombre del Menú */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-text-soft mb-1">
              Nombre del Menú *
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

          {/* Icono */}
          <div>
            <label htmlFor="icono" className="block text-sm font-medium text-text-soft mb-1">
              Icono *
            </label>
            <IconSelector
              value={formData.icono || 'Menu'}
              onChange={(icon) => setFormData(prev => ({ ...prev, icono: icon || 'Menu' }))}
            />
            {errors.icono && (
              <p className="mt-1 text-sm text-error">{errors.icono}</p>
            )}
          </div>

          {/* Ruta */}
          <div>
            <label htmlFor="ruta" className="block text-sm font-medium text-text-soft mb-1">
              Ruta
            </label>
            <input
              type="text"
              id="ruta"
              name="ruta"
              value={formData.ruta || ''}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${errors.ruta ? 'border-error' : 'border-border-base'
                }`}
              placeholder="/admin/usuarios"
              disabled={loading}
            />
            {errors.ruta && (
              <p className="mt-1 text-sm text-error">{errors.ruta}</p>
            )}
            <p className="mt-1 text-xs text-text-soft">
              La ruta debe comenzar con / (ej: /admin/usuarios). Déjalo vacío para un menú grupo.
            </p>
          </div>

          {/* Estado */}
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
              Menú Activo
            </label>
          </div>
          <p className="text-xs text-text-soft ml-6">
            Los menús inactivos no estarán disponibles en el menú del usuario.
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

export default EditMenuModal;

