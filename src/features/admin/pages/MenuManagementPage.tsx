// src/features/admin/pages/MenuManagementPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Tree,
  NodeModel,
  RenderParams,
  DropOptions,
  TreeMethods,
  PlaceholderRenderParams,
} from '@minoru/react-dnd-treeview';
import toast from 'react-hot-toast';

// --- Importaciones de Servicios y Tipos Propios ---
import { menuService } from '../services/menu.service';
import { moduloV2Service } from '@/features/modulos/services/modulo-v2.service';
import { seccionService } from '@/features/modulos/services/seccion.service';
import type {
  AreaSimpleList,
  BackendManageMenuItem,
  MenuCreateData,
  MenuUpdateData,
} from '../types/menu.types';
import type { ModuloV2 } from '@/features/modulos/types/modulo-v2.types';
import type { Seccion } from '@/features/modulos/types/seccion.types';

// --- NUEVAS IMPORTACIONES ---
import { getIcon } from '@/shared/lib/icon-utils';
import IconSelector from '@/shared/components/ui/IconSelector';

// --- Definición del Tipo para el campo 'data' de nuestros nodos ---
interface MenuNodeData {
  menu_id: string; // UUID format - el ID real del backend
  nombre: string;
  icono?: string | null;
  ruta?: string | null;
  padre_menu_id?: string | null; // UUID format
  orden?: number | null;
  es_activo: boolean;
  area_id?: string | null; // UUID format
  area_nombre?: string | null;
}

// --- Tipo para el formulario de creación ---
type NewMenuFormData = Omit<MenuCreateData, 'area_id' | 'padre_menu_id' | 'orden'>;

// --- Tipo para el formulario de edición ---
type EditFormData = Omit<MenuUpdateData, 'padre_menu_id' | 'orden'>;


