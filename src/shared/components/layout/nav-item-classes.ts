/**
 * Estilos de ítems de navegación (Sidebar, Navbar, GlobalSearch).
 * Fondo activo: .nav-item-active-bg → rgba(var(--color-primary-rgb), 0.12)
 * Texto activo: text-brand-primary (token de branding dinámico).
 */

export const navItemTransition = 'transition-colors duration-200 ease-in-out';

/** Caja sidebar: mismo padding y altura en activo e inactivo */
export const navItemBox =
  'box-border flex items-center min-h-10 px-3 py-2 rounded-lg w-full relative';

/** Caja navbar (barra superior / dropdown) */
export const navItemNavbarBox =
  'box-border flex items-center gap-1.5 px-3 py-1.5 rounded-md flex-shrink-0 whitespace-nowrap relative';

/** Fondo activo — definido en index.css con --color-primary-rgb */
export const navItemActiveBg = 'nav-item-active-bg';

export const navItemTextActive = 'text-brand-primary [&_svg]:opacity-100';
export const navItemTextIdle = 'text-brand-text-secondary';

export const navItemIdle =
  `${navItemTransition} ${navItemBox} ${navItemTextIdle} hover:bg-brand-surface-secondary dark:hover:bg-brand-surface-secondary`;

export const navItemActive =
  `${navItemTransition} ${navItemBox} ${navItemActiveBg} ${navItemTextActive} font-semibold`;

export const navItemActiveBar =
  `${navItemActive} before:pointer-events-none before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[60%] before:w-[3px] before:rounded-r-sm before:bg-brand-primary before:z-10`;

export const navItemParentActive =
  `${navItemTransition} ${navItemBox} ${navItemActiveBg} ${navItemTextActive} font-semibold hover:bg-brand-surface-secondary dark:hover:bg-brand-surface-secondary`;

export const navItemExpandBtn =
  'box-border flex items-center justify-center min-h-10 w-9 flex-shrink-0 rounded-lg p-2';

export const navItemExpandIdle =
  `${navItemTransition} ${navItemExpandBtn} ${navItemTextIdle} hover:bg-brand-surface-secondary dark:hover:bg-brand-surface-secondary`;

export const navItemExpandActive =
  `${navItemTransition} ${navItemExpandBtn} ${navItemActiveBg} ${navItemTextActive} font-semibold`;

export const navItemNavbarIdle =
  `${navItemTransition} ${navItemNavbarBox} ${navItemTextIdle} hover:bg-brand-surface-secondary dark:hover:bg-brand-surface-secondary`;

export const navItemNavbarActive =
  `${navItemTransition} ${navItemNavbarBox} ${navItemActiveBg} ${navItemTextActive} font-semibold`;
