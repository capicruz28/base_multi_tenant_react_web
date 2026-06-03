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
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import type { OrgDiscardPending } from '@/features/org/types/org-discard.types';

type ModuloActiveAction = 'deactivate' | 'reactivate';

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
  const [moduloDiscardPending, setModuloDiscardPending] = useState<OrgDiscardPending>(null);
  const [activeTarget, setActiveTarget] = useState<ModuloV2 | null>(null);
  const [activeAction, setActiveAction] = useState<ModuloActiveAction | null>(null);
  const [togglingActive, setTogglingActive] = useState<boolean>(false);

  const pageActionsLocked = moduloDiscardPending !== null || activeTarget !== null;

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
    setModuloDiscardPending(null);
    setIsCreateModalOpen(false);
    fetchModulos();
  };

  const handleEditSuccess = () => {
    setModuloDiscardPending(null);
    setIsEditModalOpen(false);
    setSelectedModulo(null);
    fetchModulos();
  };

  const handleCreateModalClose = () => {
    setModuloDiscardPending(null);
    setIsCreateModalOpen(false);
  };

  const handleEditModalClose = () => {
    setModuloDiscardPending(null);
    setIsEditModalOpen(false);
    setSelectedModulo(null);
  };

  const closeActiveConfirm = () => {
    setActiveTarget(null);
    setActiveAction(null);
  };

  const openActiveConfirm = (modulo: ModuloV2) => {
    if (moduloDiscardPending !== null) return;
    setActiveTarget(modulo);
    setActiveAction(modulo.es_activo ? 'deactivate' : 'reactivate');
  };

  const handleActiveConfirm = async () => {
    if (!activeTarget || !activeAction || togglingActive) return;
    setTogglingActive(true);
    try {
      if (activeAction === 'deactivate') {
        await moduloV2Service.deactivateModulo(activeTarget.modulo_id);
        toast.success('Módulo desactivado exitosamente');
      } else {
        await moduloV2Service.activateModulo(activeTarget.modulo_id);
        toast.success('Módulo reactivado exitosamente');
      }
      closeActiveConfirm();
      fetchModulos();
    } catch (err) {
      const errorData = getErrorMessage(err);
      toast.error(
        errorData.message ||
          `Error al ${activeAction === 'deactivate' ? 'desactivar' : 'reactivar'} el módulo`,
      );
    } finally {
      setTogglingActive(false);
    }
  };

  const openEditModal = (modulo: ModuloV2) => {
    if (pageActionsLocked) return;
    setSelectedModulo(modulo);
    setIsEditModalOpen(true);
  };

  const openCreateModal = () => {
    if (pageActionsLocked) return;
    setIsCreateModalOpen(true);
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
          <Package className="mx-auto h-12 w-12 text-text-soft" />
          <h3 className="mt-2 text-sm font-medium text-text-base">Acceso restringido</h3>
          <p className="mt-1 text-sm text-text-soft">
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
        <h1 className="text-2xl font-bold text-text-base">
          Gestión de Módulos
        </h1>
        <p className="mt-1 text-sm text-text-soft">
          Administra los módulos disponibles en el sistema multi-tenant
        </p>
      </div>
      */}
      {/* Barra de herramientas */}
      <div className="mb-6 bg-surface rounded-lg shadow-sm border border-border-base p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Búsqueda y Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
              <input
                type="text"
                placeholder="Buscar módulos..."
                value={searchTerm}
                onChange={handleSearchChange}
                disabled={pageActionsLocked}
                className="pl-10 pr-4 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base disabled:opacity-50"
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
                disabled={pageActionsLocked}
                className="px-3 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base disabled:opacity-50"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}

            {/* ✅ NUEVO: Filtro para mostrar solo activos */}
            <label className={`flex items-center gap-2 px-3 py-2 border border-border-base rounded-lg ${pageActionsLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-overlay dark:hover:bg-overlay'}`}>
              <input
                type="checkbox"
                checked={soloActivos}
                onChange={(e) => {
                  setSoloActivos(e.target.checked);
                  setCurrentPage(1);
                }}
                disabled={pageActionsLocked}
                className="rounded border-border-base text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-text-soft">Solo activos</span>
            </label>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* ✅ NUEVO: Selector de límite por página */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-soft whitespace-nowrap">
                Mostrar:
              </label>
              <select
                value={limitPerPage}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                disabled={pageActionsLocked}
                className="px-3 py-2 text-sm border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base disabled:opacity-50"
              >
                {LIMIT_OPTIONS.map(limit => (
                  <option key={limit} value={limit}>{limit}</option>
                ))}
              </select>
            </div>

            {/* ✅ NUEVO: Toggle de vista */}
            <div className="flex items-center gap-1 border border-border-base rounded-lg p-1">
              <button
                type="button"
                onClick={() => !pageActionsLocked && setViewMode('table')}
                disabled={pageActionsLocked}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-brand-primary text-white'
                    : 'text-text-soft hover:bg-overlay dark:hover:bg-overlay'
                } disabled:opacity-50`}
                title="Vista de tabla"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => !pageActionsLocked && setViewMode('grid')}
                disabled={pageActionsLocked}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-brand-primary text-white'
                    : 'text-text-soft hover:bg-overlay dark:hover:bg-overlay'
                } disabled:opacity-50`}
                title="Vista de tarjetas"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
            </div>

            {/* ✅ NUEVO: Botón de exportar con menú desplegable */}
            <div className="relative export-menu-container">
              <button
                type="button"
                onClick={() => !pageActionsLocked && setShowExportMenu(!showExportMenu)}
                disabled={isExporting || loading || pageActionsLocked}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-border-base rounded-lg bg-surface text-text-soft hover:bg-overlay dark:hover:bg-overlay transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Exportar datos"
              >
                <Download className={`h-4 w-4 ${isExporting ? 'animate-bounce' : ''}`} />
                <span className="hidden sm:inline">Exportar</span>
              </button>
              {/* Menú desplegable de exportación */}
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-lg border border-border-base z-10">
                  <button
                    onClick={() => {
                      exportToCSV();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-text-soft hover:bg-overlay dark:hover:bg-overlay flex items-center gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    Exportar a CSV
                  </button>
                  <button
                    onClick={() => {
                      exportToExcel();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-text-soft hover:bg-overlay dark:hover:bg-overlay flex items-center gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    Exportar a Excel
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={fetchModulos}
              disabled={loading || pageActionsLocked}
              className="p-2 text-text-soft hover:text-text-base hover:bg-overlay dark:hover:bg-overlay rounded-lg transition-colors disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={pageActionsLocked}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-surface transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Módulo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-brand-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">Total Módulos</p>
              <p className="text-2xl font-semibold text-text-base">{totalModulos}</p>
            </div>
          </div>
        </div>

        {/* ✅ NUEVO: Estadística de categorías */}
        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Star className="h-8 w-8 text-warning" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">Categorías</p>
              <p className="text-2xl font-semibold text-text-base">
                {categorias.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">Activos</p>
              <p className="text-2xl font-semibold text-text-base">
                {modulos?.filter(m => m.es_activo).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-error" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">Inactivos</p>
              <p className="text-2xl font-semibold text-text-base">
                {modulos?.filter(m => !m.es_activo).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="bg-surface rounded-lg shadow-sm border border-border-base overflow-hidden">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="animate-spin h-6 w-6 text-brand-primary" />
            <span className="ml-2 text-text-soft">Cargando módulos...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-6 text-center">
            <div className="text-error bg-error/10 p-4 rounded-lg">
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
                <table className="min-w-full divide-y divide-border-base">
                <thead className="bg-subtle">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                      Módulo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-soft uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border-base">
                  {modulos && modulos.length > 0 ? (
                    modulos.map((modulo) => (
                      <tr key={modulo.modulo_id} className="hover:bg-overlay/50 dark:hover:bg-overlay/50">
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
                              <div className="text-sm font-medium text-text-base">
                                {modulo.nombre}
                              </div>
                              <div className="text-sm text-text-soft">
                                Orden: {modulo.orden}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-sm font-mono bg-subtle px-2 py-1 rounded">
                            {modulo.codigo}
                          </code>
                        </td>
                        {/* ✅ NUEVO: Columna de categoría */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info">
                            {modulo.categoria || 'Sin categoría'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-text-soft max-w-md truncate">
                            {modulo.descripcion || 'Sin descripción'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${modulo.es_activo
                            ? 'bg-success/10 text-success'
                            : 'bg-error/10 text-error'
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
                              type="button"
                              onClick={() => openEditModal(modulo)}
                              disabled={pageActionsLocked}
                              className="text-brand-primary hover:text-brand-primary/80 dark:text-brand-primary dark:hover:text-brand-primary/80 p-1 rounded hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openActiveConfirm(modulo)}
                              disabled={pageActionsLocked}
                              className={`p-1 rounded hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 ${modulo.es_activo
                                ? 'text-error hover:bg-overlay dark:hover:bg-overlay'
                                : 'text-success hover:bg-overlay dark:hover:bg-overlay'
                                }`}
                              title={modulo.es_activo ? 'Desactivar' : 'Reactivar'}
                            >
                              {modulo.es_activo ? <Trash2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-text-soft">
                        <Package className="mx-auto h-12 w-12 text-text-soft mb-4" />
                        <p>No se encontraron módulos</p>
                        {searchTerm ? (
                          <p className="mt-1">Intenta ajustar los términos de búsqueda</p>
                        ) : (
                          <button
                            type="button"
                            onClick={openCreateModal}
                            disabled={pageActionsLocked}
                            className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors disabled:opacity-50"
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
                        className="bg-surface rounded-lg border border-border-base p-4 hover:shadow-lg transition-shadow"
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
                              type="button"
                              onClick={() => openEditModal(modulo)}
                              disabled={pageActionsLocked}
                              className="p-1 text-brand-primary hover:text-brand-primary/80 rounded hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openActiveConfirm(modulo)}
                              disabled={pageActionsLocked}
                              className={`p-1 rounded hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 ${
                                modulo.es_activo
                                  ? 'text-error hover:bg-overlay'
                                  : 'text-success hover:bg-overlay'
                              }`}
                              title={modulo.es_activo ? 'Desactivar' : 'Reactivar'}
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
                          <h3 className="text-lg font-semibold text-text-base mb-1">
                            {modulo.nombre}
                          </h3>
                          <code className="text-xs font-mono bg-subtle px-2 py-1 rounded block mb-2">
                            {modulo.codigo}
                          </code>
                          
                          {modulo.categoria && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-info/10 text-info mb-2">
                              {modulo.categoria}
                            </span>
                          )}

                          {modulo.descripcion && (
                            <p className="text-sm text-text-soft line-clamp-2 mb-3">
                              {modulo.descripcion}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-base">
                            <span className="text-xs text-text-soft">
                              Orden: {modulo.orden}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                modulo.es_activo
                                  ? 'bg-success/10 text-success'
                                  : 'bg-error/10 text-error'
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
                    <Package className="mx-auto h-12 w-12 text-text-soft mb-4" />
                    <p className="text-sm text-text-soft">No se encontraron módulos</p>
                    {searchTerm && (
                      <p className="mt-1 text-sm text-text-soft">
                        Intenta ajustar los términos de búsqueda
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Paginación */}
            {totalModulos > limitPerPage && (
              <div className="px-6 py-4 border-t border-border-base bg-subtle">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-text-base">
                    Mostrando <span className="font-medium">{(currentPage - 1) * limitPerPage + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(currentPage * limitPerPage, totalModulos)}</span> de{' '}
                    <span className="font-medium">{totalModulos}</span> módulos
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || pageActionsLocked}
                      className="px-3 py-1 text-sm border border-border-base rounded-md bg-surface text-text-soft hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm text-text-base">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || pageActionsLocked}
                      className="px-3 py-1 text-sm border border-border-base rounded-md bg-surface text-text-soft hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
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
          onClose={handleCreateModalClose}
          onSuccess={handleCreateSuccess}
          onDiscardPendingChange={setModuloDiscardPending}
        />
      )}

      {isEditModalOpen && selectedModulo && (
        <EditModuleModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          onSuccess={handleEditSuccess}
          modulo={selectedModulo}
          onDiscardPendingChange={setModuloDiscardPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!activeTarget && !!activeAction && moduloDiscardPending === null}
        onClose={closeActiveConfirm}
        onConfirm={handleActiveConfirm}
        title={activeAction === 'reactivate' ? 'Reactivar módulo' : 'Desactivar módulo'}
        message={
          activeTarget
            ? activeAction === 'reactivate'
              ? `¿Reactivar el módulo "${activeTarget.nombre}"?`
              : `¿Desactivar el módulo "${activeTarget.nombre}"?`
            : ''
        }
        confirmText={activeAction === 'reactivate' ? 'Reactivar' : 'Desactivar'}
        cancelText="Cancelar"
        variant={activeAction === 'reactivate' ? 'info' : 'danger'}
        loading={togglingActive}
      />
    </div>
  );
};

export default ModuleManagementPage;