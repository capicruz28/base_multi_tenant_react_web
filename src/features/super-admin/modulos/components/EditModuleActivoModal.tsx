/**
 * Modal para editar configuración de un módulo activo
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Package, Loader } from 'lucide-react';
// ✅ REFACTORIZADO: Usar nuevo servicio clienteModuloService
import { clienteModuloService } from '@/features/modulos/services/cliente-modulo.service';
import type { ClienteModuloUpdate } from '@/features/modulos/types/cliente-modulo.types';
import type { ModuloConInfoActivacion } from '@/features/super-admin/clientes/components/ClientModulesTab';
import { getErrorMessage } from '@/core/services/error.service';

interface EditModuleActivoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clienteId: string;
  modulo: ModuloConInfoActivacion;
}

const EditModuleActivoModal: React.FC<EditModuleActivoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clienteId: _clienteId,
  modulo
}) => {
  void _clienteId;
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<ClienteModuloUpdate>({
    configuracion_json: modulo.configuracion_json,
    limite_usuarios: modulo.limite_usuarios,
    limite_registros: modulo.limite_registros,
    fecha_vencimiento: modulo.fecha_vencimiento || null,
    esta_activo: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [configJson, setConfigJson] = useState<string>(
    modulo.configuracion_json ? JSON.stringify(modulo.configuracion_json, null, 2) : ''
  );

  useEffect(() => {
    if (isOpen && modulo) {
      setFormData({
        configuracion_json: modulo.configuracion_json,
        limite_usuarios: modulo.limite_usuarios,
        limite_registros: modulo.limite_registros,
        fecha_vencimiento: modulo.fecha_vencimiento || null,
        esta_activo: true
      } as ClienteModuloUpdate);
      setConfigJson(modulo.configuracion_json ? JSON.stringify(modulo.configuracion_json, null, 2) : '');
      setErrors({});
    }
  }, [isOpen, modulo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'limite_usuarios' || name === 'limite_registros') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? null : parseInt(value, 10)
      }));
    } else if (name === 'fecha_vencimiento') {
      setFormData(prev => ({
        ...prev,
        fecha_vencimiento: value === '' ? null : value
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
        // JSON inválido
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

    if (formData.fecha_vencimiento && formData.fecha_vencimiento.trim()) {
      const fechaVencimiento = new Date(formData.fecha_vencimiento);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fechaVencimiento <= hoy) {
        newErrors.fecha_vencimiento = 'La fecha de vencimiento debe ser futura';
      }
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
      // ✅ REFACTORIZADO: Usar nuevo endpoint PUT /cliente-modulo/{cliente_modulo_id}/
      if (!modulo.cliente_modulo_id) {
        throw new Error('No se encontró el ID del cliente-módulo');
      }
      await clienteModuloService.updateClienteModulo(modulo.cliente_modulo_id, formData);
      toast.success(`Configuración del módulo "${modulo.nombre}" actualizada exitosamente`);
      onSuccess();
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
      <div className="bg-surface rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-base">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-brand-primary" />
            <div>
              <h2 className="text-xl font-semibold text-text-base">
                Editar Configuración
              </h2>
              <p className="text-sm text-text-soft">
                {modulo.nombre}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Límites */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="limite_usuarios" className="block text-sm font-medium text-text-soft mb-1">
                  Límite de Usuarios
                </label>
                <input
                  type="number"
                  id="limite_usuarios"
                  name="limite_usuarios"
                  value={formData.limite_usuarios || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${
                    errors.limite_usuarios ? 'border-error' : 'border-border-base'
                  }`}
                  placeholder="Ilimitado (dejar vacío)"
                  min="1"
                  disabled={loading}
                />
                {errors.limite_usuarios && (
                  <p className="mt-1 text-sm text-error">{errors.limite_usuarios}</p>
                )}
              </div>

              <div>
                <label htmlFor="limite_registros" className="block text-sm font-medium text-text-soft mb-1">
                  Límite de Registros
                </label>
                <input
                  type="number"
                  id="limite_registros"
                  name="limite_registros"
                  value={formData.limite_registros || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${
                    errors.limite_registros ? 'border-error' : 'border-border-base'
                  }`}
                  placeholder="Ilimitado (dejar vacío)"
                  min="0"
                  disabled={loading}
                />
                {errors.limite_registros && (
                  <p className="mt-1 text-sm text-error">{errors.limite_registros}</p>
                )}
              </div>

              <div>
                <label htmlFor="fecha_vencimiento" className="block text-sm font-medium text-text-soft mb-1">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  id="fecha_vencimiento"
                  name="fecha_vencimiento"
                  value={formData.fecha_vencimiento ? formData.fecha_vencimiento.split('T')[0] : ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base ${
                    errors.fecha_vencimiento ? 'border-error' : 'border-border-base'
                  }`}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={loading}
                />
                {errors.fecha_vencimiento && (
                  <p className="mt-1 text-sm text-error">{errors.fecha_vencimiento}</p>
                )}
                <p className="mt-1 text-xs text-text-soft">
                  Dejar vacío para licencia ilimitada
                </p>
              </div>
            </div>

            {/* Configuración JSON */}
            <div>
              <label htmlFor="configuracion_json" className="block text-sm font-medium text-text-soft mb-1">
                Configuración Personalizada (JSON)
              </label>
              <textarea
                id="configuracion_json"
                name="configuracion_json"
                value={configJson}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base font-mono text-sm ${
                  errors.configuracion_json ? 'border-error' : 'border-border-base'
                }`}
                placeholder='{"clave": "valor"}'
                rows={6}
                disabled={loading}
              />
              {errors.configuracion_json && (
                <p className="mt-1 text-sm text-error">{errors.configuracion_json}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-border-base bg-subtle">
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

export default EditModuleActivoModal;


