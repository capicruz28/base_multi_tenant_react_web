import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Building, Loader } from 'lucide-react';
import { clienteService } from '../../services/cliente.service';
import { Cliente, ClienteUpdate } from '../../types/cliente.types';
import { getErrorMessage } from '../../services/error.service';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cliente: Cliente;
}

const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  cliente
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<ClienteUpdate>({
    codigo_cliente: cliente.codigo_cliente,
    subdominio: cliente.subdominio,
    razon_social: cliente.razon_social,
    nombre_comercial: cliente.nombre_comercial,
    ruc: cliente.ruc,
    tipo_instalacion: cliente.tipo_instalacion,
    modo_autenticacion: cliente.modo_autenticacion,
    plan_suscripcion: cliente.plan_suscripcion,
    estado_suscripcion: cliente.estado_suscripcion,
    contacto_nombre: cliente.contacto_nombre,
    contacto_email: cliente.contacto_email,
    contacto_telefono: cliente.contacto_telefono,
    es_activo: cliente.es_activo,
    es_demo: cliente.es_demo
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Actualizar formulario cuando cambie el cliente
  useEffect(() => {
    if (isOpen && cliente) {
      setFormData({
        codigo_cliente: cliente.codigo_cliente,
        subdominio: cliente.subdominio,
        razon_social: cliente.razon_social,
        nombre_comercial: cliente.nombre_comercial,
        ruc: cliente.ruc,
        tipo_instalacion: cliente.tipo_instalacion,
        modo_autenticacion: cliente.modo_autenticacion,
        plan_suscripcion: cliente.plan_suscripcion,
        estado_suscripcion: cliente.estado_suscripcion,
        contacto_nombre: cliente.contacto_nombre,
        contacto_email: cliente.contacto_email,
        contacto_telefono: cliente.contacto_telefono,
        es_activo: cliente.es_activo,
        es_demo: cliente.es_demo
      });
      setErrors({});
    }
  }, [isOpen, cliente]);

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

    if (!formData.codigo_cliente?.trim()) {
      newErrors.codigo_cliente = 'El código de cliente es requerido';
    }

    if (!formData.subdominio?.trim()) {
      newErrors.subdominio = 'El subdominio es requerido';
    } else if (formData.subdominio.length < 3) {
      newErrors.subdominio = 'El subdominio debe tener al menos 3 caracteres';
    } else if (!/^[a-z0-9-]+$/.test(formData.subdominio)) {
      newErrors.subdominio = 'El subdominio solo puede contener letras minúsculas, números y guiones';
    }

    if (!formData.razon_social?.trim()) {
      newErrors.razon_social = 'La razón social es requerida';
    }

    if (!formData.contacto_email?.trim()) {
      newErrors.contacto_email = 'El email de contacto es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.contacto_email)) {
      newErrors.contacto_email = 'El formato del email es inválido';
    }

    if (formData.ruc && !/^\d{11}$/.test(formData.ruc)) {
      newErrors.ruc = 'El RUC debe tener 11 dígitos';
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
      await clienteService.updateCliente(cliente.cliente_id, formData);
      toast.success('Cliente actualizado exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating client:', error);
      const errorData = getErrorMessage(error);
      toast.error(errorData.message || 'Error al actualizar el cliente');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Building className="h-6 w-6 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Editar Cliente
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {cliente.nombre_comercial || cliente.razon_social}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Básica */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Información Básica
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="codigo_cliente" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Código de Cliente *
                  </label>
                  <input
                    type="text"
                    id="codigo_cliente"
                    name="codigo_cliente"
                    value={formData.codigo_cliente || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                      errors.codigo_cliente ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={loading}
                  />
                  {errors.codigo_cliente && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.codigo_cliente}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="subdominio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subdominio *
                  </label>
                  <input
                    type="text"
                    id="subdominio"
                    name="subdominio"
                    value={formData.subdominio || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                      errors.subdominio ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={loading}
                  />
                  {errors.subdominio && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.subdominio}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="razon_social" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Razón Social *
                  </label>
                  <input
                    type="text"
                    id="razon_social"
                    name="razon_social"
                    value={formData.razon_social || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                      errors.razon_social ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={loading}
                  />
                  {errors.razon_social && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.razon_social}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="nombre_comercial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre Comercial
                  </label>
                  <input
                    type="text"
                    id="nombre_comercial"
                    name="nombre_comercial"
                    value={formData.nombre_comercial || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="ruc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    RUC
                  </label>
                  <input
                    type="text"
                    id="ruc"
                    name="ruc"
                    value={formData.ruc || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                      errors.ruc ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    maxLength={11}
                    disabled={loading}
                  />
                  {errors.ruc && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ruc}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Configuración */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Configuración
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="tipo_instalacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Instalación
                  </label>
                  <select
                    id="tipo_instalacion"
                    name="tipo_instalacion"
                    value={formData.tipo_instalacion || 'cloud'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  >
                    <option value="cloud">Cloud</option>
                    <option value="onpremise">On-Premise</option>
                    <option value="hybrid">Híbrido</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modo_autenticacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Modo de Autenticación
                  </label>
                  <select
                    id="modo_autenticacion"
                    name="modo_autenticacion"
                    value={formData.modo_autenticacion || 'local'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  >
                    <option value="local">Local</option>
                    <option value="sso">SSO</option>
                    <option value="hybrid">Híbrido</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="plan_suscripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plan de Suscripción
                  </label>
                  <select
                    id="plan_suscripcion"
                    name="plan_suscripcion"
                    value={formData.plan_suscripcion || 'trial'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  >
                    <option value="trial">Trial</option>
                    <option value="basico">Básico</option>
                    <option value="profesional">Profesional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="estado_suscripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado de Suscripción
                  </label>
                  <select
                    id="estado_suscripcion"
                    name="estado_suscripcion"
                    value={formData.estado_suscripcion || 'trial'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  >
                    <option value="trial">Trial</option>
                    <option value="activo">Activo</option>
                    <option value="suspendido">Suspendido</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="moroso">Moroso</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Información de Contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="contacto_nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre de Contacto
                  </label>
                  <input
                    type="text"
                    id="contacto_nombre"
                    name="contacto_nombre"
                    value={formData.contacto_nombre || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="contacto_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email de Contacto *
                  </label>
                  <input
                    type="email"
                    id="contacto_email"
                    name="contacto_email"
                    value={formData.contacto_email || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                      errors.contacto_email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={loading}
                  />
                  {errors.contacto_email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contacto_email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contacto_telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="contacto_telefono"
                    name="contacto_telefono"
                    value={formData.contacto_telefono || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Estado del Cliente */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Estado del Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="es_activo"
                    name="es_activo"
                    checked={formData.es_activo || false}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <label htmlFor="es_activo" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Cliente activo
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="es_demo"
                    name="es_demo"
                    checked={formData.es_demo || false}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <label htmlFor="es_demo" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Cliente de demostración
                  </label>
                </div>
              </div>
            </div>
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
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClientModal;