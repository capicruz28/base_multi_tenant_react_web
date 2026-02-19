// src/components/layout/NewSidebar.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useAuth } from '../../../shared/context/AuthContext';
import { useBreadcrumb } from '../../../shared/context/BreadcrumbContext';
import { Popover } from 'react-tiny-popover';
import * as LucideIcons from 'lucide-react';
import { useBranding } from '../../../features/tenant/hooks/useBranding';

import { menuService } from '@/features/admin/services/menu.service';
import { clienteModuloService } from '@/features/modulos/services/cliente-modulo.service';
import { seccionService } from '@/features/modulos/services/seccion.service';
import { moduloV2Service } from '@/features/modulos/services/modulo-v2.service'; 
import type { 
  SidebarMenuItem, 
  SidebarProps, 
  PopoverContentProps,
  ModuloConSecciones,
  MenuConPermisos,
  BackendManageMenuItem,
} from '@/features/admin/types/menu.types'; 
// ✅ MODIFICADO: Cambiar importación para usar el selector dinámico
import { getMenuItemsByUserType } from './MenuSelector';

// --- CLASES Y UTILIDADES COMUNES ---
const baseIconClasses = "w-5 h-5 text-current opacity-100 inline-block"; 
const transitionClass = 'transition-all duration-200 ease-in-out'; 

// Función utilitaria para obtener el ícono (SIN CAMBIOS)
const getIcon = (iconName: string | null | undefined, FallbackIcon: React.ElementType = LucideIcons.Circle) => {
    if (!iconName) {
        return <FallbackIcon className={`${baseIconClasses} opacity-50`} />;
    }
    
    try {
        const normalizedName = iconName
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
        
        let IconComponent = (LucideIcons as any)[normalizedName];
        
        if (!IconComponent) {
            IconComponent = (LucideIcons as any)[iconName]; 
        }
        
        if (!IconComponent) {
            return <FallbackIcon className={`${baseIconClasses} opacity-50`} />;
        }
        
        return <IconComponent className={baseIconClasses} />;
    } catch (e) {
        return <FallbackIcon className={`${baseIconClasses} opacity-50`} />;
    }
};

