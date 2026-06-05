// src/components/layout/NewSidebar.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useAuth } from '../../../shared/context/AuthContext';
import { Popover } from 'react-tiny-popover';
import * as LucideIcons from 'lucide-react';
import { useBranding } from '../../../features/tenant/hooks/useBranding';
import caxisIconLight from '@/assets/images/caxis-icon-light.svg';
import caxisIconDark from '@/assets/images/caxis-icon-dark.svg';
import caxisLogoLight from '@/assets/images/caxis-logo-light.svg';
import caxisLogoDark from '@/assets/images/caxis-logo-dark.svg';

import type {
  SidebarMenuItem,
  SidebarProps,
  PopoverContentProps,
} from '@/features/admin/types/menu.types';
import { useAdminMenuItems } from './MenuSelector';
import { useLayoutShell } from './LayoutShellContext';
import {
  filterModulosForShell,
  transformAuthMenuToSidebarItems,
} from './sidebar-menu.utils';
import {
  SHELL_ADMIN_SECTION_TITLE,
  SHELL_MODULE_SECTION_TITLE,
} from './layout-shell.types';
import {
    navItemActive,
    navItemActiveBar,
    navItemExpandActive,
    navItemExpandIdle,
    navItemIdle,
    navItemParentActive,
    navItemTransition,
} from './nav-item-classes';