// --- Componente Principal ---
const MenuManagementPage: React.FC = () => {
  // ⚠️ DEPRECADO: Mantener temporalmente para compatibilidad
  const [areas, setAreas] = useState<AreaSimpleList[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  
  // ✅ NUEVO: Estado para módulos y secciones
  const [modulos, setModulos] = useState<ModuloV2[]>([]);
  const [selectedModuloId, setSelectedModuloId] = useState<string | null>(null);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [selectedSeccionId, setSelectedSeccionId] = useState<string | null>(null);
  // Mapeo: número temporal (para la librería) -> UUID (real del backend)
  const [numberToUuidMap, setNumberToUuidMap] = useState<Map<number, string>>(new Map());
  const [treeViewData, setTreeViewData] = useState<NodeModel<MenuNodeData>[]>([]);
  const [initiallyOpenIds, setInitiallyOpenIds] = useState<(number | string)[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState<boolean>(false);
  const [isLoadingTree, setIsLoadingTree] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingNodeData, setEditingNodeData] = useState<NodeModel<MenuNodeData> | null>(null);
  const [parentNodeForCreate, setParentNodeForCreate] = useState<NodeModel<MenuNodeData> | null>(null);
  const treeRef = useRef<TreeMethods>(null);
  const [newMenuData, setNewMenuData] = useState<NewMenuFormData>({
    nombre: '', icono: '', ruta: '', es_activo: true,
  });
  const [editFormData, setEditFormData] = useState<EditFormData>({
    nombre: '', icono: '', ruta: '', es_activo: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ⚠️ DEPRECADO: Mantener temporalmente
  useEffect(() => {
    const fetchAreas = async () => { 
      setIsLoadingAreas(true); 
      setError(null); 
      try { 
        const areaList = await menuService.getAreaList(); 
        setAreas(areaList); 
      } catch (err) { 
        console.error("Error fetching areas:", err); 
        setError("No se pudo cargar la lista de áreas."); 
        toast.error("Error al cargar áreas."); 
      } finally { 
        setIsLoadingAreas(false); 
      } 
    }; 
    fetchAreas();
  }, []);

  // ✅ NUEVO: Cargar módulos
  useEffect(() => {
    const fetchModulos = async () => {
      setIsLoadingAreas(true);
      setError(null);
      try {
        const response = await moduloV2Service.getModulos({ es_activo: true });
        setModulos(response.items);
      } catch (err) {
        console.error("Error fetching modulos:", err);
        setError("No se pudo cargar la lista de módulos.");
        toast.error("Error al cargar módulos.");
      } finally {
        setIsLoadingAreas(false);
      }
    };
    fetchModulos();
  }, []);

  // ✅ NUEVO: Cargar secciones cuando se selecciona un módulo
  useEffect(() => {
    if (!selectedModuloId) {
      setSecciones([]);
      setSelectedSeccionId(null);
      return;
    }

    const fetchSecciones = async () => {
      setIsLoadingTree(true);
      setError(null);
      try {
        const response = await seccionService.getSecciones({ 
          modulo_id: selectedModuloId,
          es_activa: true 
        });
        setSecciones(response.items);
      } catch (err) {
        console.error("Error fetching secciones:", err);
        setError("No se pudo cargar la lista de secciones.");
        toast.error("Error al cargar secciones.");
      } finally {
        setIsLoadingTree(false);
      }
    };
    fetchSecciones();
  }, [selectedModuloId]);

  const transformBackendDataToTreeNodes = useCallback((nodes: BackendManageMenuItem[]): NodeModel<MenuNodeData>[] => {
    const treeNodes: NodeModel<MenuNodeData>[] = [];
    const uuidMap = new Map<string, number>();
    const numMap = new Map<number, string>();
    let nextNumber = 1;

    function flattenNodes(backendNodes: BackendManageMenuItem[], parentId: number | string) {
      backendNodes.forEach(node => {
        const hasChildren = node.children && node.children.length > 0;
        
        // Crear mapeo UUID -> número si no existe
        if (!uuidMap.has(node.menu_id)) {
          uuidMap.set(node.menu_id, nextNumber);
          numMap.set(nextNumber, node.menu_id);
          nextNumber++;
        }
        const numericId = uuidMap.get(node.menu_id)!;
        
        // Convertir parentId si es UUID
        let numericParentId: number | string = parentId;
        if (typeof parentId === 'string' && parentId !== '0' && uuidMap.has(parentId)) {
          numericParentId = uuidMap.get(parentId)!;
        } else if (parentId === '0' || parentId === 0) {
          numericParentId = 0;
        }
        
        const treeNode: NodeModel<MenuNodeData> = {
          id: numericId, // Número temporal para la librería
          parent: numericParentId === '0' ? 0 : (typeof numericParentId === 'string' ? 0 : numericParentId),
          text: node.nombre,
          droppable: true,
          data: {
            menu_id: node.menu_id, // UUID real
            nombre: node.nombre,
            icono: node.icono,
            ruta: node.ruta,
            orden: node.orden,
            es_activo: node.es_activo,
            area_id: node.area_id || null,
            area_nombre: node.area_nombre || null,
            padre_menu_id: node.padre_menu_id || null,
          },
        };
        treeNodes.push(treeNode);
        if (hasChildren) {
          flattenNodes(node.children, node.menu_id);
        }
      });
    }
    flattenNodes(nodes, 0);
    
    // Actualizar el mapeo
    setNumberToUuidMap(numMap);
    
    return treeNodes;
  }, []);

  useEffect(() => {
    if (selectedAreaId === null) { setTreeViewData([]); setInitiallyOpenIds([]); return; }
    const fetchMenuTree = async () => {
      setIsLoadingTree(true); setError(null);
      try {
        const backendTree = await menuService.getMenuTreeByArea(selectedAreaId);
        const transformedNodes = transformBackendDataToTreeNodes(backendTree);
        setTreeViewData(transformedNodes);
        const idsToOpen = transformedNodes.filter(node => node.droppable).map(node => node.id);
        setInitiallyOpenIds(idsToOpen);
      } catch (err) { console.error(`Error fetching menu tree:`, err); setError("No se pudo cargar el menú."); toast.error("Error al cargar el menú."); setTreeViewData([]); setInitiallyOpenIds([]); }
      finally { setIsLoadingTree(false); }
    };
    fetchMenuTree();
  }, [selectedAreaId, transformBackendDataToTreeNodes]);

  const handleAreaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newAreaId = event.target.value || null;
    setSelectedAreaId(newAreaId);
  };

  // ✅ NUEVO: Handlers para módulos y secciones
  const handleModuloChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newModuloId = event.target.value || null;
    setSelectedModuloId(newModuloId);
    setSelectedSeccionId(null); // Reset sección al cambiar módulo
  };

  const handleSeccionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeccionId = event.target.value || null;
    setSelectedSeccionId(newSeccionId);
    // ⚠️ TEMPORAL: Usar seccion_id como area_id para compatibilidad con endpoint antiguo
    // Esto se actualizará cuando el backend tenga endpoint de menús por sección
    if (newSeccionId) {
      setSelectedAreaId(newSeccionId);
    }
  };

  const handleDrop = useCallback(
    (newTreeData: NodeModel<MenuNodeData>[], options: DropOptions<MenuNodeData>) => {
      const { dragSourceId, dragSource } = options;

      if (dragSourceId === undefined || !dragSource) {
        setError("Error: Elemento arrastrado no identificado.");
        toast.error("Error al mover el elemento.");
        return;
      }
      const numericDragSourceId = typeof dragSourceId === 'string' ? parseInt(dragSourceId, 10) : dragSourceId;
      if (isNaN(numericDragSourceId) || typeof numericDragSourceId !== 'number') {
        setError("Error: ID de elemento arrastrado inválido.");
        toast.error("Error interno al mover.");
        return;
      }

      // Convertir número temporal a UUID real
      const realMenuId = numberToUuidMap.get(numericDragSourceId);
      if (!realMenuId) {
        setError("Error: No se pudo encontrar el UUID real del elemento.");
        toast.error("Error interno al mover.");
        return;
      }

      const draggedNodeInNewTree = newTreeData.find(node => node.id === numericDragSourceId);

      if (!draggedNodeInNewTree || !draggedNodeInNewTree.data) {
        setError("Error: No se pudo encontrar el elemento movido en la nueva estructura.");
        toast.error("Error al procesar el movimiento.");
        return;
      }

      // Convertir parentId numérico a UUID
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
          setError("Error: No se pudo determinar el nuevo orden del elemento.");
          toast.error("Error al calcular el orden.");
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
          console.error("Error updating menu item after drop:", err);
          setError("Error al guardar la nueva estructura del menú.");
          toast.error("Error al guardar el orden. Revirtiendo cambios visuales.");
          if (selectedAreaId) {
            menuService.getMenuTreeByArea(selectedAreaId)
              .then(backendTree => {
                const originalNodes = transformBackendDataToTreeNodes(backendTree);
                setTreeViewData(originalNodes);
                const idsToOpen = originalNodes.filter(n => n.droppable).map(n => n.id);
                setInitiallyOpenIds(idsToOpen);
              })
              .catch(() => toast.error("Error crítico: No se pudo recargar el árbol original. Por favor, recargue la página."));
          }
        });
    },
    [selectedAreaId, transformBackendDataToTreeNodes]
  );

  const handleOpenCreateModal = useCallback((parentNode: NodeModel<MenuNodeData> | null = null) => {
    setParentNodeForCreate(parentNode);
    setNewMenuData({ nombre: '', icono: '', ruta: '', es_activo: true });
    setIsSubmitting(false);
    setIsCreateModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((node: NodeModel<MenuNodeData>) => {
    if (!node.data) { toast.error("No se pueden cargar los datos para editar."); return; }
    setEditingNodeData(node);
    setEditFormData({
        nombre: node.data.nombre ?? '',
        icono: node.data.icono ?? '',
        ruta: node.data.ruta ?? '',
        es_activo: node.data.es_activo,
    });
    setIsSubmitting(false);
    setIsEditModalOpen(true);
  }, []);

  const handleToggleActive = useCallback(async (node: NodeModel<MenuNodeData>) => {
    if (!node.data || typeof node.id !== 'number') { setError("Error interno."); toast.error("Error interno."); return; }
    const numericId = node.id;
    const realMenuId = numberToUuidMap.get(numericId);
    if (!realMenuId) {
      setError("Error: No se pudo encontrar el UUID real del menú.");
      toast.error("Error interno.");
      return;
    }
    const currentStatus = node.data.es_activo;
    const action = currentStatus ? 'desactivar' : 'reactivar';
    const originalData = [...treeViewData];
    setTreeViewData(prevData => prevData.map(n => n.id === numericId ? { ...n, data: { ...n.data!, es_activo: !currentStatus } } : n));
    try {
        currentStatus ? await menuService.deactivateMenuItem(realMenuId) : await menuService.reactivateMenuItem(realMenuId);
        toast.success(`Menú ${action}do.`);
        setError(null);
    }
    catch (err) {
        console.error(`Error al ${action}:`, err); setError(`Error al ${action}.`); toast.error(`Error al ${action}.`);
        setTreeViewData(originalData);
    }
  }, [treeViewData, numberToUuidMap]);

  const handleNewMenuInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    const name = target.name;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setNewMenuData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditFormInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    const name = target.name;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewIconChange = useCallback((iconValue: string | null) => {
      setNewMenuData((prev: NewMenuFormData) => ({ ...prev, icono: iconValue ?? '' }));
  }, []);

  const handleEditIconChange = useCallback((iconValue: string | null) => {
      setEditFormData((prev: EditFormData) => ({ ...prev, icono: iconValue ?? '' }));
  }, []);

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // ✅ NUEVO: Validar que haya sección o área seleccionada
    if (!selectedSeccionId && !selectedAreaId) {
      toast.error("Selecciona una sección o área.");
      return;
    }
    if (!newMenuData.nombre.trim()) { toast.error("Nombre obligatorio."); return; }
    setIsSubmitting(true);
    const parentNumericId = parentNodeForCreate ? parentNodeForCreate.id : null;
    let parentUuid: string | null = null;
    if (parentNumericId !== null && typeof parentNumericId === 'number') {
      const uuid = numberToUuidMap.get(parentNumericId);
      if (uuid) {
        parentUuid = uuid;
      }
    }
    const siblings = treeViewData.filter(node => node.parent === (parentNumericId ?? 0));
    const newOrder = siblings.length;
    const dataToSend: MenuCreateData = {
        ...newMenuData,
        icono: newMenuData.icono || null,
        ruta: newMenuData.ruta || null,
        // ✅ NUEVO: Usar seccion_id si está disponible, sino area_id
        area_id: selectedSeccionId || selectedAreaId!,
        padre_menu_id: parentUuid,
        orden: newOrder
    };
    try {
      const createdMenu = await menuService.createMenuItem(dataToSend);
      toast.success(`Menú "${createdMenu.nombre}" creado!`);
      const currentAreaId = selectedAreaId;
      if (!currentAreaId) { setIsSubmitting(false); return; }
      setIsLoadingTree(true);
      const backendTree = await menuService.getMenuTreeByArea(currentAreaId);
      const transformedNodes = transformBackendDataToTreeNodes(backendTree);
      setTreeViewData(transformedNodes);
      const idsToOpen = transformedNodes.filter(n => n.droppable).map(n => n.id);
      setInitiallyOpenIds(idsToOpen); setIsLoadingTree(false);
      setIsCreateModalOpen(false);
    } catch (error: any) { console.error("Error creating:", error); const errorMsg = error?.response?.data?.detail || error.message || "No se pudo crear."; toast.error(`Error: ${errorMsg}`); }
    finally { setIsSubmitting(false); }
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingNodeData || typeof editingNodeData.id !== 'number') { toast.error("Error: No se encuentra el menú a editar."); return; }
    if (!editFormData.nombre || !editFormData.nombre.trim()) { toast.error("El nombre del menú es obligatorio."); return; }
    setIsSubmitting(true);
    const numericId = editingNodeData.id;
    const menuIdToUpdate = numberToUuidMap.get(numericId);
    if (!menuIdToUpdate) {
      toast.error("Error: No se pudo encontrar el UUID real del menú.");
      setIsSubmitting(false);
      return;
    }
    const dataToSend: Omit<MenuUpdateData, 'padre_menu_id' | 'orden'> = {
        nombre: editFormData.nombre,
        icono: editFormData.icono || null,
        ruta: editFormData.ruta || null,
        es_activo: editFormData.es_activo,
    };
    try {
        const updatedMenu = await menuService.updateMenuItem(menuIdToUpdate, dataToSend);
        toast.success(`Menú "${updatedMenu.nombre}" actualizado.`);
        setTreeViewData(prevData =>
            prevData.map(node => {
                if (node.id === numericId) {
                    return {
                        ...node,
                        text: updatedMenu.nombre,
                        data: {
                            ...node.data!,
                            nombre: updatedMenu.nombre,
                            icono: updatedMenu.icono,
                            ruta: updatedMenu.ruta,
                            es_activo: updatedMenu.es_activo,
                        },
                    };
                }
                return node;
            })
        );
        setIsEditModalOpen(false);
        setEditingNodeData(null);
    } catch (error: any) {
        console.error("Error updating menu item:", error);
        const errorMsg = error?.response?.data?.detail || error.message || "No se pudo actualizar el menú.";
        toast.error(`Error: ${errorMsg}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- *** Renderizador de Placeholder con Estilo y Tema *** ---
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
      backgroundColor: 'var(--color-info)',
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
      color: 'var(--text-primary)',
      backgroundColor: 'color-mix(in srgb, var(--color-info) 82%, var(--bg-page))',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      zIndex: 1,
    };

    return (
      <div style={containerStyle}>
        <div style={lineStyle} />
        <span style={textStyle}>
          {placeholderText}
        </span>
      </div>
    );
  };
  // --- ************************************************** ---

  return (
      <div className="min-h-screen bg-page p-4 md:p-6">        

        {/* ✅ NUEVO: Selectores de Módulo y Sección */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label htmlFor="modulo-select" className="block text-sm font-medium text-text-base mb-1">
              Seleccionar Módulo
            </label>
            {isLoadingAreas ? (
              <div className="h-10 bg-subtle rounded animate-pulse"></div>
            ) : modulos.length > 0 ? (
              <select
                id="modulo-select"
                value={selectedModuloId ?? ''}
                onChange={handleModuloChange}
                className="block w-full pl-3 pr-10 py-2 text-base border border-border-base focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md bg-surface text-text-base"
              >
                <option value="" disabled>-- Seleccione un módulo --</option>
                {modulos.map((modulo) => (
                  <option key={modulo.modulo_id} value={modulo.modulo_id}>
                    {modulo.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-error text-sm mt-1">No se encontraron módulos.</p>
            )}
          </div>

          <div>
            <label htmlFor="seccion-select" className="block text-sm font-medium text-text-base mb-1">
              Seleccionar Sección
            </label>
            {isLoadingTree ? (
              <div className="h-10 bg-subtle rounded animate-pulse"></div>
            ) : selectedModuloId && secciones.length > 0 ? (
              <select
                id="seccion-select"
                value={selectedSeccionId ?? ''}
                onChange={handleSeccionChange}
                className="block w-full pl-3 pr-10 py-2 text-base border border-border-base focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md bg-surface text-text-base"
              >
                <option value="" disabled>-- Seleccione una sección --</option>
                {secciones.map((seccion) => (
                  <option key={seccion.seccion_id} value={seccion.seccion_id}>
                    {seccion.nombre}
                  </option>
                ))}
              </select>
            ) : selectedModuloId ? (
              <p className="text-text-soft text-sm mt-1">No hay secciones disponibles.</p>
            ) : (
              <p className="text-text-soft text-sm mt-1">Seleccione un módulo primero.</p>
            )}
          </div>
        </div>

        {/* ⚠️ DEPRECADO: Selector de Área (mantener temporalmente como fallback) */}
        {areas.length > 0 && (
          <div className="mb-6 max-w-xs">
            <label htmlFor="area-select" className="block text-sm font-medium text-text-soft mb-1">
              ⚠️ Seleccionar Área (Deprecado)
            </label>
            {isLoadingAreas ? (
              <div className="h-10 bg-subtle rounded animate-pulse"></div>
            ) : (
              <select
                id="area-select"
                value={selectedAreaId ?? ''}
                onChange={handleAreaChange}
                className="block w-full pl-3 pr-10 py-2 text-base border border-border-base focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md bg-surface text-text-base opacity-60"
              >
                <option value="" disabled>-- Seleccione un área --</option>
                {areas.map((area) => (
                  <option key={area.area_id} value={area.area_id}>
                    {area.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {error && ( <div className="mb-4 p-3 bg-error/10 border border-error/30 text-error rounded">{error}</div> )}

        {(selectedAreaId !== null || selectedSeccionId !== null) && (
          <>
            <div className="mb-4">
              <button
                onClick={() => handleOpenCreateModal(null)}
                className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md shadow-sm hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50"
                disabled={isLoadingTree}
              >
                {selectedSeccionId ? 'Añadir Menú Principal a la Sección' : 'Añadir Menú Principal al Área'}
              </button>
            </div>

            {isLoadingTree ? ( <div className="flex items-center justify-center h-60 border border-border-base rounded-md bg-surface"><p className="text-text-soft">Cargando estructura...</p></div>
            ) : treeViewData.length > 0 ? (
              <div className="border border-border-base rounded-md p-3 min-h-[300px] bg-surface shadow-sm">
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
                  render={( node: NodeModel<MenuNodeData>, { depth, isOpen, onToggle }: RenderParams ) => {
                      const hasChildren = treeViewData.some(n => n.parent === node.id);
                      return (
                        <div style={{ marginLeft: depth * 20 }}
                             className={`flex items-center justify-between py-1.5 px-2 rounded group hover:bg-overlay ${!node.data?.es_activo ? 'opacity-60 italic' : ''}`}>
                          <div className="flex items-center truncate min-w-0">
                            <span style={{ width: '24px', textAlign: 'center', cursor: hasChildren ? 'pointer' : 'default' }}
                                  className="inline-block mr-1 text-text-soft flex-shrink-0"
                                  onClick={hasChildren ? onToggle : undefined}>
                              {hasChildren ? (isOpen ? '▼' : '▶') : <span className="inline-block w-[1em]"></span>}
                            </span>
                            <span className="mr-2 flex-shrink-0 inline-flex items-center justify-center w-5 h-5 text-brand-primary">
                               {getIcon(node.data?.icono, undefined, { size: 18 })}
                            </span>
                            <span className="text-sm text-text-base truncate" title={node.text}>{node.text}</span>
                            {!node.data?.es_activo && <span className="ml-2 text-xs text-text-soft flex-shrink-0">(Inactivo)</span>}
                          </div>
                          <div className="hidden group-hover:flex items-center space-x-1 flex-shrink-0 pl-2">
                             <button title="Añadir Submenú" onClick={(e) => { e.stopPropagation(); handleOpenCreateModal(node); }} className="p-1 rounded text-info hover:text-info hover:bg-overlay">➕</button>
                             <button title="Editar" onClick={(e) => { e.stopPropagation(); handleOpenEditModal(node); }} className="p-1 rounded text-success hover:text-success hover:bg-overlay">✏️</button>
                             <button title={node.data?.es_activo ? 'Desactivar' : 'Activar'} onClick={(e) => { e.stopPropagation(); handleToggleActive(node); }} className={`p-1 rounded hover:bg-overlay ${node.data?.es_activo ? 'text-error hover:text-error' : 'text-warning hover:text-warning'}`}>👁️</button>
                          </div>
                        </div>
                      );
                  }}
                />
              </div>
            ) : ( <p className="text-text-soft mt-4 text-sm">No hay menús para esta área o aún no se han cargado.</p> )}
          </>
        )}

        {/* --- Modal de Creación --- */}
        {isCreateModalOpen && ( <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"> <div className="bg-surface border border-border-base p-6 rounded-lg shadow-xl w-full max-w-md"> <h2 className="text-xl mb-4 font-semibold text-text-base">Crear Nuevo Menú</h2> <p className="mb-4 text-sm text-text-soft">{parentNodeForCreate ? `Como submenú de: "${parentNodeForCreate.text}"` : 'Como menú principal.'}</p> <form onSubmit={handleCreateSubmit} id="create-menu-form">
            <div className="mb-4"><label htmlFor="create-nombre" className="block text-sm font-medium text-text-base mb-1">Nombre *</label><input type="text" id="create-nombre" name="nombre" value={newMenuData.nombre} onChange={handleNewMenuInputChange} required className="w-full px-3 py-2 border border-border-base rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-surface text-text-base" /></div>
            <div className="mb-4">
              <label htmlFor="create-icono" className="block text-sm font-medium text-text-base mb-1">Icono</label>
              <IconSelector
                id="create-icono"
                value={newMenuData.icono}
                onChange={handleNewIconChange}
                placeholder="Seleccionar icono (opcional)"
                menuPlacement="auto"
              />
            </div>
            <div className="mb-4"><label htmlFor="create-ruta" className="block text-sm font-medium text-text-base mb-1">Ruta (URL)</label><input type="text" id="create-ruta" name="ruta" value={newMenuData.ruta || ''} onChange={handleNewMenuInputChange} placeholder="Ej: /admin/usuarios" className="w-full px-3 py-2 border border-border-base rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-surface text-text-base" /></div>
            <div className="mb-4"><label className="flex items-center text-sm font-medium text-text-base"><input type="checkbox" id="create-es_activo" name="es_activo" checked={newMenuData.es_activo} onChange={handleNewMenuInputChange} className="h-4 w-4 text-brand-primary border-border-base rounded focus:ring-brand-primary bg-surface" /><span className="ml-2">Activo</span></label></div>
            <div className="mt-6 flex justify-end space-x-3"><button type="button" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-white bg-brand-secondary text-sm font-medium rounded-md hover:bg-brand-secondary-hover disabled:opacity-50">Cancelar</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md shadow-sm hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? 'Guardando...' : 'Guardar Menú'}</button></div>
        </form> </div> </div> )}

        {/* --- Modal de Edición --- */}
        {isEditModalOpen && editingNodeData && (
           <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-surface border border-border-base p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-xl mb-4 font-semibold text-text-base">Editar Menú: {editingNodeData.text}</h2>
              <form onSubmit={handleEditSubmit} id="edit-menu-form">
                <div className="mb-4"><label htmlFor="edit-nombre" className="block text-sm font-medium text-text-base mb-1">Nombre *</label><input type="text" id="edit-nombre" name="nombre" value={editFormData.nombre ?? ''} onChange={handleEditFormInputChange} required className="w-full px-3 py-2 border border-border-base rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-surface text-text-base" /></div>
                <div className="mb-4">
                  <label htmlFor="edit-icono" className="block text-sm font-medium text-text-base mb-1">Icono</label>
                  <IconSelector
                    id="edit-icono"
                    value={editFormData.icono}
                    onChange={handleEditIconChange}
                    placeholder="Seleccionar icono (opcional)"
                    menuPlacement="auto"
                  />
                </div>
                <div className="mb-4"><label htmlFor="edit-ruta" className="block text-sm font-medium text-text-base mb-1">Ruta (URL)</label><input type="text" id="edit-ruta" name="ruta" value={editFormData.ruta ?? ''} onChange={handleEditFormInputChange} placeholder="Ej: /configuracion" className="w-full px-3 py-2 border border-border-base rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-surface text-text-base" /></div>
                <div className="mb-4"><label className="flex items-center text-sm font-medium text-text-base"><input type="checkbox" id="edit-es_activo" name="es_activo" checked={editFormData.es_activo} onChange={handleEditFormInputChange} className="h-4 w-4 text-brand-primary border-border-base rounded focus:ring-brand-primary bg-surface" /><span className="ml-2">Activo</span></label></div>
                <div className="mt-6 flex justify-end space-x-3"><button type="button" onClick={() => { setIsEditModalOpen(false); setEditingNodeData(null); }} disabled={isSubmitting} className="px-4 py-2 text-white bg-brand-secondary text-sm font-medium rounded-md hover:bg-brand-secondary-hover disabled:opacity-50">Cancelar</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md shadow-sm hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
};

export default MenuManagementPage;