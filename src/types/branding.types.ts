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
    navy?: string;
    blue?: string;
    cyan?: string;
    mint?: string;
    slate?: string;
    amber?: string;
    red?: string;
    green?: string;
    indigo?: string;
    purple?: string;
    orange?: string;
    [key: string]: string | undefined;
  };
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

