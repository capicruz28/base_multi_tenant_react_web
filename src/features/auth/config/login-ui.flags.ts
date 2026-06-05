/**
 * Login — white-label contextual (cliente hero + "Powered by CAXIS").
 *
 * Revertir rápido:
 * - Poner `ENABLE_CONTEXTUAL_LOGIN_UI = false` aquí, o
 * - En `.env`: VITE_LOGIN_CONTEXTUAL_BRANDING=false
 */
export const ENABLE_CONTEXTUAL_LOGIN_UI =
  import.meta.env.VITE_LOGIN_CONTEXTUAL_BRANDING !== 'false';

/** Subdominio del shell de administración global (sin "Powered by"). */
export const PLATFORM_LOGIN_SUBDOMAIN = 'platform';
