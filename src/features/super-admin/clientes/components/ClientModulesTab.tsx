/**
 * Componente para gestionar módulos activos de un cliente
 * ✅ REFACTORIZADO: Usa endpoints V2 correctos
 * - GET /cliente-modulo/cliente/{cliente_id}/ - Obtener módulos activos del cliente
 * - POST /cliente-modulo/ - Activar módulo
 * - PUT /cliente-modulo/{cliente_modulo_id}/ - Actualizar/Desactivar módulo
 * 
 * Diseño UX/UI mejorado con separación visual clara y cards modernas
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  Package,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Settings,
  Loader,
  Search,
  Filter,
  Calendar,
  Users,
  Database,
  AlertCircle,
  Sparkles,
  Tag
} from 'lucide-react';
import { clienteModuloService } from '@/features/modulos/services/cliente-modulo.service';
import { moduloV2Service } from '@/features/modulos/services/modulo-v2.service';
import type { ModuloV2 } from '@/features/modulos/types/modulo-v2.types';
import type { ClienteModulo } from '@/features/modulos/types/cliente-modulo.types';
import { getErrorMessage } from '@/core/services/error.service';
import ActivateModuleModal from '@/features/super-admin/modulos/components/ActivateModuleModal';
import EditModuleActivoModal from '@/features/super-admin/modulos/components/EditModuleActivoModal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';

// ✅ Tipo combinado para módulos con información de activación
export interface ModuloConInfoActivacion {
  modulo_id: string;
  nombre: string;
  codigo_modulo: string;
  descripcion?: string | null;
  icono?: string | null;
  color?: string | null;
  categoria?: string | null;
  activo_en_cliente: boolean;
  cliente_modulo_id?: string | null;
  fecha_activacion?: string | null;
  fecha_vencimiento?: string | null;
  limite_usuarios?: number | null;
  limite_registros?: number | null;
  configuracion_json?: Record<string, any> | null;
  es_modulo_core?: boolean;
}

interface ClientModulesTabProps {
  clienteId: string;
}

const ClientModulesTab: React.FC<ClientModulesTabProps> = ({ clienteId }) => {
  const [modulos, setModulos] = useState<ModuloConInfoActivacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterActivos, setFilterActivos] = useState<boolean | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Modales
  const [isActivateModalOpen, setIsActivateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedModulo, setSelectedModulo] = useState<ModuloConInfoActivacion | null>(null);
  const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState<boolean>(false);
  const [moduloToDeactivate, setModuloToDeactivate] = useState<ModuloConInfoActivacion | null>(null);

  /**
   * ✅ REFACTORIZADO: Usa los endpoints correctos:
   * - GET /cliente-modulo/cliente/{cliente_id}/ - Módulos activos del cliente
   * - GET /modulos-v2/disponibles/{cliente_id}/ - Módulos disponibles para activar
   */
  const fetchModulos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Obtener módulos activos del cliente
      let modulosActivosCliente: ClienteModulo[] = [];
      try {
        modulosActivosCliente = await clienteModuloService.getClienteModulosByClienteId(clienteId);
      } catch (err: any) {
        if (import.meta.env.DEV && err?.response?.status !== 404) {
          console.warn('⚠️ Error al obtener módulos activos del cliente:', err);
        }
      }

      // 2. Obtener módulos disponibles para el cliente (no activados)
      let modulosDisponibles: ModuloV2[] = [];
      try {
        modulosDisponibles = await moduloV2Service.getModulosDisponibles(clienteId);
      } catch (err: any) {
        if (import.meta.env.DEV && err?.response?.status !== 404) {
          console.warn('⚠️ Error al obtener módulos disponibles:', err);
        }
      }

      // 3. Crear un mapa de módulos activos por modulo_id
      const modulosActivosMap = new Map<string, ClienteModulo>();
      modulosActivosCliente.forEach(cm => {
        if (cm.esta_activo && cm.modulo_id) {
          modulosActivosMap.set(cm.modulo_id, cm);
        }
      });

      // 4. Convertir módulos activos a ModuloConInfoActivacion
      const modulosActivosCombinados: ModuloConInfoActivacion[] = modulosActivosCliente
        .filter(cm => cm.esta_activo && cm.modulo_id)
        .map(clienteModulo => ({
          modulo_id: clienteModulo.modulo_id,
          nombre: clienteModulo.modulo_nombre || 'Módulo desconocido',
          codigo_modulo: clienteModulo.modulo_codigo || 'N/A',
          descripcion: null, // No viene en la respuesta de cliente-modulo
          icono: null, // No viene en la respuesta de cliente-modulo
          color: '#1976D2', // Valor por defecto
          categoria: null, // No viene en la respuesta de cliente-modulo
          activo_en_cliente: true,
          cliente_modulo_id: clienteModulo.cliente_modulo_id,
          fecha_activacion: clienteModulo.fecha_activacion,
          fecha_vencimiento: clienteModulo.fecha_vencimiento || null,
          limite_usuarios: clienteModulo.limite_usuarios || null,
          limite_registros: clienteModulo.limite_registros || null,
          configuracion_json: clienteModulo.configuracion_json || null,
          es_modulo_core: false,
        }));

      // 5. Convertir módulos disponibles a ModuloConInfoActivacion
      const modulosDisponiblesCombinados: ModuloConInfoActivacion[] = modulosDisponibles.map(modulo => ({
        modulo_id: modulo.modulo_id,
        nombre: modulo.nombre,
        codigo_modulo: modulo.codigo,
        descripcion: modulo.descripcion,
        icono: modulo.icono,
        color: modulo.color || '#1976D2',
        categoria: modulo.categoria,
        activo_en_cliente: false,
        cliente_modulo_id: null,
        fecha_activacion: null,
        fecha_vencimiento: null,
        limite_usuarios: null,
        limite_registros: null,
        configuracion_json: null,
        es_modulo_core: modulo.es_core || false,
      }));

      // 6. Combinar ambos arrays
      const modulosCombinados: ModuloConInfoActivacion[] = [
        ...modulosActivosCombinados,
        ...modulosDisponiblesCombinados,
      ];

      if (import.meta.env.DEV) {
        console.log('📦 Módulos combinados:', {
          total: modulosCombinados.length,
          activos: modulosActivosCombinados.length,
          disponibles: modulosDisponiblesCombinados.length,
        });
      }

      setModulos(modulosCombinados);
    } catch (err) {
      console.error('Error fetching client modules:', err);
      const errorData = getErrorMessage(err);
      setError(errorData.message || 'Error al cargar los módulos');
      toast.error(errorData.message || 'Error al cargar los módulos');
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    fetchModulos();
  }, [fetchModulos]);

  const handleActivate = (modulo: ModuloConInfoActivacion) => {
    setSelectedModulo(modulo);
    setIsActivateModalOpen(true);
  };

  const handleEdit = (modulo: ModuloConInfoActivacion) => {
    setSelectedModulo(modulo);
    setIsEditModalOpen(true);
  };

  const handleDeactivateClick = (modulo: ModuloConInfoActivacion) => {
    setModuloToDeactivate(modulo);
    setIsDeactivateConfirmOpen(true);
  };

  /**
   * ✅ REFACTORIZADO: Usa el nuevo endpoint PUT /cliente-modulo/{cliente_modulo_id}/
   */
  const handleDeactivateConfirm = async () => {
    if (!moduloToDeactivate || !moduloToDeactivate.modulo_id) return;

    try {
      // ✅ CORREGIDO: Usar clienteId y moduloId en lugar de cliente_modulo_id
      await clienteModuloService.deactivateModulo(clienteId, moduloToDeactivate.modulo_id);
      toast.success(`Módulo "${moduloToDeactivate.nombre}" desactivado exitosamente`);
      setIsDeactivateConfirmOpen(false);
      setModuloToDeactivate(null);
      fetchModulos();
    } catch (err) {
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al desactivar el módulo');
    }
  };

  const handleActivateSuccess = () => {
    setIsActivateModalOpen(false);
    setSelectedModulo(null);
    fetchModulos();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedModulo(null);
    fetchModulos();
  };

  // Separar módulos activos y disponibles
  const modulosActivos = useMemo(() => modulos.filter(m => m.activo_en_cliente), [modulos]);
  const modulosDisponibles = useMemo(() => modulos.filter(m => !m.activo_en_cliente), [modulos]);

  // Obtener categorías únicas
  const categorias = useMemo(() => {
    const cats = new Set(modulos.map(m => m.categoria).filter(Boolean));
    return Array.from(cats).sort();
  }, [modulos]);

  // Filtrar según búsqueda, estado y categoría
  const filteredModulos = useMemo(() => {
    return modulos.filter(modulo => {
      // Filtro de búsqueda
      const matchesSearch = !searchTerm || 
        modulo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        modulo.codigo_modulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        modulo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de estado
      const matchesStatus = filterActivos === null || 
        (filterActivos === true && modulo.activo_en_cliente) ||
        (filterActivos === false && !modulo.activo_en_cliente);

      // Filtro de categoría
      const matchesCategory = categoryFilter === 'all' || modulo.categoria === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [modulos, searchTerm, filterActivos, categoryFilter]);

  const filteredModulosActivos = useMemo(() => 
    filteredModulos.filter(m => m.activo_en_cliente), 
    [filteredModulos]
  );

  const filteredModulosDisponibles = useMemo(() => 
    filteredModulos.filter(m => !m.activo_en_cliente), 
    [filteredModulos]
  );

  // Aplicar filtro adicional si está activo
  const showActivos = filterActivos === null || filterActivos === true;
  const showDisponibles = filterActivos === null || filterActivos === false;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="animate-spin h-10 w-10 text-brand-primary mb-4" />
        <span className="text-gray-600 dark:text-gray-400">Cargando módulos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
          <AlertCircle className="h-5 w-5 inline mr-2" />
          {error}
        </div>
        <button
          onClick={fetchModulos}
          className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas mejoradas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Total Módulos</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{modulos.length}</p>
            </div>
            <Package className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl shadow-sm border border-green-200 dark:border-green-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Activos</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">{modulosActivos.length}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Disponibles</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{modulosDisponibles.length}</p>
            </div>
            <XCircle className="h-10 w-10 text-gray-600 dark:text-gray-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl shadow-sm border border-purple-200 dark:border-purple-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">Categorías</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{categorias.length}</p>
            </div>
            <Tag className="h-10 w-10 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Barra de herramientas mejorada */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Búsqueda y filtros */}
          <div className="flex-1 flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar módulos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterActivos === null ? 'all' : filterActivos ? 'active' : 'inactive'}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterActivos(value === 'all' ? null : value === 'active');
                }}
                className="pl-10 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white transition-all appearance-none bg-white dark:bg-gray-700"
              >
                <option value="all">Todos</option>
                <option value="active">Solo activos</option>
                <option value="inactive">Solo disponibles</option>
              </select>
            </div>
            {categorias.length > 0 && (
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={typeof categoryFilter === 'string' ? categoryFilter : 'all'}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="pl-10 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white transition-all appearance-none bg-white dark:bg-gray-700"
                >
                  <option value="all">Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={String(cat)} value={String(cat ?? '')}>{cat}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <button
              onClick={fetchModulos}
              disabled={loading}
              className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* MÓDULOS ACTIVOS - Vista de Cards mejorada */}
      {showActivos && filteredModulosActivos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              Módulos Activos
              <span className="ml-2 px-3 py-1 text-sm font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                {filteredModulosActivos.length}
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredModulosActivos.map((modulo) => (
              <div
                key={modulo.modulo_id}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-green-200 dark:border-green-800 p-6 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div 
                      className="flex-shrink-0 h-14 w-14 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: `${modulo.color || '#10B981'}20` }}
                    >
                      <Package 
                        className="h-7 w-7" 
                        style={{ color: modulo.color || '#10B981' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
                        {modulo.nombre}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                          {modulo.codigo_modulo}
                        </code>
                        {modulo.categoria && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                            {modulo.categoria}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información de configuración */}
                {(modulo.fecha_vencimiento || modulo.limite_usuarios || modulo.limite_registros) && (
                  <div className="space-y-2 mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    {modulo.fecha_vencimiento && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Vence: {new Date(modulo.fecha_vencimiento).toLocaleDateString('es-ES')}</span>
                      </div>
                    )}
                    {modulo.limite_usuarios && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>Límite usuarios: {modulo.limite_usuarios}</span>
                      </div>
                    )}
                    {modulo.limite_registros && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Database className="h-4 w-4 flex-shrink-0" />
                        <span>Límite registros: {modulo.limite_registros}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleEdit(modulo)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-brand-primary bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg hover:bg-brand-primary/20 dark:hover:bg-brand-primary/30 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Configurar
                  </button>
                  <button
                    onClick={() => handleDeactivateClick(modulo)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Desactivar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVAR NUEVO MÓDULO - Vista de Grid mejorada */}
      {showDisponibles && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="p-2 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-brand-primary" />
              </div>
              Activar Nuevo Módulo
              <span className="ml-2 px-3 py-1 text-sm font-semibold bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary rounded-full">
                {filteredModulosDisponibles.length} disponibles
              </span>
            </h3>
          </div>

          {filteredModulosDisponibles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredModulosDisponibles.map((modulo) => (
                <div
                  key={modulo.modulo_id}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-brand-primary dark:hover:border-brand-primary transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div 
                        className="flex-shrink-0 h-14 w-14 rounded-xl flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: `${modulo.color || '#1976D2'}20` }}
                      >
                        <Package 
                          className="h-7 w-7" 
                          style={{ color: modulo.color || '#1976D2' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
                          {modulo.nombre}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                            {modulo.codigo_modulo}
                          </code>
                          {modulo.categoria && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                              {modulo.categoria}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {modulo.descripcion && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {modulo.descripcion}
                    </p>
                  )}

                  <button
                    onClick={() => handleActivate(modulo)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-primary rounded-lg hover:bg-brand-primary-hover transition-colors shadow-sm hover:shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    Activar Módulo
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'No se encontraron módulos disponibles con ese criterio' 
                  : 'No hay módulos disponibles para activar'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Estado vacío cuando no hay módulos */}
      {filteredModulos.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No hay módulos para mostrar con los filtros seleccionados
          </p>
        </div>
      )}

      {/* Modales */}
      {isActivateModalOpen && selectedModulo && (
        <ActivateModuleModal
          isOpen={isActivateModalOpen}
          onClose={() => {
            setIsActivateModalOpen(false);
            setSelectedModulo(null);
          }}
          onSuccess={handleActivateSuccess}
          clienteId={clienteId}
          modulo={selectedModulo}
        />
      )}

      {isEditModalOpen && selectedModulo && selectedModulo.activo_en_cliente && (
        <EditModuleActivoModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedModulo(null);
          }}
          onSuccess={handleEditSuccess}
          clienteId={clienteId}
          modulo={selectedModulo}
        />
      )}

      {/* Modal de confirmación de desactivación */}
      <ConfirmDialog
        isOpen={isDeactivateConfirmOpen}
        onClose={() => {
          setIsDeactivateConfirmOpen(false);
          setModuloToDeactivate(null);
        }}
        onConfirm={handleDeactivateConfirm}
        title="Desactivar Módulo"
        message={moduloToDeactivate ? `¿Estás seguro de desactivar el módulo "${moduloToDeactivate.nombre}"?\n\nEsto desactivará todas las conexiones asociadas y el módulo dejará de estar disponible para este cliente.` : ''}
        confirmText="Sí, Desactivar"
        cancelText="Cancelar"
        variant="danger"
        confirmButtonClassName="bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
      />
    </div>
  );
};

export default ClientModulesTab;
