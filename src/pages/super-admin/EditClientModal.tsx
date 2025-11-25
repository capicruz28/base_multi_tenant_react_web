import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Building, Loader, Palette, Calendar, Server } from 'lucide-react';
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
  const [activeSection, setActiveSection] = useState<'basic' | 'config' | 'branding' | 'subscription'>('basic');
  
  const [formData, setFormData] = useState<ClienteUpdate>({
    codigo_cliente: cliente.codigo_cliente,
    subdominio: cliente.subdominio,
    razon_social: cliente.razon_social,
    nombre_comercial: cliente.nombre_comercial,
    ruc: cliente.ruc,
    tipo_instalacion: cliente.tipo_instalacion,
    servidor_api_local: cliente.servidor_api_local,
    modo_autenticacion: cliente.modo_autenticacion,
    logo_url: cliente.logo_url,
    favicon_url: cliente.favicon_url,
    color_primario: cliente.color_primario,
    color_secundario: cliente.color_secundario,
    tema_personalizado: cliente.tema_personalizado,
    plan_suscripcion: cliente.plan_suscripcion,
    estado_suscripcion: cliente.estado_suscripcion,
    fecha_inicio_suscripcion: cliente.fecha_inicio_suscripcion ? cliente.fecha_inicio_suscripcion.split('T')[0] : '',
    fecha_fin_trial: cliente.fecha_fin_trial ? cliente.fecha_fin_trial.split('T')[0] : '',
    contacto_nombre: cliente.contacto_nombre,
    contacto_email: cliente.contacto_email,
    contacto_telefono: cliente.contacto_telefono,
    es_activo: cliente.es_activo,
    es_demo: cliente.es_demo,
    api_key_sincronizacion: cliente.api_key_sincronizacion,
    sincronizacion_habilitada: cliente.sincronizacion_habilitada
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
        servidor_api_local: cliente.servidor_api_local,
        modo_autenticacion: cliente.modo_autenticacion,
        logo_url: cliente.logo_url,
        favicon_url: cliente.favicon_url,
        color_primario: cliente.color_primario,
        color_secundario: cliente.color_secundario,
        tema_personalizado: cliente.tema_personalizado,
        plan_suscripcion: cliente.plan_suscripcion,
        estado_suscripcion: cliente.estado_suscripcion,
        fecha_inicio_suscripcion: cliente.fecha_inicio_suscripcion ? cliente.fecha_inicio_suscripcion.split('T')[0] : '',
        fecha_fin_trial: cliente.fecha_fin_trial ? cliente.fecha_fin_trial.split('T')[0] : '',
        contacto_nombre: cliente.contacto_nombre,
        contacto_email: cliente.contacto_email,
        contacto_telefono: cliente.contacto_telefono,
        es_activo: cliente.es_activo,
        es_demo: cliente.es_demo,
        api_key_sincronizacion: cliente.api_key_sincronizacion,
        sincronizacion_habilitada: cliente.sincronizacion_habilitada
      });
      setErrors({});
      setActiveSection('basic');
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
    } else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(formData.subdominio)) {
      newErrors.subdominio = 'El subdominio solo puede contener letras minúsculas, números y guiones, y no puede comenzar o terminar con guión';
    }

    if (!formData.razon_social?.trim()) {
      newErrors.razon_social = 'La razón social es requerida';
    }

    if (!formData.contacto_email?.trim()) {
      newErrors.contacto_email = 'El email de contacto es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.contacto_email)) {
      newErrors.contacto_email = 'El formato del email es inválido';
    }

    if (formData.ruc && formData.ruc.trim()) {
      if (!/^\d+$/.test(formData.ruc)) {
        newErrors.ruc = 'El RUC debe contener solo números';
      } else if (formData.ruc.length < 8 || formData.ruc.length > 15) {
        newErrors.ruc = 'El RUC debe tener entre 8 y 15 dígitos';
      }
    }

    // Validar servidor_api_local si es onpremise o hybrid
    if ((formData.tipo_instalacion === 'onpremise' || formData.tipo_instalacion === 'hybrid') && !formData.servidor_api_local?.trim()) {
      newErrors.servidor_api_local = 'El servidor API local es requerido para instalaciones on-premise o híbridas';
    } else if (formData.servidor_api_local && formData.servidor_api_local.trim()) {
      if (!formData.servidor_api_local.startsWith('http://') && !formData.servidor_api_local.startsWith('https://')) {
        newErrors.servidor_api_local = 'La URL debe comenzar con http:// o https://';
      }
    }

    // Validar colores HEX
    if (formData.color_primario && !/^#[0-9A-Fa-f]{6}$/.test(formData.color_primario)) {
      newErrors.color_primario = 'El color debe estar en formato HEX válido (#RRGGBB)';
    }
    if (formData.color_secundario && !/^#[0-9A-Fa-f]{6}$/.test(formData.color_secundario)) {
      newErrors.color_secundario = 'El color debe estar en formato HEX válido (#RRGGBB)';
    }

    // Validar JSON de tema_personalizado
    if (formData.tema_personalizado && formData.tema_personalizado.trim()) {
      try {
        JSON.parse(formData.tema_personalizado);
      } catch {
        newErrors.tema_personalizado = 'El tema personalizado debe ser un JSON válido';
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
      // Preparar datos para enviar (convertir strings vacíos a null, fechas a formato ISO)
      const dataToSend: ClienteUpdate = {
        ...formData,
        nombre_comercial: formData.nombre_comercial?.trim() || null,
        ruc: formData.ruc?.trim() || null,
        servidor_api_local: formData.servidor_api_local?.trim() || null,
        logo_url: formData.logo_url?.trim() || null,
        favicon_url: formData.favicon_url?.trim() || null,
        tema_personalizado: formData.tema_personalizado?.trim() || null,
        fecha_inicio_suscripcion: formData.fecha_inicio_suscripcion || null,
        fecha_fin_trial: formData.fecha_fin_trial || null,
        contacto_nombre: formData.contacto_nombre?.trim() || null,
        contacto_telefono: formData.contacto_telefono?.trim() || null,
        api_key_sincronizacion: formData.api_key_sincronizacion?.trim() || null,
        sincronizacion_habilitada: formData.sincronizacion_habilitada || false,
      };

      await clienteService.updateCliente(cliente.cliente_id, dataToSend);
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

  const sections = [
    { id: 'basic' as const, name: 'Información Básica', icon: Building },
    { id: 'config' as const, name: 'Configuración', icon: Server },
    { id: 'branding' as const, name: 'Branding', icon: Palette },
    { id: 'subscription' as const, name: 'Suscripción', icon: Calendar },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Building className="h-6 w-6 text-brand-primary" />
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

        {/* Navegación de secciones */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex gap-2 overflow-x-auto">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeSection === section.id
                      ? 'bg-brand-primary text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {section.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Sección: Información Básica */}
            {activeSection === 'basic' && (
              <div className="space-y-6">
                <div>
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${
                          errors.codigo_cliente ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${
                          errors.subdominio ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${
                          errors.razon_social ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
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
                        className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${
                          errors.ruc ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                        }`}
                        maxLength={15}
                        disabled={loading}
                      />
                      {errors.ruc && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ruc}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div>
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
                        className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
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
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${
                          errors.contacto_email ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
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
                        className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Opciones Adicionales */}
                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="es_demo"
                      name="es_demo"
                      checked={formData.es_demo || false}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                      disabled={loading}
                    />
                    <label htmlFor="es_demo" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                      Marcar como cliente de demostración
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Sección: Configuración */}
            {activeSection === 'config' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Configuración de Instalación
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="tipo_instalacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo de Instalación
                      </label>
                      <select
                        id="tipo_instalacion"
                        name="tipo_instalacion"
                        value={formData.tipo_instalacion || 'cloud'}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
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
                        className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
                        disabled={loading}
                      >
                        <option value="local">Local</option>
                        <option value="sso">SSO</option>
                        <option value="hybrid">Híbrido</option>
                      </select>
                    </div>

                    {(formData.tipo_instalacion === 'onpremise' || formData.tipo_instalacion === 'hybrid') && (
                      <div className="md:col-span-2">
                        <label htmlFor="servidor_api_local" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Servidor API Local *
                        </label>
                        <input
                          type="url"
                          id="servidor_api_local"
                          name="servidor_api_local"
                          value={formData.servidor_api_local || ''}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${
                            errors.servidor_api_local ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                          }`}
                          placeholder="https://api.cliente.local"
                          disabled={loading}
                        />
                        {errors.servidor_api_local && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.servidor_api_local}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Configuración de Sincronización */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Sincronización Multi-Instalación
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="sincronizacion_habilitada"
                          name="sincronizacion_habilitada"
                          checked={formData.sincronizacion_habilitada || false}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                          disabled={loading}
                        />
                        <label htmlFor="sincronizacion_habilitada" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                          Habilitar sincronización bidireccional con servidor central
                        </label>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                        Permite sincronización automática de datos con servidor central (multi-instalación)
                      </p>
                    </div>

                    {formData.sincronizacion_habilitada && (
                      <div className="md:col-span-2">
                        <label htmlFor="api_key_sincronizacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          API Key de Sincronización
                        </label>
                        <input
                          type="text"
                          id="api_key_sincronizacion"
                          name="api_key_sincronizacion"
                          value={formData.api_key_sincronizacion || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground font-mono text-sm"
                          placeholder="Ingrese la API key para sincronización"
                          disabled={loading}
                          maxLength={255}
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          API Key para autenticación con el servidor central (opcional)
                        </p>
                      </div>
                    )}

                    {cliente.ultima_sincronizacion && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Última Sincronización
                        </label>
                        <input
                          type="text"
                          value={new Date(cliente.ultima_sincronizacion).toLocaleString()}
                          className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          disabled
                          readOnly
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Última vez que se sincronizó con el servidor central (solo lectura)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sección: Branding */}
            {activeSection === 'branding' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Personalización Visual
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        URL del Logo
                      </label>
                      <input
                        type="url"
                        id="logo_url"
                        name="logo_url"
                        value={formData.logo_url || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
                        placeholder="https://cdn.tuapp.com/logos/acme.png"
                        disabled={loading}
                        maxLength={500}
                      />
                    </div>

                    <div>
                      <label htmlFor="favicon_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        URL del Favicon
                      </label>
                      <input
                        type="url"
                        id="favicon_url"
                        name="favicon_url"
                        value={formData.favicon_url || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
                        placeholder="https://cdn.tuapp.com/favicons/acme.ico"
                        disabled={loading}
                        maxLength={500}
                      />
                    </div>

                    <div>
                      <label htmlFor="color_primario" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Color Primario
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="color_primario"
                          name="color_primario"
                          value={formData.color_primario || '#1976D2'}
                          onChange={handleInputChange}
                          className="h-10 w-20 border border-brand-input-border dark:border-brand-input-border rounded-lg cursor-pointer"
                          disabled={loading}
                        />
                        <input
                          type="text"
                          name="color_primario"
                          value={formData.color_primario || '#1976D2'}
                          onChange={(e) => {
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                              handleInputChange(e);
                            }
                          }}
                          className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${
                            errors.color_primario ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                          }`}
                          placeholder="#1976D2"
                          disabled={loading}
                          maxLength={7}
                        />
                      </div>
                      {errors.color_primario && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.color_primario}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="color_secundario" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Color Secundario
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="color_secundario"
                          name="color_secundario"
                          value={formData.color_secundario || '#424242'}
                          onChange={handleInputChange}
                          className="h-10 w-20 border border-brand-input-border dark:border-brand-input-border rounded-lg cursor-pointer"
                          disabled={loading}
                        />
                        <input
                          type="text"
                          name="color_secundario"
                          value={formData.color_secundario || '#424242'}
                          onChange={(e) => {
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                              handleInputChange(e);
                            }
                          }}
                          className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground ${
                            errors.color_secundario ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                          }`}
                          placeholder="#424242"
                          disabled={loading}
                          maxLength={7}
                        />
                      </div>
                      {errors.color_secundario && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.color_secundario}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="tema_personalizado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tema Personalizado (JSON)
                      </label>
                      <textarea
                        id="tema_personalizado"
                        name="tema_personalizado"
                        value={formData.tema_personalizado || ''}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground font-mono text-sm ${
                          errors.tema_personalizado ? 'border-red-500' : 'border-brand-input-border dark:border-brand-input-border'
                        }`}
                        placeholder='{"font": "Roboto", "borderRadius": "8px"}'
                        disabled={loading}
                        rows={4}
                      />
                      {errors.tema_personalizado && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tema_personalizado}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sección: Suscripción */}
            {activeSection === 'subscription' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Plan y Estado de Suscripción
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="plan_suscripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Plan de Suscripción
                      </label>
                      <select
                        id="plan_suscripcion"
                        name="plan_suscripcion"
                        value={formData.plan_suscripcion || 'trial'}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
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
                        className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
                        disabled={loading}
                      >
                        <option value="trial">Trial</option>
                        <option value="activo">Activo</option>
                        <option value="suspendido">Suspendido</option>
                        <option value="cancelado">Cancelado</option>
                        <option value="moroso">Moroso</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="fecha_inicio_suscripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de Inicio de Suscripción
                      </label>
                      <input
                        type="date"
                        id="fecha_inicio_suscripcion"
                        name="fecha_inicio_suscripcion"
                        value={formData.fecha_inicio_suscripcion || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label htmlFor="fecha_fin_trial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de Fin de Trial
                      </label>
                      <input
                        type="date"
                        id="fecha_fin_trial"
                        name="fecha_fin_trial"
                        value={formData.fecha_fin_trial || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-brand-input-border dark:border-brand-input-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-brand-input-bg dark:text-foreground"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Estado del Cliente */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Estado del Cliente
                  </h3>
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
                      Cliente activo
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex gap-2">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    if (index > 0) {
                      const prevSection = sections[index - 1].id;
                      setActiveSection(prevSection);
                    }
                  }}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  disabled={index === 0}
                >
                  {index > 0 && '← Anterior'}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-secondary border border-transparent rounded-lg hover:bg-brand-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
              {activeSection !== 'subscription' && (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = sections.findIndex(s => s.id === activeSection);
                    if (currentIndex < sections.length - 1) {
                      setActiveSection(sections[currentIndex + 1].id);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-lg hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                >
                  Siguiente →
                </button>
              )}
              {activeSection === 'subscription' && (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary border border-transparent rounded-lg hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50"
                >
                  {loading && <Loader className="h-4 w-4 animate-spin" />}
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClientModal;