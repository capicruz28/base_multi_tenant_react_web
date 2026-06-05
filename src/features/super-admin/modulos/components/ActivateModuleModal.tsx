/**
 * Modal para activar un módulo para un cliente
 * Rediseñado como wizard de 3 pasos para mejor UX
 * Paso 1: Información del módulo
 * Paso 2: Configuración (límites, vencimiento, JSON)
 * Paso 3: Revisar y Activar
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Package, Loader, Settings, FileCheck } from 'lucide-react';
// ✅ REFACTORIZADO: Usar nuevo servicio clienteModuloService
import { clienteModuloService } from '@/features/modulos/services/cliente-modulo.service';
import type { ClienteModuloCreate } from '@/features/modulos/types/cliente-modulo.types';
import type { ModuloConInfoActivacion } from '@/features/super-admin/clientes/components/ClientModulesTab';
import { getErrorMessage } from '@/core/services/error.service';
import { Wizard } from '@/shared/components/ui/Wizard';

interface ActivateModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clienteId: string;
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
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<ClienteModuloCreate>({
    cliente_id: clienteId,
    modulo_id: modulo.modulo_id,
    configuracion_json: null,
    limite_usuarios: null,
    limite_registros: null,
    fecha_vencimiento: null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [configJson, setConfigJson] = useState<string>('');

  const wizardSteps = [
    { id: 'info', label: 'Información', description: 'Detalles del módulo' },
    { id: 'config', label: 'Configuración', description: 'Límites y opciones' },
    { id: 'review', label: 'Revisar', description: 'Confirmar activación' }
  ];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        cliente_id: clienteId,
        modulo_id: modulo.modulo_id,
        configuracion_json: null,
        limite_usuarios: null,
        limite_registros: null,
        fecha_vencimiento: null
      } as ClienteModuloCreate);
      setConfigJson('');
      setErrors({});
      setCurrentStep(0);
    }
  }, [isOpen, clienteId, modulo]);

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
        // JSON inválido, pero no mostramos error hasta que se intente guardar
      }
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Validar paso de configuración
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (): boolean => {
    return validateStep(1);
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep(1)) {
      toast.error('Por favor, corrige los errores antes de continuar');
      return;
    }
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      // ✅ REFACTORIZADO: Usar nuevo endpoint POST /cliente-modulo/
      await clienteModuloService.activateModulo(formData);
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
      <div className="bg-surface rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-base">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-brand-primary" />
            <div>
              <h2 className="text-xl font-semibold text-text-base">
                Activar Módulo
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

        {/* Wizard */}
        <div className="px-6 pt-6">
          <Wizard
            steps={wizardSteps}
            currentStep={currentStep}
            onStepClick={(stepIndex) => {
              if (stepIndex < currentStep || (stepIndex === 1 && validateStep(1))) {
                setCurrentStep(stepIndex);
              }
            }}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Paso 1: Información del módulo */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="bg-brand-primary-light dark:bg-brand-primary/20 p-6 rounded-lg border border-brand-primary/20">
                  <div className="flex items-start gap-3">
                    <Package className="h-8 w-8 text-brand-primary dark:text-brand-primary flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-brand-primary dark:text-brand-primary mb-2">
                        {modulo.nombre}
                      </h3>
                      <p className="text-sm text-text-base mb-3">
                        {modulo.descripcion || 'Sin descripción disponible'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-subtle text-text-base">
                          <code>{modulo.codigo_modulo}</code>
                        </span>
                        {modulo.es_modulo_core && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                            ⚠️ Módulo Core
                          </span>
                        )}
                      </div>
                      {modulo.es_modulo_core && (
                        <div className="mt-3 p-3 bg-warning/10 rounded-lg border border-warning/30">
                          <p className="text-xs text-warning">
                            Este es un módulo core del sistema. Su desactivación puede afectar funcionalidades críticas.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2: Configuración */}
            {currentStep === 1 && (
              <div className="space-y-6">

                <div>
                  <h3 className="text-lg font-medium text-text-base mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-brand-primary" />
                    Configuración del Módulo
                  </h3>
                  <p className="text-sm text-text-soft mb-4">
                    Configura los límites y opciones para este módulo. Todos los campos son opcionales.
                  </p>
                </div>

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
                    <p className="mt-1 text-xs text-text-soft">
                      Dejar vacío para ilimitado
                    </p>
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
                    <p className="mt-1 text-xs text-text-soft">
                      Dejar vacío para ilimitado
                    </p>
                  </div>

                  <div>
                    <label htmlFor="fecha_vencimiento" className="block text-sm font-medium text-text-soft mb-1">
                      Fecha de Vencimiento
                    </label>
                    <input
                      type="date"
                      id="fecha_vencimiento"
                      name="fecha_vencimiento"
                      value={formData.fecha_vencimiento || ''}
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
                  <p className="mt-1 text-xs text-text-soft">
                    Configuración opcional en formato JSON. Dejar vacío si no se requiere.
                  </p>
                </div>
              </div>
            )}

            {/* Paso 3: Revisar y Activar */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-text-base mb-4 flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-brand-primary" />
                    Revisar Configuración
                  </h3>
                  <p className="text-sm text-text-soft mb-6">
                    Revisa la configuración antes de activar el módulo. Podrás modificarla después de la activación.
                  </p>
                </div>

                {/* Resumen */}
                <div className="bg-subtle rounded-lg p-6 space-y-4">
                  <div className="border-b border-border-base pb-4">
                    <h4 className="text-sm font-semibold text-text-base mb-2">Módulo</h4>
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-brand-primary" />
                      <span className="text-sm text-text-base">{modulo.nombre}</span>
                      <span className="text-xs text-text-soft">({modulo.codigo_modulo})</span>
                    </div>
                  </div>

                  <div className="border-b border-border-base pb-4">
                    <h4 className="text-sm font-semibold text-text-base mb-2">Límites</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-text-soft">Usuarios:</span>
                        <span className="ml-2 text-text-base font-medium">
                          {formData.limite_usuarios ? formData.limite_usuarios : 'Ilimitado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-soft">Registros:</span>
                        <span className="ml-2 text-text-base font-medium">
                          {formData.limite_registros ? formData.limite_registros : 'Ilimitado'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-text-soft">Vencimiento:</span>
                        <span className="ml-2 text-text-base font-medium">
                          {formData.fecha_vencimiento 
                            ? new Date(formData.fecha_vencimiento).toLocaleDateString('es-ES')
                            : 'Sin vencimiento'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {configJson.trim() && (
                    <div>
                      <h4 className="text-sm font-semibold text-text-base mb-2">Configuración JSON</h4>
                      <pre className="text-xs bg-subtle text-text-base p-3 rounded border border-border-base overflow-x-auto font-mono">
                        {JSON.stringify(JSON.parse(configJson), null, 2)}
                      </pre>
                    </div>
                  )}

                  {!configJson.trim() && !formData.limite_usuarios && !formData.limite_registros && !formData.fecha_vencimiento && (
                    <div className="text-center py-4 text-sm text-text-soft">
                      Sin configuración personalizada. El módulo se activará con valores por defecto.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-border-base bg-subtle">
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-text-soft bg-surface border border-border-base rounded-lg hover:bg-overlay dark:hover:bg-overlay focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-brand-primary disabled:opacity-50"
                >
                  ← Anterior
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-secondary border border-transparent rounded-lg hover:bg-brand-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-brand-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
            <div>
              {currentStep < wizardSteps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-lg hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-brand-primary disabled:opacity-50"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-lg hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-brand-primary disabled:opacity-50"
                >
                  {loading && <Loader className="h-4 w-4 animate-spin" />}
                  {loading ? 'Activando...' : 'Activar Módulo'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivateModuleModal;


