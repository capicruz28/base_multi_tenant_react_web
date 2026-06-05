// src/shared/components/layout/GlobalSearch.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLayoutShell } from './LayoutShellContext';
import { normalizeNavRoute } from './sidebar-menu.utils';
import { searchMenuItems } from '../../utils/menuSearch';
import type { MenuSearchResult } from '../../utils/menuSearch';
import {
  navItemActiveBg,
  navItemTextActive,
  navItemTextIdle,
  navItemTransition,
} from './nav-item-classes';

/** Layout de resultado: alineación izquierda (navItemBox usa items-center — no aplica aquí) */
const searchResultLayout =
  'box-border flex w-full min-h-10 items-start justify-start gap-2 px-3 py-2 rounded-md text-left relative';

const searchResultBar =
  'before:pointer-events-none before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[60%] before:w-[3px] before:rounded-r-sm before:bg-brand-primary before:z-10';

const searchResultIdle = `${navItemTransition} ${searchResultLayout} ${navItemTextIdle} hover:bg-brand-surface-secondary dark:hover:bg-brand-surface-secondary`;

const searchResultActive = `${navItemTransition} ${searchResultLayout} ${navItemActiveBg} ${navItemTextActive} font-semibold ${searchResultBar}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveIcon(
  iconName: string | null | undefined,
  className: string,
): React.ReactNode {
  if (!iconName) return <LucideIcons.LayoutGrid className={className} />;
  try {
    const normalized = iconName
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
    const Icon =
      (LucideIcons as Record<string, React.ElementType>)[normalized] ??
      (LucideIcons as Record<string, React.ElementType>)[iconName];
    return Icon ? (
      <Icon className={className} />
    ) : (
      <LucideIcons.LayoutGrid className={className} />
    );
  } catch {
    return <LucideIcons.LayoutGrid className={className} />;
  }
}

/** Envuelve la porción del texto que coincide con el query en un <mark> estilizado. */
function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-warning/10 text-warning rounded-sm px-0.5 not-italic font-inherit">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const GlobalSearch: React.FC = () => {
  const shell = useLayoutShell();
  const { menuModulos } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ─── Debounce 150ms ───────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(inputValue), 150);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // ─── Cerrar al navegar ────────────────────────────────────────────────────
  useEffect(() => {
    setIsOpen(false);
    setInputValue('');
    setDebouncedQuery('');
  }, [location.pathname]);

  // ─── Cerrar al hacer click fuera (incluye el portal del dropdown) ────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inInput = containerRef.current?.contains(target) ?? false;
      const inDropdown = dropdownRef.current?.contains(target) ?? false;
      if (!inInput && !inDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Ctrl+K / Cmd+K global ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ─── Resultados (memoizados) ──────────────────────────────────────────────
  const results: MenuSearchResult[] = useMemo(
    () => searchMenuItems(menuModulos ?? [], debouncedQuery, currentPath, shell),
    [menuModulos, debouncedQuery, currentPath, shell],
  );

  const totalItems = useMemo(
    () => results.reduce((acc, r) => acc + r.menus.length, 0),
    [results],
  );

  // ─── Posición fija del dropdown (evita restricciones de stacking context) ──
  const calculateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const dropdownWidth = 480;
    const leftPos = rect.left + rect.width / 2 - dropdownWidth / 2;
    const clampedLeft = Math.max(8, Math.min(leftPos, window.innerWidth - dropdownWidth - 8));
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: clampedLeft,
      width: dropdownWidth,
      zIndex: 99999,
    });
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      setIsOpen(true);
      calculateDropdownPosition();
    },
    [calculateDropdownPosition],
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setInputValue('');
        setDebouncedQuery('');
        setIsOpen(false);
        inputRef.current?.blur();
      }
    },
    [],
  );

  const handleClear = useCallback(() => {
    setInputValue('');
    setDebouncedQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  const handleItemClick = useCallback(
    (ruta: string) => {
      const raw = ruta.startsWith('/') ? ruta : `/${ruta}`;
      navigate(normalizeNavRoute(raw, shell) ?? raw);
      setIsOpen(false);
    },
    [navigate, shell],
  );

  const showDropdown = isOpen && debouncedQuery.trim().length > 0;
  const twoColumns = totalItems >= 5;

  return (
    <div ref={containerRef} className="relative">
      {/* ── Input ────────────────────────────────────────────────────────── */}
      <div className="relative flex items-center" style={{ width: 280 }}>
        <Search className="absolute left-2.5 w-3.5 h-3.5 text-brand-text-secondary pointer-events-none flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => {
            if (inputValue.trim()) {
              setIsOpen(true);
              calculateDropdownPosition();
            }
          }}
          placeholder="Buscar en el menú..."
          className="
            w-full h-8 pl-8 pr-16 text-sm rounded-lg
            bg-brand-surface-secondary/80 dark:bg-brand-surface-secondary
            border border-brand-border
            text-brand-text-primary
            placeholder:text-brand-text-secondary
            focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
            transition-colors duration-150
          "
        />

        {/* Botón limpiar o badge ⌘K */}
        {inputValue ? (
          <button
            onClick={handleClear}
            className="absolute right-2 flex items-center justify-center w-5 h-5 rounded hover:bg-brand-surface-secondary text-brand-text-secondary transition-colors"
            title="Limpiar (Esc)"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <span className="absolute right-2 flex items-center pointer-events-none">
            <kbd className="inline-flex items-center h-5 px-1.5 rounded text-[10px] font-medium bg-brand-surface-secondary text-brand-text-secondary border border-brand-border leading-none">
              ⌘K
            </kbd>
          </span>
        )}
      </div>

      {/* ── Dropdown — renderizado en document.body via portal ───────────── */}
      {showDropdown && createPortal(
        <div
          ref={dropdownRef}
          className="bg-brand-surface border border-brand-border rounded-lg shadow-xl overflow-hidden"
          style={{ ...dropdownStyle, maxHeight: '70vh' }}
        >
          {results.length === 0 ? (
            /* ── Sin resultados ─────────────────────────────────────────── */
            <div className="px-4 py-6 text-center">
              <Search className="w-6 h-6 mx-auto mb-2 text-brand-text-secondary opacity-70" />
              <p className="text-sm text-brand-text-secondary">
                Sin resultados para{' '}
                <span className="font-medium">"{debouncedQuery}"</span>
              </p>
            </div>
          ) : (
            /* ── Resultados ─────────────────────────────────────────────── */
            <div
              className={`grid overflow-y-auto ${twoColumns ? 'grid-cols-2' : 'grid-cols-1'}`}
              style={{ maxHeight: '70vh', scrollbarWidth: 'thin' }}
            >
              {results.map((result) => (
                <div
                  key={result.modulo.modulo_id}
                  className="min-w-0 border-b border-brand-border last:border-b-0"
                >
                  {/* Cabecera del módulo — no clickeable */}
                  <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1 sticky top-0 bg-brand-surface z-10">
                    <span className="text-brand-text-secondary flex-shrink-0">
                      {resolveIcon(result.modulo.icono, 'w-3 h-3')}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-text-secondary truncate">
                      {result.modulo.nombre}
                    </span>
                  </div>

                  {/* Ítems de menú coincidentes */}
                  {result.menus.map((menu) => (
                    <button
                      key={menu.menu_id}
                      onClick={() => menu.ruta && handleItemClick(menu.ruta)}
                      disabled={!menu.ruta}
                      className={[
                        menu.isActive ? searchResultActive : searchResultIdle,
                        !menu.ruta ? 'opacity-40 cursor-default' : 'cursor-pointer',
                      ].join(' ')}
                    >
                      <span className="mt-0.5 shrink-0 text-inherit">
                        {resolveIcon(menu.icono, 'w-4 h-4')}
                      </span>

                      <div className="min-w-0 flex-1 text-left">
                        <div className="text-[13px] leading-snug">
                          {highlightText(menu.nombre, debouncedQuery)}
                        </div>
                        {menu.descripcion && (
                          <div
                            className="text-[11px] text-brand-text-secondary mt-0.5"
                            style={{
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              lineHeight: '1.4',
                            }}
                          >
                            {highlightText(menu.descripcion, debouncedQuery)}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
};

export default GlobalSearch;
