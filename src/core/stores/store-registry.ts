/**
 * Store Registry - Sistema centralizado para registro y reset de stores
 * 
 * Este registry permite registrar stores Zustand (o cualquier store) y resetearlos
 * automáticamente cuando cambia el tenant. Facilita el aislamiento de datos
 * entre tenants y la escalabilidad del sistema.
 * 
 * Uso:
 * ```typescript
 * // Registrar un store
 * storeRegistry.register('branding', (tenantId) => {
 *   useBrandingStore.getState().resetBranding(tenantId);
 * });
 * 
 * // Resetear todos los stores
 * storeRegistry.resetAll(tenantId);
 * ```
 */

export type StoreResetFunction = (tenantId: string | null) => void;

interface StoreEntry {
  name: string;
  resetFn: StoreResetFunction;
  description?: string;
}

/**
 * Registry centralizado para stores
 * Permite registrar stores y resetearlos cuando cambia el tenant
 */
class StoreRegistry {
  private stores: Map<string, StoreEntry> = new Map();
  private resetHistory: Array<{ tenantId: string | null; timestamp: number; stores: string[] }> = [];

  /**
   * Registra un store en el registry
   * 
   * @param name - Nombre único del store
   * @param resetFn - Función que resetea el store para un tenant específico
   * @param description - Descripción opcional del store
   */
  register(name: string, resetFn: StoreResetFunction, description?: string): void {
    if (this.stores.has(name)) {
      console.warn(`⚠️ [StoreRegistry] Store "${name}" ya está registrado, sobrescribiendo...`);
    }

    this.stores.set(name, {
      name,
      resetFn,
      description,
    });

    // Solo log en desarrollo
    if (import.meta.env.DEV) {
      console.log(`✅ [StoreRegistry] Store "${name}" registrado${description ? `: ${description}` : ''}`);
    }
  }

  /**
   * Desregistra un store del registry
   * 
   * @param name - Nombre del store a desregistrar
   */
  unregister(name: string): void {
    if (this.stores.delete(name)) {
      // Solo log en desarrollo
      if (import.meta.env.DEV) {
        console.log(`✅ [StoreRegistry] Store "${name}" desregistrado`);
      }
    } else {
      console.warn(`⚠️ [StoreRegistry] Store "${name}" no está registrado`);
    }
  }

  /**
   * Resetea un store específico
   * 
   * @param name - Nombre del store a resetear
   * @param tenantId - ID del tenant (null para resetear todo)
   */
  reset(name: string, tenantId: string | null): void {
    const entry = this.stores.get(name);
    if (!entry) {
      console.warn(`⚠️ [StoreRegistry] Store "${name}" no está registrado`);
      return;
    }

    try {
      console.log(`🔄 [StoreRegistry] Reseteando store "${name}" para tenant: ${tenantId || 'null'}`);
      entry.resetFn(tenantId);
      console.log(`✅ [StoreRegistry] Store "${name}" reseteado`);
    } catch (error) {
      console.error(`❌ [StoreRegistry] Error al resetear store "${name}":`, error);
    }
  }

  /**
   * Resetea todos los stores registrados
   * 
   * @param tenantId - ID del tenant (null para resetear todo)
   */
  resetAll(tenantId: string | null): void {
    const storeNames = Array.from(this.stores.keys());
    
    if (storeNames.length === 0) {
      console.log('ℹ️ [StoreRegistry] No hay stores registrados para resetear');
      return;
    }

    console.log(`🔄 [StoreRegistry] Reseteando ${storeNames.length} store(s) para tenant: ${tenantId || 'null'}`);
    console.log(`📋 [StoreRegistry] Stores a resetear: ${storeNames.join(', ')}`);

    const startTime = Date.now();
    const resetStores: string[] = [];

    storeNames.forEach(name => {
      try {
        const entry = this.stores.get(name);
        if (entry) {
          entry.resetFn(tenantId);
          resetStores.push(name);
        }
      } catch (error) {
        console.error(`❌ [StoreRegistry] Error al resetear store "${name}":`, error);
      }
    });

    const duration = Date.now() - startTime;

    // Registrar en historial
    this.resetHistory.push({
      tenantId,
      timestamp: Date.now(),
      stores: resetStores,
    });

    // Mantener solo los últimos 50 resets en el historial
    if (this.resetHistory.length > 50) {
      this.resetHistory.shift();
    }

    console.log(`✅ [StoreRegistry] ${resetStores.length} store(s) reseteado(s) en ${duration}ms`);
  }

  /**
   * Limpia todos los stores (útil para logout)
   * Equivalente a resetAll(null) pero más explícito
   */
  clearAll(): void {
    console.log('🧹 [StoreRegistry] Limpiando todos los stores...');
    this.resetAll(null);
  }

  /**
   * Obtiene la lista de stores registrados
   */
  getRegisteredStores(): string[] {
    return Array.from(this.stores.keys());
  }

  /**
   * Obtiene información de un store registrado
   */
  getStoreInfo(name: string): StoreEntry | undefined {
    return this.stores.get(name);
  }

  /**
   * Obtiene el historial de resets (útil para debugging)
   */
  getResetHistory(): Array<{ tenantId: string | null; timestamp: number; stores: string[] }> {
    return [...this.resetHistory];
  }

  /**
   * Limpia el historial de resets
   */
  clearHistory(): void {
    this.resetHistory = [];
    console.log('🧹 [StoreRegistry] Historial de resets limpiado');
  }

  /**
   * Verifica si un store está registrado
   */
  isRegistered(name: string): boolean {
    return this.stores.has(name);
  }

  /**
   * Obtiene el número de stores registrados
   */
  getCount(): number {
    return this.stores.size;
  }
}

/**
 * Instancia singleton del Store Registry
 */
export const storeRegistry = new StoreRegistry();


