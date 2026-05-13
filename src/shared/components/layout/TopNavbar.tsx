// src/shared/components/layout/TopNavbar.tsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as LucideIcons from 'lucide-react';
import type { AuthMenuModulo, AuthMenuItem } from '../../../core/auth/types/auth-menu.types';
import { ERP_MODULES } from '../../../core/constants/erp-modules';

const ERP_CODES = new Set(ERP_MODULES.map((m) => m.codigo));

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_ORDER = ['operaciones', 'ventas', 'rrhh', 'finanzas'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  operaciones: 'Operaciones',
  ventas: 'Ventas',
  rrhh: 'RRHH',
  finanzas: 'Finanzas',
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  operaciones: LucideIcons.Building2,
  ventas: LucideIcons.ShoppingCart,
  rrhh: LucideIcons.Users,
  finanzas: LucideIcons.DollarSign,
};

/** Convierte 'super_admin' → 'Super Admin', 'administracion' → 'Administracion', etc. */
function formatCategoryLabel(cat: string): string {
  return cat
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Elige ícono según heurística del nombre de la categoría desconocida. */
function getCategoryIconFallback(cat: string): React.ElementType {
  const k = cat.toLowerCase();
  if (/admin|sistema|system|config|gesti/.test(k)) return LucideIcons.Settings;
  if (/seguridad|security|permis|roles/.test(k)) return LucideIcons.Shield;
  if (/catalogo|catalog|maestro|datos/.test(k)) return LucideIcons.BookOpen;
  if (/report|analitic|bi|dashboard/.test(k)) return LucideIcons.BarChart2;
  return LucideIcons.LayoutGrid;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveIcon(
  iconName: string | null | undefined,
  sizeClass: string,
  FallbackIcon: React.ElementType = LucideIcons.Circle,
): React.ReactNode {
  if (!iconName) return <FallbackIcon className={`${sizeClass} opacity-40`} />;
  try {
    const normalized = iconName
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
    const Icon =
      (LucideIcons as Record<string, React.ElementType>)[normalized] ??
      (LucideIcons as Record<string, React.ElementType>)[iconName];
    if (Icon) return <Icon className={sizeClass} />;
  } catch {
    // fall through to fallback
  }
  return <FallbackIcon className={`${sizeClass} opacity-40`} />;
}

function getFirstRoute(modulo: AuthMenuModulo): string | null {
  for (const seccion of modulo.secciones ?? []) {
    for (const menu of seccion.menus ?? []) {
      if (menu.ruta && menu.is_enabled && menu.is_visible) {
        return menu.ruta.startsWith('/') ? menu.ruta : `/${menu.ruta}`;
      }
    }
  }
  return null;
}

function isModuleActive(modulo: AuthMenuModulo, currentPath: string): boolean {
  for (const seccion of modulo.secciones ?? []) {
    for (const menu of seccion.menus ?? []) {
      if (menu.ruta) {
        const mp = menu.ruta.startsWith('/') ? menu.ruta : `/${menu.ruta}`;
        if (currentPath === mp || currentPath.startsWith(mp + '/')) return true;
      }
    }
  }
  return false;
}

// Reemplazado por getMenusForModulo (useCallback dentro del componente)
// para tener acceso a userType y aplicar el filtro de prefijo de ruta.

/** 1-3 módulos → 1 col · 4-6 → 2 cols · 7+ → 3 cols */
function getModuleColCount(count: number): number {
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  return 3;
}

/** 1-4 ítems → 1 col · 5-8 → 2 cols · 9+ → 3 cols */
function getMenuColCount(count: number): number {
  if (count <= 4) return 1;
  if (count <= 8) return 2;
  return 3;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryEntry {
  key: string;
  label: string;
  Icon: React.ElementType;
  modules: AuthMenuModulo[];
}

// ─── Component ────────────────────────────────────────────────────────────────

const TopNavbar: React.FC = () => {
  const { menuModulos, userType } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  /** Módulo seleccionado con click — muestra su panel de menús debajo */
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  /** Posición left del dropdown, alineada con el botón de categoría clickeado */
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  /** Nivel 2 de filtrado: dentro de cada módulo, solo los menús que corresponden al rol.
   *  ERP → todos los visible+enabled. No-ERP → filtra además por prefijo de ruta. */
  const getMenusForModulo = useCallback(
    (modulo: AuthMenuModulo): AuthMenuItem[] => {
      const allMenus = (modulo.secciones ?? []).flatMap((s) => s.menus ?? []);
      const visibleMenus = allMenus.filter((m) => m.is_visible && m.is_enabled);

      if (ERP_CODES.has(modulo.codigo ?? '')) return visibleMenus;

      if (userType === 'platform_admin') {
        return visibleMenus.filter((m) => m.ruta?.startsWith('/super-admin'));
      }
      if (userType === 'tenant_admin') {
        return visibleMenus.filter((m) => m.ruta?.startsWith('/admin'));
      }
      return [];
    },
    [userType]
  );

  // Cerrar al navegar
  useEffect(() => {
    setOpenCategory(null);
    setSelectedModuleId(null);
  }, [location.pathname]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!openCategory) return;
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenCategory(null);
        setSelectedModuleId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openCategory]);

  // ─── Data ──────────────────────────────────────────────────────────────────

  // Replica exactamente la lógica de visibilidad de NewSidebar:
  // - Módulos ERP: mostrar si tienen ≥1 menú visible+habilitado
  // - Módulos no-ERP (admin): gate por userType + prefijo de ruta
  //   · platform_admin → solo rutas /super-admin/*
  //   · tenant_admin   → solo rutas /admin/*
  //   · user regular   → ningún módulo admin
  const filteredModulos = useMemo(() => {
    return (menuModulos ?? []).filter((m) => {
      const hasVisibleMenu = (m.secciones ?? []).some((s) =>
        (s.menus ?? []).some((menu) => menu.is_visible && menu.is_enabled)
      );
      if (!hasVisibleMenu) return false;

      if (ERP_CODES.has(m.codigo)) return true;

      // Módulo no-ERP (administración): filtrar por userType + prefijo de ruta
      if (userType === 'platform_admin') {
        return (m.secciones ?? []).some((s) =>
          (s.menus ?? []).some(
            (menu) =>
              menu.is_visible &&
              menu.is_enabled &&
              (menu.ruta ?? '').startsWith('/super-admin')
          )
        );
      }
      if (userType === 'tenant_admin') {
        return (m.secciones ?? []).some((s) =>
          (s.menus ?? []).some(
            (menu) =>
              menu.is_visible &&
              menu.is_enabled &&
              (menu.ruta ?? '').startsWith('/admin')
          )
        );
      }
      return false;
    });
  }, [menuModulos, userType]);

  const categoryEntries = useMemo<CategoryEntry[]>(() => {
    const grouped: Record<string, AuthMenuModulo[]> = {};

    for (const m of filteredModulos) {
      // Usar el valor real del campo categoria; vacío/null → bucket '__sin_categoria__'
      const cat = (m.categoria ?? '').trim().toLowerCase() || '__sin_categoria__';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(m);
    }

    // Orden: categorías conocidas primero, luego nuevas (alfabético), sin categoría al final
    const known = (CATEGORY_ORDER as readonly string[]).filter((c) => grouped[c]);
    const dynamic = Object.keys(grouped)
      .filter((c) => !(CATEGORY_ORDER as readonly string[]).includes(c) && c !== '__sin_categoria__')
      .sort();
    const uncategorized = grouped['__sin_categoria__'] ? ['__sin_categoria__'] : [];

    return [...known, ...dynamic, ...uncategorized].map((cat) => {
      if (CATEGORY_LABELS[cat]) {
        return { key: cat, label: CATEGORY_LABELS[cat], Icon: CATEGORY_ICONS[cat], modules: grouped[cat] };
      }
      if (cat === '__sin_categoria__') {
        return { key: cat, label: 'Más', Icon: LucideIcons.MoreHorizontal, modules: grouped[cat] };
      }
      return {
        key: cat,
        label: formatCategoryLabel(cat),
        Icon: getCategoryIconFallback(cat),
        modules: grouped[cat],
      };
    });
  }, [filteredModulos]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleCategoryClick = useCallback(
    (key: string, e: React.MouseEvent<HTMLButtonElement>) => {
      // Calcular posición del botón relativa a la barra y ajustar para no salirse de pantalla
      const btnRect = e.currentTarget.getBoundingClientRect();
      const barRect = barRef.current?.getBoundingClientRect();
      const rawLeft = barRect ? btnRect.left - barRect.left : 0;
      const DROPDOWN_MAX_WIDTH = 480;
      const barWidth = barRef.current?.offsetWidth ?? window.innerWidth;
      setDropdownLeft(Math.max(0, Math.min(rawLeft, barWidth - DROPDOWN_MAX_WIDTH)));

      setOpenCategory((prev) => (prev === key ? null : key));
      setSelectedModuleId(null);
    },
    [],
  );

  /** Click en módulo: selecciona/deselecciona — muestra u oculta panel de menús */
  const handleModuleClick = useCallback((modulo: AuthMenuModulo) => {
    setSelectedModuleId((prev) =>
      prev === modulo.modulo_id ? null : modulo.modulo_id,
    );
  }, []);

  const handleMenuItemClick = useCallback(
    (ruta: string) => {
      navigate(ruta.startsWith('/') ? ruta : `/${ruta}`);
      setOpenCategory(null);
      setSelectedModuleId(null);
    },
    [navigate],
  );

  // ─── Categoría activa según ruta actual (independiente del estado de apertura) ──
  const activeCategoryKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const { key, modules } of categoryEntries) {
      if (modules.some((m) => isModuleActive(m, currentPath))) {
        keys.add(key);
      }
    }
    return keys;
  }, [categoryEntries, currentPath]);

  // ─── Derived ───────────────────────────────────────────────────────────────

  const openEntry = categoryEntries.find((e) => e.key === openCategory) ?? null;
  const selectedModule =
    openEntry?.modules.find((m) => m.modulo_id === selectedModuleId) ?? null;
  const menuItems = selectedModule ? getMenusForModulo(selectedModule) : [];

  // ─── Render ────────────────────────────────────────────────────────────────

  if (filteredModulos.length === 0) return null;

  return (
    <div
      ref={barRef}
      className="relative z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0"
    >
      {/* ── Category bar — h-11 (44px) ───────────────────────────────────── */}
      <div className="flex items-center h-11 px-4 gap-0.5 overflow-x-auto">
        {categoryEntries.map(({ key, label, Icon }) => {
          const hasActive = activeCategoryKeys.has(key);
          const isOpen = openCategory === key;
          return (
            <button
              key={key}
              onClick={(e) => handleCategoryClick(key, e)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium',
                'transition-colors duration-150 flex-shrink-0 whitespace-nowrap',
                'border-b-2',
                hasActive
                  ? 'border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-300 bg-transparent'
                  : isOpen
                  ? 'border-transparent bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md',
              ].join(' ')}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  hasActive ? 'text-blue-700 dark:text-blue-300' : ''
                }`}
              />
              <span>{label}</span>
              <LucideIcons.ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  hasActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500'
                } ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
          );
        })}
      </div>

      {/* ── Mega dropdown — flex-col: módulos arriba, menús abajo ────────── */}
      {openEntry && (
        <div
          className="absolute top-full z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-b-lg shadow-xl overflow-hidden"
          style={{ minWidth: 240, left: dropdownLeft }}
        >
          {/* Panel de módulos — columnas automáticas, compacto */}
          <div
            className="grid gap-0.5 p-2"
            style={{ gridTemplateColumns: `repeat(${getModuleColCount(openEntry.modules.length)}, max-content)` }}
          >
            {openEntry.modules.map((modulo) => {
              const active = isModuleActive(modulo, currentPath);
              const selected = selectedModuleId === modulo.modulo_id;
              return (
                <button
                  key={modulo.modulo_id}
                  onClick={() => handleModuleClick(modulo)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-md text-left w-full
                    transition-colors duration-150
                    ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : selected
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <span
                    className={`flex-shrink-0 ${
                      active
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {resolveIcon(modulo.icono, 'w-[18px] h-[18px]')}
                  </span>
                  <span className="text-[13px] font-medium whitespace-nowrap">
                    {modulo.nombre}
                  </span>
                  <LucideIcons.ChevronDown
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-150 ${
                      selected
                        ? 'rotate-180 text-blue-500 dark:text-blue-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Panel de menús — debajo de módulos, con separador visual */}
          {selectedModule && menuItems.length > 0 && (
            <>
              <div className="border-t border-gray-100 dark:border-gray-800" />
              <div className="bg-gray-50 dark:bg-gray-800/40 p-2">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-2 py-1">
                  {selectedModule.nombre}
                </div>
                <div
                  className="grid gap-0.5 mt-1"
                  style={{ gridTemplateColumns: `repeat(${getMenuColCount(menuItems.length)}, max-content)` }}
                >
                  {menuItems.map((item) => {
                    const ruta = item.ruta
                      ? item.ruta.startsWith('/')
                        ? item.ruta
                        : `/${item.ruta}`
                      : null;
                    const isItemActive =
                      !!ruta &&
                      (currentPath === ruta || currentPath.startsWith(ruta + '/'));
                    return (
                      <button
                        key={item.menu_id}
                        onClick={() => ruta && handleMenuItemClick(ruta)}
                        disabled={!ruta}
                        className={`
                          flex items-start gap-2 px-2 py-2 rounded-md text-left w-full
                          transition-colors duration-150
                          ${
                            isItemActive
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
                          }
                          ${!ruta ? 'opacity-40 cursor-default' : 'cursor-pointer'}
                        `}
                      >
                        <span
                          className={`flex-shrink-0 mt-0.5 ${
                            isItemActive
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {resolveIcon(item.icono, 'w-4 h-4')}
                        </span>
                        <div>
                          <div className="text-[13px] font-semibold whitespace-nowrap">
                            {item.nombre}
                          </div>
                          {item.descripcion && (
                            <div
                              className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5"
                              style={{
                                maxWidth: '200px',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                lineHeight: '1.4',
                              }}
                            >
                              {item.descripcion}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TopNavbar;
