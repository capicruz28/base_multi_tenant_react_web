// src/shared/components/layout/TopNavbar.tsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as LucideIcons from 'lucide-react';
import type { AuthMenuModulo, AuthMenuItem } from '../../../core/auth/types/auth-menu.types';
import { useLayoutShell } from './LayoutShellContext';
import type { LayoutShellVariant } from './layout-shell.types';
import {
  filterModulosForShell,
  isMenuVisibleForShell,
  normalizeNavRoute,
} from './sidebar-menu.utils';
import {
  navItemActive,
  navItemIdle,
  navItemNavbarActive,
  navItemNavbarIdle,
} from './nav-item-classes';

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

function isModuleActive(
  modulo: AuthMenuModulo,
  currentPath: string,
  shell: LayoutShellVariant
): boolean {
  for (const seccion of modulo.secciones ?? []) {
    for (const menu of seccion.menus ?? []) {
      if (menu.ruta) {
        const raw = menu.ruta.startsWith('/') ? menu.ruta : `/${menu.ruta}`;
        const mp = normalizeNavRoute(raw, shell) ?? raw;
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
  const shell = useLayoutShell();
  const { menuModulos } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  /** Módulo seleccionado con click — muestra su panel de menús debajo */
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  /** Posición left del dropdown, alineada con el botón de categoría clickeado */
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  const getMenusForModulo = useCallback(
    (modulo: AuthMenuModulo): AuthMenuItem[] => {
      const allMenus = (modulo.secciones ?? []).flatMap((s) => s.menus ?? []);
      const visibleMenus = allMenus.filter((m) => m.is_visible && m.is_enabled);

      return visibleMenus.filter((m) => isMenuVisibleForShell(m, modulo, shell));
    },
    [shell]
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

  const filteredModulos = useMemo(
    () => filterModulosForShell(menuModulos ?? [], shell),
    [menuModulos, shell],
  );

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
      const raw = ruta.startsWith('/') ? ruta : `/${ruta}`;
      const target = normalizeNavRoute(raw, shell) ?? raw;
      navigate(target);
      setOpenCategory(null);
      setSelectedModuleId(null);
    },
    [navigate, shell],
  );

  // ─── Categoría activa según ruta actual (independiente del estado de apertura) ──
  const activeCategoryKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const { key, modules } of categoryEntries) {
      if (modules.some((m) => isModuleActive(m, currentPath, shell))) {
        keys.add(key);
      }
    }
    return keys;
  }, [categoryEntries, currentPath, shell]);

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
      className="relative z-20 bg-brand-surface border-b border-brand-border flex-shrink-0"
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
                'text-sm',
                hasActive
                  ? navItemNavbarActive
                  : isOpen
                  ? `${navItemNavbarIdle} bg-brand-surface-secondary text-brand-text-primary`
                  : navItemNavbarIdle,
              ].join(' ')}
            >
              <Icon className="w-4 h-4 flex-shrink-0 text-inherit" />
              <span>{label}</span>
              <LucideIcons.ChevronDown
                className={`w-3.5 h-3.5 flex-shrink-0 text-inherit transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
          );
        })}
      </div>

      {/* ── Mega dropdown — flex-col: módulos arriba, menús abajo ────────── */}
      {openEntry && (
        <div
          className="absolute top-full z-50 bg-brand-surface border border-brand-border rounded-b-lg shadow-xl overflow-hidden"
          style={{ minWidth: 240, left: dropdownLeft }}
        >
          {/* Panel de módulos — columnas automáticas, compacto */}
          <div
            className="grid gap-0.5 p-2"
            style={{ gridTemplateColumns: `repeat(${getModuleColCount(openEntry.modules.length)}, max-content)` }}
          >
            {openEntry.modules.map((modulo) => {
              const active = isModuleActive(modulo, currentPath, shell);
              const selected = selectedModuleId === modulo.modulo_id;
              return (
                <button
                  key={modulo.modulo_id}
                  onClick={() => handleModuleClick(modulo)}
                  className={`
                    gap-2 text-left
                    ${active ? navItemActive : selected ? `${navItemIdle} bg-brand-surface-secondary` : navItemIdle}
                  `}
                >
                  <span className="flex-shrink-0 text-inherit">
                    {resolveIcon(modulo.icono, 'w-[18px] h-[18px]')}
                  </span>
                  <span className="text-[13px] whitespace-nowrap">{modulo.nombre}</span>
                  <LucideIcons.ChevronDown
                    className={`w-3.5 h-3.5 flex-shrink-0 text-inherit transition-transform duration-200 ${
                      selected ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Panel de menús — debajo de módulos, con separador visual */}
          {selectedModule && menuItems.length > 0 && (
            <>
              <div className="border-t border-brand-border" />
              <div className="bg-brand-surface-secondary/80 dark:bg-brand-surface-secondary/50 p-2">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-brand-text-secondary px-2 py-1">
                  {selectedModule.nombre}
                </div>
                <div
                  className="grid gap-0.5 mt-1"
                  style={{ gridTemplateColumns: `repeat(${getMenuColCount(menuItems.length)}, max-content)` }}
                >
                  {menuItems.map((item) => {
                    const ruta = item.ruta
                      ? normalizeNavRoute(
                          item.ruta.startsWith('/') ? item.ruta : `/${item.ruta}`,
                          shell
                        )
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
                          items-start gap-2 text-left
                          ${isItemActive ? navItemActive : navItemIdle}
                          ${!ruta ? 'opacity-40 cursor-default' : 'cursor-pointer'}
                        `}
                      >
                        <span className="mt-0.5 flex-shrink-0 text-inherit">
                          {resolveIcon(item.icono, 'w-4 h-4')}
                        </span>
                        <div>
                          <div className="whitespace-nowrap text-[13px]">{item.nombre}</div>
                          {item.descripcion && (
                            <div
                              className="text-[11px] text-brand-text-secondary mt-0.5"
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
