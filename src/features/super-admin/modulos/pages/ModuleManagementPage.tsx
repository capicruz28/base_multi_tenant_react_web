import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Package,
  Star,
  CheckCircle,
  XCircle,
  Download,
  Grid3x3,
  List,
  FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ✅ NUEVO: Usar servicios y tipos V2
import { moduloV2Service } from '@/features/modulos/services/modulo-v2.service';
import type { ModuloV2 } from '@/features/modulos/types/modulo-v2.types';
import { useAuth } from '@/shared/context/AuthContext';
import { getErrorMessage } from '@/core/services/error.service';
import CreateModuleModal from '../components/CreateModuleModal';
import EditModuleModal from '../components/EditModuleModal';

const ModuleManagementPage: React.FC = () => {
  const { isSuperAdmin, isAuthenticated, loading: authLoading } = useAuth();
  // ✅ NUEVO: Usar tipos ModuloV2
  const [modulos, setModulos] = useState<ModuloV2[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ MEJORADO: Paginación con límite configurable
  const LIMIT_OPTIONS = [20, 50, 100];
  const DEFAULT_LIMIT = 20;
  
  // Cargar preferencia de límite desde localStorage
  const getStoredLimit = (): number => {
    try {
      const stored = localStorage.getItem('modulos_limit_per_page');
      return stored ? parseInt(stored, 10) : DEFAULT_LIMIT;
    } catch {
      return DEFAULT_LIMIT;
    }
  };

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalModulos, setTotalModulos] = useState<number>(0);
  const [limitPerPage, setLimitPerPage] = useState<number>(getStoredLimit());

  // ✅ NUEVO: Vista (tabla o tarjetas)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [soloActivos, setSoloActivos] = useState<boolean>(false);

  // Modales y Selección
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedModulo, setSelectedModulo] = useState<ModuloV2 | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchModulos = useCallback(async () => {
    // ✅ CORRECCIÓN: No hacer petición si no está autenticado o está cargando
    if (!isAuthenticated || authLoading) {
      console.log('⏸️ [ModuleManagementPage] Esperando autenticación...');
      return;
    }

    setLoading(true);
    try {
      // ✅ NUEVO: Usar moduloV2Service con nueva estructura de paginación
      const skip = (currentPage - 1) * limitPerPage;
      const filters: any = {
        skip,
        limit: limitPerPage,
      };

      // ✅ CORREGIDO: Enviar filtro de activos siempre (true o false)
      // El backend espera 'solo_activos' y cuando es false muestra todos
      filters.es_activo = soloActivos;

      // Agregar búsqueda si existe
      if (debouncedSearchTerm) {
        filters.nombre = debouncedSearchTerm;
      }

      // Agregar filtro de categoría si existe
      if (selectedCategoria) {
        filters.categoria = selectedCategoria;
      }

      const data = await moduloV2Service.getModulos(filters);

      // ✅ NUEVO: Estructura de respuesta diferente con validación robusta
      if (!data) {
        throw new Error('La respuesta del servidor está vacía');
      }
      
      // Validar que items sea un array
      const items = Array.isArray(data.items) ? data.items : [];
      setModulos(items);
      setTotalModulos(typeof data.total === 'number' ? data.total : items.length);
      setTotalPages(typeof data.pages === 'number' ? data.pages : 1);
      setError(null);
    } catch (err) {
      console.error('❌ Error cargando módulos:', err);
      const errorData = getErrorMessage(err);
      setError(errorData.message || 'Error al cargar los módulos');
      toast.error(errorData.message || 'Error al cargar los módulos');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, currentPage, selectedCategoria, soloActivos, limitPerPage, isAuthenticated, authLoading]);

  useEffect(() => {
    fetchModulos();
  }, [fetchModulos]);

  // ✅ NUEVO: Cerrar menú de exportación al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showExportMenu && !target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

  // Handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchModulos();
    toast.success('Módulo creado exitosamente');
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedModulo(null);
    fetchModulos();
    toast.success('Módulo actualizado exitosamente');
  };

  const handleToggleActivation = async (modulo: ModuloV2) => {
    try {
      // ✅ CORREGIDO: Usar endpoints específicos de activar/desactivar
      if (modulo.es_activo) {
        await moduloV2Service.deactivateModulo(modulo.modulo_id);
        toast.success('Módulo desactivado exitosamente');
      } else {
        await moduloV2Service.activateModulo(modulo.modulo_id);
        toast.success('Módulo activado exitosamente');
      }
      fetchModulos();
    } catch (err) {
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || `Error al ${modulo.es_activo ? 'desactivar' : 'activar'} el módulo`);
    }
  };

  const openEditModal = (modulo: ModuloV2) => {
    setSelectedModulo(modulo);
    setIsEditModalOpen(true);
  };

  // ✅ NUEVO: Manejar cambio de límite por página
  const handleLimitChange = (newLimit: number) => {
    setLimitPerPage(newLimit);
    setCurrentPage(1);
    try {
      localStorage.setItem('modulos_limit_per_page', newLimit.toString());
    } catch (error) {
      console.warn('No se pudo guardar preferencia de límite:', error);
    }
  };

  // ✅ NUEVO: Función para exportar a CSV
  const exportToCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      // Obtener todos los módulos sin paginación para exportar
      const filters: any = {};
      if (soloActivos) filters.es_activo = true;
      if (debouncedSearchTerm) filters.nombre = debouncedSearchTerm;
      if (selectedCategoria) filters.categoria = selectedCategoria;
      
      // Obtener todos los registros (sin límite)
      filters.skip = 0;
      filters.limit = 1000; // Límite alto para obtener todos

      const data = await moduloV2Service.getModulos(filters);
      const items = Array.isArray(data.items) ? data.items : [];

      // Preparar datos para CSV
      const csvData = items.map(modulo => ({
        'Código': modulo.codigo,
        'Nombre': modulo.nombre,
        'Categoría': modulo.categoria || '',
        'Descripción': modulo.descripcion || '',
        'Estado': modulo.es_activo ? 'Activo' : 'Inactivo',
        'Orden': modulo.orden,
        'Color': modulo.color || '',
        'Fecha Creación': modulo.fecha_creacion || '',
      }));

      // Convertir a CSV
      const headers = Object.keys(csvData[0] || {});
      const csvRows = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escapar comillas y envolver en comillas si contiene comas
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `modulos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exportados ${items.length} módulos a CSV`);
    } catch (err) {
      console.error('Error exportando a CSV:', err);
      toast.error('Error al exportar a CSV');
    } finally {
      setIsExporting(false);
    }
  }, [debouncedSearchTerm, selectedCategoria, soloActivos]);

  // ✅ NUEVO: Función para exportar a Excel
  const exportToExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      // Obtener todos los módulos sin paginación para exportar
      const filters: any = {};
      if (soloActivos) filters.es_activo = true;
      if (debouncedSearchTerm) filters.nombre = debouncedSearchTerm;
      if (selectedCategoria) filters.categoria = selectedCategoria;
      
      // Obtener todos los registros (sin límite)
      filters.skip = 0;
      filters.limit = 1000; // Límite alto para obtener todos

      const data = await moduloV2Service.getModulos(filters);
      const items = Array.isArray(data.items) ? data.items : [];

      // Preparar datos para Excel
      const excelData = items.map(modulo => ({
        'Código': modulo.codigo,
        'Nombre': modulo.nombre,
        'Categoría': modulo.categoria || '',
        'Descripción': modulo.descripcion || '',
        'Estado': modulo.es_activo ? 'Activo' : 'Inactivo',
        'Orden': modulo.orden,
        'Color': modulo.color || '',
        'Fecha Creación': modulo.fecha_creacion || '',
      }));

      // Crear workbook y worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Módulos');

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 15 }, // Código
        { wch: 30 }, // Nombre
        { wch: 20 }, // Categoría
        { wch: 50 }, // Descripción
        { wch: 12 }, // Estado
        { wch: 8 },  // Orden
        { wch: 12 }, // Color
        { wch: 20 }, // Fecha Creación
      ];
      ws['!cols'] = colWidths;

      // Exportar
      XLSX.writeFile(wb, `modulos_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`Exportados ${items.length} módulos a Excel`);
    } catch (err) {
      console.error('Error exportando a Excel:', err);
      toast.error('Error al exportar a Excel');
    } finally {
      setIsExporting(false);
    }
  }, [debouncedSearchTerm, selectedCategoria, soloActivos]);

  // ✅ NUEVO: Obtener categorías únicas para el filtro con validación
  const categorias = useMemo(() => {
    if (!modulos || !Array.isArray(modulos) || modulos.length === 0) {
      return [];
    }
    try {
      const cats = new Set(modulos.map(m => m?.categoria).filter(Boolean));
      return Array.from(cats).sort();
    } catch (error) {
      console.error('Error procesando categorías:', error);
      return [];
    }
  }, [modulos]);

  // Si no es super admin
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acceso restringido</h3>
          <p className="mt-1 text-sm text-gray-500">
            No tienes permisos para acceder a la gestión de módulos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      {/*
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Módulos
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Administra los módulos disponibles en el sistema multi-tenant
        </p>
      </div>
      */}
      {/* Barra de herramientas */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Búsqueda y Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar módulos..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* ✅ NUEVO: Filtro por categoría */}
            {categorias.length > 0 && (
              <select
                value={selectedCategoria}
                onChange={(e) => {
                  setSelectedCategoria(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}

            {/* ✅ NUEVO: Filtro para mostrar solo activos */}
            <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={soloActivos}
                onChange={(e) => {
                  setSoloActivos(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Solo activos</span>
            </label>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* ✅ NUEVO: Selector de límite por página */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Mostrar:
              </label>
              <select
                value={limitPerPage}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white"
              >
                {LIMIT_OPTIONS.map(limit => (
                  <option key={limit} value={limit}>{limit}</option>
                ))}
              </select>
            </div>

            {/* ✅ NUEVO: Toggle de vista */}
            <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-brand-primary text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Vista de tabla"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-brand-primary text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Vista de tarjetas"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
            </div>

            {/* ✅ NUEVO: Botón de exportar con menú desplegable */}
            <div className="relative export-menu-container">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting || loading}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Exportar datos"
              >
                <Download className={`h-4 w-4 ${isExporting ? 'animate-bounce' : ''}`} />
                <span className="hidden sm:inline">Exportar</span>
              </button>
              {/* Menú desplegable de exportación */}
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <button
                    onClick={() => {
                      exportToCSV();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    Exportar a CSV
                  </button>
                  <button
                    onClick={() => {
                      exportToExcel();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    Exportar a Excel
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={fetchModulos}
              disabled={loading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Módulo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-brand-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Módulos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalModulos}</p>
            </div>
          </div>
        </div>

        {/* ✅ NUEVO: Estadística de categorías */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Categorías</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {categorias.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Activos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {modulos?.filter(m => m.es_activo).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inactivos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {modulos?.filter(m => !m.es_activo).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="animate-spin h-6 w-6 text-brand-primary" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando módulos...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-6 text-center">
            <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              {error}
            </div>
            <button
              onClick={fetchModulos}
              className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Contenido: Tabla o Grid */}
        {!loading && !error && (
          <>
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Módulo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {modulos && modulos.length > 0 ? (
                    modulos.map((modulo) => (
                      <tr key={modulo.modulo_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {/* ✅ NUEVO: Mostrar color del módulo */}
                            <div 
                              className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: modulo.color || '#6366f1', color: 'white' }}
                            >
                              <Package className="h-6 w-6" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {modulo.nombre}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Orden: {modulo.orden}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {modulo.codigo}
                          </code>
                        </td>
                        {/* ✅ NUEVO: Columna de categoría */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {modulo.categoria || 'Sin categoría'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">
                            {modulo.descripcion || 'Sin descripción'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${modulo.es_activo
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                            {modulo.es_activo ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Activo
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactivo
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => openEditModal(modulo)}
                              className="text-brand-primary hover:text-brand-primary/80 dark:text-brand-primary dark:hover:text-brand-primary/80 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleToggleActivation(modulo)}
                              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${modulo.es_activo
                                ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                                : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                                }`}
                              title={modulo.es_activo ? 'Desactivar' : 'Activar'}
                            >
                              {modulo.es_activo ? <Trash2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>No se encontraron módulos</p>
                        {searchTerm ? (
                          <p className="mt-1">Intenta ajustar los términos de búsqueda</p>
                        ) : (
                          <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
                          >
                            Crear primer módulo
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            ) : (
              /* ✅ NUEVO: Vista de tarjetas (Grid) */
              <div className="p-6">
                {modulos && modulos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {modulos.map((modulo) => (
                      <div
                        key={modulo.modulo_id}
                        className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-lg transition-shadow"
                      >
                        {/* Header de la tarjeta */}
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className="flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: modulo.color || '#6366f1', color: 'white' }}
                          >
                            <Package className="h-6 w-6" />
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditModal(modulo)}
                              className="p-1 text-brand-primary hover:text-brand-primary/80 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActivation(modulo)}
                              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 ${
                                modulo.es_activo
                                  ? 'text-red-600 hover:text-red-900'
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                              title={modulo.es_activo ? 'Desactivar' : 'Activar'}
                            >
                              {modulo.es_activo ? (
                                <Trash2 className="h-4 w-4" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Contenido */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {modulo.nombre}
                          </h3>
                          <code className="text-xs font-mono bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded block mb-2">
                            {modulo.codigo}
                          </code>
                          
                          {modulo.categoria && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mb-2">
                              {modulo.categoria}
                            </span>
                          )}

                          {modulo.descripcion && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                              {modulo.descripcion}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Orden: {modulo.orden}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                modulo.es_activo
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                            >
                              {modulo.es_activo ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Activo
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactivo
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No se encontraron módulos</p>
                    {searchTerm && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Intenta ajustar los términos de búsqueda
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Paginación */}
            {totalModulos > limitPerPage && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando <span className="font-medium">{(currentPage - 1) * limitPerPage + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(currentPage * limitPerPage, totalModulos)}</span> de{' '}
                    <span className="font-medium">{totalModulos}</span> módulos
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      {isCreateModalOpen && (
        <CreateModuleModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {isEditModalOpen && selectedModulo && (
        <EditModuleModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedModulo(null);
          }}
          onSuccess={handleEditSuccess}
          modulo={selectedModulo}
        />
      )}
    </div>
  );
};

export default ModuleManagementPage;