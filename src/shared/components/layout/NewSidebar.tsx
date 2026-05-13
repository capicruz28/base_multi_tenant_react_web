// src/components/layout/NewSidebar.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useAuth } from '../../../shared/context/AuthContext';
import { useBreadcrumb } from '../../../shared/context/BreadcrumbContext';
import { Popover } from 'react-tiny-popover';
import * as LucideIcons from 'lucide-react';
import { useBranding } from '../../../features/tenant/hooks/useBranding';

import type {
  SidebarMenuItem,
  SidebarProps,
  PopoverContentProps,
} from '@/features/admin/types/menu.types';
import type { AuthMenuModulo, AuthMenuItem } from '@/core/auth/types/auth-menu.types';
import { useAdminMenuItems } from './MenuSelector';

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
                                flex items-center px-3 py-2 rounded-md transition-colors duration-150 group relative
                                ${hasValidRoute ? 'cursor-pointer' : 'cursor-default'}
                                ${isChildActive 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[60%] before:w-[3px] before:bg-blue-600 dark:before:bg-blue-500 before:rounded-r-sm' 
                                    : hasValidRoute 
                                    ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    : 'text-gray-400 dark:text-gray-500'
                                }
                            `}
                            title={child.nombre}
                        >
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

/** Códigos de módulos de administración: no se muestran como módulos de producto (solo en AdminSection). */
const ADMIN_MODULE_CODES = new Set<string>(['SYS_ADMIN', 'ADMIN_SYSTEM', 'ADMINISTRACION']);

/** Convierte AuthMenuModulo[] (desde /auth/menu vía AuthContext) en SidebarMenuItem[]. Filtra por is_visible && is_enabled únicamente. */
function transformAuthMenuToSidebarItems(modulos: AuthMenuModulo[]): SidebarMenuItem[] {
    const items: SidebarMenuItem[] = [];
    for (const modulo of modulos) {
        const moduloItem: SidebarMenuItem = {
            menu_id: `modulo-${modulo.modulo_id}`,
            nombre: modulo.nombre,
            icono: modulo.icono,
            ruta: null,
            orden: modulo.orden,
            level: 0,
            es_activo: true,
            padre_menu_id: null,
            area_id: modulo.modulo_id,
            area_nombre: modulo.nombre,
            children: [],
        };
        for (const seccion of modulo.secciones || []) {
            const seccionItem: SidebarMenuItem = {
                menu_id: `seccion-${seccion.seccion_id}`,
                nombre: seccion.nombre,
                icono: seccion.icono,
                ruta: null,
                orden: seccion.orden,
                level: 1,
                es_activo: true,
                padre_menu_id: moduloItem.menu_id,
                area_id: modulo.modulo_id,
                area_nombre: modulo.nombre,
                children: [],
            };
            for (const menu of seccion.menus || []) {
                if (!menu.is_visible || !menu.is_enabled) continue;
                const menuItem: SidebarMenuItem = {
                    menu_id: menu.menu_id,
                    nombre: menu.nombre,
                    icono: menu.icono,
                    ruta: menu.ruta,
                    orden: menu.orden,
                    level: 2,
                    es_activo: true,
                    padre_menu_id: seccionItem.menu_id,
                    area_id: modulo.modulo_id,
                    area_nombre: modulo.nombre,
                    children: (menu.submenus || [])
                        .filter((sub: AuthMenuItem) => sub.is_visible && sub.is_enabled)
                        .map((sub: AuthMenuItem) => ({
                            menu_id: sub.menu_id,
                            nombre: sub.nombre,
                            icono: sub.icono,
                            ruta: sub.ruta,
                            orden: sub.orden,
                            level: 3,
                            es_activo: true,
                            padre_menu_id: menu.menu_id,
                            area_id: modulo.modulo_id,
                            area_nombre: modulo.nombre,
                            children: [],
                        })),
                };
                seccionItem.children.push(menuItem);
            }
            if (seccionItem.children.length > 0) {
                moduloItem.children.push(seccionItem);
            }
        }
        if (moduloItem.children.length > 0) {
            items.push(moduloItem);
        }
    }
    const sortByOrder = (list: SidebarMenuItem[]): SidebarMenuItem[] =>
        [...list]
            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
            .map((item) => ({ ...item, children: sortByOrder(item.children || []) }));
    return sortByOrder(items);
}

const NewSidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
    const { isDarkMode } = useTheme();
    const { auth, menuModulos, userType } = useAuth();
    const { items: adminMenuItems } = useAdminMenuItems();
    const { setBreadcrumbs } = useBreadcrumb();
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;
    const { branding } = useBranding();

    // Menú de producto desde GET /auth/menu (excluye SYS_ADMIN, ADMIN_SYSTEM, ADMINISTRACION)
    const menuItems = useMemo(
        () =>
            menuModulos
                ? transformAuthMenuToSidebarItems(
                      menuModulos.filter((m) => !ADMIN_MODULE_CODES.has(m.codigo ?? ''))
                  )
                : [],
        [menuModulos]
    );
    const normalizedMenu = menuItems;

    if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('MENU FROM AUTH (modulos):', menuModulos);
        // eslint-disable-next-line no-console
        console.log('MENU RENDER FINAL:', normalizedMenu);
    }
    const menuLoading = !!auth.user && menuModulos === null;

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
            // Saltar el nivel de sección (menu_id empieza con 'seccion-') para que el
            // breadcrumb muestre Módulo → Ítem de menú, sin el nodo intermedio "Principal".
            const isSection = item.menu_id.startsWith('seccion-');
            const newBreadcrumb = isSection
                ? currentBreadcrumb
                : [...currentBreadcrumb, { nombre: item.nombre, ruta: item.ruta || null }];
            
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
        
        // 2. Si no se encuentra y hay menú de administración, intentar resolver ahí
        if (!breadcrumb && adminMenuItems.length > 0) {
            const adminItem = adminMenuItems.find(item => {
                if (item.isSeparator) return false;
                const itemPath = item.ruta ? (item.ruta.startsWith('/') ? item.ruta : `/${item.ruta}`) : '#';
                return currentPath === itemPath || currentPath.startsWith(itemPath);
            });
            
            if (adminItem) {
                const adminTitle = (adminItem.ruta ?? '').startsWith('/super-admin')
                    ? 'Administración Global'
                    : 'Administración General';
                breadcrumb = [
                    { nombre: adminTitle, ruta: null },
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
    }, [currentPath, menuItems, adminMenuItems, findBreadcrumbPath, setBreadcrumbs]);

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

    // Expandir automáticamente solo los padres del path actual
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
            flex items-center px-3 py-2 rounded-lg relative
            ${isCollapsed ? 'justify-center' : 'w-full'}
            ${transitionClass}
            ${isActive
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[60%] before:w-[3px] before:bg-blue-600 dark:before:bg-blue-500 before:rounded-r-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
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
                                ${isChildActive
                                    ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
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
                        flex items-center px-3 py-2 rounded-lg w-full text-left relative
                        ${transitionClass} ${indentClass}
                        ${isChildActive
                            ? 'bg-blue-50 dark:bg-blue-900/20 font-medium text-blue-600 dark:text-blue-400 before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[60%] before:w-[3px] before:bg-blue-600 dark:before:bg-blue-500 before:rounded-r-sm' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
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
        // Skip section nodes (level 1, menu_id "seccion-*"): render their children
        // directly at this level so the "Principal" intermediate row is never shown.
        if (String(item.menu_id).startsWith('seccion-')) {
            if (!item.children || item.children.length === 0) return null;
            return (
                <React.Fragment key={String(item.menu_id)}>
                    {item.children.map(child => renderMenuItem(child, level))}
                </React.Fragment>
            );
        }

        const itemIdentifier = getItemIdentifier(item);
        const hasChildren = item.children && item.children.length > 0;
        const rawPath = item.ruta || '#';
        const itemPath = rawPath === '#' ? '#' : (rawPath.startsWith('/') ? rawPath : `/${rawPath}`);
        const hasValidRoute = item.ruta && item.ruta !== '#' && item.es_activo;
        const isExpanded = expandedItems.has(itemIdentifier);
        
        const isChildActive = hasChildren && item.children?.some(child => {
            if (child.ruta) {
                const childPath = child.ruta.startsWith('/') ? child.ruta : `/${child.ruta}`;
                if (currentPath === childPath || currentPath.startsWith(childPath + '/')) return true;
            }
            return child.children?.some(grandchild => {
                if (!grandchild.ruta) return false;
                const grandchildPath = grandchild.ruta.startsWith('/') ? grandchild.ruta : `/${grandchild.ruta}`;
                return currentPath === grandchildPath || currentPath.startsWith(grandchildPath + '/');
            }) ?? false;
        });
        const isDirectlyActive = hasValidRoute && (currentPath === itemPath || currentPath.startsWith(itemPath + '/'));
        const isActive = isDirectlyActive || isChildActive; 

        // ✅ MEJORADO: Indentación basada en el nivel jerárquico (reducida para mejor UX)
        // Nivel 0 (Módulo): sin indentación
        // Nivel 1 (Sección): pl-2
        // Nivel 2 (Menú): pl-2 (reducido aún más)
        // Nivel 3 (Submenú): pl-4 (reducido aún más)
        const indentClass = level === 0 ? '' : level === 1 ? 'pl-2' : level === 2 ? 'pl-2' : 'pl-4';

        // 1. Colapsado con hijos (Popover)
        if (isCollapsed && hasChildren) {
            // Flatten section children so the popover skips the "Principal" row
            const flatChildren = item.children?.flatMap(child =>
                String(child.menu_id).startsWith('seccion-')
                    ? (child.children || [])
                    : [child]
            ) ?? [];
            const popoverItem_ = flatChildren.length > 0 ? { ...item, children: flatChildren } : item;

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
                        item={popoverItem_}
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
                        ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : ''}
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

    // ✅ FASE 1: Renderizar estructura jerárquica completa con filtrado de búsqueda
    // Todo estará colapsado por defecto, solo se expandirá automáticamente el path actual
    const renderDynamicMenu = useMemo(() => {
        if (menuItems.length === 0) {
            return null;
        }
        return (
            <div className="space-y-1">
                {menuItems.map(item => renderMenuItem(item, 0))}
            </div>
        );
    }, [menuItems, renderMenuItem]);

    // ✅ RBAC Wave 3: separar ítems por access_level (global vs tenant).
    // Filtro solo por ruta: los separadores tienen ruta del primer menú de su sección,
    // así "Administración del Tenant" (ruta /admin/...) no entra en global.
    const globalAdminItems = useMemo(
        () => adminMenuItems.filter((item) => (item.ruta ?? '').startsWith('/super-admin')),
        [adminMenuItems]
    );
    const tenantAdminItems = useMemo(
        () => adminMenuItems.filter((item) => (item.ruta ?? '').startsWith('/admin')),
        [adminMenuItems]
    );

    const renderAdminBlock = useCallback(
        (title: string, items: typeof adminMenuItems) => {
            if (items.length === 0) return null;
            return (
                <div className="mb-3 border-b border-gray-200 dark:border-gray-700 pb-3">
                    {!isCollapsed && (
                        <div className="mb-2 pl-2">
                            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                {title}
                            </h2>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="mb-3 px-1">
                            <div className="p-2 flex items-center justify-center text-gray-400 dark:text-gray-500">
                                <LucideIcons.Shield className="w-4 h-4" />
                            </div>
                        </div>
                    )}
                    <div className="space-y-1">
                        {items.map((item) => {
                            if (item.isSeparator) {
                                if (isCollapsed) return null;
                                return (
                                    <h3
                                        key={item.menu_id}
                                        className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1 pl-2 mt-3"
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
                                        <span className="ml-3 text-sm flex-1 truncate leading-relaxed" title={item.nombre}>
                                            {item.nombre}
                                        </span>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            );
        },
        [isCollapsed, getLinkClasses]
    );

    const renderAdminGlobalMenu = useMemo(
        () => (userType === 'platform_admin' ? renderAdminBlock('Administración Global', globalAdminItems) : null),
        [userType, renderAdminBlock, globalAdminItems]
    );
    const renderAdminTenantMenu = useMemo(
        () => (userType === 'tenant_admin' ? renderAdminBlock('Administración General', tenantAdminItems) : null),
        [userType, renderAdminBlock, tenantAdminItems]
    );

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
            {/* Scrollbar delgada — webkit + dark mode */}
            <style>{`
              .sidebar-thin-scroll::-webkit-scrollbar { width: 4px; }
              .sidebar-thin-scroll::-webkit-scrollbar-track { background: transparent; }
              .sidebar-thin-scroll::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.15); border-radius: 4px; }
              .dark .sidebar-thin-scroll::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.15); }
            `}</style>
            
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


            <div
                className="flex-1 overflow-y-auto p-2 sidebar-thin-scroll"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: isDarkMode
                        ? 'rgba(255,255,255,0.15) transparent'
                        : 'rgba(0,0,0,0.15) transparent',
                }}
            >
                {menuLoading && (
                    <div className={`p-4 flex flex-col items-center justify-center text-center ${widthClass}`}>
                        <LucideIcons.Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                        <span className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cargando...</span>
                    </div>
                )}

                {!menuLoading && (
                    <nav className="px-2 pb-4">
                        {/* SECCIÓN 1: ProductModulesSection — solo módulos de producto (GET /auth/menu sin admin) */}
                        {menuItems.length > 0 && (
                            <div className="space-y-1 mb-3 border-b border-gray-200 dark:border-gray-700 pb-3">
                                {!isCollapsed && (
                                    <div className="pl-2 mb-3">
                                        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                            Módulos
                                        </h2>
                                    </div>
                                )}
                                {isCollapsed && (
                                    <div className="px-1 mb-1">
                                        <div className="p-2 flex items-center justify-center text-gray-400 dark:text-gray-500">
                                            <LucideIcons.Boxes className="w-4 h-4" />
                                        </div>
                                    </div>
                                )}
                                {renderDynamicMenu}
                            </div>
                        )}

                        {/* SECCIÓN 2: AdminSection — por user_type (/auth/me); hasPermission dentro de cada menú */}
                        {userType === 'platform_admin' ? (
                            renderAdminGlobalMenu
                        ) : userType === 'tenant_admin' ? (
                            renderAdminTenantMenu
                        ) : null}
                    </nav>
                )}
            </div>

        </div>
    );
};

export default NewSidebar;
