/**
 * Tenant Store Sync - Sincronización de cambios de tenant entre pestañas
 * 
 * Usa BroadcastChannel API para sincronizar cambios de tenant entre múltiples
 * pestañas del mismo origen. Cuando un usuario cambia de tenant en una pestaña,
 * todas las demás pestañas se actualizan automáticamente.
 * 
 * Uso:
 * ```typescript
 * // Escuchar cambios de tenant
 * tenantStoreSync.onTenantChange((tenantId) => {
 *   // Resetear stores, invalidar caché, etc.
 * });
 * 
 * // Notificar cambio de tenant
 * tenantStoreSync.notifyTenantChange(tenantId);
 * ```
 */

type TenantChangeCallback = (tenantId: string | null) => void;

/**
 * Servicio de sincronización de tenant entre pestañas
 */
class TenantStoreSync {
  private channel: BroadcastChannel | null = null;
  private callbacks: Set<TenantChangeCallback> = new Set();
  private currentTenantId: string | null = null;
  private readonly CHANNEL_NAME = 'tenant-sync';

  constructor() {
    // Verificar si BroadcastChannel está disponible
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(this.CHANNEL_NAME);
        this.setupListener();
        // Solo log en desarrollo
        if (import.meta.env.DEV) {
          console.log('✅ [TenantStoreSync] BroadcastChannel inicializado');
        }
      } catch (error) {
        console.warn('⚠️ [TenantStoreSync] Error al inicializar BroadcastChannel:', error);
      }
    } else {
      console.warn('⚠️ [TenantStoreSync] BroadcastChannel no está disponible en este navegador');
    }
  }

  /**
   * Configura el listener para recibir mensajes de otras pestañas
   */
  private setupListener(): void {
    if (!this.channel) return;

    this.channel.onmessage = (event: MessageEvent) => {
      const { type, tenantId } = event.data;

      if (type === 'tenant-changed') {
        // Ignorar si es el mismo tenant (evitar loops)
        if (tenantId === this.currentTenantId) {
          return;
        }

        console.log(`🔄 [TenantStoreSync] Cambio de tenant detectado desde otra pestaña: ${tenantId || 'null'}`);
        
        this.currentTenantId = tenantId;
        
        // Notificar a todos los callbacks
        this.callbacks.forEach(callback => {
          try {
            callback(tenantId);
          } catch (error) {
            console.error('❌ [TenantStoreSync] Error en callback:', error);
          }
        });
      }
    };
  }

  /**
   * Registra un callback que se ejecutará cuando cambie el tenant en otra pestaña
   * 
   * @param callback - Función a ejecutar cuando cambie el tenant
   * @returns Función para desregistrar el callback
   */
  onTenantChange(callback: TenantChangeCallback): () => void {
    this.callbacks.add(callback);
    
    // Solo log en desarrollo
    if (import.meta.env.DEV) {
      console.log(`✅ [TenantStoreSync] Callback registrado. Total: ${this.callbacks.size}`);
    }

    // Retornar función para desregistrar
    return () => {
      this.callbacks.delete(callback);
      // Solo log en desarrollo
      if (import.meta.env.DEV) {
        console.log(`✅ [TenantStoreSync] Callback desregistrado. Total: ${this.callbacks.size}`);
      }
    };
  }

  /**
   * Notifica a todas las pestañas que el tenant ha cambiado
   * 
   * @param tenantId - ID del nuevo tenant (null para logout)
   */
  notifyTenantChange(tenantId: string | null): void {
    if (!this.channel) {
      console.warn('⚠️ [TenantStoreSync] BroadcastChannel no disponible, no se puede notificar');
      return;
    }

    // Actualizar tenant actual
    this.currentTenantId = tenantId;

    try {
      this.channel.postMessage({
        type: 'tenant-changed',
        tenantId,
        timestamp: Date.now(),
      });

      console.log(`📢 [TenantStoreSync] Cambio de tenant notificado: ${tenantId || 'null'}`);
    } catch (error) {
      console.error('❌ [TenantStoreSync] Error al notificar cambio de tenant:', error);
    }
  }

  /**
   * Obtiene el tenant actual (último conocido)
   */
  getCurrentTenantId(): string | null {
    return this.currentTenantId;
  }

  /**
   * Limpia todos los callbacks y cierra el canal
   */
  cleanup(): void {
    this.callbacks.clear();
    
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    console.log('🧹 [TenantStoreSync] Limpiado');
  }

  /**
   * Verifica si la sincronización está disponible
   */
  isAvailable(): boolean {
    return this.channel !== null;
  }
}

/**
 * Instancia singleton del Tenant Store Sync
 */
export const tenantStoreSync = new TenantStoreSync();


