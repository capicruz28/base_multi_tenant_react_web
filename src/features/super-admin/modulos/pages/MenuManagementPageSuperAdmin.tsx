import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Menu,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import {
  Tree,
  NodeModel,
  RenderParams,
  DropOptions,
  TreeMethods,
  PlaceholderRenderParams,
} from '@minoru/react-dnd-treeview';

import { menuService } from '@/features/admin/services/menu.service';
import { moduloV2Service } from '@/features/modulos/services/modulo-v2.service';
import { seccionService } from '@/features/modulos/services/seccion.service';
import type { ModuloV2 } from '@/features/modulos/types/modulo-v2.types';
import type { Seccion } from '@/features/modulos/types/seccion.types';
import type { MenuUpdateData, BackendManageMenuItem } from '@/features/admin/types/menu.types';
import { useAuth } from '@/shared/context/AuthContext';
import { getErrorMessage } from '@/core/services/error.service';
import { getIcon } from '@/shared/lib/icon-utils';
import { useTheme } from '@/shared/context/ThemeContext';
import CreateMenuModal from '../components/CreateMenuModal';
import EditMenuModal from '../components/EditMenuModal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';

// Tipo para el nodo del árbol
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

const MenuManagementPageSuperAdmin: React.FC = () => {
  const { isSuperAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const { isDarkMode } = useTheme();
  const [modulos, setModulos] = useState<ModuloV2[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  void loading;
  void setLoading;
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [selectedModuloId, setSelectedModuloId] = useState<string>('');
  const [selectedSeccionId, setSelectedSeccionId] = useState<string>('');

  // Árbol de menús (para cuando NO hay sección seleccionada)
  const [numberToUuidMap, setNumberToUuidMap] = useState<Map<number, string>>(new Map());
  const [treeViewData, setTreeViewData] = useState<NodeModel<MenuNodeData>[]>([]);
  const [initiallyOpenIds, setInitiallyOpenIds] = useState<(number | string)[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState<boolean>(false);
  const treeRef = useRef<TreeMethods>(null);
  
  // ✅ NUEVO: Lista plana de menús para mostrar en tabla (cuando hay sección seleccionada)
  const [flatMenusList, setFlatMenusList] = useState<MenuNodeData[]>([]);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuNodeData | null>(null);
  const [parentMenuForCreate, setParentMenuForCreate] = useState<MenuNodeData | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [menuToDelete, setMenuToDelete] = useState<MenuNodeData | null>(null);

  // Cargar módulos
  const fetchModulos = useCallback(async () => {
    try {
      const data = await moduloV2Service.getModulos({ es_activo: true });
      setModulos(data.items);
    } catch (err) {
      console.error('Error cargando módulos:', err);
    }
  }, []);

  // ✅ ACTUALIZADO: Cargar secciones del módulo seleccionado usando el endpoint correcto
  const fetchSeccionesByModulo = useCallback(async (moduloId: string) => {
    if (!moduloId) {
      setSecciones([]);
      return;
    }

    try {
      const seccionesData = await seccionService.getSeccionesByModulo(moduloId);
      setSecciones(seccionesData || []);
    } catch (err: any) {
      // ✅ Manejar errores 405/404/500 de forma más silenciosa
      if (err?.response?.status === 405 || err?.response?.status === 404 || err?.response?.status === 500) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Endpoint de secciones por módulo no disponible o no implementado aún:', err?.response?.status);
        }
        setSecciones([]);
        return;
      }
      console.error('Error cargando secciones del módulo:', err);
      setSecciones([]);
    }
  }, []);

  // ✅ NUEVO: Función para aplanar menús a lista plana para mostrar en tabla
  const flattenMenusToList = useCallback((nodes: BackendManageMenuItem[]): MenuNodeData[] => {
    const flatList: MenuNodeData[] = [];
    
    function flatten(menuItems: BackendManageMenuItem[]) {
      menuItems.forEach(menu => {
        flatList.push({
          menu_id: menu.menu_id,
          nombre: menu.nombre,
          icono: menu.icono || null,
          ruta: menu.ruta || null,
          padre_menu_id: menu.padre_menu_id || null,
          orden: menu.orden || null,
          es_activo: menu.es_activo,
          seccion_id: menu.seccion_id || selectedSeccionId || null,
        });
        
        // Incluir submenús también en la lista plana
        if (menu.children && menu.children.length > 0) {
          flatten(menu.children);
        }
      });
    }
    
    flatten(nodes);
    // Ordenar por orden ascendente
    return flatList.sort((a, b) => (a.orden || 0) - (b.orden || 0));
  }, [selectedSeccionId]); // ✅ selectedSeccionId en dependencias

  // Transformar datos del backend a nodos del árbol
  // ✅ MOVIDO ANTES de fetchMenusByModulo para evitar error de inicialización
  const transformBackendDataToTreeNodes = useCallback((nodes: BackendManageMenuItem[]): NodeModel<MenuNodeData>[] => {
    const treeNodes: NodeModel<MenuNodeData>[] = [];
    const uuidMap = new Map<string, number>();
    const numMap = new Map<number, string>();
    let nextNumber = 1;

    function flattenNodes(backendNodes: BackendManageMenuItem[], parentId: number | string) {
      backendNodes.forEach(node => {
        const hasChildren = node.children && node.children.length > 0;
        
        if (!uuidMap.has(node.menu_id)) {
          uuidMap.set(node.menu_id, nextNumber);
          numMap.set(nextNumber, node.menu_id);
          nextNumber++;
        }
        const numericId = uuidMap.get(node.menu_id)!;
        
        let numericParentId: number | string = parentId;
        if (typeof parentId === 'string' && parentId !== '0' && uuidMap.has(parentId)) {
          numericParentId = uuidMap.get(parentId)!;
        } else if (parentId === '0' || parentId === 0) {
          numericParentId = 0;
        }
        
        const treeNode: NodeModel<MenuNodeData> = {
          id: numericId,
          parent: numericParentId === '0' ? 0 : (typeof numericParentId === 'string' ? 0 : numericParentId),
          text: node.nombre,
          droppable: true,
          data: {
            menu_id: node.menu_id,
            nombre: node.nombre,
            icono: node.icono,
            ruta: node.ruta,
            orden: node.orden,
            es_activo: node.es_activo,
            padre_menu_id: node.padre_menu_id || null,
            seccion_id: selectedSeccionId || null,
          },
        };
        treeNodes.push(treeNode);
        if (hasChildren) {
          flattenNodes(node.children, node.menu_id);
        }
      });
    }
    flattenNodes(nodes, 0);
    
    setNumberToUuidMap(numMap);
    
    return treeNodes;
  }, [selectedSeccionId]);

  // ✅ ACTUALIZADO: Cargar menús directamente del módulo con filtro opcional de sección
  // ✅ Ahora el filtro se hace en el backend usando el parámetro seccion_id
  const fetchMenusByModulo = useCallback(async (moduloId: string, seccionId?: string) => {
      if (!moduloId) {
      setTreeViewData([]);
      setInitiallyOpenIds([]);
      setFlatMenusList([]);
      return;
    }

    setIsLoadingTree(true);
    setError(null);
    try {
      // ✅ ACTUALIZADO: Usar endpoint con parámetro opcional seccion_id
      // GET /modulos-menus/modulo/{modulo_id}/?seccion_id={seccion_id}
      const backendTree = await menuService.getMenusByModulo(moduloId, seccionId);
      
      // ✅ ACTUALIZADO: Si hay sección seleccionada, aplanar a lista para tabla
      // Si no hay sección, usar árbol
      if (seccionId) {
        const flatList = flattenMenusToList(backendTree);
        setFlatMenusList(flatList);
        setTreeViewData([]); // Limpiar árbol cuando hay sección
      } else {
        const transformedNodes = transformBackendDataToTreeNodes(backendTree);
        setTreeViewData(transformedNodes);
        const idsToOpen = transformedNodes.filter(node => node.droppable).map(node => node.id);
        setInitiallyOpenIds(idsToOpen);
        setFlatMenusList([]); // Limpiar lista cuando no hay sección
      }
    } catch (err: any) {
      // ✅ Manejar errores 405/404/500 de forma más silenciosa
      if (err?.response?.status === 405 || err?.response?.status === 404 || err?.response?.status === 500) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Endpoint de menús por módulo no disponible o no implementado aún:', err?.response?.status);
        }
        setTreeViewData([]);
        setInitiallyOpenIds([]);
        setFlatMenusList([]);
        return;
      }
      console.error('Error cargando menús del módulo:', err);
      setError('No se pudo cargar el menú del módulo.');
      toast.error('Error al cargar el menú del módulo.');
      setTreeViewData([]);
      setInitiallyOpenIds([]);
      setFlatMenusList([]);
    } finally {
      setIsLoadingTree(false);
    }
  }, [transformBackendDataToTreeNodes, flattenMenusToList]);

  // ⚠️ DEPRECADO: Ya no se usa fetchMenus por sección, ahora se obtienen directamente del módulo
  // Se mantiene por compatibilidad pero no se llama

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchModulos();
    }
  }, [isAuthenticated, authLoading, fetchModulos]);

  // ✅ ACTUALIZADO: Cargar secciones cuando se selecciona un módulo
  // ✅ Separar en dos useEffect para evitar conflictos y mantener la persistencia de la sección
  const prevModuloIdRef = useRef<string>('');
  
  useEffect(() => {
    if (selectedModuloId) {
      // ✅ Solo resetear sección si el módulo realmente cambió
      if (prevModuloIdRef.current !== selectedModuloId) {
        setSelectedSeccionId('');
        prevModuloIdRef.current = selectedModuloId;
      }
      
      fetchSeccionesByModulo(selectedModuloId);
    } else {
      setSecciones([]);
      setSelectedSeccionId('');
      prevModuloIdRef.current = '';
    }
  }, [selectedModuloId, fetchSeccionesByModulo]);

  // ✅ NUEVO: Cargar menús cuando cambia el módulo o la sección
  useEffect(() => {
    if (selectedModuloId) {
      // ✅ Cargar menús con la sección seleccionada (si hay una)
      fetchMenusByModulo(selectedModuloId, selectedSeccionId || undefined);
    } else {
      setTreeViewData([]);
      setInitiallyOpenIds([]);
    }
  }, [selectedModuloId, selectedSeccionId, fetchMenusByModulo]);

  // Handlers
  const handleModuloChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModuloId(event.target.value);
  };

  const handleSeccionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeccionId = event.target.value;
    setSelectedSeccionId(newSeccionId);
    // ✅ ACTUALIZADO: Recargar menús con el filtro de sección desde el backend
    if (selectedModuloId) {
      fetchMenusByModulo(selectedModuloId, newSeccionId || undefined);
    }
  };

  const handleDrop = useCallback(
    (newTreeData: NodeModel<MenuNodeData>[], options: DropOptions<MenuNodeData>) => {
      const { dragSourceId, dragSource } = options;

      if (dragSourceId === undefined || !dragSource) {
        setError('Error: Elemento arrastrado no identificado.');
        toast.error('Error al mover el elemento.');
        return;
      }

      const numericDragSourceId = typeof dragSourceId === 'string' ? parseInt(dragSourceId, 10) : dragSourceId;
      if (isNaN(numericDragSourceId) || typeof numericDragSourceId !== 'number') {
        setError('Error: ID de elemento arrastrado inválido.');
        toast.error('Error interno al mover.');
        return;
      }

      const realMenuId = numberToUuidMap.get(numericDragSourceId);
      if (!realMenuId) {
        setError('Error: No se pudo encontrar el UUID real del elemento.');
        toast.error('Error interno al mover.');
        return;
      }

      const draggedNodeInNewTree = newTreeData.find(node => node.id === numericDragSourceId);
      if (!draggedNodeInNewTree || !draggedNodeInNewTree.data) {
        setError('Error: No se pudo encontrar el elemento movido en la nueva estructura.');
        toast.error('Error al procesar el movimiento.');
        return;
      }

      let newParentId: string | null = null;
      if (draggedNodeInNewTree.parent !== 0 && draggedNodeInNewTree.parent !== '0') {
        const parentNumericId = typeof draggedNodeInNewTree.parent === 'string' 
          ? parseInt(draggedNodeInNewTree.parent, 10) 
          : draggedNodeInNewTree.parent;
        if (!isNaN(parentNumericId)) {
          const parentUuid = numberToUuidMap.get(parentNumericId);
          if (parentUuid) {
            newParentId = parentUuid;
          }
        }
      }

      const newSiblings = newTreeData.filter(
        (node) => node.parent === draggedNodeInNewTree.parent
      );
      const newOrder = newSiblings.findIndex(
        (node) => node.id === numericDragSourceId
      );

      if (newOrder < 0) {
        setError('Error: No se pudo determinar el nuevo orden del elemento.');
        toast.error('Error al calcular el orden.');
        return;
      }

      setTreeViewData(newTreeData);
      setError(null);

      const updatePayload: Partial<MenuUpdateData> = {
        padre_menu_id: newParentId,
        orden: newOrder,
      };

      menuService.updateMenuItem(realMenuId, updatePayload)
        .then(() => {
          toast.success(`Menú "${draggedNodeInNewTree.text}" movido y orden actualizado.`);
        })
        .catch(err => {
          console.error('Error updating menu item after drop:', err);
          setError('Error al guardar la nueva estructura del menú.');
          toast.error('Error al guardar el orden. Revirtiendo cambios visuales.');
          if (selectedModuloId) {
            fetchMenusByModulo(selectedModuloId);
          }
        });
    },
    [selectedModuloId, numberToUuidMap, fetchMenusByModulo]
  );

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    setParentMenuForCreate(null);
    if (selectedModuloId) {
      // ✅ ACTUALIZADO: Pasar selectedSeccionId para refrescar correctamente la lista o árbol
      fetchMenusByModulo(selectedModuloId, selectedSeccionId || undefined);
    }
    // El toast de éxito ya se maneja en el modal
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedMenu(null);
    if (selectedModuloId) {
      // ✅ ACTUALIZADO: Pasar selectedSeccionId para refrescar correctamente la lista o árbol
      fetchMenusByModulo(selectedModuloId, selectedSeccionId || undefined);
    }
    // El toast de éxito ya se maneja en el modal
  };

  const handleToggleActivation = async (menu: MenuNodeData) => {
    try {
      if (menu.es_activo) {
        await menuService.deactivateMenuItem(menu.menu_id);
      } else {
        await menuService.reactivateMenuItem(menu.menu_id);
      }
      toast.success(`Menú ${menu.es_activo ? 'desactivado' : 'activado'} exitosamente`);
      if (selectedModuloId) {
        // ✅ ACTUALIZADO: Pasar selectedSeccionId para refrescar correctamente la lista o árbol
        fetchMenusByModulo(selectedModuloId, selectedSeccionId || undefined);
      }
    } catch (err) {
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || `Error al ${menu.es_activo ? 'desactivar' : 'activar'} el menú`);
    }
  };

  const openEditModal = (menu: MenuNodeData) => {
    setSelectedMenu(menu);
    setIsEditModalOpen(true);
  };

  const openDeleteConfirm = (menu: MenuNodeData) => {
    setMenuToDelete(menu);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!menuToDelete) return;

    try {
      await menuService.deactivateMenuItem(menuToDelete.menu_id);
      toast.success('Menú eliminado exitosamente');
      setIsDeleteConfirmOpen(false);
      setMenuToDelete(null);
      if (selectedModuloId) {
        // ✅ ACTUALIZADO: Pasar selectedSeccionId para refrescar correctamente la lista o árbol
        fetchMenusByModulo(selectedModuloId, selectedSeccionId || undefined);
      }
    } catch (err) {
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al eliminar el menú');
    }
  };

  // Obtener módulo y sección seleccionados con validación
  const selectedModulo = useMemo(() => {
    if (!modulos || !Array.isArray(modulos)) {
      return undefined;
    }
    return modulos.find(m => m.modulo_id === selectedModuloId);
  }, [modulos, selectedModuloId]);

  const selectedSeccion = useMemo(() => {
    if (!secciones || !Array.isArray(secciones)) {
      return undefined;
    }
    return secciones.find(s => s.seccion_id === selectedSeccionId);
  }, [secciones, selectedSeccionId]);

  // Si no es super admin
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Menu className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Acceso restringido</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No tienes permisos para acceder a la gestión de menús.
          </p>
        </div>
      </div>
    );
  }

  // Placeholder para drag & drop
  const CustomPlaceholder: React.FC<PlaceholderRenderParams & { node: NodeModel<MenuNodeData> }> = ({
    depth,
  }) => {
    const placeholderText = `Soltar aquí (nivel ${depth})`;
    const containerStyle: React.CSSProperties = {
      position: 'relative',
      height: '24px',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
    };
    const lineStyle: React.CSSProperties = {
      height: '2px',
      width: '100%',
      backgroundColor: isDarkMode ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)',
      borderRadius: '1px',
    };
    const textStyle: React.CSSProperties = {
      position: 'absolute',
      left: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      color: isDarkMode ? 'rgb(229, 231, 235)' : 'rgb(255, 255, 255)',
      backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.85)' : 'rgba(37, 99, 235, 0.9)',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      zIndex: 1,
    };

    return (
      <div style={containerStyle}>
        <div style={lineStyle} />
        <span style={textStyle}>{placeholderText}</span>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Header */}
      {/*
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Menús
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Administra los menús del sistema con estructura jerárquica (Módulo → Sección → Menú)
        </p>
      </div>
      */}
      {/* Selectores de Módulo y Sección */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="modulo-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Seleccionar Módulo
            </label>
            <select
              id="modulo-select"
              value={selectedModuloId}
              onChange={handleModuloChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white"
            >
              <option value="">-- Seleccione un módulo --</option>
                    {modulos && modulos.length > 0 && modulos.map((modulo) => (
                      <option key={modulo.modulo_id} value={modulo.modulo_id}>
                        {modulo.nombre}
                      </option>
                    ))}
            </select>
          </div>

          <div>
            <label htmlFor="seccion-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Seleccionar Sección
            </label>
            {isLoadingTree ? (
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : selectedModuloId && secciones && secciones.length > 0 ? (
              <select
                id="seccion-select"
                value={selectedSeccionId}
                onChange={handleSeccionChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white"
              >
                <option value="">-- Seleccione una sección --</option>
                {secciones.map((seccion) => (
                  <option key={seccion.seccion_id} value={seccion.seccion_id}>
                    {seccion.nombre}
                  </option>
                ))}
              </select>
            ) : selectedModuloId ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">No hay secciones disponibles.</p>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Seleccione un módulo primero.</p>
            )}
          </div>
        </div>

        {/* Información del módulo y sección seleccionados */}
        {(selectedModulo || selectedSeccion) && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              {selectedModulo && (
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: selectedModulo.color || '#6366f1' }}
                  >
                    {getIcon(selectedModulo.icono, Menu)}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedModulo.nombre}
                  </span>
                </div>
              )}
              {selectedSeccion && (
                <>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      {getIcon(selectedSeccion.icono, Menu)}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedSeccion.nombre}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {/* ✅ MEJORADO: Tabla de Menús cuando hay sección seleccionada, Árbol cuando no */}
      {selectedModuloId && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedSeccionId ? 'Menús de la Sección' : 'Menús del Módulo'}
            </h2>
            <button
              onClick={() => {
                setParentMenuForCreate(null);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 transition-colors"
              disabled={isLoadingTree}
            >
              <Plus className="h-4 w-4" />
              {selectedSeccionId ? 'Nuevo Menú' : 'Nuevo Menú Principal'}
            </button>
          </div>

          {isLoadingTree ? (
            <div className="flex items-center justify-center h-60 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
              <RefreshCw className="animate-spin h-6 w-6 text-brand-primary" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando menús...</span>
            </div>
          ) : selectedSeccionId && flatMenusList.length > 0 ? (
            // ✅ NUEVO: Tabla de menús cuando hay sección seleccionada
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Menú
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Ruta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Orden
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
                    {flatMenusList.map((menu) => (
                      <tr key={menu.menu_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              {getIcon(menu.icono, Menu, { size: 20 })}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {menu.nombre}
                              </div>
                              {menu.padre_menu_id && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Submenú
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {menu.ruta ? (
                            <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {menu.ruta}
                            </code>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white">{menu.orden ?? '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            menu.es_activo
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {menu.es_activo ? (
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
                              onClick={() => openEditModal(menu)}
                              className="text-brand-primary hover:text-brand-primary/80 dark:text-brand-primary dark:hover:text-brand-primary/80 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleToggleActivation(menu)}
                              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                menu.es_activo
                                  ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                                  : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                              }`}
                              title={menu.es_activo ? 'Desactivar' : 'Activar'}
                            >
                              {menu.es_activo ? <Trash2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                            </button>

                            <button
                              onClick={() => openDeleteConfirm(menu)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : selectedSeccionId && flatMenusList.length === 0 ? (
            // ✅ NUEVO: Estado vacío cuando hay sección pero no hay menús
            <div className="border border-gray-200 dark:border-gray-700 rounded-md p-8 bg-white dark:bg-gray-800 text-center">
              <Menu className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No hay menús en esta sección</p>
              <button
                onClick={() => {
                  setParentMenuForCreate(null);
                  setIsCreateModalOpen(true);
                }}
                className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
              >
                Crear primer menú
              </button>
            </div>
          ) : !selectedSeccionId && treeViewData.length > 0 ? (
            // ✅ Árbol cuando NO hay sección seleccionada (vista jerárquica completa)
            <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 min-h-[300px] bg-white dark:bg-gray-800 shadow-sm">
              <Tree<MenuNodeData>
                ref={treeRef}
                tree={treeViewData}
                rootId={0}
                onDrop={handleDrop}
                initialOpen={initiallyOpenIds}
                placeholderRender={(nodeFromLib, params) => <CustomPlaceholder node={nodeFromLib} {...params} />}
                sort={false}
                dropTargetOffset={10}
                canDrop={(_tree, options: DropOptions<MenuNodeData>) => {
                  const { dragSource, dropTargetId } = options;
                  if (dragSource?.id === dropTargetId) {
                    return false;
                  }
                  return true;
                }}
                render={(node: NodeModel<MenuNodeData>, { depth, isOpen, onToggle }: RenderParams) => {
                  const hasChildren = treeViewData.some(n => n.parent === node.id);
                  return (
                    <div
                      style={{ marginLeft: depth * 20 }}
                      className={`flex items-center justify-between py-1.5 px-2 rounded group hover:bg-gray-100 dark:hover:bg-gray-700 ${!node.data?.es_activo ? 'opacity-60 italic' : ''}`}
                    >
                      <div className="flex items-center truncate min-w-0 flex-1">
                        <span
                          style={{ width: '24px', textAlign: 'center', cursor: hasChildren ? 'pointer' : 'default' }}
                          className="inline-block mr-1 text-gray-500 dark:text-gray-400 flex-shrink-0"
                          onClick={hasChildren ? onToggle : undefined}
                        >
                          {hasChildren ? (isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : <span className="w-4" />}
                        </span>
                        {node.data?.icono && (
                          <span className="mr-2 flex-shrink-0">
                            {getIcon(node.data.icono, Menu)}
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {node.text}
                        </span>
                        {node.data?.ruta && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                            ({node.data.ruta})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${node.data?.es_activo
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                          {node.data?.es_activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <button
                          onClick={() => node.data && openEditModal(node.data)}
                          className="p-1 text-brand-primary hover:text-brand-primary/80 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                          title="Editar"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => node.data && handleToggleActivation(node.data)}
                          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${node.data?.es_activo
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                            }`}
                          title={node.data?.es_activo ? 'Desactivar' : 'Activar'}
                        >
                          {node.data?.es_activo ? <Trash2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => node.data && openDeleteConfirm(node.data)}
                          className="p-1 text-red-600 hover:text-red-900 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          ) : !selectedSeccionId && treeViewData.length === 0 ? (
            // ✅ Estado vacío cuando NO hay sección y no hay menús
            <div className="border border-gray-200 dark:border-gray-700 rounded-md p-8 bg-white dark:bg-gray-800 text-center">
              <Menu className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Selecciona una sección para ver los menús o crea un menú principal
              </p>
              <button
                onClick={() => {
                  setParentMenuForCreate(null);
                  setIsCreateModalOpen(true);
                }}
                className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
              >
                Crear primer menú
              </button>
            </div>
          ) : null}
        </>
      )}

      {/* Modales */}
      {isCreateModalOpen && selectedModuloId && (
        <CreateMenuModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setParentMenuForCreate(null);
          }}
          onSuccess={handleCreateSuccess}
          seccionId={selectedSeccionId || ''}
          moduloId={selectedModuloId} // ✅ NUEVO: Pasar moduloId al modal
          parentMenuId={parentMenuForCreate?.menu_id || null}
        />
      )}

      {isEditModalOpen && selectedMenu && (
        <EditMenuModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedMenu(null);
          }}
          onSuccess={handleEditSuccess}
          menu={selectedMenu}
        />
      )}

      {/* Confirmación de eliminación */}
      {isDeleteConfirmOpen && menuToDelete && (
        <ConfirmDialog
          isOpen={isDeleteConfirmOpen}
          onClose={() => {
            setIsDeleteConfirmOpen(false);
            setMenuToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Eliminar Menú"
          message={`¿Estás seguro de que deseas eliminar el menú "${menuToDelete.nombre}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
        />
      )}
    </div>
  );
};

export default MenuManagementPageSuperAdmin;

