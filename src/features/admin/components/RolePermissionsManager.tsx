// src/features/admin/components/RolePermissionsManager.tsx
import axios from 'axios';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, AlertCircle, ChevronDown } from 'lucide-react';

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
import { getPermisosCatalogo, getPermisosNegocioByRol, updatePermisosNegocioByRol } from '../services/permisos-negocio.service';

// --- Importar Auth Context ---
import { useAuth } from '@/shared/context/AuthContext';

// --- Importar tipos REALES ---
import type { AuthMenuModulo, AuthMenuItem } from '@/core/auth/types/auth-menu.types';
import type {
  SidebarMenuItem,
  BackendManageMenuItem,
} from '../types/menu.types';
import type { PermissionState } from '../types/permission.types';
import type { PermisoCatalogoItem } from '../types/permisos-negocio.types';

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

/** Convierte AuthMenuItem (desde /auth/menu) en SidebarMenuItem. */
function authMenuItemToSidebarItem(
  menu: AuthMenuItem,
  seccionId: string,
  seccionNombre: string,
  parentId: string | null
): SidebarMenuItem {
  return {
    menu_id: menu.menu_id,
    nombre: menu.nombre,
    icono: menu.icono ?? null,
    ruta: menu.ruta ?? null,
    orden: menu.orden ?? null,
    level: 2,
    es_activo: menu.permisos?.ver ?? true,
    padre_menu_id: parentId,
    area_id: seccionId,
    area_nombre: seccionNombre,
    children: (menu.submenus ?? []).map((child) =>
      authMenuItemToSidebarItem(child, seccionId, seccionNombre, menu.menu_id)
    ),
  };
}

