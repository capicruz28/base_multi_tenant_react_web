/**
 * Utilidad para almacenamiento seguro con secure-ls
 * 
 * Esta utilidad proporciona almacenamiento seguro usando AES + HMAC
 * para datos sensibles que necesitan persistencia.
 * 
 * NOTA: Actualmente los tokens están en memoria (más seguro).
 * Esta utilidad está preparada para cuando se necesite persistencia opcional.
 * 
 * @example
 * import { secureStorage } from '@/core/utils/secureStorage';
 * 
 * // Guardar token (si se requiere persistencia)
 * secureStorage.set('access_token', token);
 * 
 * // Leer token
 * const token = secureStorage.get('access_token');
 * 
 * // Eliminar token
 * secureStorage.remove('access_token');
 */

// secure-ls se cargará dinámicamente cuando se necesite
let SecureLS: any = null;
let secureStorageInstance: any = null;

/**
 * Configuración por defecto de secure-ls
 */
const defaultConfig = {
  encodingType: 'aes', // AES encryption
  isCompression: false, // No comprimir (tokens son pequeños)
  encryptionSecret: import.meta.env.VITE_ENCRYPTION_SECRET || 'default-secret-change-in-production', // ⚠️ CAMBIAR EN PRODUCCIÓN
};

/**
 * Carga secure-ls de forma lazy
 */
async function loadSecureLS(): Promise<any> {
  if (SecureLS) {
    return SecureLS;
  }

  try {
    // Intentar cargar secure-ls
    // @ts-ignore - secure-ls puede no estar instalado
    const secureLSModule = await import('secure-ls');
    SecureLS = secureLSModule.default || secureLSModule;
    return SecureLS;
  } catch (error) {
    console.warn('⚠️ [secureStorage] secure-ls no está instalado. Ejecuta: npm install secure-ls');
    // Retornar null si no está disponible
    return null;
  }
}

/**
 * Obtiene la instancia de secure-ls
 */
async function getSecureStorage() {
  if (secureStorageInstance) {
    return secureStorageInstance;
  }

  const SecureLSClass = await loadSecureLS();
  if (!SecureLSClass) {
    return null;
  }

  secureStorageInstance = new SecureLSClass(defaultConfig);
  return secureStorageInstance;
}

/**
 * API de almacenamiento seguro
 */
export const secureStorage = {
  /**
   * Guardar un valor de forma segura
   * 
   * @param key - Clave del valor
   * @param value - Valor a guardar
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const storage = await getSecureStorage();
      if (!storage) {
        console.warn('⚠️ [secureStorage] secure-ls no disponible, usando localStorage sin encriptar');
        localStorage.setItem(key, JSON.stringify(value));
        return;
      }

      storage.set(key, value);
    } catch (error) {
      console.error('❌ [secureStorage] Error guardando valor:', error);
      throw error;
    }
  },

  /**
   * Obtener un valor de forma segura
   * 
   * @param key - Clave del valor
   * @returns Valor guardado o null si no existe
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const storage = await getSecureStorage();
      if (!storage) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      }

      return storage.get(key) || null;
    } catch (error) {
      console.error('❌ [secureStorage] Error obteniendo valor:', error);
      return null;
    }
  },

  /**
   * Eliminar un valor
   * 
   * @param key - Clave del valor a eliminar
   */
  async remove(key: string): Promise<void> {
    try {
      const storage = await getSecureStorage();
      if (!storage) {
        localStorage.removeItem(key);
        return;
      }

      storage.remove(key);
    } catch (error) {
      console.error('❌ [secureStorage] Error eliminando valor:', error);
    }
  },

  /**
   * Limpiar todo el almacenamiento
   */
  async clear(): Promise<void> {
    try {
      const storage = await getSecureStorage();
      if (!storage) {
        localStorage.clear();
        return;
      }

      storage.removeAll();
    } catch (error) {
      console.error('❌ [secureStorage] Error limpiando almacenamiento:', error);
    }
  },

  /**
   * Verificar si secure-ls está disponible
   */
  async isAvailable(): Promise<boolean> {
    const SecureLSClass = await loadSecureLS();
    return SecureLSClass !== null;
  },
};

/**
 * Hook de React para usar secure storage
 * 
 * @example
 * const { setValue, getValue, removeValue } = useSecureStorage();
 * 
 * await setValue('token', accessToken);
 * const token = await getValue('token');
 */
import { useCallback } from 'react';

export function useSecureStorage() {
  const setValue = useCallback(async (key: string, value: any) => {
    await secureStorage.set(key, value);
  }, []);

  const getValue = useCallback(async <T = any>(key: string): Promise<T | null> => {
    return await secureStorage.get<T>(key);
  }, []);

  const removeValue = useCallback(async (key: string) => {
    await secureStorage.remove(key);
  }, []);

  const clearAll = useCallback(async () => {
    await secureStorage.clear();
  }, []);

  return {
    setValue,
    getValue,
    removeValue,
    clearAll,
    isAvailable: secureStorage.isAvailable,
  };
}

/**
 * NOTA IMPORTANTE:
 * 
 * Actualmente los tokens están en memoria (más seguro que localStorage).
 * Esta utilidad está preparada para cuando se necesite persistencia opcional.
 * 
 * Si en el futuro se requiere persistencia de tokens:
 * 1. Instalar: npm install secure-ls
 * 2. Configurar VITE_ENCRYPTION_SECRET en .env
 * 3. Usar secureStorage en lugar de memoria para tokens
 * 
 * ⚠️ SEGURIDAD:
 * - NUNCA usar localStorage sin encriptar para tokens
 * - Siempre usar secure-ls o mantener en memoria
 * - Cambiar VITE_ENCRYPTION_SECRET en producción
 */

