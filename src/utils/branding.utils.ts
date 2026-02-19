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
 * ✅ MEJORADO: Prioriza tema_personalizado.colors sobre color_primario/secundario
 */
export const applyBrandingColors = (branding: BrandingRead): void => {
  const root = document.documentElement;

  // ✅ NUEVO: Priorizar colores de tema_personalizado si existen
  // Si existe tema_personalizado.colors.blue, usarlo como primario
  // Si existe tema_personalizado.colors.navy, usarlo como secundario
  // Si no, usar color_primario y color_secundario como fallback
  
  let primaryColor = '#1976D2'; // Valor por defecto
  let secondaryColor = '#424242'; // Valor por defecto
  
  if (branding.tema_personalizado?.colors) {
    // Priorizar blue del tema_personalizado para primario
    if (branding.tema_personalizado.colors.blue && isValidHexColor(branding.tema_personalizado.colors.blue)) {
      primaryColor = branding.tema_personalizado.colors.blue;
    } else if (isValidHexColor(branding.color_primario)) {
      primaryColor = branding.color_primario;
    }
    
    // Priorizar navy del tema_personalizado para secundario
    if (branding.tema_personalizado.colors.navy && isValidHexColor(branding.tema_personalizado.colors.navy)) {
      secondaryColor = branding.tema_personalizado.colors.navy;
    } else if (isValidHexColor(branding.color_secundario)) {
      secondaryColor = branding.color_secundario;
    }
  } else {
    // Si no hay tema_personalizado, usar los campos directos
    primaryColor = isValidHexColor(branding.color_primario) 
      ? branding.color_primario 
      : '#1976D2';
    
    secondaryColor = isValidHexColor(branding.color_secundario) 
      ? branding.color_secundario 
      : '#424242';
  }
  
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
  
  // ✅ NUEVO: Si NO hay tema_personalizado, también establecer --caxis-blue con color_primario
  // Esto asegura que los componentes que usan bg-brand-primary (que usa --caxis-blue como fallback) funcionen
  if (!branding.tema_personalizado?.colors?.blue) {
    root.style.setProperty('--caxis-blue', primaryColor);
  }
  
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
  
  // ✅ NUEVO: Si NO hay tema_personalizado, también establecer --caxis-navy con color_secundario
  // Esto asegura que los componentes que usan bg-brand-secondary (que usa --caxis-navy como fallback) funcionen
  if (!branding.tema_personalizado?.colors?.navy) {
    root.style.setProperty('--caxis-navy', secondaryColor);
  }
  
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
  if (tema.fonts && typeof tema.fonts !== 'object') return false;
  if (tema.borderRadius && typeof tema.borderRadius !== 'string') return false;
  if (tema.spacing && typeof tema.spacing !== 'object') return false;
  if (tema.shadows && typeof tema.shadows !== 'object') return false;
  if (tema.colors && typeof tema.colors !== 'object') return false;
  if (tema.grays && typeof tema.grays !== 'object') return false;
  if (tema.gradients && typeof tema.gradients !== 'object') return false;
  
  return true;
};

/**
 * Aplica tema personalizado (fuente, border radius, etc.)
 * Con validación y generación de tokens derivados
 */