// --- CLASES Y UTILIDADES COMUNES ---
const baseIconClasses = "w-5 h-5 text-current opacity-100 inline-block"; 
const transitionClass = navItemTransition; 

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
        <div className="bg-brand-surface rounded-lg shadow-xl border border-brand-border p-1.5 min-w-[280px] max-w-sm z-50">
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
                                group
                                ${hasValidRoute ? 'cursor-pointer' : 'cursor-default'}
                                ${isChildActive 
                                    ? navItemActiveBar
                                    : hasValidRoute 
                                    ? navItemIdle
                                    : `${navItemIdle} opacity-80 pointer-events-none`
                                }
                            `}
                            title={child.nombre}
                        >
                            <span className="text-sm leading-relaxed min-w-0 flex-1 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                {child.nombre}
                            </span>
                            {hasChildren && (
                                <LucideIcons.ChevronRight className="w-4 h-4 ml-2 flex-shrink-0 text-brand-text-secondary mt-0.5" />
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
    const shell = useLayoutShell();
    const { isDarkMode } = useTheme();
    const { auth, menuModulos } = useAuth();
    const { items: adminMenuItems } = useAdminMenuItems();
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;
    const { branding } = useBranding();

    // Menú operativo: payload /auth/menu particionado por shell (metadata o prefijo de ruta)
    const menuItems = useMemo(
        () =>
            shell === 'app' && menuModulos
                ? transformAuthMenuToSidebarItems(filterModulosForShell(menuModulos, 'app'), 'app')
                : [],
        [menuModulos, shell]
    );
    const menuLoading = !!auth.user && menuModulos === null;
    const menuEmptyAfterLoad =
        !menuLoading && shell === 'app' && menuModulos !== null && menuItems.length === 0;

    // ✅ ACTUALIZADO: Inicializar vacío para que todo esté colapsado por defecto
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [popoverItem, setPopoverItem] = useState<SidebarMenuItem | null>(null);
    const [nestedPopover, setNestedPopover] = useState<string | null>(null);
    
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
            ${isCollapsed ? 'justify-center' : ''}
            ${isActive ? navItemActiveBar : navItemIdle}
        `;
    }, [currentPath, isCollapsed]);

    // ✅ MEJORADO: Función auxiliar para renderizar el contenido del item de menú con mejor UX
    const renderLinkContent = (item: SidebarMenuItem, hasChildren: boolean, isExpanded: boolean) => {
        const Icon = getIcon(item.icono, LucideIcons.Circle);
        return (
            <>
                <div className="flex-shrink-0 text-inherit [&_svg]:opacity-100">
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
                                className={`w-4 h-4 ml-auto flex-shrink-0 text-brand-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
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
        const isSelfActive = hasValidRoute && currentPath === itemPath;
        const parentNavLinkClasses =
            isSelfActive || !(hasChildren && isChildActive)
                ? `flex-1 min-w-0 ${getLinkClasses(itemPath, true)}`
                : `flex-1 min-w-0 ${navItemParentActive}`;

        // Opción 1: Tiene ruta (NavLink)
        if (hasValidRoute) {
            return (
                <div className={`flex items-stretch gap-1 ${indentClass}`}>
                    <NavLink
                        to={itemPath}
                        className={parentNavLinkClasses}
                        end={true}
                        title={item.nombre}
                    >
                        {renderLinkContent(item, false, false)}
                    </NavLink>
                    
                    {hasChildren && (
                        <button
                            onClick={() => toggleExpanded(itemIdentifier)}
                            className={isChildActive ? navItemExpandActive : navItemExpandIdle}
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
                        w-full text-left ${indentClass}
                        ${isChildActive ? navItemActiveBar : navItemIdle}
                    `}
                    title={item.nombre}
                >
                    {renderLinkContent(item, hasChildren, isExpanded)}
                </button>
            );
        }
        
        return null; 
    }, [getItemIdentifier, getLinkClasses, toggleExpanded, transitionClass, renderLinkContent, currentPath]);


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
                        ${isActive ? navItemActive : ''}
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
                                ${level === 0 ? 'ml-3 border-l border-brand-border pl-2' : ''}
                                ${level === 1 ? 'ml-3 border-l border-brand-border pl-2' : ''}
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

    // Admin: ítems ya filtrados por shell en useAdminMenuItems; refino por prefijo de ruta.
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
                <div className="mb-3 border-b border-brand-border pb-3">
                    {!isCollapsed && (
                        <div className="mb-2 pl-2">
                            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-brand-text-secondary">
                                {title}
                            </h2>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="mb-3 px-1">
                            <div className="p-2 flex items-center justify-center text-brand-text-secondary">
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
                                        className="text-[10px] font-semibold uppercase tracking-widest text-brand-text-secondary mb-1 pl-2 mt-3"
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

    const adminSectionTitle = SHELL_ADMIN_SECTION_TITLE[shell];
    const adminSectionItems = useMemo(() => {
        if (shell === 'super-admin') return globalAdminItems;
        if (shell === 'admin') return tenantAdminItems;
        return [];
    }, [shell, globalAdminItems, tenantAdminItems]);

    const renderShellAdminMenu = useMemo(
        () =>
            adminSectionTitle
                ? renderAdminBlock(adminSectionTitle, adminSectionItems)
                : null,
        [adminSectionTitle, renderAdminBlock, adminSectionItems]
    );

    const moduleSectionTitle = SHELL_MODULE_SECTION_TITLE[shell];

    const caxisIconSrc = isDarkMode ? caxisIconDark : caxisIconLight;
    const caxisLogoSrc = isDarkMode ? caxisLogoDark : caxisLogoLight;

    return (
        <div 
            className={`
                fixed left-0 z-30 overflow-visible
                top-[var(--support-banner-h,0px)]
                h-[calc(100vh-var(--support-banner-h,0px))]
                max-h-[calc(100dvh-var(--support-banner-h,0px))]
                bg-brand-surface border-r border-brand-border 
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
                flex items-center h-16 flex-shrink-0 border-b border-brand-border
                ${isCollapsed ? 'justify-center' : 'px-4'}
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
                {isCollapsed ? (
                    <img
                        src={caxisIconSrc}
                        alt="CAXIS"
                        className="h-8 w-8 object-contain"
                    />
                ) : (
                    <img
                        src={caxisLogoSrc}
                        alt="CAXIS"
                        className="h-auto max-h-14 w-[200px] max-w-full object-contain object-left"
                        style={{ display: branding?.logo_url ? 'none' : 'block' }}
                    />
                )}
            </div>

            <button
                type="button"
                onClick={toggleSidebar}
                className={`
                    absolute top-16 right-0 z-40
                    flex h-8 w-8 -translate-y-1/2 translate-x-1/2
                    items-center justify-center
                    rounded-full border border-brand-border
                    bg-brand-surface text-brand-text-secondary shadow-md
                    ${transitionClass}
                    hover:bg-brand-surface-secondary hover:text-brand-text-primary
                `}
                title={isCollapsed ? 'Expandir' : 'Colapsar'}
                aria-label={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            >
                {isCollapsed ? (
                    <LucideIcons.ChevronRight className="h-4 w-4" strokeWidth={2} />
                ) : (
                    <LucideIcons.ChevronLeft className="h-4 w-4" strokeWidth={2} />
                )}
            </button>


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
                        <span className="mt-2 text-sm text-brand-text-secondary">Cargando...</span>
                    </div>
                )}

                {!menuLoading && (
                    <nav className="px-2 pb-4">
                        {/* SECCIÓN 1: ProductModulesSection — solo módulos de producto (GET /auth/menu sin admin) */}
                        {shell === 'app' && menuEmptyAfterLoad && (
                            <div className={`p-4 text-center text-sm text-brand-text-secondary ${isCollapsed ? 'px-1' : ''}`}>
                                {!isCollapsed && <p>Sin módulos disponibles</p>}
                            </div>
                        )}

                        {shell === 'app' && menuItems.length > 0 && moduleSectionTitle && (
                            <div className="space-y-1 mb-3 border-b border-brand-border pb-3">
                                {!isCollapsed && (
                                    <div className="mb-2 pl-2">
                                        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-brand-text-secondary">
                                            {moduleSectionTitle}
                                        </h2>
                                    </div>
                                )}
                                {isCollapsed && (
                                    <div className="mb-3 px-1">
                                        <div className="flex items-center justify-center p-2 text-brand-text-secondary">
                                            <LucideIcons.Boxes className="w-4 h-4" />
                                        </div>
                                    </div>
                                )}
                                {renderDynamicMenu}
                            </div>
                        )}

                        {/* SECCIÓN 2: menús de administración (admin / super-admin) */}
                        {renderShellAdminMenu}
                    </nav>
                )}
            </div>

        </div>
    );
};

export default NewSidebar;
