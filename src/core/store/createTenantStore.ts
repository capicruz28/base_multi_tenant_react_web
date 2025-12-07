/**
 * Factory para crear stores con auto-registro en el StoreRegistry
 * 
 * Este factory asegura que todos los stores se registren automáticamente
 * para limpieza cuando cambia el tenant, previniendo fugas de datos.
 * 
 * @example
 * ```typescript
 * interface BrandingState {
 *   branding: BrandingRead | null;
 *   loading: boolean;
 *   reset: (tenantId: string | null) => void;
 * }
 * 
 * export const useBrandingStore = createTenantStore<BrandingState>(
 *   'branding',
 *   (set, get) => ({
 *     branding: null,
 *     loading: false,
 *     reset: (tenantId) => set({ branding: null, loading: false }),
 *   })
 * );
 * ```
 */
import { create, StateCreator } from 'zustand';
import { storeRegistry } from '../stores/store-registry';

export const createTenantStore = <T extends object>(
  storeName: string,
  initializer: StateCreator<T>
) => {
  const store = create<T>(initializer);

  // Auto-registro en el registry
  storeRegistry.register(
    storeName,
    (tenantId) => {
      const state = store.getState();
      
      // Si el store tiene un método reset, usarlo
      if ('reset' in state && typeof (state as any).reset === 'function') {
        (state as any).reset(tenantId as string | null);
      } else {
        // Si no tiene reset, intentar reinicializar al estado inicial
        // Esto requiere que el initializer sea una función que retorne el estado inicial
        // Por ahora, simplemente logueamos que se necesita un método reset
        console.warn(
          `⚠️ [createTenantStore] Store "${storeName}" no tiene método reset(). ` +
          `Agrega un método reset(tenantId: string | null) al store para limpieza automática.`
        );
      }
    },
    `Store auto-registrado por createTenantStore`
  );

  return store;
};