/** Convierte AuthMenuModulo[] (respuesta de getAuthMenu) en HierarchicalStructure[]. */
function authModulosToHierarchical(modulos: AuthMenuModulo[]): HierarchicalStructure[] {
  return modulos.map((mod) => ({
    modulo_id: mod.modulo_id,
    modulo_nombre: mod.nombre,
    modulo_icono: mod.icono ?? null,
    modulo_color: mod.color ?? null,
    secciones: (mod.secciones || []).map((sec) => ({
      seccion_id: sec.seccion_id,
      seccion_nombre: sec.nombre,
      seccion_icono: sec.icono ?? null,
      menus: (sec.menus || []).map((menu) =>
        authMenuItemToSidebarItem(menu, sec.seccion_id, sec.nombre, null)
      ),
    })),
  }));
}

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

  // --- Permisos de negocio (RBAC) - DOC_FRONTEND_ADMIN_PERMISOS_RBAC.md ---
  const [advancedMenuExpanded, setAdvancedMenuExpanded] = useState<boolean>(false);
  const [catalogo, setCatalogo] = useState<PermisoCatalogoItem[]>([]);
  const [selectedPermisoIds, setSelectedPermisoIds] = useState<string[]>([]);
  const [loadingNegocio, setLoadingNegocio] = useState<boolean>(false);
  const [savingNegocio, setSavingNegocio] = useState<boolean>(false);
  const [errorNegocio, setErrorNegocio] = useState<string | null>(null);
  const [negocioLoaded, setNegocioLoaded] = useState<boolean>(false);

  // --- Cargar datos: GET /auth/menu para estructura + permisos del rol para la pestaña avanzada ---
  const loadData = useCallback(async () => {
    if (!rolId) return;

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

      const [hierarchicalData, permissionsData] = await Promise.all([
        menuService.getAuthMenu().then((res) => authModulosToHierarchical(res.modulos || [])),
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
      (hierarchicalData || []).forEach(modulo => {
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
  }, [rolId, clienteId]);

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
      setAdvancedMenuExpanded(false);
      setCatalogo([]);
      setSelectedPermisoIds([]);
      setErrorNegocio(null);
      setNegocioLoaded(false);
    }
  }, [isOpen, rolId, loadData]);

  // --- Cargar datos de permisos de negocio al abrir el modal ---
  const loadNegocioData = useCallback(async () => {
    if (!rolId) return;
    setLoadingNegocio(true);
    setErrorNegocio(null);
    try {
      const [catalogoResult, roleResult] = await Promise.allSettled([
        getPermisosCatalogo(),
        getPermisosNegocioByRol(rolId),
      ]);
      const catalogoData = catalogoResult.status === 'fulfilled' ? catalogoResult.value : [];
      const roleData = roleResult.status === 'fulfilled' ? roleResult.value : [];
      setCatalogo(Array.isArray(catalogoData) ? catalogoData : []);

      if (roleResult.status === 'rejected') {
        const err = roleResult.reason;
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setErrorNegocio('No tiene permiso para ver o editar los permisos de negocio de este rol. El backend requiere el permiso admin.rol.leer (y admin.rol.actualizar para guardar).');
          setSelectedPermisoIds([]);
        } else {
          const msg = err instanceof Error ? err.message : 'Error al cargar los permisos asignados al rol.';
          setErrorNegocio(msg);
          toast.error(msg);
          setSelectedPermisoIds([]);
        }
      } else {
        const permisosList = Array.isArray(roleData) ? roleData : [];
        const assignedIds = permisosList.map((p: Record<string, unknown>) =>
          String(p.permiso_id ?? p.permisoId ?? p.id ?? '')
        ).filter(Boolean);
        setSelectedPermisoIds(assignedIds);
        if (import.meta.env.DEV && assignedIds.length > 0) {
          console.log('[Permisos negocio] IDs asignados al rol (checkboxes marcados):', assignedIds);
        }
      }

      if ((!Array.isArray(catalogoData) || catalogoData.length === 0) && roleResult.status !== 'rejected') {
        setErrorNegocio('El catálogo de permisos no está disponible (404). Verifique que el backend exponga GET /api/v1/permisos-catalogo/.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar permisos de negocio.';
      setErrorNegocio(msg);
      toast.error(msg);
    } finally {
      setLoadingNegocio(false);
      setNegocioLoaded(true);
    }
  }, [rolId]);

  useEffect(() => {
    if (isOpen && rolId && !negocioLoaded && !loadingNegocio) {
      loadNegocioData();
    }
  }, [isOpen, rolId, negocioLoaded, loadingNegocio, loadNegocioData]);

  const togglePermisoNegocio = (permisoId: string) => {
    const id = String(permisoId);
    setSelectedPermisoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getPermisoId = (p: { permiso_id?: string; permisoId?: string; id?: string }) =>
    String((p as Record<string, unknown>).permiso_id ?? (p as Record<string, unknown>).permisoId ?? (p as Record<string, unknown>).id ?? '');

  const isPermisoNegocioChecked = (permisoId: string) =>
    selectedPermisoIds.includes(String(permisoId));

  const handleSavePermisosNegocio = async () => {
    setSavingNegocio(true);
    setErrorNegocio(null);
    try {
      await updatePermisosNegocioByRol(rolId, { permiso_ids: selectedPermisoIds });
      toast.success(`Permisos de negocio para el rol "${rolName}" actualizados.`);
      onPermissionsUpdate?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar permisos de negocio.';
      setErrorNegocio(msg);
      toast.error(msg);
    } finally {
      setSavingNegocio(false);
    }
  };

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && !savingNegocio && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Gestionar permisos para rol: <span className="font-bold">{rolName}</span></DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            El menú y los accesos se configuran automáticamente según los permisos. Aquí defines los permisos de negocio del rol; la configuración avanzada de menú es opcional.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-2 py-4 space-y-4">
          {/* Sección principal: Permisos de negocio */}
          <section aria-labelledby="permisos-negocio-heading">
            <h2 id="permisos-negocio-heading" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Permisos de negocio
            </h2>
            {loadingNegocio && (
              <div className="flex justify-center items-center h-40">
                <Loader className="animate-spin h-8 w-8 text-brand-primary" />
                <p className="ml-3 text-gray-500 dark:text-gray-400">Cargando catálogo y permisos del rol...</p>
              </div>
            )}
            {!loadingNegocio && errorNegocio && (
              <div className="flex justify-center items-center h-40 text-center text-red-600 dark:text-red-400">
                <AlertCircle className="h-6 w-6 mr-2"/> {errorNegocio}
              </div>
            )}
            {!loadingNegocio && !errorNegocio && catalogo.length === 0 && negocioLoaded && (
              <div className="flex justify-center items-center h-40 text-gray-500 dark:text-gray-400">
                No hay permisos en el catálogo.
              </div>
            )}
            {!loadingNegocio && !errorNegocio && catalogo.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Marque los permisos que este rol debe tener. Definen qué acciones puede ejecutar en el sistema (API).
                </p>
                <div className="max-h-[50vh] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50 space-y-2">
                  {catalogo.map((perm) => {
                    const pid = getPermisoId(perm);
                    return (
                      <div key={pid || perm.codigo} className="flex items-start gap-3 py-1.5">
                        <Checkbox
                          id={`negocio-${pid}`}
                          checked={!!pid && isPermisoNegocioChecked(pid)}
                          onCheckedChange={() => pid && togglePermisoNegocio(pid)}
                          disabled={savingNegocio}
                          aria-label={perm.nombre ?? perm.codigo}
                          className="mt-0.5 dark:border-gray-500 dark:data-[state=checked]:bg-brand-primary dark:data-[state=checked]:border-brand-primary"
                        />
                        <label htmlFor={`negocio-${pid}`} className="text-sm text-gray-800 dark:text-gray-200 cursor-pointer flex-1">
                          <span className="font-medium">{perm.nombre ?? perm.codigo}</span>
                          {perm.codigo && perm.nombre !== perm.codigo && (
                            <span className="text-gray-500 dark:text-gray-400 ml-1">({perm.codigo})</span>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Acordeón: Configuración avanzada de menú */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setAdvancedMenuExpanded(!advancedMenuExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 text-left transition-colors"
              aria-expanded={advancedMenuExpanded}
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Configuración avanzada de menú
              </span>
              <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${advancedMenuExpanded ? 'rotate-180' : ''}`} />
            </button>
            {advancedMenuExpanded && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Opcional. Controla qué ítems de menú ve este rol y qué acciones tiene en cada pantalla (ver, crear, editar, eliminar).
                </p>
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
                {!isLoading && !error && hierarchicalStructure.length === 0 && (
                  <div className="flex justify-center items-center h-40 text-gray-500 dark:text-gray-400">
                    No se encontró la estructura del menú o no hay módulos activos con menús definidos.
                  </div>
                )}
                {!isLoading && !error && hierarchicalStructure.length > 0 && (
                  <>
                    <div className="space-y-6">
                      {hierarchicalStructure.map((modulo) => (
                        <div key={modulo.modulo_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-300 dark:border-gray-600">
                            <div className="flex-shrink-0" style={{ color: modulo.modulo_color || '#1976D2' }}>
                              {getIcon(modulo.modulo_icono, Package, { size: 24 })}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{modulo.modulo_nombre}</h3>
                          </div>
                          <div className="space-y-4 pl-2">
                            {modulo.secciones.map((seccion) => (
                              <div key={seccion.seccion_id} className="border-l-2 border-gray-300 dark:border-gray-600 pl-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex-shrink-0 text-gray-600 dark:text-gray-400">
                                    {getIcon(seccion.seccion_icono, Folder, { size: 20 })}
                                  </div>
                                  <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">{seccion.seccion_nombre}</h4>
                                </div>
                                <div className="space-y-1 pl-2">
                                  {seccion.menus.map((menu) => renderMenuNode(menu, 0))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        type="button"
                        onClick={handleSaveChanges}
                        disabled={isLoading || isSaving || hierarchicalStructure.length === 0}
                        className="bg-brand-primary hover:bg-brand-primary-hover text-white disabled:opacity-50"
                      >
                        {isSaving && <Loader className="animate-spin h-4 w-4 mr-2" />}
                        {isSaving ? 'Guardando...' : 'Guardar permisos de menú'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Cancelar + Guardar permisos de negocio */}
        <DialogFooter className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          {errorNegocio && savingNegocio && <p className="text-sm text-red-600 dark:text-red-400 mr-auto">{errorNegocio}</p>}
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose} disabled={isSaving || savingNegocio} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSavePermisosNegocio}
            disabled={loadingNegocio || savingNegocio}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white disabled:opacity-50"
          >
            {savingNegocio && <Loader className="animate-spin h-4 w-4 mr-2" />}
            {savingNegocio ? 'Guardando...' : 'Guardar permisos de negocio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RolePermissionsManager;