// Componente PopoverContent (SIN CAMBIOS)
const PopoverContent: React.FC<PopoverContentProps> = React.memo(({
    item,
    nestedPopover,
    setNestedPopover,
    handleNavigate,
    currentPath,
    getItemIdentifier,
}) => {
    if (!item.children || item.children.length === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 p-1.5 min-w-[280px] max-w-sm z-50">
            {item.children.map((child: SidebarMenuItem) => { 
                const itemIdentifier = getItemIdentifier(child);
                const childPath = child.ruta ? (child.ruta.startsWith('/') ? child.ruta : `/${child.ruta}`) : '#';
                const isChildActive = child.ruta && currentPath.startsWith(childPath);
                const hasChildren = child.children && child.children.length > 0;
                const hasValidRoute = child.ruta && child.ruta !== '#' && child.es_activo;

                return (
                    <div 
                        key={itemIdentifier}
                        onMouseEnter={() => {
                            if (hasChildren) {
                                // OK: string | null es el tipo correcto
                                setNestedPopover(itemIdentifier);
                            }
                        }}
                        onMouseLeave={() => {
                            if (hasChildren && nestedPopover === itemIdentifier) {
                                // OK: string | null es el tipo correcto
                                setNestedPopover(null);
                            }
                        }}
                        className="relative"
                    >
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                if (hasValidRoute) {
                                    handleNavigate(childPath);
                                }
                            }}
                            className={`
                                flex items-start p-2.5 rounded-md transition-colors duration-150 group
                                ${hasValidRoute ? 'cursor-pointer' : 'cursor-default'}
                                ${isChildActive 
                                    ? 'bg-brand-primary/10 dark:bg-gray-700 text-brand-primary dark:text-brand-primary font-medium' 
                                    : hasValidRoute 
                                    ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    : 'text-gray-500 dark:text-gray-400'
                                }
                            `}
                            title={child.nombre}
                        >
                            <span className={`
                                w-1.5 h-1.5 rounded-full mr-3 flex-shrink-0 mt-1.5
                                ${isChildActive ? 'bg-brand-primary' : 'bg-gray-400 dark:bg-gray-500'}
                            `}></span>
                            <span className="text-sm leading-relaxed min-w-0 flex-1 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                {child.nombre}
                            </span>
                            {hasChildren && (
                                <LucideIcons.ChevronRight className="w-4 h-4 ml-2 flex-shrink-0 text-gray-500 dark:text-gray-400 mt-0.5" />
                            )}
                        </div>
                        
                        {nestedPopover === itemIdentifier && hasChildren && (
                            <div className="absolute left-full top-0 ml-2">
                                <PopoverContent 
                                    item={child} 
                                    nestedPopover={nestedPopover} 
                                    setNestedPopover={setNestedPopover}
                                    handleNavigate={handleNavigate}
                                    currentPath={currentPath}
                                    getItemIdentifier={getItemIdentifier}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
});

const NewSidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { logout, isSuperAdmin, accessLevel, auth, clienteInfo } = useAuth(); // ✅ AGREGAR clienteInfo para obtener cliente_id
    const { setBreadcrumbs } = useBreadcrumb();
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;
    const { branding } = useBranding(); // ✅ NUEVO: Obtener branding
    
    // ✅ NUEVO: Estado para estructura jerárquica
    const [, setModulosMenu] = useState<ModuloConSecciones[]>([]);
    // ⚠️ MANTENER temporalmente para compatibilidad con código antiguo
    const [menuItems, setMenuItems] = useState<SidebarMenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ✅ ACTUALIZADO: Inicializar vacío para que todo esté colapsado por defecto
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [popoverItem, setPopoverItem] = useState<SidebarMenuItem | null>(null);
    const [nestedPopover, setNestedPopover] = useState<string | null>(null); 

    // ✅ ACTUALIZADO: Función para buscar breadcrumb incluyendo módulos y secciones
    const findBreadcrumbPath = useCallback((
        items: SidebarMenuItem[], 
        targetPath: string, 
        currentBreadcrumb: Array<{nombre: string, ruta?: string | null}> = []
    ): Array<{nombre: string, ruta?: string | null}> | null => {
        for (const item of items) {
            const itemPath = item.ruta ? (item.ruta.startsWith('/') ? item.ruta : `/${item.ruta}`) : '#';
            // ✅ ACTUALIZADO: Incluir módulos y secciones (sin ruta) en el breadcrumb
            const newBreadcrumb = [...currentBreadcrumb, { nombre: item.nombre, ruta: item.ruta || null }];
            
            // Si el item tiene ruta y coincide exactamente con el path actual
            if (item.ruta && itemPath === targetPath) {
                return newBreadcrumb;
            }
            
            // Buscar recursivamente en hijos (incluye módulos → secciones → menús → submenús)
            if (item.children && item.children.length > 0) {
                const childResult = findBreadcrumbPath(item.children, targetPath, newBreadcrumb);
                if (childResult) {
                    return childResult;
                }
            }
            
            // Si el path actual comienza con el path del item (para rutas anidadas)
            if (item.ruta && targetPath.startsWith(itemPath) && itemPath !== '/') {
                return newBreadcrumb;
            }
        }
        return null;
    }, []);

    // ✅ ACTUALIZADO: Actualizar breadcrumb para TODOS los tipos de usuario
    useEffect(() => {
        // 1. Buscar breadcrumb en la estructura jerárquica de módulos (funciona para todos los usuarios)
        let breadcrumb = findBreadcrumbPath(menuItems, currentPath);
        
        // 2. Si no se encuentra y es admin, buscar en el menú estático de administración
        if (!breadcrumb && (isSuperAdmin || accessLevel >= 4)) {
            const adminMenuItems = getMenuItemsByUserType(isSuperAdmin, accessLevel >= 4);
            const adminItem = adminMenuItems.find(item => {
                if (item.isSeparator) return false;
                const itemPath = item.ruta ? (item.ruta.startsWith('/') ? item.ruta : `/${item.ruta}`) : '#';
                return currentPath === itemPath || currentPath.startsWith(itemPath);
            });
            
            if (adminItem) {
                breadcrumb = [
                    { nombre: isSuperAdmin ? 'Administración Global' : 'Administración', ruta: null }, 
                    { nombre: adminItem.nombre, ruta: adminItem.ruta || null }
                ];
            }
        }
        
        // 3. Establecer breadcrumb (vacío si no se encuentra nada)
        if (breadcrumb && breadcrumb.length > 0) {
            setBreadcrumbs(breadcrumb);
        } else {
            setBreadcrumbs([]);
        }
    }, [currentPath, menuItems, isSuperAdmin, accessLevel, findBreadcrumbPath, setBreadcrumbs]);

    const handleNavigate = useCallback((path: string) => {
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        navigate(normalizedPath);
        if (isCollapsed) {
            setIsPopoverOpen(false);
            setPopoverItem(null);
            setNestedPopover(null);
        }
    }, [navigate, isCollapsed]);

    const getItemIdentifier = useCallback((item: SidebarMenuItem): string => {
        return `${item.menu_id}-${item.nombre}`;
    }, []);

    const handleMouseEnter = useCallback((item: SidebarMenuItem) => {
        if (!isCollapsed) return;
        setIsPopoverOpen(true);
        setPopoverItem(item);
    }, [isCollapsed]);

    const handleMouseLeave = useCallback(() => {
        if (!isCollapsed) return;
        setIsPopoverOpen(false);
        setPopoverItem(null);
        setNestedPopover(null);
    }, [isCollapsed]);

    const toggleExpanded = useCallback((identifier: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(identifier)) {
                newSet.delete(identifier);
            } else {
                newSet.add(identifier);
            }
            return newSet;
        });
    }, []);

    /**
     * ✅ NUEVO: Construir estructura jerárquica desde módulos activos del cliente
     * Flujo: Cliente → Módulos Activos → Secciones → Menús → Submenús
     */
    const buildHierarchicalMenuFromClienteModulos = useCallback(async (clienteId: string): Promise<ModuloConSecciones[]> => {
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
            const modulosCompletos = await Promise.all(
                moduloIds.map(async (moduloId) => {
                    try {
                        // Obtener detalles del módulo
                        const moduloResponse = await moduloV2Service.getModuloById(moduloId);
                        const moduloData = moduloResponse.data; // ✅ Extraer data de la respuesta
                        
                        // Obtener secciones del módulo (limit alto para sidebar: no paginar en memoria)
                        const seccionesData = await seccionService.getSecciones({
                            modulo_id: moduloId,
                            es_activa: true,
                            limit: 200,
                            skip: 0
                        });
                        
                        // Construir secciones con sus menús
                        const seccionesConMenus = await Promise.all(
                            seccionesData.items.map(async (seccion) => {
                                try {
                                    // Obtener menús de la sección
                                    const menusData = await menuService.getMenusByModulo(moduloId, seccion.seccion_id);
                                    
                                    // Transformar BackendManageMenuItem[] a MenuConPermisos[]
                                    const transformMenuToMenuConPermisos = (menu: BackendManageMenuItem): MenuConPermisos => {
                                        return {
                                            menu_id: menu.menu_id,
                                            codigo: menu.menu_id, // Usar menu_id como código temporal
                                            nombre: menu.nombre,
                                            icono: menu.icono || '',
                                            ruta: menu.ruta || '',
                                            nivel: menu.level || 1,
                                            tipo_menu: 'pantalla',
                                            orden: menu.orden || 0,
                                            permisos: {
                                                ver: menu.es_activo,
                                                crear: false,
                                                editar: false,
                                                eliminar: false,
                                                exportar: false,
                                                imprimir: false,
                                                aprobar: false,
                                            },
                                            submenus: menu.children?.map(transformMenuToMenuConPermisos) || [],
                                        };
                                    };
                                    
                                    const menus = menusData.map(transformMenuToMenuConPermisos);
                                    
                                    return {
                                        seccion_id: seccion.seccion_id,
                                        codigo: seccion.codigo,
                                        nombre: seccion.nombre,
                                        icono: seccion.icono,
                                        orden: seccion.orden,
                                        menus: menus,
                                    };
                                } catch (err) {
                                    console.error(`Error obteniendo menús de sección ${seccion.seccion_id}:`, err);
                                    return {
                                        seccion_id: seccion.seccion_id,
                                        codigo: seccion.codigo,
                                        nombre: seccion.nombre,
                                        icono: seccion.icono,
                                        orden: seccion.orden,
                                        menus: [],
                                    };
                                }
                            })
                        );
                        
                        return {
                            modulo_id: moduloData.modulo_id,
                            codigo: moduloData.codigo,
                            nombre: moduloData.nombre,
                            icono: moduloData.icono,
                            color: moduloData.color || '#1976D2',
                            categoria: moduloData.categoria || '',
                            orden: moduloData.orden,
                            secciones: seccionesConMenus.filter(s => s.menus.length > 0), // Solo secciones con menús
                        };
                    } catch (err) {
                        console.error(`Error obteniendo detalles del módulo ${moduloId}:`, err);
                        return null;
                    }
                })
            );
            
            // Filtrar módulos nulos y ordenar por orden
            const modulosValidos = modulosCompletos
                .filter((m): m is ModuloConSecciones => m !== null && m.secciones.length > 0)
                .sort((a, b) => (a.orden || 0) - (b.orden || 0));
            
            if (import.meta.env.DEV) {
                console.log(`✅ Estructura jerárquica construida para cliente ${clienteId}:`, {
                    totalModulos: modulosValidos.length,
                    modulos: modulosValidos.map(m => ({
                        nombre: m.nombre,
                        secciones: m.secciones.length,
                        menus: m.secciones.reduce((acc, s) => acc + s.menus.length, 0)
                    }))
                });
            }
            
            return modulosValidos;
        } catch (error) {
            console.error(`Error construyendo menú jerárquico para cliente ${clienteId}:`, error);
            throw error;
        }
    }, []);

    // ✅ ACTUALIZADO: Fetch data usando el endpoint correcto según el tipo de usuario
    useEffect(() => {
        const fetchData = async () => {
            // Solo cargar menú si el usuario está autenticado
            if (!auth.user?.usuario_id) {
                setLoading(false);
                return;
            }

            const clienteId = clienteInfo?.cliente_id || auth.user?.cliente_id;
            const usuarioId = auth.user.usuario_id;

            setLoading(true);
            setError(null);
            try {
                let modulos: ModuloConSecciones[] = [];

                // ✅ NUEVO: Determinar qué endpoint usar según el tipo de usuario
                // Usuario normal (no superadmin ni tenant admin) usa endpoint con roles y permisos
                const isNormalUser = !isSuperAdmin && accessLevel < 4;
                
                if (isNormalUser) {
                    // ✅ Usuario normal: usar endpoint que filtra por roles y permisos
                    if (import.meta.env.DEV) {
                        console.log('👤 [NewSidebar] Usuario normal detectado, usando endpoint con roles y permisos');
                    }
                    modulos = await menuService.getUserMenu(usuarioId, clienteId || undefined);
                } else {
                    // ✅ SuperAdmin o Tenant Admin: construir desde módulos activos del cliente
                    if (!clienteId) {
                        if (import.meta.env.DEV) {
                            console.warn('⚠️ [NewSidebar] SuperAdmin/TenantAdmin sin cliente_id, no se puede construir menú');
                        }
                        setLoading(false);
                        return;
                    }
                    
                    if (import.meta.env.DEV) {
                        console.log('👑 [NewSidebar] SuperAdmin/TenantAdmin detectado, construyendo desde módulos activos');
                    }
                    modulos = await buildHierarchicalMenuFromClienteModulos(clienteId);
                }

                setModulosMenu(modulos);
                
                // ✅ Transformar a estructura jerárquica completa para el sidebar
                const transformedItems = transformModulosToSidebarItems(modulos);
                setMenuItems(transformedItems);
            } catch (err: any) {
                console.error('❌ Error fetching sidebar data:', err);
                
                // ✅ FALLBACK: Si falla, intentar método antiguo
                const isServerError = err?.response?.status === 500 || err?.response?.status >= 500;
                if (isServerError) {
                    if (import.meta.env.DEV) {
                        console.warn('⚠️ [NewSidebar] Endpoint principal falló, usando método antiguo como fallback');
                    }
                    
                    try {
                        // Fallback al método antiguo
                        const oldMenuItems = await menuService.getSidebarMenu();
                        setMenuItems(oldMenuItems);
                        setModulosMenu([]);
                        setError(null);
                    } catch (fallbackError) {
                        console.error('❌ Error en fallback también:', fallbackError);
                        setError(`No se pudieron cargar los datos del menú. El servidor puede estar experimentando problemas.`);
                        setModulosMenu([]);
                        setMenuItems([]);
                    }
                } else {
                    setError(`No se pudieron cargar los datos del menú. Intente recargar.`);
                    setModulosMenu([]);
                    setMenuItems([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [clienteInfo?.cliente_id, auth.user?.cliente_id, auth.user?.usuario_id, isSuperAdmin, accessLevel, buildHierarchicalMenuFromClienteModulos]);

    /**
     * ✅ NUEVO: Función de transformación que preserva la estructura jerárquica completa
     * Convierte ModuloConSecciones[] a SidebarMenuItem[] con estructura: Módulo → Sección → Menú → Submenú
     * Todo estará colapsado por defecto
     */
    const transformModulosToSidebarItems = useCallback((modulos: ModuloConSecciones[]): SidebarMenuItem[] => {
        const items: SidebarMenuItem[] = [];
        
        modulos.forEach(modulo => {
            // Crear item de módulo (sin ruta, solo para expandir/colapsar)
            const moduloItem: SidebarMenuItem = {
                menu_id: `modulo-${modulo.modulo_id}`, // ID único para módulo
                nombre: modulo.nombre,
                icono: modulo.icono,
                ruta: null, // Módulo no tiene ruta, solo expande/colapsa
                orden: modulo.orden,
                level: 0, // Nivel 0 = módulo
                es_activo: true,
                padre_menu_id: null,
                area_id: modulo.modulo_id,
                area_nombre: modulo.nombre,
                children: [], // Se llenará con secciones
            };
            
            // Procesar secciones del módulo
            modulo.secciones.forEach(seccion => {
                // Crear item de sección (sin ruta, solo para expandir/colapsar)
                const seccionItem: SidebarMenuItem = {
                    menu_id: `seccion-${seccion.seccion_id}`, // ID único para sección
                    nombre: seccion.nombre,
                    icono: seccion.icono,
                    ruta: null, // Sección no tiene ruta, solo expande/colapsa
                    orden: seccion.orden,
                    level: 1, // Nivel 1 = sección
                    es_activo: true,
                    padre_menu_id: moduloItem.menu_id,
                    area_id: modulo.modulo_id,
                    area_nombre: modulo.nombre,
                    children: [], // Se llenará con menús
                };
                
                // Procesar menús de la sección
                seccion.menus.forEach(menu => {
                    // Solo incluir menús con permiso "ver"
                    if (!menu.permisos.ver) return;
                    
                    // Crear item de menú (con ruta)
                    const menuItem: SidebarMenuItem = {
                        menu_id: menu.menu_id,
                        nombre: menu.nombre,
                        icono: menu.icono,
                        ruta: menu.ruta,
                        orden: menu.orden,
                        level: 2, // Nivel 2 = menú
                        es_activo: true,
                        padre_menu_id: seccionItem.menu_id,
                        area_id: modulo.modulo_id,
                        area_nombre: modulo.nombre,
                        children: [], // Se llenará con submenús
                    };
                    
                    // Procesar submenús
                    if (menu.submenus && menu.submenus.length > 0) {
                        menuItem.children = menu.submenus
                            .filter(submenu => submenu.permisos.ver) // Solo submenús con permiso ver
                            .map(submenu => ({
                                menu_id: submenu.menu_id,
                                nombre: submenu.nombre,
                                icono: submenu.icono,
                                ruta: submenu.ruta,
                                orden: submenu.orden,
                                level: 3, // Nivel 3 = submenú
                                es_activo: true,
                                padre_menu_id: menuItem.menu_id,
                                area_id: modulo.modulo_id,
                                area_nombre: modulo.nombre,
                                children: [], // Los submenús no tienen hijos por ahora
                            }));
                    }
                    
                    seccionItem.children.push(menuItem);
                });
                
                // Solo agregar sección si tiene menús visibles
                if (seccionItem.children.length > 0) {
                    moduloItem.children.push(seccionItem);
                }
            });
            
            // Solo agregar módulo si tiene secciones con menús visibles
            if (moduloItem.children.length > 0) {
                items.push(moduloItem);
            }
        });
        
        // Ordenar por orden
        const sortByOrder = (items: SidebarMenuItem[]): SidebarMenuItem[] => {
            return items
                .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                .map(item => ({
                    ...item,
                    children: item.children ? sortByOrder(item.children) : []
                }));
        };
        
        return sortByOrder(items);
    }, []);

    // ✅ ACTUALIZADO: Expandir automáticamente solo los padres del path actual
    // Esto permite que el usuario vea dónde está sin expandir todo
    useEffect(() => {
        const findAndExpandParents = (
            items: SidebarMenuItem[], 
            targetPath: string, 
            currentExpanded: Set<string>
        ) => {
            let found = false;
            
            for (const item of items) {
                const itemIdentifier = getItemIdentifier(item);
                const itemPath = item.ruta ? (item.ruta.startsWith('/') ? item.ruta : `/${item.ruta}`) : '#';

                // Si el item tiene ruta y coincide con el path actual, expandir sus padres
                if (item.ruta && targetPath.startsWith(itemPath) && targetPath !== '/') {
                    return true;
                }
                
                // Buscar recursivamente en hijos
                if (item.children && item.children.length > 0) {
                    if (findAndExpandParents(item.children, targetPath, currentExpanded)) {
                        // Si se encontró en los hijos, expandir este item
                        currentExpanded.add(itemIdentifier);
                        found = true;
                    }
                }
            }
            return found;
        };

        // ✅ ACTUALIZADO: Solo expandir los padres del path actual, no todo
        const newExpanded = new Set<string>();
        if (menuItems.length > 0 && currentPath && currentPath !== '/') {
            findAndExpandParents(menuItems, currentPath, newExpanded);
        }
        setExpandedItems(newExpanded);
        
    }, [menuItems, currentPath, getItemIdentifier]);

    const collapsedWidthClass = 'w-[72px]';
    const expandedWidthClass = 'w-64';
    const widthClass = isCollapsed ? collapsedWidthClass : expandedWidthClass;

    // Obtención de clases de link (SIN CAMBIOS)
    const getLinkClasses = useCallback((path: string, exactMatch: boolean = false) => {
        const normalizedPath = path === '#' ? '#' : (path.startsWith('/') ? path : `/${path}`);
        const isActive = exactMatch ? currentPath === normalizedPath : currentPath.startsWith(normalizedPath);
        
        return `
            flex items-center p-2.5 rounded-lg relative
            ${isCollapsed ? 'justify-center' : 'w-full'}
            ${transitionClass}
            ${isActive
                ? 'bg-brand-primary/10 dark:bg-gray-700 text-brand-primary font-medium before:content-[""] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-brand-primary before:rounded-lg'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
        `;
    }, [currentPath, isCollapsed, transitionClass]);

    // ✅ MEJORADO: Función auxiliar para renderizar el contenido del item de menú con mejor UX
    const renderLinkContent = (item: SidebarMenuItem, hasChildren: boolean, isExpanded: boolean) => {
        const Icon = getIcon(item.icono, LucideIcons.Circle);
        return (
            <>
                <div className="flex-shrink-0 text-current">
                    {Icon}
                </div>
                {!isCollapsed && (
                    <>
                        <span 
                            className="ml-3 text-sm flex-1 truncate leading-relaxed" 
                            title={item.nombre}
                        >
                            {item.nombre}
                        </span>
                        {hasChildren && (
                            <LucideIcons.ChevronDown 
                                className={`w-4 h-4 ml-auto flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                            />
                        )}
                    </>
                )}
            </>
        );
    };

    // Función auxiliar para renderizar un elemento con o sin ruta válida (SIN CAMBIOS)
    const renderItemWrapper = useCallback((
        item: SidebarMenuItem, 
        isExpanded: boolean, 
        isChildActive: boolean, 
        indentClass: string
    ) => {
        const itemIdentifier = getItemIdentifier(item);
        const rawPath = item.ruta || '#';
        const itemPath = rawPath === '#' ? '#' : (rawPath.startsWith('/') ? rawPath : `/${rawPath}`);
        const hasValidRoute = item.ruta && item.ruta !== '#' && item.es_activo;
        const hasChildren = item.children && item.children.length > 0;
        
        // Opción 1: Tiene ruta (NavLink)
        if (hasValidRoute) {
            return (
                <div className={`flex items-stretch gap-1 ${indentClass}`}>
                    <NavLink
                        to={itemPath}
                        className={`flex-1 text-left ${getLinkClasses(itemPath, true)}`}
                        end={true}
                        title={item.nombre}
                    >
                        <div className="flex items-center w-full">
                            {renderLinkContent(item, false, false)} 
                        </div>
                    </NavLink>
                    
                    {hasChildren && (
                        <button
                            onClick={() => toggleExpanded(itemIdentifier)}
                            className={`
                                flex items-center justify-center p-2 rounded-lg flex-shrink-0 w-8
                                ${transitionClass}
                                ${isExpanded || isChildActive
                                    ? 'bg-gray-100 dark:bg-gray-700 text-brand-primary dark:text-brand-primary'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }
                            `}
                            title={isExpanded ? 'Colapsar' : 'Expandir'}
                        >
                            <LucideIcons.ChevronDown 
                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                            />
                        </button>
                    )}
                </div>
            );
        } 
        
        // Opción 2: No tiene ruta pero tiene hijos (Botón/Div para expandir)
        if (hasChildren && !hasValidRoute) {
            return (
                <button
                    onClick={() => toggleExpanded(itemIdentifier)}
                    className={`
                        flex items-center p-2.5 rounded-lg w-full text-left
                        ${transitionClass} ${indentClass}
                        ${isExpanded || isChildActive
                            ? 'bg-gray-100 dark:bg-gray-700 font-semibold text-brand-primary dark:text-brand-primary' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                    `}
                    title={item.nombre}
                >
                    {renderLinkContent(item, hasChildren, isExpanded)}
                </button>
            );
        }
        
        return null; 
    }, [getItemIdentifier, getLinkClasses, toggleExpanded, transitionClass, renderLinkContent]);


    const renderMenuItem = useCallback((item: SidebarMenuItem, level: number = 0) => {
        const itemIdentifier = getItemIdentifier(item);
        const hasChildren = item.children && item.children.length > 0;
        const rawPath = item.ruta || '#';
        const itemPath = rawPath === '#' ? '#' : (rawPath.startsWith('/') ? rawPath : `/${rawPath}`);
        const hasValidRoute = item.ruta && item.ruta !== '#' && item.es_activo;
        const isExpanded = expandedItems.has(itemIdentifier);
        
        const isChildActive = hasChildren && item.children?.some(child => {
            if (!child.ruta) return false;
            const childPath = child.ruta.startsWith('/') ? child.ruta : `/${child.ruta}`;
            return currentPath.startsWith(childPath);
        });
        const isDirectlyActive = hasValidRoute && currentPath.startsWith(itemPath);
        const isActive = isDirectlyActive || isChildActive; 

        // ✅ MEJORADO: Indentación basada en el nivel jerárquico (reducida para mejor UX)
        // Nivel 0 (Módulo): sin indentación
        // Nivel 1 (Sección): pl-2
        // Nivel 2 (Menú): pl-2 (reducido aún más)
        // Nivel 3 (Submenú): pl-4 (reducido aún más)
        const indentClass = level === 0 ? '' : level === 1 ? 'pl-2' : level === 2 ? 'pl-2' : 'pl-4';

        // 1. Colapsado con hijos (Popover)
        if (isCollapsed && hasChildren) {
             return (
                <div key={itemIdentifier}>
                  <Popover
                    isOpen={isPopoverOpen && popoverItem?.menu_id === item.menu_id}
                    positions={['right', 'bottom']}
                    align={'start'}
                    // CORRECCIÓN: zIndex como string
                    containerStyle={{ zIndex: '50' }}
                    content={() => (
                      <PopoverContent
                        item={item}
                        nestedPopover={nestedPopover} 
                        setNestedPopover={setNestedPopover}
                        handleNavigate={handleNavigate}
                        currentPath={currentPath}
                        getItemIdentifier={getItemIdentifier}
                      />
                    )}
                  >
                    <button
                      className={`
                        ${getLinkClasses(itemPath)}
                        ${isActive ? 'bg-brand-primary/10 dark:bg-gray-700 text-brand-primary dark:text-brand-primary' : ''}
                      `}
                      title={item.nombre}
                      onMouseEnter={() => handleMouseEnter(item)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => {
                        if (hasValidRoute) {
                            handleNavigate(itemPath);
                        }
                      }}
                    >
                      {renderLinkContent(item, hasChildren, isExpanded)}
                    </button>
                  </Popover>
                </div>
              );
        }

        // 2. Colapsado sin hijos (NavLink directo)
        if (isCollapsed && !hasChildren) {
             if (!hasValidRoute) {
                 return null;
             }
             return (
                 <NavLink
                     key={itemIdentifier}
                     to={itemPath}
                     className={`${getLinkClasses(itemPath)} ${indentClass}`}
                     title={item.nombre}
                     end={true}
                 >
                     {renderLinkContent(item, hasChildren, isExpanded)}
                 </NavLink>
             );
        }

        // 3. Expandido (con o sin hijos)
        if (!isCollapsed) {
            if (!hasValidRoute && !hasChildren) {
                return null;
            }

            return (
                <div key={itemIdentifier}>
                    {renderItemWrapper(item, isExpanded, isChildActive, indentClass)}
                    
                    {hasChildren && (
                        <div 
                            className={`
                                ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 pointer-events-none'} 
                                overflow-hidden ${transitionClass}
                                mt-1 space-y-0.5
                                ${level === 0 ? 'ml-3 border-l border-gray-200 dark:border-gray-700 pl-2' : ''}
                                ${level === 1 ? 'ml-3 border-l border-gray-200 dark:border-gray-700 pl-2' : ''}
                                ${level >= 2 ? 'ml-2' : ''}
                            `}
                        >
                            {item.children?.map(child => {
                                // ✅ Asegurar que se pase el nivel correcto basado en el level del item
                                const childLevel = (item.level ?? level) + 1;
                                return renderMenuItem(child, childLevel);
                            })}
                        </div>
                    )}
                </div>
            );
        }

        return null;
    }, [
        getItemIdentifier, 
        expandedItems, 
        currentPath, 
        isCollapsed, 
        getLinkClasses, 
        renderItemWrapper, // Dependencia de la función auxiliar
        isPopoverOpen,
        popoverItem,
        nestedPopover,
        handleMouseEnter,
        handleMouseLeave,
        handleNavigate,
        transitionClass,
        renderLinkContent
    ]);

    // ✅ ACTUALIZADO: Renderizar estructura jerárquica completa (Módulo → Sección → Menú → Submenú)
    // Todo estará colapsado por defecto, solo se expandirá automáticamente el path actual
    const renderDynamicMenu = useMemo(() => {
        // Usar menuItems que ya tiene la estructura jerárquica transformada
        // (Módulo → Sección → Menú → Submenú)
        if (menuItems.length === 0) {
            return null;
        }

        return (
            <div className="space-y-1">
                {menuItems.map(item => renderMenuItem(item, 0))}
            </div>
        );
    }, [menuItems, renderMenuItem]);

    // Renderizado estático del menú de administración (MODIFICADO)
    const renderAdminStaticMenu = useMemo(() => {
    // ✅ CORREGIDO: Pasar los parámetros correctos
    const adminMenuItems = getMenuItemsByUserType(
        isSuperAdmin, 
        accessLevel >= 4 // tenant admin
    );
    
    // ✅ CORREGIDO: Si no hay items de administración para este usuario, no renderizar nada
    if (adminMenuItems.length === 0) {
        return null;
    }

    return (
        <div className="mb-3 border-b border-gray-200 dark:border-gray-700 pb-3">
            {!isCollapsed && (
                <div className="mb-2 pl-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-brand-primary dark:text-brand-primary flex items-center gap-2">
                        <LucideIcons.Shield className="w-4 h-4" />
                        {isSuperAdmin ? 'Administración Global' : 'Administración'}
                    </h2>
                </div>
            )}
            
            {isCollapsed && (
                <div className="mb-3 px-1">
                    <div className="p-2 flex items-center justify-center text-brand-primary dark:text-brand-primary">
                        <LucideIcons.Shield className="w-5 h-5" />
                    </div>
                </div>
            )}
            
            <div className="space-y-1">
                {adminMenuItems.map((item) => {
                    if (item.isSeparator) { 
                        if (isCollapsed) return null; 
                        return (
                            <h3 
                                key={item.menu_id}
                                className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2 pl-2 mt-4"
                            >
                                {item.nombre}
                            </h3>
                        );
                    }
                    
                    const IconComponent = getIcon(item.icono, LucideIcons.LayoutDashboard);

                    return (
                        <NavLink
                            key={item.menu_id}
                            to={item.ruta || '#'}
                            className={getLinkClasses(item.ruta || '#', true)}
                            title={item.nombre}
                            end={true}
                        >
                            {IconComponent}
                            {!isCollapsed && (
                                <span 
                                    className="ml-3 text-sm flex-1 truncate leading-relaxed" 
                                    title={item.nombre}
                                >
                                    {item.nombre}
                                </span>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
}, [isCollapsed, getLinkClasses, isSuperAdmin, accessLevel]);

    return (
        <div 
            className={`
                fixed top-0 left-0 h-full z-30 
                bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 
                flex flex-col flex-shrink-0
                ${widthClass} ${transitionClass}
            `}
            onMouseLeave={handleMouseLeave} 
        >
            
            <div className={`
                flex items-center h-16 flex-shrink-0 border-b border-gray-200 dark:border-gray-800
                ${isCollapsed ? 'justify-center' : 'justify-between px-4'}
            `}>
                {!isCollapsed && (
                    branding?.logo_url ? (
                        <img 
                            src={branding.logo_url} 
                            alt="Logo"
                            className="h-8 w-auto max-w-[180px] object-contain"
                            onError={(e) => {
                                // Fallback a texto si la imagen falla
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent && !parent.querySelector('.logo-fallback')) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'logo-fallback font-bold text-lg text-brand-primary truncate';
                                    fallback.textContent = branding?.tema_personalizado?.appName || 'CAXIS';
                                    parent.appendChild(fallback);
                                }
                            }}
                        />
                    ) : null
                )}
                {!isCollapsed && (
                    <div 
                        className="font-bold text-lg text-gray-900 dark:text-white truncate"
                        style={{ display: branding?.logo_url ? 'none' : 'block' }}
                    >
                        CAXIS
                    </div>
                )}
                <button
                    onClick={toggleSidebar} 
                    className={`
                        flex items-center p-2 rounded-lg 
                        ${transitionClass} 
                        hover:bg-gray-100 dark:hover:bg-gray-700
                        text-gray-500 dark:text-gray-400 flex-shrink-0
                        ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? 'Expandir' : 'Colapsar'}
                >
                    {isCollapsed ? (
                        <LucideIcons.Menu className="w-5 h-5" />
                    ) : (
                        <LucideIcons.PanelLeftClose className="w-5 h-5" />
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-thumb-rounded scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
                {loading && (
                    <div className={`p-4 flex flex-col items-center justify-center text-center ${widthClass}`}>
                        <LucideIcons.Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                        <span className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cargando...</span>
                    </div>
                )}

                {error && (
                    <div className={`p-4 flex flex-col items-center text-center ${widthClass}`}>
                        <LucideIcons.AlertCircle className="w-6 h-6 text-red-500" />
                        <span className="mt-2 text-sm text-red-500">{error}</span>
                    </div>
                )}

                {!loading && !error && (
                    <nav className="px-2 pb-4">
                        {(isSuperAdmin || accessLevel >= 4) && renderAdminStaticMenu}
                        
                        {menuItems.length > 0 && (
                            <div className="space-y-1"> 
                                {!isCollapsed && (isSuperAdmin || accessLevel >= 4) && (
                                    <div className="pl-2 mb-4"> {/* CAMBIO APLICADO: De mb-1 a mb-2 */}
                                        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                            <LucideIcons.Boxes className="w-4 h-4" />
                                            Módulos
                                        </h2>
                                    </div>
                                )}

                                {isCollapsed && (isSuperAdmin || accessLevel >= 4) && (
                                     <div className="px-1 mb-1"> 
                                        <div className="p-2 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                            <LucideIcons.Boxes className="w-5 h-5" />
                                        </div>
                                    </div>
                                )}
                                
                                {renderDynamicMenu}
                            </div>
                        )}
                    </nav>
                )}
            </div>

            <div
                className={`
                    border-t border-gray-200 dark:border-gray-800 flex-shrink-0
                    h-auto flex flex-col justify-center p-2
                `}
            >
                <div className="flex flex-col space-y-1"> 
                    <button
                        onClick={toggleDarkMode}
                        className={`
                            flex items-center p-2 rounded-lg 
                            ${transitionClass}
                            hover:bg-gray-100 dark:hover:bg-gray-700
                            text-gray-600 dark:text-gray-300
                            ${isCollapsed ? 'justify-center' : 'w-full'}
                        `}
                        title={isCollapsed ? (isDarkMode ? 'Claro' : 'Oscuro') : (isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro')}
                    >
                        {isDarkMode ? (
                            <LucideIcons.Sun className="w-5 h-5 text-yellow-500" />
                        ) : (
                            <LucideIcons.Moon className="w-5 h-5" />
                        )}
                        {!isCollapsed && (
                            <span className="ml-3 text-sm">{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                        )}
                    </button>
                    <button
                        onClick={() => logout()}
                        className={`
                            flex items-center p-2 rounded-lg 
                            ${transitionClass}
                            hover:bg-red-50 dark:hover:bg-red-900/20
                            text-red-600 dark:text-red-400
                            ${isCollapsed ? 'justify-center' : 'w-full'}
                        `}
                        title={isCollapsed ? 'Salir' : 'Cerrar sesión'}
                    >
                        <LucideIcons.LogOut className="w-5 h-5" />
                        {!isCollapsed && (
                            <span className="ml-3 text-sm">Cerrar Sesión</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewSidebar;
