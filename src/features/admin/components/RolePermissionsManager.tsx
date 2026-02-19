// src/features/admin/components/RolePermissionsManager.tsx
import axios from 'axios';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, AlertCircle } from 'lucide-react';

// --- Importar componentes de shadcn/ui ---
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";

// --- Importar servicios REALES ---
import { menuService } from '../services/menu.service';
import { permissionService } from '../services/permission.service';
import { clienteModuloService } from '@/features/modulos/services/cliente-modulo.service';
import { moduloV2Service } from '@/features/modulos/services/modulo-v2.service';
import { seccionService } from '@/features/modulos/services/seccion.service';

// --- Importar Auth Context ---
import { useAuth } from '@/shared/context/AuthContext';

// --- Importar tipos REALES ---
// Usamos SidebarMenuItem para el estado y la UI interna
// Usamos BackendManageMenuItem para el tipo de datos que esperamos de la API
import type { SidebarMenuItem, BackendManageMenuItem } from '../types/menu.types';
import type { PermissionState } from '../types/permission.types';

// --- Importar utilidades de iconos ---
import { getIcon } from '@/shared/lib/icon-utils';
import { Package, Folder } from 'lucide-react';

// --- Props del componente ---
interface RolePermissionsManagerProps {
  isOpen: boolean;
  rolId: string; // UUID format
  rolName: string;
  onClose: () => void;
  onPermissionsUpdate?: () => void;
}

// --- Interfaz para Datos Agrupados ---
interface GroupedMenuItems {
  [seccionName: string]: SidebarMenuItem[];
}

// --- Interfaz para estructura jerárquica completa ---
interface HierarchicalStructure {
  modulo_id: string;
  modulo_nombre: string;
  modulo_icono: string | null;
  modulo_color: string | null;
  secciones: Array<{
    seccion_id: string;
    seccion_nombre: string;
    seccion_icono: string | null;
    menus: SidebarMenuItem[];
  }>;
}

// --- FUNCIÓN DE TRANSFORMACIÓN RECURSIVA (CORREGIDA) ---
// Acepta el tipo de la API (BackendManageMenuItem) y devuelve el tipo del Frontend (SidebarMenuItem)
const transformApiMenuItem = (item: BackendManageMenuItem): SidebarMenuItem => {
    // Transforma el nodo actual
    const transformedNode: SidebarMenuItem = {
        // Mapea campos requeridos/conocidos
        menu_id: item.menu_id,
        nombre: item.nombre,
        // Transforma campos opcionales/problemáticos asegurando compatibilidad con SidebarMenuItem
        icono: item.icono === undefined ? null : item.icono, // undefined -> null
        ruta: item.ruta === undefined ? null : item.ruta,     // undefined -> null
        orden: item.orden === undefined ? null : item.orden,   // undefined -> null (SidebarMenuItem permite null)
        level: item.level, // Asumiendo que level es compatible o no está en SidebarMenuItem
        es_activo: item.es_activo, // Asumiendo que boolean es compatible
        padre_menu_id: item.padre_menu_id === undefined ? null : item.padre_menu_id, // undefined -> null
        area_id: item.area_id === undefined ? null : item.area_id, // undefined -> null
        area_nombre: item.area_nombre === undefined ? null : item.area_nombre, // undefined -> null
        // --- CORRECCIÓN CLAVE: Inicializa children como array vacío ---
        children: [],
    };

    // Si hay hijos en el item original, transfórmalos recursivamente y asigna el resultado
    if (item.children && Array.isArray(item.children) && item.children.length > 0) {
        transformedNode.children = item.children.map(transformApiMenuItem); // Llamada recursiva
    }

    return transformedNode;
};