export const applyTemaPersonalizado = (tema: TemaPersonalizado | null): void => {
  const root = document.documentElement;
  
  if (!tema) {
    // Resetear a valores por defecto (los valores del design system se mantienen en CSS)
    root.style.removeProperty('--font-family');
    root.style.removeProperty('--font-display');
    root.style.removeProperty('--font-body');
    root.style.removeProperty('--font-mono');
    root.style.removeProperty('--border-radius');
    root.style.removeProperty('--app-name');
    document.body.style.fontFamily = '';
    
    // Limpiar spacing personalizado
    ['small', 'medium', 'large'].forEach(size => {
      root.style.removeProperty(`--spacing-${size}`);
    });
    
    // ✅ CORREGIDO: NO limpiar --caxis-blue y --caxis-navy cuando no hay tema_personalizado
    // Estos serán establecidos por applyBrandingColors con color_primario y color_secundario
    // Solo limpiar los otros colores de la paleta que fueron personalizados
    ['cyan', 'mint', 'slate', 'amber', 'red', 'green', 'indigo', 'purple', 'orange'].forEach(color => {
      root.style.removeProperty(`--caxis-${color}`);
    });
    
    // Limpiar grises personalizados
    ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', 'white', 'black'].forEach(gray => {
      root.style.removeProperty(`--caxis-gray-${gray}`);
    });
    
    // Limpiar gradientes personalizados
    ['primary', 'success', 'dark', 'subtle'].forEach(gradient => {
      root.style.removeProperty(`--gradient-${gradient}`);
    });
    
    // Limpiar sombras personalizadas
    ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', 'inner', 'focus-blue', 'focus-cyan', 'focus-red'].forEach(shadow => {
      root.style.removeProperty(`--shadow-${shadow}`);
    });
    
    return;
  }

  // Validar estructura del tema
  if (!validateTemaPersonalizado(tema)) {
    console.warn('⚠️ [Branding] Tema personalizado inválido, usando valores por defecto');
    return;
  }

  // ✅ NUEVO: Aplicar fuentes tipográficas estructuradas
  if (tema.fonts && typeof tema.fonts === 'object') {
    if (tema.fonts.display && typeof tema.fonts.display === 'string') {
      root.style.setProperty('--font-display', tema.fonts.display);
      if (import.meta.env.DEV) {
        console.log('✅ Fuente display aplicada:', tema.fonts.display);
      }
    }
    if (tema.fonts.body && typeof tema.fonts.body === 'string') {
      root.style.setProperty('--font-body', tema.fonts.body);
      root.style.setProperty('--font-family', tema.fonts.body); // Compatibilidad
      document.body.style.fontFamily = tema.fonts.body;
      if (import.meta.env.DEV) {
        console.log('✅ Fuente body aplicada:', tema.fonts.body);
      }
    }
    if (tema.fonts.mono && typeof tema.fonts.mono === 'string') {
      root.style.setProperty('--font-mono', tema.fonts.mono);
      if (import.meta.env.DEV) {
        console.log('✅ Fuente mono aplicada:', tema.fonts.mono);
      }
    }
  }
  
  // ✅ COMPATIBILIDAD: Aplicar fuente personalizada (retrocompatibilidad)
  if (tema.fontFamily && typeof tema.fontFamily === 'string' && !tema.fonts?.body) {
    root.style.setProperty('--font-family', tema.fontFamily);
    document.body.style.fontFamily = tema.fontFamily;
    if (import.meta.env.DEV) {
      console.log('✅ Fuente personalizada aplicada (legacy):', tema.fontFamily);
    }
  }

  // Aplicar border radius personalizado
  if (tema.borderRadius && typeof tema.borderRadius === 'string') {
    root.style.setProperty('--border-radius', tema.borderRadius);
    if (import.meta.env.DEV) {
      console.log('✅ Border radius personalizado aplicado:', tema.borderRadius);
    }
  }

  // Aplicar nombre de la aplicación
  if (tema.appName && typeof tema.appName === 'string') {
    root.style.setProperty('--app-name', tema.appName);
    document.title = tema.appName;
    if (import.meta.env.DEV) {
      console.log('✅ Nombre de aplicación aplicado:', tema.appName);
    }
  }

  // Aplicar spacing personalizado
  if (tema.spacing && typeof tema.spacing === 'object') {
    Object.entries(tema.spacing).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        root.style.setProperty(`--spacing-${key}`, value);
        if (import.meta.env.DEV) {
          console.log(`✅ Spacing ${key} aplicado:`, value);
        }
      }
    });
  }

  // Aplicar sombras personalizadas
  if (tema.shadows && typeof tema.shadows === 'object') {
    Object.entries(tema.shadows).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        root.style.setProperty(`--shadow-${key}`, value);
        if (import.meta.env.DEV) {
          console.log(`✅ Sombra ${key} aplicada:`, value);
        }
      }
    });
  }

  // ✅ MEJORADO: Aplicar colores de la paleta completa con prefijo caxis-
  // También actualizar --color-primary y --color-secondary para que los componentes los usen
  if (tema.colors && typeof tema.colors === 'object') {
    Object.entries(tema.colors).forEach(([key, value]) => {
      if (value && typeof value === 'string' && isValidHexColor(value)) {
        // Aplicar con prefijo caxis- para los colores de la paleta
        root.style.setProperty(`--caxis-${key}`, value);
        
        // ✅ NUEVO: Actualizar --color-primary y --color-secondary cuando se aplican blue y navy
        if (key === 'blue') {
          // Actualizar color primario y regenerar variaciones
          const primaryVariations = generateColorVariations(value, true);
          root.style.setProperty('--color-primary', value);
          root.style.setProperty('--color-primary-hsl', primaryVariations.base.hsl);
          if (primaryVariations.base.rgb) {
            root.style.setProperty('--color-primary-rgb', `${primaryVariations.base.rgb.r}, ${primaryVariations.base.rgb.g}, ${primaryVariations.base.rgb.b}`);
          }
          root.style.setProperty('--color-primary-hover-hsl', primaryVariations.hover.hsl);
          root.style.setProperty('--color-primary-active-hsl', primaryVariations.active.hsl);
          root.style.setProperty('--color-primary-light-hsl', primaryVariations.light.hsl);
          root.style.setProperty('--color-primary-dark-hsl', primaryVariations.dark.hsl);
          root.style.setProperty('--color-primary-dark-mode-hsl', primaryVariations.darkMode.hsl);
          if (primaryVariations.darkMode.rgb) {
            root.style.setProperty('--color-primary-dark-mode-rgb', `${primaryVariations.darkMode.rgb.r}, ${primaryVariations.darkMode.rgb.g}, ${primaryVariations.darkMode.rgb.b}`);
          }
        }
        
        if (key === 'navy') {
          // Actualizar color secundario y regenerar variaciones
          const secondaryVariations = generateColorVariations(value, false);
          root.style.setProperty('--color-secondary', value);
          root.style.setProperty('--color-secondary-hsl', secondaryVariations.base.hsl);
          if (secondaryVariations.base.rgb) {
            root.style.setProperty('--color-secondary-rgb', `${secondaryVariations.base.rgb.r}, ${secondaryVariations.base.rgb.g}, ${secondaryVariations.base.rgb.b}`);
          }
          root.style.setProperty('--color-secondary-hover-hsl', secondaryVariations.hover.hsl);
          root.style.setProperty('--color-secondary-active-hsl', secondaryVariations.active.hsl);
          root.style.setProperty('--color-secondary-light-hsl', secondaryVariations.light.hsl);
          root.style.setProperty('--color-secondary-dark-hsl', secondaryVariations.dark.hsl);
          root.style.setProperty('--color-secondary-dark-mode-hsl', secondaryVariations.darkMode.hsl);
          if (secondaryVariations.darkMode.rgb) {
            root.style.setProperty('--color-secondary-dark-mode-rgb', `${secondaryVariations.darkMode.rgb.r}, ${secondaryVariations.darkMode.rgb.g}, ${secondaryVariations.darkMode.rgb.b}`);
          }
        }
        
        // También mantener compatibilidad con --color- para colores personalizados adicionales
        if (!['navy', 'blue', 'cyan', 'mint', 'slate', 'amber', 'red', 'green', 'indigo', 'purple', 'orange'].includes(key)) {
          root.style.setProperty(`--color-${key}`, value);
        }
        if (import.meta.env.DEV) {
          console.log(`✅ Color ${key} aplicado:`, value);
        }
      }
    });
  }

  // ✅ NUEVO: Aplicar escala de grises personalizada
  if (tema.grays && typeof tema.grays === 'object') {
    Object.entries(tema.grays).forEach(([key, value]) => {
      if (value && typeof value === 'string' && isValidHexColor(value)) {
        root.style.setProperty(`--caxis-gray-${key}`, value);
        if (import.meta.env.DEV) {
          console.log(`✅ Gray ${key} aplicado:`, value);
        }
      }
    });
  }

  // ✅ NUEVO: Aplicar gradientes personalizados
  if (tema.gradients && typeof tema.gradients === 'object') {
    Object.entries(tema.gradients).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        root.style.setProperty(`--gradient-${key}`, value);
        if (import.meta.env.DEV) {
          console.log(`✅ Gradiente ${key} aplicado:`, value);
        }
      }
    });
  }

  // ✅ MEJORADO: Aplicar sombras mejoradas del design system
  if (tema.shadows && typeof tema.shadows === 'object') {
    Object.entries(tema.shadows).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        root.style.setProperty(`--shadow-${key}`, value);
        if (import.meta.env.DEV) {
          console.log(`✅ Sombra ${key} aplicada:`, value);
        }
      }
    });
  }

  // Aplicar otras propiedades personalizadas (genérico)
  Object.entries(tema).forEach(([key, value]) => {
    if (
      key !== 'fontFamily' &&
      key !== 'fonts' &&
      key !== 'borderRadius' &&
      key !== 'spacing' &&
      key !== 'shadows' &&
      key !== 'appName' &&
      key !== 'colors' &&
      key !== 'grays' &&
      key !== 'gradients' &&
      typeof value === 'string'
    ) {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--${cssKey}`, value);
      if (import.meta.env.DEV) {
        console.log(`✅ Propiedad personalizada ${key} aplicada:`, value);
      }
    }
  });
};

/**
 * Aplica todo el branding (colores, favicon, tema)
 * ✅ MEJORADO: Aplica tema_personalizado primero para que los colores se prioricen correctamente
 */
export const applyBranding = (branding: BrandingRead): void => {
  // ✅ IMPORTANTE: Aplicar tema_personalizado primero para que los colores de la paleta estén disponibles
  // Luego applyBrandingColors puede usar esos colores si existen
  applyTemaPersonalizado(branding.tema_personalizado);
  // Ahora aplicar colores de branding (que priorizará tema_personalizado si existe)
  applyBrandingColors(branding);
  updateFavicon(branding.favicon_url);
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

