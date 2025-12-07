/**
 * Utilidad para sanitización HTML con DOMPurify
 * 
 * Esta utilidad previene ataques XSS al sanitizar HTML antes de renderizarlo.
 * 
 * @example
 * import { sanitizeHTML } from '@/core/utils/sanitize';
 * 
 * const htmlContent = '<div>User content</div><script>alert("XSS")</script>';
 * const safeHTML = sanitizeHTML(htmlContent);
 * 
 * // Usar con dangerouslySetInnerHTML
 * <div dangerouslySetInnerHTML={{ __html: safeHTML }} />
 */

// DOMPurify se importa directamente (ya está instalado)
import DOMPurify from 'dompurify';
import { useState, useEffect } from 'react';
import React from 'react';

/**
 * Configuración por defecto de DOMPurify
 * Whitelist estricta para permitir solo elementos seguros
 */
const defaultConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span', 'section', 'article',
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'alt', 'src', 'width', 'height', 'class', 'id',
    'target', 'rel', // Para enlaces
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
};

/**
 * Sanitiza HTML usando DOMPurify
 * 
 * @param html - HTML a sanitizar
 * @param config - Configuración personalizada (opcional)
 * @returns HTML sanitizado seguro
 */
export function sanitizeHTML(
  html: string,
  config?: Partial<typeof defaultConfig>
): string {
  const finalConfig = { ...defaultConfig, ...config };
  return DOMPurify.sanitize(html, finalConfig);
}

/**
 * Sanitiza HTML de forma síncrona (alias de sanitizeHTML)
 * 
 * @param html - HTML a sanitizar
 * @param config - Configuración personalizada (opcional)
 * @returns HTML sanitizado seguro
 */
export function sanitizeHTMLSync(
  html: string,
  config?: Partial<typeof defaultConfig>
): string {
  return sanitizeHTML(html, config);
}

/**
 * Hook de React para sanitizar HTML
 * 
 * @example
 * const { sanitizedHTML, isReady } = useSanitizeHTML(userContent);
 */
export function useSanitizeHTML(html: string | null | undefined) {
  const [sanitized, setSanitized] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!html) {
      setSanitized('');
      setIsReady(true);
      return;
    }

    try {
      const safe = sanitizeHTML(html);
      setSanitized(safe);
      setIsReady(true);
    } catch (error) {
      console.error('❌ [useSanitizeHTML] Error sanitizando HTML:', error);
      setSanitized(''); // Retornar vacío en caso de error
      setIsReady(true);
    }
  }, [html]);

  return { sanitizedHTML: sanitized, isReady };
}

/**
 * Componente helper para renderizar HTML sanitizado
 * 
 * @example
 * <SanitizedHTML html={userContent} />
 */
interface SanitizedHTMLProps {
  html: string | null | undefined;
  className?: string;
  fallback?: React.ReactNode;
}

export const SanitizedHTML: React.FC<SanitizedHTMLProps> = ({ 
  html, 
  className,
  fallback = null 
}) => {
  const { sanitizedHTML, isReady } = useSanitizeHTML(html);

  if (!isReady) {
    return <>{fallback}</>;
  }

  if (!sanitizedHTML) {
    return <>{fallback}</>;
  }

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }} 
    />
  );
};




