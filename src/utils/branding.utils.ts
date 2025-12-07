/**
 * Utilidades para aplicar branding dinámico
 * Actualiza CSS variables, favicon y tema personalizado
 */
import { BrandingRead, TemaPersonalizado } from '../types/branding.types';

/**
 * Convierte color HEX a RGB
 * Útil para aplicar transparencias
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Convierte color HEX a HSL
 * Útil para compatibilidad con variables CSS de shadcn/ui
 */
export const hexToHsl = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '0 0% 50%';

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lightness = Math.round(l * 100);

  return `${h} ${s}% ${lightness}%`;
};

/**
 * Valida formato HEX de color
 */
export const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

/**
 * Ajusta la luminosidad de un color HSL
 * @param hslString - String HSL en formato "H S% L%"
 * @param lightnessDelta - Cambio de luminosidad (-100 a 100)
 * @returns String HSL ajustado
 */
const adjustLightness = (hslString: string, lightnessDelta: number): string => {
  const match = hslString.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!match) return hslString;
  
  const h = match[1];
  const s = match[2];
  let l = parseInt(match[3]);
  
  l = Math.max(0, Math.min(100, l + lightnessDelta));
  
  return `${h} ${s}% ${l}%`;
};

/**
 * Genera variaciones de color para dark mode
 * Aclara el color para mejor contraste en fondos oscuros
 */
const generateDarkModeColor = (hex: string): string => {
  const hsl = hexToHsl(hex);
  // Aclarar el color para dark mode (aumentar luminosidad)
  return adjustLightness(hsl, 30);
};

/**
 * Genera variaciones de color (hover, active, light, dark)
 */
const generateColorVariations = (hex: string, isPrimary: boolean = true) => {
  const hsl = hexToHsl(hex);
  const rgb = hexToRgb(hex);
  
  // Para hover: oscurecer ligeramente (disminuir luminosidad)
  const hoverHSL = adjustLightness(hsl, isPrimary ? -5 : -3);
  
  // Para active: oscurecer más
  const activeHSL = adjustLightness(hsl, isPrimary ? -10 : -5);
  
  // Para light: aclarar significativamente (backgrounds suaves)
  const lightHSL = adjustLightness(hsl, isPrimary ? 40 : 30);
  
  // Para dark: oscurecer significativamente (textos sobre fondos claros)
  const darkHSL = adjustLightness(hsl, isPrimary ? -20 : -15);
  
  // Para dark mode: aclarar para mejor contraste
  const darkModeHSL = generateDarkModeColor(hex);
  const darkModeRGB = hexToRgb(hex); // Usar mismo RGB base, la variación se hace en HSL
  
  return {
    base: { hex, hsl, rgb },
    hover: { hsl: hoverHSL },
    active: { hsl: activeHSL },
    light: { hsl: lightHSL },
    dark: { hsl: darkHSL },
    darkMode: { hsl: darkModeHSL, rgb: darkModeRGB },
  };
};

/**
 * Aplica los colores de branding como variables CSS con tokens derivados
 */
