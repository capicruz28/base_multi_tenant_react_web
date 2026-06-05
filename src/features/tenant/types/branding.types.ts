/**
 * Tipos TypeScript para el sistema de branding dinámico
 * Alineado con el schema BrandingRead del backend
 */

/**
 * tema_personalizado — solo estos campos son contractuales en frontend.
 * (El backend puede devolver JSON con claves ignoradas.)
 */
export interface TemaPersonalizado {
  appName?: string;
  fonts?: {
    display?: string;
    body?: string;
    mono?: string;
  };
  shape?: {
    borderRadius?: string;
  };
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
