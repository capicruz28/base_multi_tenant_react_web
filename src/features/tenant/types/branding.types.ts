/**
 * Tipos TypeScript para el sistema de branding dinámico
 * Alineado con el schema BrandingRead del backend
 */

/**
 * Configuración avanzada de tema personalizado
 * Estructura flexible para permitir diferentes parámetros de UI
 */
export interface TemaPersonalizado {
  fontFamily?: string;
  borderRadius?: string;
  appName?: string; // Nombre de la aplicación
  spacing?: {
    small?: string;
    medium?: string;
    large?: string;
    [key: string]: string | undefined;
  };
  shadows?: {
    small?: string;
    medium?: string;
    large?: string;
    [key: string]: string | undefined;
  };
  colors?: {
    [key: string]: string; // Colores personalizados adicionales
  };
  [key: string]: any; // Permitir propiedades adicionales
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

