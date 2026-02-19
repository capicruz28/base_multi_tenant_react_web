/**
 * Tipos TypeScript para el sistema de branding dinámico
 * Alineado con el schema BrandingRead del backend
 */

/**
 * Configuración avanzada de tema personalizado
 * Estructura flexible para permitir diferentes parámetros de UI
 */
export interface TemaPersonalizado {
  // ✅ NUEVO: Fuentes tipográficas estructuradas
  fonts?: {
    display?: string; // Fuente para títulos y elementos destacados
    body?: string;    // Fuente para texto general
    mono?: string;    // Fuente monoespaciada para código
  };
  // ✅ COMPATIBILIDAD: Mantener fontFamily para retrocompatibilidad
  fontFamily?: string;
  borderRadius?: string;
  appName?: string; // Nombre de la aplicación
  spacing?: {
    small?: string;
    medium?: string;
    large?: string;
    [key: string]: string | undefined;
  };
  /** Sombras: small/medium/large (legacy) y xs/sm/base/md/lg/xl/2xl/inner/focus-* (design system) */
  shadows?: {
    small?: string;
    medium?: string;
    large?: string;
    xs?: string;
    sm?: string;
    base?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
    inner?: string;
    'focus-blue'?: string;
    'focus-cyan'?: string;
    'focus-red'?: string;
    [key: string]: string | undefined;
  };
  colors?: {
    navy?: string;   // #0A1628 - Fondos oscuros, headers
    blue?: string;   // #1E56A0 - Primario: botones, links
    cyan?: string;   // #1FB6E8 - Hover, acentos
    mint?: string;   // #00D4AA - Success, métricas +
    slate?: string;  // #64748B - Textos secundarios, iconos
    amber?: string;  // #F59E0B - Warnings, alertas moderadas
    red?: string;    // #EF4444 - Errores, acciones destructivas
    green?: string;  // #10B981 - Confirmaciones, success
    indigo?: string; // #4F46E5 - Premium features, highlights
    purple?: string; // #8B5CF6 - Notificaciones especiales
    orange?: string; // #F97316 - En progreso, actualizaciones
    [key: string]: string | undefined; // Permitir colores adicionales
  };
  // ✅ NUEVO: Escala de grises personalizada
  grays?: {
    '50'?: string;
    '100'?: string;
    '200'?: string;
    '300'?: string;
    '400'?: string;
    '500'?: string;
    '600'?: string;
    '700'?: string;
    '800'?: string;
    '900'?: string;
    white?: string;
    black?: string;
    [key: string]: string | undefined;
  };
  gradients?: {
    primary?: string;
    success?: string;
    dark?: string;
    subtle?: string;
    [key: string]: string | undefined;
  };
  [key: string]: any;
}

/**
 * Respuesta del endpoint GET /tenant/branding
 * Alineado con BrandingRead del backend
 */
export interface BrandingRead {
  logo_url: string | null;
  favicon_url: string | null;
  color_primario: string; // HEX format (#RRGGBB)
  color_secundario: string; // HEX format (#RRGGBB)
  tema_personalizado: TemaPersonalizado | null;
}

/**
 * Estado del branding en el store
 * Incluye estado de carga y errores
 */
export interface BrandingState {
  branding: BrandingRead | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