const RolePermissionsManager: React.FC<RolePermissionsManagerProps> = ({
  isOpen,
  rolId,
  rolName,
  onClose,
  onPermissionsUpdate,
}) => {
  // --- Auth Context ---
  const { clienteInfo, auth } = useAuth();
  
  // ✅ Obtener cliente_id desde múltiples fuentes (fallback)
  const clienteId = clienteInfo?.cliente_id || auth.user?.cliente_id || null;

  // --- Estados Internos ---
  const [menuTree, setMenuTree] = useState<SidebarMenuItem[]>([]); // Mantener para compatibilidad
  const [hierarchicalStructure, setHierarchicalStructure] = useState<HierarchicalStructure[]>([]); // ✅ NUEVO: Estructura jerárquica completa
  const [permissions, setPermissions] = useState<PermissionState>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  /**
   * ✅ ACTUALIZADO: Construir estructura jerárquica completa desde módulos activos del cliente
   * Mantiene la estructura: Módulo → Sección → Menú → Submenú
   */
  const buildHierarchicalMenuFromClienteModulos = useCallback(async (clienteId: string): Promise<HierarchicalStructure[]> => {
    try {
      // 1. Obtener módulos activos del cliente
      const clienteModulos = await clienteModuloService.getClienteModulosByClienteId(clienteId);
      
      if (clienteModulos.length === 0) {
        if (import.meta.env.DEV) {
          console.log(`ℹ️ Cliente ${clienteId} no tiene módulos activos`);
        }
        return [];
      }

      // 2. Obtener información completa de cada módulo activo
      const moduloIds = clienteModulos.map(cm => cm.modulo_id);
      const hierarchicalData: HierarchicalStructure[] = [];

      await Promise.all(
        moduloIds.map(async (moduloId) => {
          try {
            // Obtener detalles del módulo
            const moduloResponse = await moduloV2Service.getModuloById(moduloId);
            const moduloData = moduloResponse.data;
            
            // Obtener secciones del módulo
            const seccionesData = await seccionService.getSecciones({
              modulo_id: moduloId,
              es_activa: true
            });
            
            // Construir secciones con sus menús
            const seccionesConMenus: Array<{
              seccion_id: string;
              seccion_nombre: string;
              seccion_icono: string | null;
              menus: SidebarMenuItem[];
            }> = [];

            for (const seccion of seccionesData.items) {
              try {
                // Obtener menús de la sección
                const menusData = await menuService.getMenusByModulo(moduloId, seccion.seccion_id);
                
                // Transformar BackendManageMenuItem[] a SidebarMenuItem[]
                const transformMenuToSidebarItem = (menu: BackendManageMenuItem, parentId: string | null = null): SidebarMenuItem => {
                  const sidebarItem: SidebarMenuItem = {
                    menu_id: menu.menu_id,
                    nombre: menu.nombre,
                    icono: menu.icono || null,
                    ruta: menu.ruta || null,
                    orden: menu.orden || null,
                    level: menu.level || 1,
                    es_activo: menu.es_activo,
                    padre_menu_id: parentId,
                    area_id: seccion.seccion_id,
                    area_nombre: seccion.nombre,
                    children: [],
                  };

                  // Transformar hijos recursivamente
                  if (menu.children && Array.isArray(menu.children) && menu.children.length > 0) {
                    sidebarItem.children = menu.children.map(child => transformMenuToSidebarItem(child, menu.menu_id));
                  }

                  return sidebarItem;
                };
                
                const menuItems = menusData.map(menu => transformMenuToSidebarItem(menu, null));
                
                if (menuItems.length > 0) {
                  seccionesConMenus.push({
                    seccion_id: seccion.seccion_id,
                    seccion_nombre: seccion.nombre,
                    seccion_icono: seccion.icono,
                    menus: menuItems,
                  });
                }
              } catch (err) {
                console.error(`Error obteniendo menús de sección ${seccion.seccion_id}:`, err);
              }
            }
            
            // Solo agregar módulo si tiene secciones con menús
            if (seccionesConMenus.length > 0) {
              hierarchicalData.push({
                modulo_id: moduloData.modulo_id,
                modulo_nombre: moduloData.nombre,
                modulo_icono: moduloData.icono,
                modulo_color: moduloData.color || null,
                secciones: seccionesConMenus,
              });
            }
          } catch (err) {
            console.error(`Error obteniendo detalles del módulo ${moduloId}:`, err);
          }
        })
      );
      
      if (import.meta.env.DEV) {
        console.log(`✅ Estructura jerárquica construida para cliente ${clienteId}:`, {
          totalModulos: hierarchicalData.length,
          modulos: hierarchicalData.map(m => ({
            nombre: m.modulo_nombre,
            secciones: m.secciones.length,
            menus: m.secciones.reduce((acc, s) => acc + s.menus.length, 0)
          }))
        });
      }
      
      return hierarchicalData;
    } catch (error) {
      console.error('❌ Error construyendo menú jerárquico desde módulos de cliente:', error);
      throw error;
    }
  }, []);

  // --- Cargar datos (ACTUALIZADO: Usar módulos activos del cliente) ---
  const loadData = useCallback(async () => {
    if (!rolId) return;
    
    // ✅ Validar que tenemos cliente_id desde cualquier fuente
    if (!clienteId) {
      const errorMsg = 'No se pudo obtener el ID del cliente. Por favor, inicie sesión nuevamente.';
      setError(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setMenuTree([]);
    setHierarchicalStructure([]);
    setPermissions({});
    try {
      console.log(`Cargando datos para rol ID: ${rolId}, cliente: ${clienteId}`);

      // ✅ ACTUALIZADO: Construir menú desde módulos activos del cliente
      const [hierarchicalData, permissionsData] = await Promise.all([
        buildHierarchicalMenuFromClienteModulos(clienteId),
        permissionService.getRolePermissions(rolId).catch((err) => {
          // Si falla obtener permisos, loggear el error pero continuar con permisos vacíos
          console.error('❌ [RolePermissionsManager] Error cargando permisos del rol:', err);
          if (import.meta.env.DEV) {
            console.error('Detalles del error:', {
              message: err instanceof Error ? err.message : String(err),
              response: (err as any)?.response?.data,
              status: (err as any)?.response?.status,
            });
          }
          // Retornar objeto vacío para que el componente pueda continuar
          return {} as PermissionState;
        }),
      ]);

      console.log("Hierarchical Structure Data:", hierarchicalData);
      console.log("Permissions Data:", permissionsData);

      // ✅ ACTUALIZADO: Guardar estructura jerárquica completa
      setHierarchicalStructure(hierarchicalData || []);
      
      // También mantener menuTree plano para compatibilidad con el código existente
      const flatMenuItems: SidebarMenuItem[] = [];
      hierarchicalData.forEach(modulo => {
        modulo.secciones.forEach(seccion => {
          flatMenuItems.push(...seccion.menus);
        });
      });
      setMenuTree(flatMenuItems);
      
      // ✅ DEBUG: Verificar mapeo de permisos
      if (import.meta.env.DEV) {
        const menuIds = flatMenuItems.map(m => m.menu_id);
        const permissionMenuIds = Object.keys(permissionsData || {});
        console.log('🔍 [RolePermissionsManager] Debug de permisos:', {
          totalMenus: menuIds.length,
          totalPermisos: permissionMenuIds.length,
          menuIds: menuIds.slice(0, 5), // Primeros 5
          permissionMenuIds: permissionMenuIds.slice(0, 5), // Primeros 5
          coincidencias: menuIds.filter(id => permissionMenuIds.includes(id)).length,
          permisosCargados: permissionsData,
        });
      }
      
      setPermissions(permissionsData || {});

    } catch (err) {
      console.error("Error loading permissions data:", err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos de permisos.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [rolId, clienteId, buildHierarchicalMenuFromClienteModulos]);

  // --- Efecto para cargar datos (sin cambios) ---
  useEffect(() => {
    if (isOpen && rolId) {
      loadData();
    } else {
    setMenuTree([]);
    setHierarchicalStructure([]);
    setPermissions({});
    setError(null);
    setIsLoading(false);
    setIsSaving(false);
    }
  }, [isOpen, rolId, loadData]);

  // --- Handler para cambiar SOLO el permiso 'ver' (sin cambios) ---
  const handleViewPermissionChange = (menuId: string, checked: boolean) => {
    setPermissions(prev => {
      const updatedPermissions = { ...prev };
      if (!updatedPermissions[menuId]) {
        updatedPermissions[menuId] = { ver: false, crear: false, editar: false, eliminar: false };
      }
      updatedPermissions[menuId].ver = checked;
      if (!checked) {
          updatedPermissions[menuId].crear = false;
          updatedPermissions[menuId].editar = false;
          updatedPermissions[menuId].eliminar = false;
      }
      return updatedPermissions;
    });
  };

  // --- Handler para guardar los cambios (sin cambios) ---
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    try {
        const permisosArray = Object.entries(permissions).map(([menuIdStr, perms]) => {
            return {
                menu_id: menuIdStr, // UUID format
                puede_ver: perms.ver,
                puede_crear: perms.crear,
                puede_editar: perms.editar,
                puede_eliminar: perms.eliminar,
            };
        });

        console.log(`Enviando permisos para rol ID: ${rolId}`, { permisos: permisosArray });

        // ✅ ACTUALIZADO: Usar el nuevo método que actualiza permisos individualmente
        await permissionService.updateRolePermissionsBatch(rolId, permisosArray);

        toast.success(`Permisos para el rol "${rolName}" actualizados.`);
        onPermissionsUpdate?.();
        onClose();

    } catch (err) {
        console.error("Error saving permissions:", err);
        let errorMessage = 'Error al guardar los permisos.';
        if (axios.isAxiosError(err) && err.response?.status === 422 && err.response.data?.detail) {
             try {
                 const details = err.response.data.detail;
                 if (Array.isArray(details)) {
                     errorMessage = details.map(e => `${e.loc?.join('.')}: ${e.msg}`).join('; ');
                 } else if (typeof details === 'string') {
                     errorMessage = details;
                 }
             } catch (parseError) { /* Ignorar */ }
        } else if (err instanceof Error) {
            errorMessage = err.message;
        }
        setError(errorMessage);
        toast.error(errorMessage);
    } finally {
        setIsSaving(false);
    }
  };

  // --- Función recursiva para renderizar el árbol (sin cambios) ---
  const renderMenuNode = (node: SidebarMenuItem, level: number = 0): JSX.Element => {
    const nodePermissions = permissions[node.menu_id] || { ver: false, crear: false, editar: false, eliminar: false };
    
    // ✅ DEBUG: Log para verificar permisos por menú
    if (import.meta.env.DEV && level === 0) {
      console.log(`🔍 [renderMenuNode] Menú: ${node.nombre} (${node.menu_id}), Permisos:`, nodePermissions, 'Existe en permissions:', !!permissions[node.menu_id]);
    }
    
    const indentClass = `ml-${level * 4}`;

    return (
      <div key={node.menu_id} className={`py-1 ${indentClass}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{node.nombre}</span>
          <div className="flex items-center mr-4">
            <Checkbox
              id={`perm-${node.menu_id}-ver`}
              checked={nodePermissions.ver}
              onCheckedChange={(checked) => handleViewPermissionChange(node.menu_id, !!checked)}
              disabled={isLoading || isSaving}
              aria-label={`Permiso de Ver para ${node.nombre}`}
              className="dark:border-gray-500 dark:data-[state=checked]:bg-brand-primary dark:data-[state=checked]:border-brand-primary"
            />
          </div>
        </div>
        {/* Ahora node.children siempre es un array, por lo que la condición es segura */}
        {node.children.length > 0 && (
          <div className="border-l border-gray-200 dark:border-gray-700 pl-3">
            {node.children.map((child: SidebarMenuItem) => renderMenuNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Memo para agrupar por sección (reservado para posible uso en vista alternativa)
  const _groupedMenuItems = useMemo(() => {
    const groups: GroupedMenuItems = {};
    menuTree.forEach((item) => {
      if (!item.padre_menu_id) {
        const seccionName = item.area_nombre || 'General';
        if (!groups[seccionName]) groups[seccionName] = [];
        groups[seccionName].push(item);
      }
    });
    const sortedGroups: GroupedMenuItems = {};
    if (groups['General']) {
      sortedGroups['General'] = groups['General'];
      delete groups['General'];
    }
    Object.keys(groups).sort().forEach((seccionName) => {
      sortedGroups[seccionName] = groups[seccionName];
    });
    return sortedGroups;
  }, [menuTree]);
  void _groupedMenuItems; // uso explícito para evitar warning


  // --- Renderizado del Componente (sin cambios estructurales) ---
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Gestionar Visibilidad para Rol: <span className="font-bold">{rolName}</span></DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Selecciona los menús que este rol podrá visualizar. Estructura: Módulo → Sección → Menú → Submenú.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-2 py-4 space-y-4">
          {/* Indicadores de carga y error */}
          {isLoading && (
            <div className="flex justify-center items-center h-40">
              <Loader className="animate-spin h-8 w-8 text-brand-primary" />
              <p className="ml-3 text-gray-500 dark:text-gray-400">Cargando estructura y permisos...</p>
            </div>
          )}
          {!isLoading && error && !isSaving && (
             <div className="flex justify-center items-center h-40 text-center text-red-600 dark:text-red-400">
                <AlertCircle className="h-6 w-6 mr-2"/> {error}
             </div>
          )}
          {/* Mensajes si no hay datos */}
          {!isLoading && !error && hierarchicalStructure.length === 0 && (
             <div className="flex justify-center items-center h-40 text-gray-500 dark:text-gray-400">
                No se encontró la estructura del menú o no hay módulos activos con menús definidos.
             </div>
          )}
          {/* ✅ NUEVO: Renderizado jerárquico completo (Módulo → Sección → Menú → Submenú) */}
          {!isLoading && !error && hierarchicalStructure.length > 0 && (
            <div className="space-y-6">
              {hierarchicalStructure.map((modulo) => (
                <div key={modulo.modulo_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                  {/* Encabezado del Módulo */}
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-300 dark:border-gray-600">
                    <div className="flex-shrink-0" style={{ color: modulo.modulo_color || '#1976D2' }}>
                      {getIcon(modulo.modulo_icono, Package, { size: 24 })}
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {modulo.modulo_nombre}
                    </h2>
                  </div>
                  
                  {/* Secciones del Módulo */}
                  <div className="space-y-4 pl-2">
                    {modulo.secciones.map((seccion) => (
                      <div key={seccion.seccion_id} className="border-l-2 border-gray-300 dark:border-gray-600 pl-4">
                        {/* Encabezado de la Sección */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-shrink-0 text-gray-600 dark:text-gray-400">
                            {getIcon(seccion.seccion_icono, Folder, { size: 20 })}
                          </div>
                          <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300">
                            {seccion.seccion_nombre}
                          </h3>
                        </div>
                        
                        {/* Menús de la Sección */}
                        <div className="space-y-1 pl-2">
                          {seccion.menus.map((menu) => renderMenuNode(menu, 0))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con Botones (sin cambios) */}
        <DialogFooter className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
           {error && isSaving && <p className="text-sm text-red-600 dark:text-red-400 mr-auto">{error}</p>}
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose} disabled={isSaving} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSaveChanges}
            disabled={isLoading || isSaving || hierarchicalStructure.length === 0}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white disabled:opacity-50"
          >
            {isSaving && <Loader className="animate-spin h-4 w-4 mr-2" />}
            {isSaving ? 'Guardando...' : 'Guardar Visibilidad'} {/* Texto del botón actualizado */}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RolePermissionsManager;