export const applyBrandingColors = (branding: BrandingRead): void => {
  const root = document.documentElement;

  // Validar y aplicar color primario
  const primaryColor = isValidHexColor(branding.color_primario) 
    ? branding.color_primario 
    : '#1976D2';
  
  // Validar y aplicar color secundario
  const secondaryColor = isValidHexColor(branding.color_secundario) 
    ? branding.color_secundario 
    : '#424242';
  
  // Generar variaciones de colores
  const primaryVariations = generateColorVariations(primaryColor, true);
  const secondaryVariations = generateColorVariations(secondaryColor, false);
  
  // ===== TOKENS PRIMARIOS =====
  root.style.setProperty('--color-primary', primaryColor);
  root.style.setProperty('--color-primary-hsl', primaryVariations.base.hsl);
  if (primaryVariations.base.rgb) {
    root.style.setProperty('--color-primary-rgb', `${primaryVariations.base.rgb.r}, ${primaryVariations.base.rgb.g}, ${primaryVariations.base.rgb.b}`);
  }
  
  // Variaciones primario
  root.style.setProperty('--color-primary-hover-hsl', primaryVariations.hover.hsl);
  root.style.setProperty('--color-primary-active-hsl', primaryVariations.active.hsl);
  root.style.setProperty('--color-primary-light-hsl', primaryVariations.light.hsl);
  root.style.setProperty('--color-primary-dark-hsl', primaryVariations.dark.hsl);
  
  // ===== TOKENS SECUNDARIOS =====
  root.style.setProperty('--color-secondary', secondaryColor);
  root.style.setProperty('--color-secondary-hsl', secondaryVariations.base.hsl);
  if (secondaryVariations.base.rgb) {
    root.style.setProperty('--color-secondary-rgb', `${secondaryVariations.base.rgb.r}, ${secondaryVariations.base.rgb.g}, ${secondaryVariations.base.rgb.b}`);
  }
  
  // Variaciones secundario
  root.style.setProperty('--color-secondary-hover-hsl', secondaryVariations.hover.hsl);
  root.style.setProperty('--color-secondary-active-hsl', secondaryVariations.active.hsl);
  root.style.setProperty('--color-secondary-light-hsl', secondaryVariations.light.hsl);
  root.style.setProperty('--color-secondary-dark-hsl', secondaryVariations.dark.hsl);
  
  // ===== TOKENS PARA DARK MODE =====
  // Estos se aplicarán cuando exista la clase .dark
  root.style.setProperty('--color-primary-dark-mode-hsl', primaryVariations.darkMode.hsl);
  if (primaryVariations.darkMode.rgb) {
    root.style.setProperty('--color-primary-dark-mode-rgb', `${primaryVariations.darkMode.rgb.r}, ${primaryVariations.darkMode.rgb.g}, ${primaryVariations.darkMode.rgb.b}`);
  }
  
  root.style.setProperty('--color-secondary-dark-mode-hsl', secondaryVariations.darkMode.hsl);
  if (secondaryVariations.darkMode.rgb) {
    root.style.setProperty('--color-secondary-dark-mode-rgb', `${secondaryVariations.darkMode.rgb.r}, ${secondaryVariations.darkMode.rgb.g}, ${secondaryVariations.darkMode.rgb.b}`);
  }

  // Solo log en desarrollo
  if (import.meta.env.DEV) {
    console.log('✅ Colores de branding aplicados:', {
      primary: primaryColor,
      secondary: secondaryColor,
    });
  }
};

/**
 * Actualiza el favicon dinámicamente
 */
export const updateFavicon = (faviconUrl: string | null): void => {
  const linkId = 'favicon-link';
  let link = document.getElementById(linkId) as HTMLLinkElement;

  // Crear link si no existe
  if (!link) {
    link = document.createElement('link');
    link.id = linkId;
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  if (faviconUrl) {
    // Determinar tipo de imagen según extensión
    const extension = faviconUrl.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      svg: 'image/svg+xml',
      ico: 'image/x-icon',
    };

    link.href = faviconUrl;
    link.type = typeMap[extension || ''] || 'image/png';
    
    // Solo log en desarrollo
    if (import.meta.env.DEV) {
      console.log('✅ Favicon actualizado:', faviconUrl);
    }
  } else {
    // Fallback a favicon por defecto
    link.href = '/vite.svg';
    link.type = 'image/svg+xml';
    // Solo log en desarrollo
    if (import.meta.env.DEV) {
      console.log('✅ Favicon restaurado a valor por defecto');
    }
  }
};


/**
 * Valida la estructura del tema personalizado
 */
const validateTemaPersonalizado = (tema: any): tema is TemaPersonalizado => {
  if (!tema || typeof tema !== 'object') return false;
  
  // Validar tipos básicos
  if (tema.fontFamily && typeof tema.fontFamily !== 'string') return false;
  if (tema.borderRadius && typeof tema.borderRadius !== 'string') return false;
  if (tema.spacing && typeof tema.spacing !== 'object') return false;
  if (tema.shadows && typeof tema.shadows !== 'object') return false;
  
  return true;
};

/**
 * Aplica tema personalizado (fuente, border radius, etc.)
 * Con validación y generación de tokens derivados
 */
export const applyTemaPersonalizado = (tema: TemaPersonalizado | null): void => {
  const root = document.documentElement;
  
  if (!tema) {
    // Resetear a valores por defecto
    root.style.removeProperty('--font-family');
    root.style.removeProperty('--border-radius');
    root.style.removeProperty('--app-name');
    document.body.style.fontFamily = '';
    
    // Limpiar spacing y shadows
    ['small', 'medium', 'large'].forEach(size => {
      root.style.removeProperty(`--spacing-${size}`);
      root.style.removeProperty(`--shadow-${size}`);
    });
    
    return;
  }

  // Validar estructura del tema
  if (!validateTemaPersonalizado(tema)) {
    console.warn('⚠️ [Branding] Tema personalizado inválido, usando valores por defecto');
    return;
  }

  // Aplicar fuente personalizada
  if (tema.fontFamily && typeof tema.fontFamily === 'string') {
    root.style.setProperty('--font-family', tema.fontFamily);
    document.body.style.fontFamily = tema.fontFamily;
    console.log('✅ Fuente personalizada aplicada:', tema.fontFamily);
  }

  // Aplicar border radius personalizado
  if (tema.borderRadius && typeof tema.borderRadius === 'string') {
    root.style.setProperty('--border-radius', tema.borderRadius);
    console.log('✅ Border radius personalizado aplicado:', tema.borderRadius);
  }

  // Aplicar nombre de la aplicación
  if (tema.appName && typeof tema.appName === 'string') {
    root.style.setProperty('--app-name', tema.appName);
    document.title = tema.appName;
    console.log('✅ Nombre de aplicación aplicado:', tema.appName);
  }

  // Aplicar spacing personalizado
  if (tema.spacing && typeof tema.spacing === 'object') {
    Object.entries(tema.spacing).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        root.style.setProperty(`--spacing-${key}`, value);
        console.log(`✅ Spacing ${key} aplicado:`, value);
      }
    });
  }

  // Aplicar sombras personalizadas
  if (tema.shadows && typeof tema.shadows === 'object') {
    Object.entries(tema.shadows).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        root.style.setProperty(`--shadow-${key}`, value);
        console.log(`✅ Sombra ${key} aplicada:`, value);
      }
    });
  }

  // Aplicar colores personalizados adicionales (si existen)
  if (tema.colors && typeof tema.colors === 'object') {
    Object.entries(tema.colors).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        root.style.setProperty(`--color-${key}`, value);
        console.log(`✅ Color personalizado ${key} aplicado:`, value);
      }
    });
  }

  // Aplicar otras propiedades personalizadas (genérico)
  Object.entries(tema).forEach(([key, value]) => {
    if (
      key !== 'fontFamily' &&
      key !== 'borderRadius' &&
      key !== 'spacing' &&
      key !== 'shadows' &&
      key !== 'appName' &&
      key !== 'colors' &&
      typeof value === 'string'
    ) {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--${cssKey}`, value);
      console.log(`✅ Propiedad personalizada ${key} aplicada:`, value);
    }
  });
};

/**
 * Aplica todo el branding (colores, favicon, tema)
 */
export const applyBranding = (branding: BrandingRead): void => {
  applyBrandingColors(branding);
  updateFavicon(branding.favicon_url);
  applyTemaPersonalizado(branding.tema_personalizado);
};

/**
 * Resetea el branding a valores por defecto
 */
export const resetBranding = (): void => {
  // Resetear colores base
  const defaultPrimary = '#1976D2';
  const defaultSecondary = '#424242';
  
  // Aplicar branding con valores por defecto para regenerar todos los tokens
  const defaultBranding: BrandingRead = {
    logo_url: null,
    favicon_url: null,
    color_primario: defaultPrimary,
    color_secundario: defaultSecondary,
    tema_personalizado: null,
  };
  
  applyBrandingColors(defaultBranding);
  
  // Resetear favicon
  updateFavicon(null);
  
  // Resetear tema personalizado
  applyTemaPersonalizado(null);
  
  // Solo log en desarrollo
  if (import.meta.env.DEV) {
    console.log('✅ Branding reseteado a valores por defecto');
  }
};

